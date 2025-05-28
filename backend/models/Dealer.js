const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const DealerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});

DealerSchema.methods.isValidPassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('Dealer', DealerSchema);
