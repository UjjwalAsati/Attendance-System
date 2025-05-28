const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },  
  timestamp: { type: Date, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
