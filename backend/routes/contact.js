const express = require('express');
const router = express.Router();
const { sendEmail, emailTemplates } = require('../utils/mailer');

// @route   POST /api/contact
// @desc    Public contact form submission — sends email to admin
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ message: 'Name, email and message are required' });
  try {
    await sendEmail(emailTemplates.contactMessage({ name, email, subject: subject || 'General Inquiry', message }));
    res.json({ message: 'Your message has been sent! We will get back to you within 24 hours.' });
  } catch (err) {
    console.error('Contact email error:', err.message);
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
});

module.exports = router;
