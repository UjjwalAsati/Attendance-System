const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  faceDescriptor: { type: [Number], required: true },
  username: { type: String, required: true },
  guestCreatedAt: { type: Date }, 
});

EmployeeSchema.index(
  { guestCreatedAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24, 
    partialFilterExpression: { guestCreatedAt: { $exists: true } },
  }
);

EmployeeSchema.pre('save', function (next) {
  if (this.username === 'guest' && !this.guestCreatedAt) {
    this.guestCreatedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Employee', EmployeeSchema);
