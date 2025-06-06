import React, { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import Attendance from './components/Attendance';
import RegisterFace from './components/RegisterFace';
import Data from './components/Data';
import './App.css';

export default function App() {
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('username') || null);
  const [view, setView] = useState(null);
  const attendanceRef = useRef(null);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem('username', userEmail);
    } else {
      localStorage.removeItem('username');
    }
  }, [userEmail]);

  const handleLogout = () => {
    if (attendanceRef.current && attendanceRef.current.stopCamera) {
      attendanceRef.current.stopCamera(); // stop camera manually
    }
    setUserEmail(null);
    setView(null);
    localStorage.removeItem('username');
  };

  if (!userEmail) {
    return (
      <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
        <Login onLogin={(email) => setUserEmail(email)} />
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
          marginBottom: '20px'
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
