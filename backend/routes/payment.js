const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Auction = require('../models/Auction');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const { sendEmail, emailTemplates } = require('../utils/mailer');

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

// Initialize Razorpay
// If process.env.RAZORPAY_KEY_ID is missing, we use a dummy fallback string so it doesn't crash on boot.
const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// @route   POST api/payment/checkout/:listingId
// @desc    Acquire lock and generate Razorpay Order ID for Escrow
router.post('/checkout/:listingId', auth, async (req, res) => {
  try {
    const listing = await Auction.findById(req.params.listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.status !== 'open') return res.status(400).json({ message: 'Listing is no longer active' });

    // 1. Lock Check (Escrow simulation locking mechanism)
    if (listing.checkoutLock && listing.checkoutLock.expiresAt > new Date()) {
      if (listing.checkoutLock.user.toString() !== req.user.id) {
        return res.status(423).json({ message: 'Someone else is currently completing a checkout for this item. Please try again in a few minutes.' });
      }
    }

    // Determine total amount
    let totalAmount = listing.listingType === 'auction' ? listing.winningBid : listing.price;
    
    // For auctions, must have a winner assigned
    if (listing.listingType === 'auction') {
        if (!listing.winner) {
            return res.status(403).json({ message: 'This auction has not been awarded to a winner yet.' });
        }
        if (listing.winner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the awarded winner can checkout this auction.' });
        }
        
        // Also check if payment deadline hasn't passed (safety check)
        if (listing.paymentDeadline && listing.paymentDeadline < new Date()) {
            return res.status(403).json({ message: 'Your payment window has expired.' });
        }
    }

    // 2. Set Lock for 5 minutes
    listing.checkoutLock = {
      user: req.user.id,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    };
    await listing.save();

    // 3. Razorpay Order Creation
    // In INR, 1 unit = 100 paise. (If you're using USD, this simulates a rough INR conversion or just base*100)
    const amountInPaise = Math.round(totalAmount * 100); 

    let rzpOrder;
    // If user hasn't put real keys, we return a mock order id.
    if (!process.env.RAZORPAY_KEY_ID) {
      rzpOrder = { id: 'order_MOCK_' + Date.now(), amount: amountInPaise, currency: 'INR' };
    } else {
      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: "receipt_" + listing._id.toString().substring(0,10)
      };
      rzpOrder = await rzp.orders.create(options);
    }

    res.json({
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      totalAmount, // raw USD/base amount for DB
      key: process.env.RAZORPAY_KEY_ID // to initialize frontend script
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error during Checkout');
  }
});

// @route   POST api/payment/verify
// @desc    Verify Razorpay signature, complete Order, lock Escrow, send Email
router.post('/verify', auth, async (req, res) => {
  try {
    const { 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature, 
      listingId, 
      deliveryAddress, 
      totalAmount 
    } = req.body;

    // 1. Signature Verification (If real keys exist)
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");
      
      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ message: "Invalid payment signature. Payment failed." });
      }
    }

    // 2. Process Escrow & Order
    const listing = await Auction.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    // Mark listing closed
    listing.status = 'closed';
    // Clear lock
    listing.checkoutLock = undefined;
    await listing.save();

    // Create Order with Escrow status
    const order = new Order({
      listing: listing._id,
      buyer: req.user.id,
      seller: listing.producer,
      quantity: listing.quantity,
      totalAmount: totalAmount,
      deliveryAddress: deliveryAddress || {},
      status: 'pending',
      paymentStatus: 'escrowed',
      razorpayOrderId,
      razorpayPaymentId,
      statusHistory: [
        { status: 'pending', note: 'Order placed.', timestamp: new Date() },
        { status: 'escrowed', note: 'Payment secured in Razorpay Escrow.', timestamp: new Date() }
      ]
    });

    await order.save();

    // 3. Send Email Receipt
    try {
      const populatedOrder = await Order.findById(order._id)
        .populate('listing', 'title')
        .populate('buyer', 'name email')
        .populate('seller', 'name email');
        
      // Email to Seller
      await sendEmail(emailTemplates.orderPlaced(populatedOrder, populatedOrder.seller));
      // Receipt to Buyer
      await sendEmail(emailTemplates.paymentReceipt(populatedOrder, populatedOrder.buyer));
    } catch (emailErr) {
      console.error('Email send error:', emailErr.message);
    }

    res.json({ message: 'Payment successful. Funds secured in Escrow.', order });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error during Verification');
  }
});

module.exports = router;
