const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch { res.status(401).json({ message: 'Token is not valid' }); }
};

// @route   GET /api/messages/conversation/:userId
// @desc    Get conversation between two users
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id }
      ]
    })
    .populate('sender', 'name')
    .populate('receiver', 'name')
    .sort({ createdAt: 1 })
    .limit(100);

    // Mark messages from other user as read
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user.id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/messages/contacts
// @desc    Get list of users that the current user has chatted with
router.get('/contacts', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    }).populate('sender', 'name role').populate('receiver', 'name role');

    // Extract unique contacts
    const contactMap = new Map();
    messages.forEach(m => {
      const contact = m.sender._id.toString() === req.user.id ? m.receiver : m.sender;
      if (!contactMap.has(contact._id.toString())) {
        contactMap.set(contact._id.toString(), {
          _id: contact._id,
          name: contact.name,
          role: contact.role,
          lastMessage: m.text,
          lastMessageTime: m.createdAt,
          unread: 0
        });
      }
    });

    // Count unread for each contact
    const unreadCounts = await Message.aggregate([
      { $match: { receiver: require('mongoose').Types.ObjectId(req.user.id), read: false } },
      { $group: { _id: '$sender', count: { $sum: 1 } } }
    ]);
    unreadCounts.forEach(u => {
      const contact = contactMap.get(u._id.toString());
      if (contact) contact.unread = u.count;
    });

    res.json(Array.from(contactMap.values()));
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
