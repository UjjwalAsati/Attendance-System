import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { loadFaceModels } from '../utils/loadFaceModels'; 

export default function RegisterFace() {
  const videoRef = useRef(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [facingMode, setFacingMode] = useState('user');
  const [stream, setStream] = useState(null);

  useEffect(() => {
    const loadModelsAndStartCamera = async () => {
      try {
        await loadFaceModels();
        startCamera();
      } catch (err) {
        console.error('Model load error:', err);
        setStatus('❌ Failed to load face-api models.');
      }
    };

    loadModelsAndStartCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
      }

      setStream(mediaStream);
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotReadableError') {
        setStatus('❌ Camera is in use by another app.');
      } else {
        setStatus('❌ Failed to start camera.');
      }
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleRegister = async () => {
    setStatus('');
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
    <div style={{ padding: 20 }}>
      <h2>Register New Employee</h2>
      <video
        ref={videoRef}
        autoPlay
        muted
        width="320"
        height="240"
        style={{ border: '1px solid black', marginBottom: 10 }}
      />
      <input
        type="text"
        placeholder="Employee Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ marginBottom: 10, padding: 8, width: '100%' }}
      />
      <br />
      <button onClick={handleRegister} style={{ padding: 10, width: '100%' }}>
        Register Face
      </button>
      <p>{status}</p>
      <br />
      <button onClick={handleSwitchCamera} style={{ marginBottom: 10, padding: 8 }}>
        Switch Camera
      </button>
      <br />
    </div>
  );
}
