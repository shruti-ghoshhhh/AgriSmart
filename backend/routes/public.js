const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Auction = require('../models/Auction');

// @route   GET api/public/stats
// @desc    Get public counters for the landing page
router.get('/stats', async (req, res) => {
  try {
    const producersCount = await User.countDocuments({ role: 'producer' });
    const consumersCount = await User.countDocuments({ role: 'consumer' });
    const auctionsCount = await Auction.countDocuments();
    
    // We can even add "Total Yield Traded" if we had a field for it, 
    // for now let's stick to these true counts.
    res.json({
      producers: producersCount,
      consumers: consumersCount,
      auctions: auctionsCount
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
