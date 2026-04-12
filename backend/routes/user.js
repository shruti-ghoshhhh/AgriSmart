const express = require('express');
const router = express.Router();
const User = require('../models/User');
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

// @route   GET api/users/producers
// @desc    Get all producers with location
router.get('/producers', async (req, res) => {
  try {
    const producers = await User.find({ role: 'producer' }).select('-password');
    res.json(producers);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/consumers
// @desc    Get all consumers with location
router.get('/consumers', async (req, res) => {
  try {
    const consumers = await User.find({ role: 'consumer' }).select('-password');
    res.json(consumers);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users/favorite/:id
// @desc    Favorite a producer
router.post('/favorite/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.favorites.includes(req.params.id)) {
      user.favorites.push(req.params.id);
      await user.save();
    }
    res.json(user.favorites);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/favorite/:id
// @desc    Unfavorite a producer
router.delete('/favorite/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.favorites = user.favorites.filter(favId => favId.toString() !== req.params.id);
    await user.save();
    res.json(user.favorites);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

const Order = require('../models/Order');

// @route   GET api/users/producers/customers
// @desc    Get all unique customers who bought from this producer
router.get('/producers/customers', auth, async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user.id })
      .populate('buyer', 'name email createdAt favorites')
      .populate('listing', 'title cropType quantity price');
    
    // Aggregate unique customers
    const customerMap = {};
    orders.forEach(order => {
      if (order.buyer) {
        if (!customerMap[order.buyer._id]) {
          customerMap[order.buyer._id] = {
            ...order.buyer._doc,
            orders: []
          };
        }
        customerMap[order.buyer._id].orders.push({
          item: order.listing?.title || 'Unknown Item',
          date: order.createdAt,
          amount: order.totalAmount
        });
      }
    });

    res.json(Object.values(customerMap));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/profile/location
// @desc    Update user location coordinates
router.put('/profile/location', auth, async (req, res) => {
  try {
    const { coordinates } = req.body; // [lon, lat]
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ message: 'Invalid coordinates format. Expected [longitude, latitude].' });
    }

    // Ensure coordinates are numbers
    const lon = parseFloat(coordinates[0]);
    const lat = parseFloat(coordinates[1]);

    if (isNaN(lon) || isNaN(lat)) {
       return res.status(400).json({ message: 'Coordinates must be valid numbers.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          location: { 
            type: 'Point', 
            coordinates: [lon, lat] 
          } 
        } 
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser.location);
  } catch (err) {
    console.error('Location Update Error:', err.message);
    // Log to a file we can read
    const fs = require('fs');
    fs.appendFileSync('error_logs.txt', `[${new Date().toISOString()}] Location Update Error: ${err.message}\n${err.stack}\n`);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;
