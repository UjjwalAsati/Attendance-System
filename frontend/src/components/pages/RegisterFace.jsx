import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { loadFaceModels } from '../../utils/loadFaceModels';
import '../styles/RegisterFace.css';

export default function RegisterFace() {
  const videoRef = useRef(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [facingMode, setFacingMode] = useState('user');
  const [stream, setStream] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    if (savedMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }, []);

  useEffect(() => {
    const loadModelsAndStartCamera = async () => {
      try {
        await loadFaceModels();
        startCamera();
      } catch (err) {
        console.error('Model load error:', err);
        setStatus('Failed to load face-api models.');
      }
    };

    loadModelsAndStartCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]); 
  
  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play();
      }

      setStream(mediaStream);
      setStatus('');
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotReadableError') {
        setStatus('Camera is in use by another app.');
      } else {
        setStatus('Failed to start camera.');
      }
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleRegister = async () => {
    setStatus('');
    if (!name.trim()) {
      setStatus('Please enter a valid name.');
      return;
    }

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus('No face detected. Please try again.');
        return;
      }

      const faceDescriptor = Array.from(detection.descriptor);
      const username = localStorage.getItem('username');

      if (!username) {
        setStatus('User not logged in. Username missing.');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/register-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, faceDescriptor, username }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('Employee registered successfully!');
        setName('');
      } else {
        setStatus(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      setStatus('Server error during registration.');
    }
  };

  return (
    <section className={`register-face-container ${darkMode ? 'dark' : ''}`}>
      <h2 className="heading">Register New Employee</h2>
      <video
        ref={videoRef}
        autoPlay
        muted
        width="320"
        height="240"
        className="video-feed"
      />
      <input
        type="text"
        placeholder="Employee Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input-name"
        autoComplete="off"
      />
      <button onClick={handleRegister} className="btn register-btn">
        Register Face
      </button>
      <p className="status-message">{status}</p>
      <button onClick={handleSwitchCamera} className="btn switch-btn">
        Switch Camera
      </button>
    </section>
  );
}
