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

        console.log('Available cameras:', videoDevices);

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
        console.error('Camera error:', err);
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
        setMessage('No face detected, please try again.');
        setSending(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);

      const position = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 });
      });

      const data = {
        descriptor,
        timestamp: new Date().toISOString(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      const response = await fetch('http://localhost:3001/submit-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json();
      setMessage(json.success ? `✅ Attendance recorded for ${json.name}` : '❌ Failed to record attendance.');
    } catch (err) {
      console.error('❌ Error:', err);
      setMessage('Error: ' + err.message);
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
    <div>
      <h2>Welcome to Attendance</h2>
      <button onClick={handleLogout} style={{ marginBottom: 20 }}>
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
