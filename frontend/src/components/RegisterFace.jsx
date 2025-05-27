// src/pages/RegisterFace.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function RegisterFace() {
  const videoRef = useRef(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      startCamera();
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const handleRegister = async () => {
    const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

    if (!detections) {
      setStatus('No face detected.');
      return;
    }

    const descriptor = Array.from(detections.descriptor); // Convert Float32Array to normal array

    const response = await fetch('http://localhost:3001/register-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, descriptor }),
    });

    const result = await response.json();
    if (result.success) {
      setStatus('Employee registered successfully.');
    } else {
      setStatus('Error registering employee.');
    }
  };

  return (
    <div>
      <h2>Register Employee</h2>
      <video ref={videoRef} autoPlay muted width="320" height="240" style={{ border: '1px solid black' }} />
      <br />
      <input
        type="text"
        placeholder="Employee Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleRegister}>Register Face</button>
      <p>{status}</p>
    </div>
  );
}
