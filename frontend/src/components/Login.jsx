import React, { useState, useEffect } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [deviceAuthorized, setDeviceAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authorizedDeviceToken');
    setDeviceAuthorized(token === 'jatashankar-2025-token-01'); 
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!deviceAuthorized) {
      setError('Unauthorized device! Please authorize this device first.');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('username', email);
        onLogin(email);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Server error, try again later');
    }
  };

  if (!deviceAuthorized) {
    return (
      <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
        <h2>Device Not Authorized</h2>
        <p style={{ color: 'red' }}>You must authorize this device before logging in.</p>
        <p>Open browser console and paste:</p>
        <pre style={{ background: '#eee', padding: '10px' }}>
          localStorage.setItem('authorizedDeviceToken', 'jatashankar-2025-token-01')
        </pre>
        <p>Then refresh the page.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>Dealer Login</h2>
      <input
        type="email"
        placeholder="Email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: '100%', marginBottom: 10, padding: 8 }}
      />
      <input
        type="password"
        placeholder="Password"
        required
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', marginBottom: 10, padding: 8 }}
      />
      <button type="submit" style={{ width: '100%', padding: 10 }}>
        Login
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
