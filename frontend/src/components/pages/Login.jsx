import React, { useState, useEffect } from 'react';
import { loadFaceModels } from '../../utils/loadFaceModels';
import '../styles/Login.css';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    if (savedMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      if (newMode) document.body.classList.add('dark');
      else document.body.classList.remove('dark');
      localStorage.setItem('darkMode', newMode);
      return newMode;
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!res.ok) {
        try {
          const errorData = await res.json();
          setError(errorData.message || `Login failed with status ${res.status}`);
        } catch {
          const errorText = await res.text();
          setError(errorText || `Login failed with status ${res.status}`);
        }
        setLoading(false);
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
