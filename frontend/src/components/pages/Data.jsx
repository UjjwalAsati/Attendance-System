import React, { useState } from 'react';
import '../styles/Data.css';

export default function Data() {
  const [message, setMessage] = useState('');

  const handleDownloadOverview = () => {
    const username = localStorage.getItem('username');
    const url = `${import.meta.env.VITE_BACKEND_URL}/download-overview?username=${encodeURIComponent(username)}`;
    window.open(url, '_blank');
  };

  const handleDownloadExcel = async () => {
    try {
      const username = localStorage.getItem('username');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/download-attendance?username=${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error('Network response was not ok');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${username}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      setMessage('Error downloading Excel.');
    }
  };

  return (
    <section className="data-container">
      <h2 className="heading">Attendance Data</h2>
      <div className="buttons-group">
        <button className="btn" onClick={handleDownloadExcel}>
          Export Attendance Excel
        </button>
        <button className="btn" onClick={handleDownloadOverview}>
          Download Overview
        </button>
      </div>
      {message && <p className="message">{message}</p>}
    </section>
  );
}
