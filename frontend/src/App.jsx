import React, { useState, useRef, useEffect } from 'react';
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

  const INACTIVITY_TIMEOUT = 5 * 60 * 1000; 
  const inactivityTimerRef = useRef(null);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      if (!attendanceRef.current?.isRunning) {
        handleLogout();
      }
    }, INACTIVITY_TIMEOUT);
  };


  useEffect(() => {
    
    const events = ['touchstart', 'touchmove', 'touchend', 'click'];

    events.forEach(e => document.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      events.forEach(e => document.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, []);

  const handleLogout = () => {
    // stop camera in Attendance component if exists
    if (attendanceRef.current?.stopCamera) {
      attendanceRef.current.stopCamera();
    }
    localStorage.removeItem('username');
    localStorage.removeItem('isGuest');
    setUserEmail('');
    setDeviceAuthorized(false);
    window.location.reload();
  };

  const handleLogin = (email) => {
    setUserEmail(email);
    localStorage.setItem('username', email);
  };

  const isGuest = userEmail === 'guest';

  return (
    <div className="App">
      {isGuest ? (
        <Home
          userEmail={userEmail}
          handleLogout={handleLogout}
          attendanceRef={attendanceRef}
        />
      ) : !deviceAuthorized ? (
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
