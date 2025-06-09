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

  const handleAttendance = async (type) => {
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
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      const timestamp = new Date().toISOString();

      const data = { descriptor, timestamp, latitude, longitude, type };

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
      } else {
        setMessage(`ℹ️ ${json.message || 'Attendance not recorded.'}`);
      }
    } catch (err) {
      console.error(`❌ Error during ${type}:`, err);
      if (err.code === 1) {
        setMessage('❌ Location permission denied.');
      } else {
        setMessage('❌ Error: ' + err.message);
      }
    }

    setSending(false);
  };

  return (
    <div className="attendance-container" style={{ textAlign: 'center', marginTop: '20px' }}>
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
            <button onClick={() => handleAttendance('checkin')} disabled={sending}>
              {sending ? 'Processing...' : 'Check In'}
            </button>
            <button onClick={() => handleAttendance('checkout')} disabled={sending}>
              {sending ? 'Processing...' : 'Check Out'}
            </button>
          </div>
          {message && <p style={{ marginTop: '10px' }}>{message}</p>}
        </>
      )}
    </div>
  );
}
