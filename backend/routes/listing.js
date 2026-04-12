const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction');
const Order = require('../models/Order');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail, emailTemplates } = require('../utils/mailer');

const CROP_IMAGES = {
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=800',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800',
  corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=800',
  maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=800',
  tomatoes: 'https://images.unsplash.com/photo-1592924357228-91a4daadc739?auto=format&fit=crop&q=80&w=800',
  potatoes: 'https://images.unsplash.com/photo-1518977676601-b53f02bad675?auto=format&fit=crop&q=80&w=800',
  carrots: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=800',
  apples: 'https://images.unsplash.com/photo-1560806887-1e470b13cf41?auto=format&fit=crop&q=80&w=800',
  grapes: 'https://images.unsplash.com/photo-1533604195573-0949d0ca88d3?auto=format&fit=crop&q=80&w=800',
  onions: 'https://images.unsplash.com/photo-1508747703725-7197771375ae?auto=format&fit=crop&q=80&w=800',
  default: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800'
};

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

// @route   POST api/listings/create
// @desc    Create a new listing (Auction or Fixed Price)
router.post('/create', auth, async (req, res) => {
  try {
    const { title, description, cropType, quantity, price, listingType, endDate, coordinates } = req.body;
    
    // Validate role
    if (req.user.role !== 'producer') {
      return res.status(403).json({ message: 'Only producers can create listings' });
    }

    const newListing = new Auction({
      title,
      description,
      cropType,
      quantity,
      price: listingType === 'fixed' ? price : undefined,
      startingPrice: listingType === 'auction' ? price : 0, 
      currentBid: listingType === 'auction' ? price : 0,
      listingType,
      producer: req.user.id,
      imageUrl: CROP_IMAGES[cropType.toLowerCase()] || CROP_IMAGES.default,
      endDate: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      location: {
        type: 'Point',
        coordinates: coordinates || [78.9629, 20.5937] // Default India center if missing
      }
    });

    const listing = await newListing.save();
    res.json(listing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// @route   PUT api/listings/:id
// @desc    Edit an existing listing
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, cropType, quantity, price, endDate } = req.body;
    
    let listing = await Auction.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    
    // Validate owner
    if (listing.producer.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to edit this listing' });
    }

    // Update fields
    if (title) listing.title = title;
    if (description) listing.description = description;
    if (cropType) {
      listing.cropType = cropType;
      listing.imageUrl = CROP_IMAGES[cropType.toLowerCase()] || CROP_IMAGES.default;
    }
    if (quantity) listing.quantity = quantity;
    if (price !== undefined) {
      if (listing.listingType === 'fixed') listing.price = price;
      else if (listing.listingType === 'auction' && listing.bids.length === 0) {
        listing.startingPrice = price;
        listing.currentBid = price;
      }
    }
    if (endDate) listing.endDate = endDate;

    await listing.save();
    res.json(listing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   GET api/listings
// @desc    Get all active listings
router.get('/', async (req, res) => {
  try {
    const rawListings = await Auction.find()
      .populate('producer', 'name')
      .populate('bids.user', 'name')
      .populate('highestBidder', 'name')
      .populate('winner', 'name')
      .sort({ createdAt: -1 });

    // Process expirations dynamically
    const listings = await Promise.all(rawListings.map(l => handleExpiredAwards(l)));
    
    // Return only open listings or awarded listings that aren't fully closed (status check)
    // Actually, users need to see listings they are winners of even if they are 'closed'
    res.json(listings.filter(l => l.status === 'open' || l.winner));
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST api/listings/bid/:id
// @desc    Place a bid on an auction
router.post('/bid/:id', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const listing = await Auction.findById(req.params.id);

    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.listingType !== 'auction') return res.status(400).json({ message: 'This item is not an auction' });
    if (listing.status !== 'open') return res.status(400).json({ message: 'Auction is closed' });
    if (listing.producer.toString() === req.user.id) return res.status(400).json({ message: 'You cannot bid on your own listing' });

    if (amount <= 0) {
      return res.status(400).json({ message: "Bid must be a positive amount" });
    }

    // Keep top bid updated if this is a new high
    if (amount > listing.currentBid) {
      listing.currentBid = amount;
      listing.highestBidder = req.user.id;
    }

    listing.currentBid = amount;
    listing.highestBidder = req.user.id;
    listing.bids.push({ user: req.user.id, amount });

    await listing.save();
    
    // Reload with populated bidder names for socket broadcast
    const updatedListing = await Auction.findById(listing._id)
      .populate('bids.user', 'name')
      .populate('highestBidder', 'name');
    
    // Broadcast real-time update via Socket.io
    const io = req.app.get('io');
    io.to(`auction:${listing._id}`).emit('bid-update', {
      listingId: listing._id,
      newBid: amount,
      bidderId: req.user.id,
      bidderName: updatedListing.highestBidder?.name || 'Anonymous',
      bids: updatedListing.bids.map(b => ({
        user: b.user?._id || b.user,
        name: b.user?.name || 'Anonymous',
        amount: b.amount,
        timestamp: b.timestamp
      }))
    });

    res.json(updatedListing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Helper to handle award expiration and fallback
const handleExpiredAwards = async (listing) => {
  if (listing.listingType === 'auction' && listing.winner && listing.paymentDeadline && listing.paymentDeadline < new Date()) {
    const currentOrder = await Order.findOne({ listing: listing._id, buyer: listing.winner, paymentStatus: 'pending' });
    
    // If no order was even started, or there's an order but it's still pending (not escrowed)
    if (!currentOrder || currentOrder.status === 'pending') {
      console.log(`Award expired for user ${listing.winner} on listing ${listing._id}. Falling back.`);
      
      // Filter out the current winner and find the next highest bidder
      const remainingBids = listing.bids
        .filter(b => b.user.toString() !== listing.winner.toString())
        .sort((a, b) => b.amount - a.amount);

      if (remainingBids.length > 0) {
        const nextWinner = remainingBids[0];
        listing.winner = nextWinner.user;
        listing.winningBid = nextWinner.amount;
        listing.awardedAt = new Date();
        listing.paymentDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        if (currentOrder) {
            currentOrder.status = 'cancelled';
            currentOrder.statusHistory.push({ status: 'cancelled', note: 'Payment deadline expired.', timestamp: new Date() });
            await currentOrder.save();
        }
      } else {
        // No more bidders, reopen or just clear winner
        listing.winner = undefined;
        listing.winningBid = undefined;
        listing.awardedAt = undefined;
        listing.paymentDeadline = undefined;
        listing.status = 'open';
      }
      await listing.save();
    }
  }
  return listing;
};

// @route   POST api/listings/award/:id
// @desc    Award an auction to a specific bidder
router.post('/award/:id', auth, async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const listing = await Auction.findById(req.params.id);

    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.producer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the producer can award the auction' });
    }
    if (listing.listingType !== 'auction') {
      return res.status(400).json({ message: 'Only auctions can be awarded' });
    }

    listing.winner = userId;
    listing.winningBid = amount;
    listing.status = 'closed';
    listing.awardedAt = new Date();
    listing.paymentDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours deadline

    await listing.save();

    // Notify winner via email (optional but recommended)
    try {
        const winner = await User.findById(userId);
        if (winner) {
            await sendEmail({
                to: winner.email,
                subject: `Congratulations! You've won the auction for ${listing.title}`,
                html: `<p>Please proceed to payment within 24 hours to secure your purchase.</p>`
            });
        }
    } catch (err) {
        console.error('Email notify error:', err.message);
    }

    res.json(listing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/listings/buy/:id
// @desc    Buy a fixed-price listing
router.post('/buy/:id', auth, async (req, res) => {
  try {
    const listing = await Auction.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.listingType !== 'fixed') return res.status(400).json({ message: 'Only fixed-price items can be bought directly' });
    if (listing.status !== 'open') return res.status(400).json({ message: 'Listing is no longer active' });

    const { deliveryAddress } = req.body;

    const order = new Order({
      listing: listing._id,
      buyer: req.user.id,
      seller: listing.producer,
      quantity: listing.quantity,
      totalAmount: listing.price,
      deliveryAddress: deliveryAddress || {},
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp: new Date() }]
    });

    // Update listing status
    listing.status = 'closed';
    await listing.save();
    await order.save();

    // Send email notification to producer
    try {
      const populatedOrder = await Order.findById(order._id)
        .populate('listing', 'title')
        .populate('buyer', 'name email')
        .populate('seller', 'name email');
      await sendEmail(emailTemplates.orderPlaced(populatedOrder, populatedOrder.seller));
    } catch (emailErr) {
      console.error('Email send error (non-fatal):', emailErr.message);
    }

    res.json({ message: 'Purchase successful', order });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
