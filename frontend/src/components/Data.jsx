import React, { useState } from 'react';

export default function Data() {
  const [message, setMessage] = useState('');

  const handleDownloadOverview = () => {
    const username = localStorage.getItem('username');
    const url = `${import.meta.env.VITE_BACKEND_URL}/download-overview?username=${encodeURIComponent(username)}`;
    window.open(url, '_blank');
  };

  const handleDownloadExcel = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/download-attendance`);
      if (!res.ok) throw new Error('Network response was not ok');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Error downloading Excel:', error);
      setMessage('❌ Error downloading Excel.');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '30px' }}>
      <h2>Attendance Data</h2>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
        <button onClick={handleDownloadExcel}>📥 Export Attendance Excel</button>
        <button onClick={handleDownloadOverview}>📥 Download Overview</button>
      </div>
      {message && <p style={{ marginTop: '15px' }}>{message}</p>}
    </div>
  );
}
