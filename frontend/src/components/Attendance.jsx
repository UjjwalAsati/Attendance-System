import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function Attendance({ email, onLogout }) {
  const videoRef = useRef(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const streamRef = useRef(null); // ✅ store stream

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      setLoadingModels(false);
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!loadingModels) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        streamRef.current = stream; // ✅ store the stream
        videoRef.current.srcObject = stream;
      });

      // ✅ Cleanup function to stop the camera when component unmounts
      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [loadingModels]);

  const handleCheckIn = async () => {
    setMessage('');
    setSending(true);

    try {
      const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions());
      if (!detection) {
        setMessage('No face detected, please try again.');
        setSending(false);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const faceImageBase64 = canvas.toDataURL('image/jpeg');

      const position = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 });
      });

      const data = {
        email,
        timestamp: new Date().toISOString(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        faceImageBase64,
      };

      const response = await fetch('http://localhost:3001/submit-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json();
      if (json.success) {
        setMessage('Attendance recorded successfully!');
      } else {
        setMessage('Failed to record attendance.');
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
    }

    setSending(false);
  };

  return (
    <div>
      <h2>Welcome, {email}</h2>
      <button
        onClick={() => {
          // ✅ Stop camera stream on logout
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          onLogout();
        }}
        style={{ marginBottom: 20 }}
      >
        Logout
      </button>

      {loadingModels ? (
        <p>Loading face detection models...</p>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            width="320"
            height="240"
            style={{ border: '1px solid black', marginBottom: 10 }}
          />
          <br />
          <button onClick={handleCheckIn} disabled={sending}>
            {sending ? 'Sending...' : 'Check-In Attendance'}
          </button>
          {message && <p>{message}</p>}
        </>
      )}
    </div>
  );
}
