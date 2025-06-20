const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  faceDescriptor: { type: [Number], required: true },
  username:String,
});

module.exports = mongoose.model('Employee', EmployeeSchema);
