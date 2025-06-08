import React, { useState } from 'react';

const DEVICE_TOKEN = import.meta.env.VITE_DEVICE_AUTH_TOKEN;

export default function AuthorizeDevice() {
  const [inputToken, setInputToken] = useState('');
  const [message, setMessage] = useState('');

  const handleSetToken = () => {
    if (inputToken === DEVICE_TOKEN) {
      localStorage.setItem('authorizedDeviceToken', DEVICE_TOKEN);
      setMessage('✅ Device authorized successfully!');
    } else {
      setMessage('❌ Invalid token!');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20, textAlign: 'center' }}>
      <h2>Authorize This Device</h2>
      <input
        type="password"
        placeholder="Enter device token"
        value={inputToken}
        onChange={e => setInputToken(e.target.value)}
        style={{ width: '100%', padding: 8, marginBottom: 10 }}
      />
      <button onClick={handleSetToken} style={{ padding: 10, width: '100%' }}>
        Authorize Device
      </button>
      {message && <p>{message}</p>}
      <p style={{ fontSize: 12, color: '#666' }}>
        * Enter the secret token to authorize this browser.
      </p>
    </div>
  );
}
