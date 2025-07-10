import React, { useEffect, useState } from 'react';

export default function EditEmployee() {
  const [passkeyEntered, setPasskeyEntered] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [employees, setEmployees] = useState([]);
  const [editNames, setEditNames] = useState({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  const username = localStorage.getItem('username');
  const DEALER_PASSKEY = import.meta.env.VITE_DEALER_PASSKEY;
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchEmployees = async () => {
    setIsLoading(true);
    setMessage('');
    setDebugInfo({});
    
    try {
      console.log('Fetching employees for username:', username);
      const endpoint = `${BACKEND_URL}/get-employees?username=${encodeURIComponent(username)}`;
      console.log('API Endpoint:', endpoint);

      const startTime = Date.now();
      const res = await fetch(endpoint);
      const responseTime = Date.now() - startTime;

      console.log('Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
      }

      const data = await res.json();
      console.log('Full API Response:', data);

      setDebugInfo({
        endpoint,
        status: res.status,
        responseTime,
        responseData: data,
        receivedAt: new Date().toISOString()
      });

      if (!data || !Array.isArray(data.employees)) {
        throw new Error('Invalid data format: employees array missing');
      }

      const processedEmployees = data.employees.map(emp => {
        const name = emp.employeeName || emp.name || emp.fullName || 'Unnamed Employee';
        console.log(`Processed employee ID ${emp._id}:`, { ...emp, computedName: name });
        return {
          ...emp,
          displayName: name
        };
      });

      setEmployees(processedEmployees);
      
      const names = {};
      processedEmployees.forEach(emp => {
        names[emp._id] = emp.displayName;
      });
      setEditNames(names);

      setMessage(`✅ Loaded ${processedEmployees.length} employees`);
    } catch (err) {
      console.error('Fetch Error:', err);
      setMessage(`❌ Error: ${err.message}`);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (passkeyEntered) {
      fetchEmployees();
    }
  }, [passkeyEntered]);

  const handleEdit = async (id) => {
    const newName = editNames[id]?.trim();
    if (!newName) {
      setMessage('❌ Please enter a valid name');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/edit-employee/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newName })
      });
      const data = await res.json();
      console.log('Edit response:', data);
      setMessage(data.message || (data.success ? '✅ Updated successfully' : '❌ Update failed'));

      if (data.success) {
        setEmployees(prev =>
          prev.map(emp =>
            emp._id === id ? { ...emp, displayName: newName } : emp
          )
        );
      }
    } catch (err) {
      console.error('Edit error:', err);
      setMessage('❌ Server error during update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/delete-employee/${id}?username=${username}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      console.log('Delete response:', data);
      setMessage(data.message || (data.success ? '✅ Deleted successfully' : '❌ Deletion failed'));
      if (data.success) fetchEmployees();
    } catch (err) {
      console.error('Delete error:', err);
      setMessage('❌ Server error during deletion');
    }
  };

  const handleKeySubmit = (e) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setMessage('❌ Please enter a passkey');
      return;
    }
    if (inputKey === DEALER_PASSKEY) {
      setPasskeyEntered(true);
      setMessage('');
    } else {
      setMessage('❌ Incorrect passkey');
    }
  };

  if (!passkeyEntered) {
    return (
      <div style={styles.passkeyContainer}>
        <h3>Enter Dealer Passkey</h3>
        <form onSubmit={handleKeySubmit}>
          <input
            type="password"
            placeholder="Enter dealer passkey"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            style={styles.passkeyInput}
          />
          <button type="submit" style={styles.submitButton}>
            Submit
          </button>
        </form>
        {message && <p style={styles.errorMessage}>{message}</p>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.debugPanel}>
        <h4>Information</h4>
        <p><strong>Username:</strong> {username}</p>
        <p><strong>Loaded Employees:</strong> {employees.length}</p>
        <button onClick={fetchEmployees} style={styles.refreshButton}>
          Refresh Data
        </button>
      </div>

      {isLoading ? (
        <p style={styles.loadingMessage}>Loading employees...</p>
      ) : employees.length === 0 ? (
        <p style={styles.noEmployees}>No employees found</p>
      ) : (
        employees.map(emp => (
          <div key={emp._id} style={styles.employeeCard}>
            <div style={styles.employeeHeader}>
              <p><strong>ID:</strong> {emp._id}</p>
              <p><strong>Current Name:</strong> {emp.displayName}</p>
            </div>
            <div style={styles.controls}>
              <input
                type="text"
                value={editNames[emp._id] || ''}
                onChange={(e) => setEditNames({ ...editNames, [emp._id]: e.target.value })}
                placeholder="New name"
                style={styles.nameInput}
              />
              <button 
                onClick={() => handleEdit(emp._id)}
                style={styles.editButton}
                disabled={!editNames[emp._id]?.trim()}
              >
                Update
              </button>
              <button 
                onClick={() => handleDelete(emp._id)}
                style={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  passkeyContainer: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '20px',
    textAlign: 'center',
    border: '1px solid #ddd',
    borderRadius: '8px'
  },
  passkeyInput: {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    fontSize: '16px'
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  debugPanel: {
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ddd'
  },
  employeeCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    backgroundColor: '#fff'
  },
  employeeHeader: {
    marginBottom: '10px'
  },
  controls: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  },
  nameInput: {
    flex: 1,
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  editButton: {
    padding: '8px 15px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  deleteButton: {
    padding: '8px 15px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  refreshButton: {
    padding: '8px 15px',
    backgroundColor: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px'
  },
  errorMessage: {
    color: '#f44336',
    marginTop: '10px'
  },
  loadingMessage: {
    color: '#2196F3',
    textAlign: 'center'
  },
  noEmployees: {
    color: '#FF9800',
    textAlign: 'center'
  }
};
