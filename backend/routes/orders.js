const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail, emailTemplates } = require('../utils/mailer');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch { res.status(401).json({ message: 'Token is not valid' }); }
};

// @route   GET /api/orders/my
// @desc    Consumer gets their order history
router.get('/my', auth, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate('listing', 'title cropType quantity')
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/orders/producer
// @desc    Producer gets orders they need to fulfill
router.get('/producer', auth, async (req, res) => {
  try {
    if (req.user.role !== 'producer') return res.status(403).json({ message: 'Producers only' });
    const orders = await Order.find({ seller: req.user.id })
      .populate('listing', 'title cropType quantity')
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Producer updates order status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .populate('listing', 'title');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only seller can update status (or buyer can mark delivered)
    const isSeller = order.seller._id.toString() === req.user.id;
    const isBuyer = order.buyer._id.toString() === req.user.id;

    const allowedByProducer = ['approved', 'dispatched', 'completed'];
    const allowedByConsumer = ['delivered'];

    if (isSeller && !allowedByProducer.includes(status)) {
      return res.status(400).json({ message: `Invalid status for producer: ${status}` });
    }
    if (isBuyer && !allowedByConsumer.includes(status)) {
      return res.status(400).json({ message: `Invalid status for consumer: ${status}` });
    }
    if (!isSeller && !isBuyer) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    order.status = status;
    order.statusHistory.push({ status, note: note || '', timestamp: new Date() });
    await order.save();

    // Emit socket event for live order updates
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${order.buyer._id}`).emit('order-status-update', {
        orderId: order._id,
        status,
        listingTitle: order.listing?.title
      });
    }

    // Send email notifications based on status
    try {
      if (status === 'approved') {
        await sendEmail(emailTemplates.orderApproved(order, order.buyer));
      } else if (status === 'dispatched') {
        await sendEmail(emailTemplates.orderDispatched(order, order.buyer));
      } else if (status === 'completed') {
        await sendEmail(emailTemplates.orderCompleted(order, order.seller));
      }
    } catch (emailErr) {
      console.error('Email send error (non-fatal):', emailErr.message);
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
