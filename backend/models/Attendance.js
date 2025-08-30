const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employeeName: { type: String, required: true }, 
  username: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  type: { type: String, enum: ['checkin', 'checkout'], required: true },
});

AttendanceSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 60 * 24 * 60 * 60 } 
);

module.exports = mongoose.model('Attendance', AttendanceSchema);
