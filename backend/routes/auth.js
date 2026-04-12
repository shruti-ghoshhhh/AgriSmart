const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', register);

// @route   POST api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', login);

// @route   POST api/auth/forgot-password
// @desc    Generate reset token and send email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const User = require('../models/User');
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    // Generate a simple UUID-like token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Save to user (valid for 1 hour)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    // Send email
    const { sendEmail, emailTemplates } = require('../utils/mailer');
    const resetLink = `http://localhost:5173/reset-password/${resetToken}`; // Demo link
    
    await sendEmail(emailTemplates.passwordReset(user, resetLink));

    res.json({ message: 'A password reset link has been sent to your email.' });
  } catch (err) {
    console.error('Forgot Password Error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/reset-password/:token
// @desc    Reset password using token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const User = require('../models/User');
    const user = await User.findOne({ 
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    // Hash and save new password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Clear reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    res.json({ message: 'Password has been successfully reset! You can now log in.' });
  } catch (err) {
    console.error('Reset Password Error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
