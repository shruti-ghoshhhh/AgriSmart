const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Auction = require('../models/Auction');
const jwt = require('jsonwebtoken');

// Middleware to authenticate user
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// @route    GET api/dashboard/producer
// @desc     Get real stats for producer dashboard
// @access   Private (Producer)
router.get('/producer', auth, async (req, res) => {
  if (req.user.role !== 'producer') {
    return res.status(403).json({ message: 'Access denied: Producers only' });
  }

  try {
    const orders = await Order.find({ seller: req.user.id }).sort({ createdAt: 1 });
    const auctions = await Auction.find({ producer: req.user.id });

    // Aggregations
    const totalEarnings = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalQtySold = orders.reduce((sum, order) => sum + order.quantity, 0);
    const uniqueCustomers = new Set(orders.map(order => order.buyer.toString())).size;
    
    // Carbon Saved Logic: 0.5kg per kg of produce
    const carbonSaved = (totalQtySold * 0.5).toFixed(1);

    // Timeline for charts (Grouping by day for the last 7 days)
    const timeline = orders.map(order => ({
      name: new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
      value: order.totalAmount
    }));

    res.json({
      counts: {
        totalEarnings,
        carbonSaved: `${carbonSaved}kg`,
        marketReach: uniqueCustomers,
        activeAuctions: auctions.filter(a => a.status === 'open').length
      },
      timeline
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/dashboard/consumer
// @desc     Get real stats for consumer dashboard
// @access   Private (Consumer)
router.get('/consumer', auth, async (req, res) => {
  if (req.user.role !== 'consumer') {
    return res.status(403).json({ message: 'Access denied: Consumers only' });
  }

  try {
    const orders = await Order.find({ buyer: req.user.id }).sort({ createdAt: 1 });
    
    // Aggregation
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalQtyBought = orders.reduce((sum, order) => sum + order.quantity, 0);
    
    // Cost Saved Logic: 15% mediator markup avoided
    const costSaved = (totalSpent * 0.15).toFixed(2);

    const timeline = orders.map(order => ({
      name: new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
      value: order.totalAmount
    }));

    res.json({
      counts: {
         totalSpent,
         costSaved: `$${costSaved}`,
         goodsBought: `${totalQtyBought} units`,
         ordersCount: orders.length
      },
      timeline
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
