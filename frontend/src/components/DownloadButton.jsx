import React from 'react';

const DownloadButton = () => {
  const handleDownloadAttendance = async () => {
    try {
      const response = await fetch('http://localhost:3001/download-attendance');
      const blob = await response.blob();

      // ✅ Extract filename from response headers
      const disposition = response.headers.get('Content-Disposition');
      const match = disposition && disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : 'attendance.xlsx';

      // ✅ Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Error downloading attendance:', error);
    }
  };

  return (
    <button onClick={handleDownloadAttendance}>
      Download Today’s Attendance
    </button>
  );
};

export default DownloadButton;
