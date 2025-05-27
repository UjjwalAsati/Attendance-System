const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  faceDescriptor: { type: [Number], required: true }, // store face descriptor array
});

module.exports = mongoose.model('Employee', EmployeeSchema);
