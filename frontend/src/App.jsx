import React, { useState, useRef } from 'react';
import './App.css';
import Home from './components/pages/Home';
import Login from './components/pages/Login';
import DeviceAuth from './components/pages/AuthorizeDevice';

function App() {
  const [userEmail, setUserEmail] = useState(localStorage.getItem('username') || '');
  const [deviceAuthorized, setDeviceAuthorized] = useState(
    localStorage.getItem('authorizedDeviceToken') === import.meta.env.VITE_DEVICE_AUTH_TOKEN
  );
  const attendanceRef = useRef(null);

  const handleLogout = () => {
    if (attendanceRef.current?.stopCamera) {
      attendanceRef.current.stopCamera();
    }
    setUserEmail('');
    localStorage.removeItem('username');
    window.location.reload();
  };

  const handleLogin = (email) => {
    setUserEmail(email);
    localStorage.setItem('username', email);
  };

  return (
    <div className="App">
      {!deviceAuthorized ? (
        <DeviceAuth setDeviceAuthorized={setDeviceAuthorized} />
      ) : !userEmail ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Home
          userEmail={userEmail}
          handleLogout={handleLogout}
          attendanceRef={attendanceRef}
        />
      )}
    </div>
  );
}

export default App;
