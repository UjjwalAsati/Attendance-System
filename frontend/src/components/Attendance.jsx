import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function Attendance({ onLogout }) {
  const videoRef = useRef(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState(null);
  const [flashColor, setFlashColor] = useState(null);
  const streamRef = useRef(null);
  const successAudioRef = useRef(new Audio('/success.mp3'));

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      setLoadingModels(false);
    };
    loadModels();
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        const laptopCamera = videoDevices.find(device =>
          device.label.includes('HP TrueVision HD Camera')
        );
        const preferredDeviceId = laptopCamera?.deviceId || videoDevices[0]?.deviceId;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: preferredDeviceId ? { exact: preferredDeviceId } : undefined },
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

    if (!loadingModels) {
      startCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [loadingModels]);

  const triggerFlash = (color) => {
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 1000);
  };

  const handleAttendance = async (type) => {
    setSending(true);
    setMessage('');
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setMessage('❌ No face detected, please try again.');
        setSending(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const timestamp = new Date().toISOString();
const username = localStorage.getItem('username');  

const data = { descriptor, timestamp, type, username };

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
    if (mode && !loadingModels && !sending) {
      interval = setInterval(() => {
        if (!sending) handleAttendance(mode);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [mode, loadingModels, sending]);

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
      {loadingModels ? (
        <p>Loading face detection models...</p>
      ) : (
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
            flexWrap: 'wrap',
            gap: '10px'
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
      )}
    </div>
  );
}
