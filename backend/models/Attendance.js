const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employeeName: { type: String, required: true }, 
  username: {type:String, required: true },
  timestamp: { type: Date, required: true },
  type: { type: String, enum: ['checkin', 'checkout'], required: true },
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
