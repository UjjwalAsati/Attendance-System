import React, { useState } from 'react';
import Attendance from '../pages/Attendance';
import RegisterFace from '../pages/RegisterFace';
import Data from '../pages/Data';
import EditEmployee from '../pages/EditEmployee';
import '../styles/Home.css';

function Home({ userEmail, handleLogout, attendanceRef }) {
  const [view, setView] = useState('');

  return (
    <div className="home-full-container">
      <header className="home-animated-header">
      <div className="left-header">
        {view !== '' && (
        <button
          type="button"
          className="home-button"
          onClick={() => window.location.reload()}
          aria-label="Go to home menu"
        >
          Home
        </button>
        )}
      </div>
      <div className="right-header">
        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
        >
          Logout
        </button>
      </div>
      </header>
      {view === '' && (
        <div className="welcome-animated">
          <span className="welcome-text">Welcome, {userEmail}</span>
        </div>
       )}

      <main className="home-content">
        {view === 'attendance' && <Attendance ref={attendanceRef} />}
        {view === 'register' && <RegisterFace />}
        {view === 'data' && <Data />}
        {view === 'edit' && <EditEmployee />}
        {view === '' && (
          <div className="card-container" role="menu">
            <button onClick={() => setView('attendance')} className="card animated-card" role="menuitem">
              Take Attendance
            </button>
            <button onClick={() => setView('register')} className="card animated-card" role="menuitem">
              Register Employee
            </button>
            <button onClick={() => setView('data')} className="card animated-card" role="menuitem">
              View Attendance
            </button>
            <button onClick={() => setView('edit')} className="card animated-card" role="menuitem">
              Edit Employee
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;
