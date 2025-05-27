import React from 'react';

export default function AddEmployeePrompt({ onAdd, onLogout }) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome! Do you want to add a new employee?</h2>
      <button onClick={onAdd} style={{ marginRight: 10, padding: '10px 20px' }}>
        Yes, add employee
      </button>
      <button onClick={onLogout} style={{ padding: '10px 20px' }}>
        Logout
      </button>
    </div>
  );
}
