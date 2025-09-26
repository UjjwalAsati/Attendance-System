import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import '../styles/Attendance.css';

export default function AttendancePage({ onLogout, attendanceRef }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const successAudioRef = useRef(new Audio('/success.mp3'));
  const [loadingModels, setLoadingModels] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState(null);
  const [flash, setFlash] = useState(null);
  const noFaceTimerRef = useRef(null);
  const NO_FACE_TIMEOUT = 1.5 * 60 * 1000;

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
        setMessage('Camera error: ' + err.message);
      }
    };
    if (!loadingModels) startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [loadingModels]);

  const doFlash = (color) => {
    setFlash(color);
    setTimeout(() => setFlash(null), 1000);
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
      setMessage('No face detected, please try again.');

      
      if (!noFaceTimerRef.current) {
        noFaceTimerRef.current = setTimeout(() => {
          
          
          handleLogout();

        }, NO_FACE_TIMEOUT);
      }

      setSending(false);
      return;
    }

    if (noFaceTimerRef.current) {
      clearTimeout(noFaceTimerRef.current);
      noFaceTimerRef.current = null;
    }
      const descriptor = Array.from(detection.descriptor);
      const timestamp = new Date().toISOString();
      const username = localStorage.getItem('username');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/submit-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor, timestamp, type, username }),
      });
      const json = await res.json();
      if (json.success) {
        const recordedTime = new Date(json.timestamp || new Date().toISOString());
        const istTimeStr = recordedTime.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: true,
        });
        setMessage(
          `${type === 'checkin' ? 'Check-in' : 'Checkout'} recorded for ${json.name} at ${istTimeStr}`
        );
        successAudioRef.current.play();
        if (navigator.vibrate) navigator.vibrate(300);
        doFlash(type === 'checkin' ? 'green' : 'blue');
      } else {
        setMessage(json.message || 'Attendance not recorded.');
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
    setSending(false);
  };


  const handleLogout = () => {

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    localStorage.removeItem('username');
    localStorage.removeItem('isGuest');
    window.location.reload();
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

  useEffect(() => {
  if (attendanceRef) {
    attendanceRef.current = {
      stopCamera: () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      },
      isRunning: !!mode 
    };
  }
}, [mode]);


  return (
    <div className={`attendance-main ${flash === 'green' ? 'flash-green' : flash === 'blue' ? 'flash-blue' : ''}`}>
      <h2 className="attendance-heading">Attendance&nbsp;Portal</h2>

      {loadingModels ? (
        <div className="attendance-msg info">Loading face detection models...</div>
      ) : (
        <>
          <video
            ref={videoRef}
            width="400"
            height="300"
            autoPlay
            muted
            className="attendance-video"
          />
          <div className="attendance-buttons">
            <div className="top-row">
            <button
              onClick={() => setMode('checkin')}
              className={mode === 'checkin' ? 'active' : ''}
              type="button"
            >
              Check-in
            </button>
            <button
              onClick={() => setMode('checkout')}
              className={mode === 'checkout' ? 'active' : ''}
              type="button"
            >
              Check-out
            </button>
            </div>
            <div className="bottom-row">
            <button
              onClick={() => setMode(null)}
              className={mode === null ? 'active' : ''}
              type="button"
            >
              Stop
            </button>
          </div>
          </div>
          {mode && (
            <div
              className={
                mode === 'checkin'
                  ? 'attendance-msg mode-green'
                  : mode === 'checkout'
                  ? 'attendance-msg mode-blue'
                  : 'attendance-msg mode-gray'
              }
            >
              Current mode: <strong>{mode}</strong>
            </div>
          )}
          {message && (
            <div
              className={
                message.toLowerCase().includes('not recognized') ||
                message.toLowerCase().includes('no face')
                  ? 'attendance-msg warn'
                  : 'attendance-msg success'
              }
            >
              {message}
            </div>
          )}
        </>
      )}
    </div>
  );
}
