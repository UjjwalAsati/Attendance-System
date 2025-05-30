// index.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
require('dotenv').config();

const Attendance = require('./models/Attendance');
const Employee = require('./models/Employee');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

function getISTDayBounds(date) {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const localDate = new Date(date.getTime() + istOffsetMs);
  const startOfDay = new Date(localDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(localDate);
  endOfDay.setHours(23, 59, 59, 999);
  return {
    startUTC: new Date(startOfDay.getTime() - istOffsetMs),
    endUTC: new Date(endOfDay.getTime() - istOffsetMs)
  };
}

function euclideanDistance(d1, d2) {
  return Math.sqrt(d1.reduce((sum, val, i) => sum + Math.pow(val - d2[i], 2), 0));
}

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = deg => deg * Math.PI / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

app.post('/register-face', async (req, res) => {
  try {
    const { name, faceDescriptor } = req.body;
    if (!name || !faceDescriptor || faceDescriptor.length === 0) {
      return res.status(400).json({ error: 'Missing name or face descriptor' });
    }
    const employee = new Employee({ name, faceDescriptor });
    await employee.save();
    res.json({ success: true, message: 'Face registered successfully' });
  } catch (error) {
    console.error('❌ Error registering face:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/submit-attendance', async (req, res) => {
  try {
    const { descriptor, timestamp, latitude, longitude, type } = req.body;

    if (!descriptor || !timestamp || latitude == null || longitude == null || !type) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    console.log('📍 Received location:', latitude, longitude);

    const employees = await Employee.find();
    let matchedEmployee = null;

    for (const emp of employees) {
      const dist = euclideanDistance(emp.faceDescriptor, descriptor);
      if (dist < 0.5) {
        matchedEmployee = emp;
        break;
      }
    }

    if (!matchedEmployee) {
      return res.json({ success: false, message: 'Face not recognized' });
    }

    const centerLat = 25.0288473;
    const centerLon = 79.4928857;
    const distance = getDistanceInMeters(latitude, longitude, centerLat, centerLon);

    if (distance > 100) {
      return res.json({
        success: false,
        message: `❌ Outside 100m attendance zone (distance: ${Math.round(distance)}m)`
      });
    }

    const { startUTC, endUTC } = getISTDayBounds(new Date(timestamp));

    const query = {
      employeeName: matchedEmployee.name,
      timestamp: { $gte: startUTC, $lte: endUTC },
      type
    };

    const alreadyMarked = await Attendance.findOne(query);

if (alreadyMarked) {
  return res.json({ success: false, message: `${type === 'checkin' ? 'Check-in' : 'Checkout'} already recorded today` });
}

// ⛔️ Prevent checkout without checkin
if (type === 'checkout') {
  const checkinQuery = {
    employeeName: matchedEmployee.name,
    timestamp: { $gte: startUTC, $lte: endUTC },
    type: 'checkin'
  };

  const checkinExists = await Attendance.findOne(checkinQuery);
  if (!checkinExists) {
    return res.json({
      success: false,
      message: '❌ Checkout denied: Check-in not recorded today'
    });
  }
}


    const attendance = new Attendance({
      employeeName: matchedEmployee.name,
      timestamp: new Date(timestamp),
      latitude,
      longitude,
      type
    });

    await attendance.save();

    res.json({
      success: true,
      name: matchedEmployee.name,
      timestamp: attendance.timestamp,
      message: `${type === 'checkin' ? 'Check-in' : 'Checkout'} recorded successfully`
    });

  } catch (error) {
    console.error('❌ Error saving attendance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

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

app.get('/all-employees', async (req, res) => {
  const employees = await Employee.find();
  res.json(employees);
});

app.get('/download-attendance', async (req, res) => {
  try {
    const records = await Attendance.find().sort({ timestamp: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');

    sheet.columns = [
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Timestamp (IST)', key: 'timestamp', width: 30 },
      { header: 'Latitude', key: 'latitude', width: 15 },
      { header: 'Longitude', key: 'longitude', width: 15 }
    ];

    for (const record of records) {
      const istTime = new Date(record.timestamp).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true
      });

      sheet.addRow({
        employeeName: record.employeeName,
        type: record.type,
        timestamp: istTime,
        latitude: record.latitude,
        longitude: record.longitude
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('❌ Error exporting Excel:', error);
    res.status(500).send('Error generating Excel');
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`🚀 Backend running on port ${port}`));
