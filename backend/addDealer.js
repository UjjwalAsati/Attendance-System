require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Dealer = require('./models/Dealer');

async function addDealer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const existing = await Dealer.findOne({ email });
    if (existing) {
      console.log('Dealer already exists');
      process.exit();
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const dealer = new Dealer({ email, passwordHash });
    await dealer.save();

    console.log('Dealer added successfully');
    process.exit();
  } catch (err) {
    console.error('Error adding dealer:', err);
    process.exit(1);
  }
}

addDealer();
