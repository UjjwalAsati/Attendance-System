import React, { useState, useEffect } from 'react';
import '../styles/AuthorizeDevice.css';

const DEVICE_TOKEN = import.meta.env.VITE_DEVICE_AUTH_TOKEN;

export default function AuthorizeDevice({ onAuthorized }) {
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
    if (typeof onAuthorized === 'function') {
      onAuthorized(inputToken);
    }
    setMessage('Device authorized successfully!');
    setInputToken('');
    setTimeout(() => setMessage(''), 1000);
  } else {
    setMessage('Invalid token!');
  }
};


  return (
    <section className={`authorize-container ${darkMode ? 'dark' : ''}`}>
      <h2 className="heading">Authorize This Device</h2>
      <input
        type="password"
        placeholder="Enter device token"
        value={inputToken}
        onChange={(e) => setInputToken(e.target.value)}
        className="input-token"
        autoComplete="off"
      />
      <button onClick={handleSetToken} className="btn authorize-btn">
        Authorize Device
      </button>
      {message && (
        <p className={`message ${message.startsWith('Invalid') ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
      <p className="note">
        * Enter the token to authorize this browser.
      </p>
    </section>
  );
}
