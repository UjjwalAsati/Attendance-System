const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

router.post('/submit-attendance', async (req, res) => {
  const faceapi = require('@vladmandic/face-api');
  const canvas = require('canvas');
  const { faceImageBase64} = req.body;

  try {
    const imgBuffer = Buffer.from(faceImageBase64.split(',')[1], 'base64');
    const img = await canvas.loadImage(imgBuffer);

    const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return res.json({ success: false, message: 'No face detected' });
    }

    const descriptor = detection.descriptor;
    const employees = await Employee.find();

    let bestMatch = null;
    let minDistance = 0.6;

    for (const emp of employees) {
      const distance = faceapi.euclideanDistance(
        new Float32Array(emp.faceDescriptor),
        new Float32Array(descriptor)
      );
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = emp;
      }
    }

    if (!bestMatch) {
      return res.json({ success: false, message: 'Face not recognized' });
    }

    await Attendance.create({
      name: bestMatch.name,
      email: bestMatch.email,
      timestamp: new Date(),
      faceImageBase64,
    });

    res.json({ success: true, message: 'Attendance recorded' });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
