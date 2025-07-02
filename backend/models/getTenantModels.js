
const mongoose = require('mongoose');
const EmployeeSchema = require('../models/Employee').schema;
const AttendanceSchema = require('../models/Attendance').schema;

const connections = {};

const getTenantModels = async (username) => {
  let dbUri;
  if (username === 'jatashankar_auto@rediffmail.com') {
    dbUri = process.env.MONGODB_URI_JM;
  } else if (username === 'jatashankarsalesandservices@gmail.com') {
    dbUri = process.env.MONGODB_URI_JSS;
  } else {
    throw new Error('Unknown user');
  }

  if (!connections[username]) {
    const conn = await mongoose.createConnection(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    connections[username] = {
      Employee: conn.model('Employee', EmployeeSchema),
      Attendance: conn.model('Attendance', AttendanceSchema)
    };
  }

  return connections[username];
};

module.exports = { getTenantModels };
