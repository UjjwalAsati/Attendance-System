import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { loadFaceModels } from '../utils/loadFaceModels'; 

export default function Attendance({ onLogout }) {
  const videoRef = useRef(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState(null);
  const [flashColor, setFlashColor] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const streamRef = useRef(null);
  const successAudioRef = useRef(new Audio('/success.mp3'));

  useEffect(() => {
    const startUp = async () => {
      await loadFaceModels(); 
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => videoRef.current.play();
        }
      } catch (err) {
        console.error('📷 Camera error:', err);
        setMessage('❌ Camera error: ' + err.message);
      }
    };

    startUp();

    return () => {
      if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack?.getCapabilities()?.torch) {
          videoTrack.applyConstraints({ advanced: [{ torch: false }] });
        }
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const toggleTorch = async () => {
    const videoTrack = streamRef.current?.getVideoTracks?.()[0];
    if (!videoTrack) {
      setMessage('❌ No video track found.');
      return;
    }

    const capabilities = videoTrack.getCapabilities?.();
    if (!capabilities?.torch) {
      setMessage('⚠️ Torch not supported on this camera.');
      return;
    }

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: !isTorchOn }]
      });
      setIsTorchOn(prev => !prev);
    } catch (err) {
      console.error('Torch error:', err);
      setMessage('❌ Failed to toggle torch: ' + err.message);
    }
  };

  const triggerFlash = (color) => {
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 1000);
  };

  const handleAttendance = async (type) => {
    if (!videoRef.current) return;
    setSending(true);
    setMessage('');
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setMessage('❌ No face detected, please try again.');
        setSending(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const timestamp = new Date().toISOString();
      const data = { descriptor, timestamp, type };

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/submit-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (json.success) {
        const recordedTime = new Date(json.timestamp || new Date().toISOString());
        const istTimeStr = recordedTime.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: true,
        });

        setMessage(`✅ ${type === 'checkin' ? 'Check-in' : 'Checkout'} recorded for ${json.name} at ${istTimeStr}`);
        successAudioRef.current.play();

        if (navigator.vibrate) navigator.vibrate(300);
        triggerFlash(type === 'checkin' ? 'green' : 'blue');
      } else {
        setMessage(`ℹ️ ${json.message || 'Attendance not recorded.'}`);
      }
    } catch (err) {
      console.error(`❌ Error during ${type}:`, err);
      setMessage('❌ Error: ' + err.message);
    }
    setSending(false);
  };

  useEffect(() => {
    let interval;
    if (mode && !sending) {
      interval = setInterval(() => {
        if (!sending) handleAttendance(mode);
      }, 400);
    }
    return () => clearInterval(interval);
  }, [mode, sending]);

  return (
    <div
      className="attendance-container"
      style={{
        textAlign: 'center',
        marginTop: '20px',
        transition: 'background-color 0.3s ease',
        backgroundColor: flashColor || 'transparent',
        padding: '20px'
      }}
    >
      <h2>Attendance Portal</h2>
      <>
        <video
          ref={videoRef}
          width="400"
          height="300"
          autoPlay
          muted
          style={{ border: '1px solid #ccc' }}
        />
        <div style={{
          marginTop: '15px',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setMode('checkin')}
            style={{ backgroundColor: mode === 'checkin' ? '#aaffaa' : '' }}
          >
            Auto Check-in
          </button>
          <button
            onClick={() => setMode('checkout')}
            style={{ backgroundColor: mode === 'checkout' ? '#aaffaa' : '' }}
          >
            Auto Check-out
          </button>
        </div>

        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button
            onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
            style={{ backgroundColor: '#00cc66', color: '#fff' }}
          >
            Switch Camera
          </button>
          <button
            onClick={toggleTorch}
            style={{ backgroundColor: isTorchOn ? '#ffcc00' : '#cccccc' }}
          >
            {isTorchOn ? 'Turn Off Flash' : 'Turn On Flash'}
          </button>
        </div>

        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setMode(null)}
            style={{ backgroundColor: mode === null ? '#ffaaaa' : '' }}
          >
            Stop
          </button>
        </div>

        {mode && <p style={{ marginTop: '10px' }}>🔄 Current mode: <strong>{mode}</strong></p>}
        {message && <p style={{ marginTop: '10px' }}>{message}</p>}
      </>
    </div>
  );
}
