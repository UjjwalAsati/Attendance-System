const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  username: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  type: { type: String, enum: ['checkin', 'checkout'], required: true },
  guestTimestamp: { type: Date }, 
});

AttendanceSchema.index(
  { guestTimestamp: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24,
    partialFilterExpression: { guestTimestamp: { $exists: true } },
  }
);

AttendanceSchema.index(
  { timestamp: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 60, 
    partialFilterExpression: { guestTimestamp: { $exists: false } },
  }
);

AttendanceSchema.pre('save', function (next) {
  if (this.username === 'guest' && !this.guestTimestamp) {
    this.guestTimestamp = new Date();
  }
  next();
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
