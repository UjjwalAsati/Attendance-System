import React, { useEffect, useState, useMemo } from 'react'
import '../styles/EditEmployee.css'

export default function EditEmployee() {
  const [passkeyEntered, setPasskeyEntered] = useState(false)
  const [inputKey, setInputKey] = useState('')
  const [employees, setEmployees] = useState([])
  const [editNames, setEditNames] = useState({})
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const username = localStorage.getItem('username')
  const DEALER_PASSKEY = import.meta.env.VITE_DEALER_PASSKEY
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedMode)
    if (savedMode) document.body.classList.add('dark')
    else document.body.classList.remove('dark')
  }, [])

  const fetchEmployees = async () => {
    setIsLoading(true)
    setMessage('')
    try {
      const endpoint = `${BACKEND_URL}/get-employees?username=${encodeURIComponent(username)}`
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`)
      const data = await res.json()
      if (!data || !Array.isArray(data.employees)) throw new Error('Invalid data format: employees array missing')

      const processedEmployees = data.employees.map(emp => ({
        ...emp,
        displayName: emp.employeeName || emp.name || emp.fullName || 'Unnamed Employee',
      }))
      setEmployees(processedEmployees)
      const names = {}
      processedEmployees.forEach(emp => { names[emp._id] = emp.displayName })
      setEditNames(names)

      setMessage(`Loaded ${processedEmployees.length} employees`)
    } catch (err) {
      setMessage(`Error: ${err.message}`)
      setEmployees([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (passkeyEntered) fetchEmployees()
  }, [passkeyEntered])

  const handleEdit = async id => {
    const newName = editNames[id]?.trim()
    if (!newName) {
      setMessage('Please enter a valid name')
      return
    }
    try {
      const res = await fetch(`${BACKEND_URL}/edit-employee/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newName }),
      })
      const data = await res.json()
      setMessage(data.message || (data.success ? 'Updated successfully' : 'Update failed'))

      if (data.success) {
        setEmployees(prev => prev.map(emp =>
          emp._id === id ? { ...emp, displayName: newName } : emp
        ))
      }
    } catch {
      setMessage('Server error during update')
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this employee?')) return
    try {
      const res = await fetch(`${BACKEND_URL}/delete-employee/${id}?username=${encodeURIComponent(username)}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      setMessage(data.message || (data.success ? 'Deleted successfully' : 'Deletion failed'))
      if (data.success) fetchEmployees()
    } catch {
      setMessage('Server error during deletion')
    }
  }

  const handleKeySubmit = e => {
    e.preventDefault()
    if (!inputKey.trim()) return setMessage('Please enter a passkey')
    if (inputKey === DEALER_PASSKEY) {
      setPasskeyEntered(true)
      setMessage('')
    } else {
      setMessage('Incorrect passkey')
    }
  }

  // ✅ Live search filtering
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp =>
      emp.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employees, searchTerm])

  if (!passkeyEntered) {
    return (
      <div className={`passkey-container${darkMode ? ' dark' : ''}`}>
        <h3>Dealer Authorization</h3>
        <p className="passkey-instruction">
          Enter the dealer passkey to edit or delete employees.
        </p>
        <form onSubmit={handleKeySubmit}>
          <input
            type="password"
            placeholder="Enter dealer passkey"
            value={inputKey}
            onChange={e => setInputKey(e.target.value)}
            className="passkey-input"
          />
          <button type="submit" className="btn submit-btn" disabled={!inputKey.trim()}>
            Submit
          </button>
        </form>
        {message && (
          <div className={`status-msg ${message.toLowerCase().includes('incorrect') ? 'error' : 'info'}`}>
            {message}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`container${darkMode ? ' dark' : ''}`}>
      {/* Search bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search employee"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="debug-panel">
        <h4>Information</h4>
        <p><strong>ID:</strong> {username}</p>
        <p><strong>Loaded:</strong> {employees.length}</p>
        <button onClick={fetchEmployees} className="btn refresh-btn">
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p className="loading-message">Loading employees...</p>
      ) : filteredEmployees.length === 0 ? (
        <p className="no-employees">No employees found.</p>
      ) : (
        filteredEmployees.map(emp => (
          <div key={emp._id} className="employee-card">
            <div className="employee-header">
              <p><strong>Name:</strong> {emp.displayName}</p>
            </div>
            <div className="controls">
              <input
                type="text"
                value={editNames[emp._id] || ''}
                onChange={e => setEditNames({ ...editNames, [emp._id]: e.target.value })}
                placeholder="New name"
                className="name-input"
              />
              <button
                onClick={() => handleEdit(emp._id)}
                className="btn edit-btn"
                disabled={!editNames[emp._id]?.trim()}
              >
                Update
              </button>
              <button onClick={() => handleDelete(emp._id)} className="btn delete-btn">
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {message && <p className="message">{message}</p>}
    </div>
  )
}
