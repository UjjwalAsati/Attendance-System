import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function Attendance({ onLogout }) {
  const videoRef = useRef(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const streamRef = useRef(null);

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

        console.log('📷 Available cameras:', videoDevices);

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

  const handleCheckIn = async () => {
    setMessage('');
    setSending(true);

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

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      console.log('📍 Detected location:', latitude, longitude);

      const timestamp = new Date().toISOString();

      const data = {
        descriptor,
        timestamp,
        latitude,
        longitude
      };

      const response = await fetch('http://localhost:3001/submit-attendance', {
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
        setMessage(`✅ Attendance recorded for ${json.name} at ${istTimeStr}`);
      } else {
        setMessage(`ℹ️ ${json.message || 'Attendance not recorded.'}`);
      }

    } catch (err) {
      console.error('❌ Error during check-in:', err);
      if (err.code === 1) {
        setMessage('❌ Location permission denied.');
      } else {
        setMessage('❌ Error: ' + err.message);
      }
    }

    setSending(false);
  };

  const handleLogout = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onLogout();
  };

  return (
    <div className="attendance-container" style={{ textAlign: 'center', marginTop: '20px' }}>
      <h2>Attendance Portal</h2>
      {loadingModels ? (
        <p>Loading face detection models...</p>
      ) : (
        <>
          <video ref={videoRef} width="400" height="300" autoPlay muted style={{ border: '1px solid #ccc' }} />
          <div style={{ marginTop: '10px' }}>
            <button onClick={handleCheckIn} disabled={sending}>
              {sending ? 'Processing...' : 'Mark Attendance'}
            </button>
            <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
          </div>
          {message && <p style={{ marginTop: '10px' }}>{message}</p>}
        </>
      )}
    </div>
  );
}
