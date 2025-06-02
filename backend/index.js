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

// Helper: Get IST day bounds as UTC dates for querying MongoDB
function getISTDayBounds(date) {
  const istOffsetMs = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
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

    if (distance > 10000000) {
      return res.json({
        success: false,
        message: `❌ Outside 100m attendance zone (distance: ${Math.round(distance)}m)`
      });
    }

    // Convert the timestamp to Date object
    const submittedDate = new Date(timestamp);
    const { startUTC, endUTC } = getISTDayBounds(submittedDate);

    // Check if the same type already recorded today (checkin or checkout)
    const existingSameType = await Attendance.findOne({
      employeeName: matchedEmployee.name,
      type,
      timestamp: { $gte: startUTC, $lte: endUTC }
    });

    if (existingSameType) {
      return res.json({
        success: false,
        message: `${type === 'checkin' ? 'Check-in' : 'Checkout'} already recorded today`
      });
    }

    if (type === 'checkout') {
      // Ensure a checkin exists today before allowing checkout
      const checkinToday = await Attendance.findOne({
        employeeName: matchedEmployee.name,
        type: 'checkin',
        timestamp: { $gte: startUTC, $lte: endUTC }
      });

      if (!checkinToday) {
        return res.json({
          success: false,
          message: '❌ Checkout denied: Check-in not recorded today'
        });
      }
    }

    const attendance = new Attendance({
      employeeName: matchedEmployee.name,
      timestamp: submittedDate,
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

const DEALER_EMAIL = process.env.DEALER_EMAIL;
const DEALER_PASSWORD = process.env.DEALER_PASSWORD;


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
    const records = await Attendance.find().sort({ timestamp: 1 });

    const grouped = {};

    for (const record of records) {
      const istDateObj = new Date(record.timestamp.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const dayName = istDateObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
      const day = istDateObj.getDate().toString().padStart(2, '0');
      const month = (istDateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = istDateObj.getFullYear();
      const dateKey = `${dayName}, ${day}-${month}-${year}`;

      if (!grouped[dateKey]) grouped[dateKey] = {};
      if (!grouped[dateKey][record.employeeName]) {
        grouped[dateKey][record.employeeName] = { checkin: null, checkout: null };
      }

      const localTime = new Date(record.timestamp).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      if (record.type === 'checkin') {
        if (!grouped[dateKey][record.employeeName].checkin || localTime < grouped[dateKey][record.employeeName].checkin) {
          grouped[dateKey][record.employeeName].checkin = localTime;
        }
      } else if (record.type === 'checkout') {
        if (!grouped[dateKey][record.employeeName].checkout || localTime > grouped[dateKey][record.employeeName].checkout) {
          grouped[dateKey][record.employeeName].checkout = localTime;
        }
      }
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');

    sheet.columns = [
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Check-in', key: 'checkin', width: 20 },
      { header: 'Check-out', key: 'checkout', width: 20 },
    ];

    const dateHeaderStyle = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } },
    };

    for (const [dateKey, employees] of Object.entries(grouped)) {
      if (sheet.rowCount > 1) {
        sheet.addRow([]);
      }

      const dateRow = sheet.addRow([dateKey]);
      dateRow.font = dateHeaderStyle.font;
      dateRow.alignment = dateHeaderStyle.alignment;
      dateRow.fill = dateHeaderStyle.fill;

      sheet.mergeCells(`A${dateRow.number}:C${dateRow.number}`);

      const headerRow = sheet.addRow(['Employee Name', 'Check-in', 'Check-out']);
      headerRow.font = { bold: true };

      for (const employeeName of Object.keys(employees).sort()) {
        const times = employees[employeeName];
        sheet.addRow({
          employeeName,
          checkin: times.checkin || '',
          checkout: times.checkout || '',
        });
      }
    }

    const filename = `attendance_all_dates.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).send('Error generating Excel');
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`🚀 Backend running on port ${port}`));
