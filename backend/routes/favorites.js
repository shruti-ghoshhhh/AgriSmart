const express = require('express');
const router = express.Router();
const User = require('../models/User');
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

// @route   POST /api/favorites/toggle
// @desc    Toggle a listing in user's favorites
router.post('/toggle', auth, async (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ message: 'Listing ID required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const index = user.favoriteListings.indexOf(listingId);
    if (index > -1) {
      user.favoriteListings.splice(index, 1);
      await user.save();
      return res.json({ message: 'Removed from favorites', favorites: user.favoriteListings });
    } else {
      user.favoriteListings.push(listingId);
      await user.save();
      return res.json({ message: 'Added to favorites', favorites: user.favoriteListings });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/favorites/my
// @desc    Get user's favorites
router.get('/my', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
        path: 'favoriteListings',
        populate: { path: 'producer', select: 'name' }
    });
    res.json(user.favoriteListings);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
