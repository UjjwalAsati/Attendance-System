const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
require('dotenv').config();

const Attendance = require('./models/Attendance');
const Employee = require('./models/Employee');

const app = express();
app.use(cors({ origin: 'https://attendance-system-jo9b.onrender.com' }));
app.use(express.json({ limit: '1000mb' }));

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
    const { name, faceDescriptor, username } = req.body;
    if (!name || !faceDescriptor || faceDescriptor.length === 0 || !username) {
      return res.status(400).json({ error: 'Missing name, username or face descriptor' });
    }
    const employee = new Employee({ name, faceDescriptor, username });
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

    const submittedDate = new Date(timestamp);
    const { startUTC, endUTC } = getISTDayBounds(submittedDate);

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
      username: matchedEmployee.username,
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
    const { username } = req.query;
    const query = username ? { username } : {};
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const lastMonth = new Date(firstOfMonth);
    lastMonth.setDate(0);
    const day2 = new Date(lastMonth);
    const day1 = new Date(lastMonth);
    day1.setDate(lastMonth.getDate() - 1);

    const startDate = new Date(day1.setHours(0, 0, 0, 0));
    const endDate = new Date(now.setHours(23, 59, 59, 999));

    const records = await Attendance.find({
      ...query,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });

    const allEmployees = await Employee.find(query);

    if (records.length === 0) {
      return res.status(404).send('No attendance records found.');
    }

    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const dateList = [];

    const cur = new Date(startDate.getTime() + istOffsetMs);
    cur.setUTCHours(0, 0, 0, 0);

    while (cur <= endDate) {
      const dateStr = new Date(cur.getTime() - istOffsetMs).toISOString().split('T')[0];
      dateList.push(dateStr);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const todayYMD = todayIST.toISOString().split('T')[0];
    if (!dateList.includes(todayYMD)) {
      dateList.push(todayYMD);
    }

    const grouped = {};
    for (const date of dateList) {
      grouped[date] = {};
      for (const emp of allEmployees) {
        grouped[date][emp.name] = { checkin: 'Absent', checkout: 'Absent' };
      }
    }

    for (const record of records) {
      const istDate = new Date(record.timestamp.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const dateStr = istDate.toISOString().split('T')[0];
      const localTime = new Date(record.timestamp).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      if (!grouped[dateStr]) grouped[dateStr] = {};
      if (!grouped[dateStr][record.employeeName]) {
        grouped[dateStr][record.employeeName] = { checkin: 'Absent', checkout: 'Absent' };
      }

      if (record.type === 'checkin') {
        grouped[dateStr][record.employeeName].checkin = localTime;
      } else if (record.type === 'checkout') {
        grouped[dateStr][record.employeeName].checkout = localTime;
      }
    }

    for (const date of dateList) {
      for (const empName in grouped[date]) {
        const attendance = grouped[date][empName];
        if (attendance.checkin !== 'Absent' && attendance.checkout === 'Absent') {
          attendance.checkout = 'Not given';
        }
        if (attendance.checkout !== 'Absent' && attendance.checkin === 'Absent') {
          attendance.checkin = 'Not given';
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

    for (const date of dateList) {
      const d = new Date(`${date}T00:00:00`);
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' });
      const dd = d.getDate().toString().padStart(2, '0');
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const yyyy = d.getFullYear();
      const dateKey = `${dayName}, ${dd}-${mm}-${yyyy}`;

      if (sheet.rowCount > 1) sheet.addRow([]);

      const dateRow = sheet.addRow([dateKey]);
      dateRow.font = dateHeaderStyle.font;
      dateRow.alignment = dateHeaderStyle.alignment;
      dateRow.fill = dateHeaderStyle.fill;
      sheet.mergeCells(`A${dateRow.number}:C${dateRow.number}`);

      const headerRow = sheet.addRow(['Employee Name', 'Check-in', 'Check-out']);
      headerRow.font = { bold: true };

      const employees = grouped[date];
      const sortedNames = Object.keys(employees).sort();

      for (const name of sortedNames) {
        const { checkin, checkout } = employees[name];
        sheet.addRow({
          employeeName: name,
          checkin: checkin || 'Not given',
          checkout: checkout || 'Not given',
        });
      }
    }

    const monthName = now.toLocaleString('en-IN', { month: 'long' });
    const filename = `attendance_${username || 'all'}_${monthName}_${year}_plus2days.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).send('Error generating Excel');
  }
});





app.get('/download-overview', async (req, res) => {
  try {
    const { username } = req.query;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const allEmployees = await Employee.find(username ? { username } : {}).sort({ name: 1 });

    const attendanceRecords = await Attendance.find({
      timestamp: { $gte: firstDay, $lte: lastDay },
      ...(username && { username }),
    });

    const grouped = {};
    for (const emp of allEmployees) {
      grouped[emp.name] = {};
      for (let d = 1; d <= daysInMonth; d++) {
        grouped[emp.name][d] = d <= today ? 'A' : '';
      }
    }

    for (const record of attendanceRecords) {
      const istDate = new Date(record.timestamp.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = istDate.getDate();
      const empName = record.employeeName;
      if (grouped[empName] && day <= today) {
        grouped[empName][day] = 'P';
      }
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Monthly Overview');

    const monthName = now.toLocaleString('en-IN', { month: 'long' });
    const headingCell = sheet.getCell('A1');
    headingCell.value = `${monthName} ${year}`;
    headingCell.font = { bold: true, size: 16 };
    headingCell.alignment = { horizontal: 'center' };
    sheet.mergeCells(1, 1, 1, daysInMonth + 2);

    const headerRow = ['Employee Name'];
    for (let d = 1; d <= daysInMonth; d++) {
      headerRow.push(d);
    }
    headerRow.push(`Total P / ${today}`);
    const header = sheet.addRow(headerRow);
    header.font = { bold: true };
    header.alignment = { horizontal: 'center' };

    for (const emp of allEmployees) {
      const name = emp.name;
      const row = [name];
      let presentCount = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const status = grouped[name]?.[d] || '';
        row.push(status);
        if (d <= today && status === 'P') {
          presentCount++;
        }
      }

      row.push(`${presentCount} / ${today}`);
      sheet.addRow(row);
    }

    sheet.getColumn(1).width = 30;
    for (let col = 2; col <= daysInMonth + 1; col++) {
      sheet.getColumn(col).width = 5;
      sheet.getColumn(col).alignment = { horizontal: 'center' };
    }
    sheet.getColumn(daysInMonth + 2).width = 15;
    sheet.getColumn(daysInMonth + 2).alignment = { horizontal: 'center' };

    for (let rowIndex = 3; rowIndex <= sheet.rowCount; rowIndex++) {
      const row = sheet.getRow(rowIndex);
      for (let colIndex = 2; colIndex <= daysInMonth + 1; colIndex++) {
        const cell = row.getCell(colIndex);
        if (cell.value === 'P') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC6EFCE' }
          };
        } else if (cell.value === 'A') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFC7CE' }
          };
        }
      }
    }

    const filename = `monthly_overview_${username || 'all'}_${month + 1}_${year}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error exporting monthly overview:', err);
    res.status(500).send('Failed to generate overview Excel');
  }
});





const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`🚀 Backend running on port ${port}`));
