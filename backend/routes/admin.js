const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Auction = require('../models/Auction');
const Feedback = require('../models/Feedback');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Middleware to authenticate and check Admin role
const adminAuth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// @route   GET api/admin/stats
// @desc    Get dashboard stats (dynamic counts for charts)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const producersCount = await User.countDocuments({ role: 'producer' });
    const consumersCount = await User.countDocuments({ role: 'consumer' });
    const auctionsCount = await Auction.countDocuments();
    const resolvedFeedback = await Feedback.countDocuments({ status: 'resolved' });
    const pendingFeedback = await Feedback.countDocuments({ status: 'pending' });

    // Calculate dynamic growth data for the last 4 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timeline = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const pCount = await User.countDocuments({ role: 'producer', createdAt: { $lt: nextD } });
      const cCount = await User.countDocuments({ role: 'consumer', createdAt: { $lt: nextD } });
      const aCount = await Auction.countDocuments({ createdAt: { $lt: nextD } });

      timeline.push({
        name: monthNames[d.getMonth()],
        producers: pCount,
        consumers: cCount,
        auctions: aCount
      });
    }

    res.json({
      counts: { producersCount, consumersCount, auctionsCount, resolvedFeedback, pendingFeedback },
      timeline
    });
  } catch (err) {
    console.error('Stats Error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH api/admin/feedback/archive/:id
// @desc    Archive feedback (hide from queue)
router.patch('/feedback/archive/:id', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    feedback.status = 'archived'; // Add archived status
    await feedback.save();
    res.json(feedback);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/users
// @desc    Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/users
// @desc    Create a new user manually
router.post('/users', adminAuth, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'consumer'
    });

    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/users/:id
// @desc    Update user details
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PATCH api/admin/users/ban/:id
// @desc    Toggle user ban status
router.patch('/users/ban/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot ban another admin' });

    user.isBanned = !user.isBanned;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/users/:id
// @desc    Delete a user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/feedback
// @desc    Get all feedback
router.get('/feedback', adminAuth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/feedback/resolve/:id
// @desc    Mark feedback as resolved
router.post('/feedback/resolve/:id', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    feedback.status = 'resolved';
    await feedback.save();
    res.json(feedback);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/auctions
// @desc    Get all listings for admin monitoring
router.get('/auctions', adminAuth, async (req, res) => {
  try {
    const auctions = await Auction.find().populate('producer', 'name email').sort({ createdAt: -1 });
    res.json(auctions);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/auctions/:id
// @desc    Delete a listing (admin override)
router.delete('/auctions/:id', adminAuth, async (req, res) => {
  try {
    await Auction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Listing removed by admin' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
