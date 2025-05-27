// index.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Attendance = require('./models/Attendance');
const Employee = require('./models/Employee');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Register an employee face
app.post('/register-face', async (req, res) => {
  try {
    const { name, faceDescriptor } = req.body;

    if (!name || !faceDescriptor || faceDescriptor.length === 0) {
  return res.status(400).json({ error: 'Missing name or face descriptor or empty descriptor' });
}


    console.log('Saving employee:', name);
    const employee = new Employee({ name, faceDescriptor });
    await employee.save();
    console.log('✅ Employee saved successfully');

    res.json({ success: true, message: 'Face registered successfully' });
  } catch (error) {
    console.error('❌ Error registering face:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit attendance by matching face descriptor
app.post('/submit-attendance', async (req, res) => {
  try {
    const { descriptor, timestamp, latitude, longitude } = req.body;

    if (!descriptor || !timestamp || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const employees = await Employee.find();

    const match = employees.find(emp => {
      const dist = euclideanDistance(emp.faceDescriptor, descriptor);
      return dist < 0.5; // adjust threshold as needed
    });

    if (!match) {
      return res.json({ success: false, message: 'Face not recognized' });
    }

    const attendance = new Attendance({
      name: match.name,
      timestamp,
      latitude,
      longitude
    });

    await attendance.save();
    res.json({ success: true, name: match.name });
  } catch (error) {
    console.error('❌ Error saving attendance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Hardcoded dealer credentials login route
const DEALER_EMAIL = 'ujjwal5.asati5@gmail.com';
const DEALER_PASSWORD = '123';

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email === DEALER_EMAIL && password === DEALER_PASSWORD) {
    return res.json({ success: true, message: 'Login successful' });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Utility: Euclidean distance between two descriptors
function euclideanDistance(d1, d2) {
  return Math.sqrt(d1.reduce((sum, val, i) => sum + Math.pow(val - d2[i], 2), 0));
}

// Optional: Debug endpoint to check all registered employees
app.get('/all-employees', async (req, res) => {
  const employees = await Employee.find();
  res.json(employees);
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`🚀 Backend running on port ${port}`));
