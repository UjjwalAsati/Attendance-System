const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Attendance = require('./models/Attendance');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173' 
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.post('/submit-attendance', async (req, res) => {
  try {
    const { email, timestamp, latitude, longitude, faceImageBase64 } = req.body;

    if (!email || !timestamp || !latitude || !longitude || !faceImageBase64) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const attendance = new Attendance({
      email,
      timestamp,
      latitude,
      longitude,
      faceImageBase64
    });

    await attendance.save();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend running on port ${port}`));
