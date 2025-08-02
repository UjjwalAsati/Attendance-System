import React, { useState, useEffect } from 'react';
import '../styles/Data.css';

function getDefaultDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const today = new Date();

  const formatDate = (date) => date.toISOString().split('T')[0];

  return {
    from: formatDate(firstDay),
    to: formatDate(today),
  };
}

export default function Data() {
  const defaultDates = getDefaultDates();
  const [message, setMessage] = useState('');
  const [fromDate, setFromDate] = useState(defaultDates.from);
  const [toDate, setToDate] = useState(defaultDates.to);

  const handleDownloadOverview = () => {
    const username = localStorage.getItem('username');
    const url = `${import.meta.env.VITE_BACKEND_URL}/download-overview?username=${encodeURIComponent(username)}`;
    window.open(url, '_blank');
  };

  const handleDownloadExcel = async () => {
    if (!fromDate || !toDate) {
      setMessage('Please select both From and To dates.');
      return;
    }
    if (fromDate > toDate) {
      setMessage('From date cannot be later than To date.');
      return;
    }
    setMessage('');
    try {
      const username = localStorage.getItem('username');
      const url = `${import.meta.env.VITE_BACKEND_URL}/download-attendance?username=${encodeURIComponent(username)}&from=${fromDate}&to=${toDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `attendance_${username}_${fromDate}_to_${toDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      setMessage('Error downloading Excel.');
    }
  };

  return (
    <section className="data-container">
      <h2 className="heading">Attendance Data</h2>
      <div className="date-range-picker">
        <label>
          From: 
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label>
          To: 
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
      </div>
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
