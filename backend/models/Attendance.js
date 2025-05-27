const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  email: { type: String, required: true },
  timestamp: { type: Date, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  faceImageBase64: { type: String, required: true }
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
