import React, { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import Attendance from './components/Attendance';
import RegisterFace from './components/RegisterFace';
import Data from './components/Data';
import './App.css';

const DEVICE_TOKEN = import.meta.env.VITE_DEVICE_AUTH_TOKEN;

function AuthorizeDevice({ onAuthorized }) {
  const [inputToken, setInputToken] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputToken === DEVICE_TOKEN) {
      localStorage.setItem('authorizedDeviceToken', inputToken);
      onAuthorized(true);
      setError(null);
    } else {
      setError('❌ Invalid device token. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20, textAlign: 'center' }}>
      <h3>Authorize This Device</h3>
      <form onSubmit={handleSubmit}>
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
      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
    </div>
  );
}

export default function App() {
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('username') || null);
  const [view, setView] = useState(null);
  const [deviceAuthorized, setDeviceAuthorized] = useState(false);
  const attendanceRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('authorizedDeviceToken');
    setDeviceAuthorized(token === DEVICE_TOKEN);
  }, [userEmail]);

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


  if (!userEmail) {
    return (
      <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
        <Login onLogin={setUserEmail} />
      </div>
    );
  }

  if (!deviceAuthorized) {
    return (
      <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
        <h2>Welcome, {userEmail}</h2>
        <AuthorizeDevice onAuthorized={setDeviceAuthorized} />
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
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>Welcome, {userEmail}</h2>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        <button onClick={() => setView('attendance')}>Take Attendance</button>
        <button onClick={() => setView('register')}>Register New Employee</button>
        <button onClick={() => setView('data')}>Data</button>
        <button onClick={handleLogout} style={{ backgroundColor: '#f44336', color: 'white' }}>
          Logout
        </button>
      </div>

      {view === 'attendance' && <Attendance ref={attendanceRef} />}
      {view === 'register' && <RegisterFace />}
      {view === 'data' && <Data />}
    </div>
  );
}
