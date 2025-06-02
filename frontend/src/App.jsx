import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Attendance from './components/Attendance';
import RegisterFace from './components/RegisterFace';
import './App.css';

export default function App() {
  const [userEmail, setUserEmail] = useState(() => {
    // On initial load, try to get username from localStorage
    return localStorage.getItem('username') || null;
  });
  const [view, setView] = useState(null);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem('username', userEmail);
    } else {
      localStorage.removeItem('username');
    }
  }, [userEmail]);

  const handleLogout = () => {
    setUserEmail(null);
    setView(null);
    localStorage.removeItem('username'); // extra safety
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
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={() => setView('attendance')}>Take Attendance</button>
        <button onClick={() => setView('register')}>Register New Employee</button>
        <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>
          Logout
        </button>
      </div>

      {view === 'attendance' && <Attendance onLogout={handleLogout} />}
      {view === 'register' && <RegisterFace />}
    </div>
  );
}
