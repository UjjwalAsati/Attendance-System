import React, { useState, useEffect } from 'react';
import { loadFaceModels } from '../../utils/loadFaceModels';
import '../styles/Login.css';

const DEVICE_TOKEN = import.meta.env.VITE_DEVICE_AUTH_TOKEN;

export default function Login({ onLogin, setDeviceAuthorized }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [deviceAuthorized, setLocalDeviceAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authorizedDeviceToken');
    const authorized = token === DEVICE_TOKEN;
    setDeviceAuthorized(authorized);
    setLocalDeviceAuthorized(authorized);

    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    if (savedMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }, [setDeviceAuthorized]);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      if (newMode) document.body.classList.add('dark');
      else document.body.classList.remove('dark');
      localStorage.setItem('darkMode', newMode);
      return newMode;
    });
  };

  const handleAuthorize = () => {
    if (authToken === DEVICE_TOKEN) {
      localStorage.setItem('authorizedDeviceToken', DEVICE_TOKEN);
      setDeviceAuthorized(true);
      setLocalDeviceAuthorized(true);
      setAuthError(null);
    } else {
      setAuthError('Invalid token. Please try again.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!deviceAuthorized) {
      setError('Unauthorized device! Please authorize this device first.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorText = await res.text();
        setLoading(false);
        setError(errorText || `Login failed with status ${res.status}`);
        return;
      }

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        localStorage.setItem('username', email);
        await loadFaceModels();
        if (typeof onLogin === 'function') {
          onLogin(email);
        } else {
          console.error('onLogin is not a function');
          setError('Internal client error. Please refresh.');
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError('Server error, try again later');
    }
  };

  if (!deviceAuthorized) {
    return (
      <section className={`login-container unauthorized-fancy ${darkMode ? 'dark' : ''}`}>
        <div className="unauthorized-box">
          <button className="dark-toggle-btn" onClick={toggleDarkMode}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <div className="unauth-emoji">
            <svg height="56" width="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="28" fill={darkMode ? '#ef4444' : '#fee2e2'} />
              <path d="M20 24l16 0" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
              <circle cx="28" cy="36" r="2" fill="#dc2626" />
            </svg>
          </div>
          <h2 className="unauth-title">Oops! You're Not Authorized</h2>
          <p className="unauth-desc">Enter your secret device token to authorize this browser.</p>
          <input
            type="text"
            className="unauth-input"
            placeholder="Enter secret token"
            value={authToken}
            onChange={e => {
              setAuthToken(e.target.value);
              setAuthError(null);
            }}
            autoFocus
          />
          <button className="unauth-btn" onClick={handleAuthorize}>
            Authorize Device
          </button>
          {authError && <div className="unauth-error">{authError}</div>}
          <div className="unauth-note">* This will be remembered in this browser.</div>
        </div>
      </section>
    );
  }

  return (
    <section className={`login-container ${darkMode ? 'dark' : ''}`}>
      <button className="dark-toggle-btn" onClick={toggleDarkMode}>
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
      <div className="login-box">
        <div className="logo-text">SmartCheck</div>
        <form onSubmit={handleLogin} className="login-form" noValidate>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="input-box"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input-box"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <input
            type="submit"
            value={loading ? 'Logging in...' : 'Sign In'}
            disabled={loading}
            className="submit-btn"
          />
          {error && <div className="error-msg">{error}</div>}
        </form>
        <p className="connect-text">Connect With</p>
        <ul className="social-buttons">
          <li><a href="#" className="facebook-btn" aria-label="Facebook">F</a></li>
          <li><a href="#" className="twitter-btn" aria-label="Twitter">T</a></li>
          <li><a href="#" className="google-btn" aria-label="Google">G</a></li>
        </ul>
        <a href="#" className="forgot-password">Forget Password?</a>
        <p className="signup-text">
          Not a member yet? <a href="#" className="sign-up-link">Sign Up</a>
        </p>
      </div>
    </section>
  );
}
