import React, { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import Attendance from './components/Attendance';
import RegisterFace from './components/RegisterFace';
import Data from './components/Data';
import './App.css';

const DEVICE_TOKEN = import.meta.env.VITE_DEVICE_AUTH_TOKEN;

export default function App() {
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('username') || null);
  const [view, setView] = useState(null);
  const [deviceAuthorized, setDeviceAuthorized] = useState(() => {
    const savedToken = localStorage.getItem('authorizedDeviceToken');
    return savedToken === DEVICE_TOKEN;
  });
  const [inputToken, setInputToken] = useState('');
  const [tokenError, setTokenError] = useState('');
  const attendanceRef = useRef(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('authorizedDeviceToken');
    setDeviceAuthorized(savedToken === DEVICE_TOKEN);
  }, []);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem('username', userEmail);
    } else {
      localStorage.removeItem('username');
    }
  }, [userEmail]);

  const handleLogout = () => {
    if (attendanceRef.current?.stopCamera) {
      attendanceRef.current.stopCamera();
    }
    setUserEmail(null);
    setView(null);
    setDeviceAuthorized(false);
    localStorage.removeItem('username');
    window.location.reload();
  };

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (inputToken === DEVICE_TOKEN) {
      localStorage.setItem('authorizedDeviceToken', DEVICE_TOKEN);
      setDeviceAuthorized(true);
      setTokenError('');
    } else {
      setTokenError('❌ Invalid token. Please try again.');
    }
  };

  if (!deviceAuthorized && !userEmail) {
    return (
      <div style={{ maxWidth: 400, margin: 'auto', padding: 20, textAlign: 'center' }}>
        <h3>Device Not Authorized</h3>
        <p>You must authorize this device before logging in.</p>
        <p>Enter the secret token below to authorize this browser:</p>

        <form onSubmit={handleTokenSubmit}>
          <input
            type="password"
            placeholder="Enter device token"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 10 }}
          />
          <button type="submit" style={{ padding: '8px 16px' }}>
            Authorize Device
          </button>
        </form>

        {tokenError && <p style={{ color: 'red', marginTop: 10 }}>{tokenError}</p>}
        <p style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
          * This will be remembered in this browser.
        </p>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
        <Login onLogin={setUserEmail} />
      </div>
    );
  }

  if (!deviceAuthorized) {
    return (
      <div style={{ maxWidth: 600, margin: 'auto', padding: 20, textAlign: 'center' }}>
        <h2>Welcome, {userEmail}</h2>
        <h3>Authorize This Device</h3>
        <form onSubmit={handleTokenSubmit}>
          <input
            type="password"
            placeholder="Enter device token"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 10 }}
          />
          <button type="submit" style={{ padding: '8px 16px' }}>
            Authorize
          </button>
        </form>
        {tokenError && <p style={{ color: 'red', marginTop: 10 }}>{tokenError}</p>}
        <button
          onClick={handleLogout}
          style={{ marginTop: 20, backgroundColor: '#f44336', color: 'white', padding: '8px 16px' }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '120px', maxWidth: 800, margin: 'auto' }}>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #ccc',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        flexWrap: 'wrap'
      }}>
        <div>
          <select
            value={view || ''}
            onChange={(e) => setView(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid #ccc',
              fontSize: 14
            }}
          >
            <option value="">📂 Select Action</option>
            <option value="attendance">📝 Take Attendance</option>
            <option value="register">➕ Register Employee</option>
            <option value="data">📊 Data</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: 14, fontWeight: 'bold' }}>Welcome, {userEmail}</span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              padding: '6px 12px',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {view === 'attendance' && <Attendance ref={attendanceRef} />}
      {view === 'register' && <RegisterFace />}
      {view === 'data' && <Data />}
    </div>
  );
}
