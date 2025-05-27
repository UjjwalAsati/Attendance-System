const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },  // store employee name on attendance
  timestamp: { type: Date, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  // No need to store faceImageBase64 here anymore
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
