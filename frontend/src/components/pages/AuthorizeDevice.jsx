import React, { useState, useEffect } from 'react';
import '../styles/AuthorizeDevice.css';

const DEVICE_TOKEN = import.meta.env.VITE_DEVICE_AUTH_TOKEN;

export default function AuthorizeDevice({ setDeviceAuthorized }) {
  const [inputToken, setInputToken] = useState('');
  const [message, setMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    if (savedMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }, []);

  const handleSetToken = () => {
    if (inputToken === DEVICE_TOKEN) {
      localStorage.setItem('authorizedDeviceToken', DEVICE_TOKEN);
      setDeviceAuthorized(true);
      setMessage('Device authorized successfully!');
      setInputToken('');
      setTimeout(() => setMessage(''), 1000);
    } else {
      setMessage('Invalid token!');
    }
  };

  const handleGuestLogin = () => {
  localStorage.setItem('username', 'guest');
  localStorage.setItem('isGuest', 'true');
  window.location.reload();
};


  return (
    <section className={`authorize-container ${darkMode ? 'dark' : ''}`}>
      <h2 className="heading error-text">Oops! You're Not <br></br>Authorized</h2>

      <p>Enter your secret device token to authorize this browser.</p>

      <input
        type="password"
        placeholder="Enter secret token"
        value={inputToken}
        onChange={(e) => setInputToken(e.target.value)}
        className="input-token"
        autoComplete="off"
      />

      <button onClick={handleSetToken} className="btn authorize-btn">
        Authorize Device
      </button>

      <button onClick={handleGuestLogin} className="btn guest-btn">
        Continue as Guest
      </button>

      {message && (
        <p className={`message ${message.startsWith('Invalid') ? 'error' : 'success'}`}>
          {message}
        </p>
      )}

      <p className="note">
        * This will be remembered in this browser.<br />
        * Guest mode resets daily and won’t save data permanently.
      </p>
    </section>
  );
}
