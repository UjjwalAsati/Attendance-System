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
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (err) {
      console.error('Camera error:', err);
      setStatus('❌ Could not access camera.');
    }
  };

  const handleRegister = async () => {
    setStatus('');
    if (!modelsLoaded) {
      return setStatus('⚠️ Face models not loaded yet.');
    }

    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return setStatus('😐 No face detected. Please try again.');
    }

    const descriptor = Array.from(detection.descriptor);

    try {
      const res = await fetch('http://localhost:3001/register-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, descriptor }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('✅ Employee registered successfully!');
        setName('');
      } else {
        setStatus('❌ Registration failed.');
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
      <br />
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
    </div>
  );
}
