import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function RegisterFace() {
  const videoRef = useRef(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModelsAndStartCamera = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        startCamera();
      } catch (err) {
        console.error('Model load error:', err);
        setStatus('❌ Failed to load face-api models.');
      }
    };

    loadModelsAndStartCamera();
  }, []);

  const startCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      const hpCamera = videoDevices.find(device =>
        device.label.includes('HP TrueVision HD Camera')
      );

      const preferredDeviceId = hpCamera?.deviceId || videoDevices[0]?.deviceId;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: preferredDeviceId ? { exact: preferredDeviceId } : undefined },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotReadableError') {
        setStatus('❌ Camera is in use by another app.');
      } else {
        setStatus('❌ Failed to start camera.');
      }
    }
  };

  const handleRegister = async () => {
    setStatus('');
    if (!modelsLoaded) {
      return setStatus('⚠️ Face models not loaded yet.');
    }
    if (!name.trim()) {
      return setStatus('⚠️ Please enter a valid name.');
    }

    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return setStatus('😐 No face detected. Please try again.');
    }

    const faceDescriptor = Array.from(detection.descriptor);
    const username = localStorage.getItem('username');

    if (!username) {
      return setStatus('⚠️ User not logged in. Username missing.');
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/register-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, faceDescriptor, username }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('✅ Employee registered successfully!');
        setName('');
      } else {
        setStatus(data.message || '❌ Registration failed.');
      }
    } catch (err) {
      console.error(err);
      setStatus('❌ Server error during registration.');
    }
  };

return (
  <div className="register-container" style={{ textAlign: 'center', marginTop: '20px', padding: '0 10px' }}>
    <h2 style={{ marginBottom: '10px' }}>Register New Employee</h2>
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{ width: '100%', maxWidth: '400px', height: 'auto', border: '1px solid #ccc', borderRadius: '8px' }}
      />
    </div>
    <div style={{ marginTop: 15 }}>
      <input
        type="text"
        placeholder="Employee Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: 8, width: '100%', maxWidth: '400px' }}
      />
      <br />
      <button
        onClick={handleRegister}
        style={{ marginTop: 10, padding: '8px 16px', maxWidth: '400px', width: '100%' }}
      >
        Register Face
      </button>
      <p style={{ marginTop: 10 }}>{status}</p>
    </div>
  </div>
);

}
