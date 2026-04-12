const mongoose = require('mongoose');

const AuctionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  cropType: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number, // Used as 'Buy Now' price for fixed listings
  },
  startingPrice: {
    type: Number, // Used as initial price for auctions
    default: 0
  },
  listingType: {
    type: String,
    enum: ['auction', 'fixed'],
    default: 'auction',
  },
  currentBid: {
    type: Number,
    default: 0
  },
  highestBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  bids: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number },
    timestamp: { type: Date, default: Date.now }
  }],
  favoriteListings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auction'
    }
  ],
  producer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true, // [longitude, latitude]
    }
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
  },
  endDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  checkoutLock: {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date }
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  winningBid: {
    type: Number,
  },
  awardedAt: {
    type: Date,
  },
  paymentDeadline: {
    type: Date,
  }
});

AuctionSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Auction', AuctionSchema);
