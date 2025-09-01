import React, { useState } from 'react';
import '../styles/Data.css';

function getDefaultDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const today = new Date();

  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() - 2); 
  const formatDate = (date) => date.toISOString().split('T')[0];

  return {
    from: formatDate(firstDay),
    to: formatDate(today),
    min: formatDate(minDate),
    max: formatDate(today),
  };
}

export default function Data() {
  const defaultDates = getDefaultDates();
  const [message, setMessage] = useState('');
  const [fromDate, setFromDate] = useState(defaultDates.from);
  const [toDate, setToDate] = useState(defaultDates.to);

  const validateDates = () => {
    const minDate = new Date(defaultDates.min);
    const maxDate = new Date(defaultDates.max);

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (!fromDate || !toDate) {
      setMessage('Please select both From and To dates.');
      return false;
    }
    if (from < minDate || to < minDate) {
      setMessage('Dates cannot be earlier than 2 months ago.');
      return false;
    }
    if (from > maxDate || to > maxDate) {
      setMessage('Dates cannot be later than today.');
      return false;
    }
    if (from > to) {
      setMessage('From date cannot be later than To date.');
      return false;
    }
    setMessage('');
    return true;
  };

  const handleDownloadOverview = () => {
    if (!validateDates()) return;

    const username = localStorage.getItem('username');
    const url = `${import.meta.env.VITE_BACKEND_URL}/download-overview?username=${encodeURIComponent(
      username
    )}&from=${fromDate}&to=${toDate}`;
    window.open(url, '_blank');
  };

  const handleDownloadExcel = async () => {
    if (!validateDates()) return;

    try {
      const username = localStorage.getItem('username');
      const url = `${import.meta.env.VITE_BACKEND_URL}/download-attendance?username=${encodeURIComponent(
        username
      )}&from=${fromDate}&to=${toDate}`;
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
            min={defaultDates.min}
            max={defaultDates.max}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label>
          To: 
          <input
            type="date"
            value={toDate}
            min={defaultDates.min}
            max={defaultDates.max}
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
      {message && <p className="message" style={{ color: 'red' }}>{message}</p>}
    </section>
  );
}
