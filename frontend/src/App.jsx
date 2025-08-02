import React, { useState, useRef } from 'react';
import './App.css';
import Home from './components/pages/Home';
import Login from './components/pages/Login';

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
    setDeviceAuthorized(false);
    localStorage.removeItem('username');
    window.location.reload();
  };

  const handleLogin = (email) => {
    setUserEmail(email);
  };

  return (
    <div className="App">
      {userEmail && deviceAuthorized ? (
        <Home
          userEmail={userEmail}
          handleLogout={handleLogout}
          attendanceRef={attendanceRef}
        />
      ) : (
        <Login onLogin={handleLogin} setDeviceAuthorized={setDeviceAuthorized} />
      )}
    </div>
  );
}

export default App;
