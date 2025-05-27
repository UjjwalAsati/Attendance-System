import React, { useState } from 'react';
import Login from './components/Login';
import Attendance from './components/Attendance';
import RegisterFace from './components/RegisterFace';
import './App.css'

export default function App() {
  const [userEmail, setUserEmail] = useState(null);

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      {!userEmail ? (
        <Login onLogin={(email) => setUserEmail(email)} />
      ) : (
        <Attendance email={userEmail} onLogout={() => setUserEmail(null)} />
      )}
      <RegisterFace />
    </div>
  );
}
