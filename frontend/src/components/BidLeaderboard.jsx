import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, TrendingUp, Zap, Clock, Users } from 'lucide-react';

const formatTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const secs = Math.floor((now - d) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return d.toLocaleTimeString();
};

const BidLeaderboard = ({ listing, onClose, onPlaceBid }) => {
  const [bids, setBids] = useState([]);
  const [newEntryId, setNewEntryId] = useState(null);
  const [topBidPulse, setTopBidPulse] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [ticker, setTicker] = useState(null);
  const tickerRef = useRef(null);

  // Initialize bids sorted by amount descending
  useEffect(() => {
    if (listing?.bids) {
      const sorted = [...listing.bids]
        .map(b => ({
          id: b._id || `${b.user?._id || b.user}-${b.amount}-${b.timestamp}`,
          name: b.user?.name || b.name || 'Anonymous',
          amount: b.amount,
          timestamp: b.timestamp,
          user: b.user || b.bidderId || b.id
        }))
        .sort((a, b) => b.amount - a.amount);
      setBids(sorted);
    }
  }, [listing]);

  // Listen for new bids pushed from parent
  const handleNewBid = (update) => {
    const newBidEntry = {
      id: `${update.bidderId}-${update.newBid}-${Date.now()}`,
      name: update.bidderName || 'Anonymous',
      amount: update.newBid,
      timestamp: new Date(),
      user: update.bidderId
    };
    setNewEntryId(newBidEntry.id);
    setBids(prev => {
      const updated = [newBidEntry, ...prev].sort((a, b) => b.amount - a.amount);
      return updated;
    });
    setTopBidPulse(true);

    // Animated number ticker for the new top bid
    animateTicker(listing.currentBid || 0, update.newBid);

    setTimeout(() => {
      setNewEntryId(null);
      setTopBidPulse(false);
    }, 2500);
  };

  // Expose handler via ref for parent to call
  useEffect(() => {
    if (listing) {
      window._bidLeaderboardUpdate = handleNewBid;
    }
    return () => { delete window._bidLeaderboardUpdate; };
  }, [listing]);

  const animateTicker = (from, to) => {
    const steps = 20;
    const step = (to - from) / steps;
    let current = from;
    let count = 0;
    if (tickerRef.current) clearInterval(tickerRef.current);
    tickerRef.current = setInterval(() => {
      current += step;
      count++;
      setTicker(current.toFixed(2));
      if (count >= steps) {
        setTicker(to.toFixed(2));
        clearInterval(tickerRef.current);
        tickerRef.current = null;
        setTimeout(() => setTicker(null), 1000);
      }
    }, 30);
  };

  const handleBid = (e) => {
    e.preventDefault();
    if (!bidAmount || isNaN(bidAmount)) return;
    onPlaceBid(parseFloat(bidAmount));
    setBidAmount('');
  };

  const topBid = bids[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-nature-900/60 to-zinc-900 p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                <img 
                  src={listing?.imageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800'} 
                  alt={listing?.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg leading-none">{listing?.title}</h2>
                <p className="text-nature-400 text-xs">{listing?.quantity}kg • by {listing?.producer?.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>

          {/* Live top bid */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                <Zap size={10} className="text-nature-400" /> Live Top Bid
              </p>
              <motion.div
                animate={topBidPulse ? { scale: [1, 1.1, 1], color: ['#a3e635', '#ffffff', '#a3e635'] } : {}}
                className="text-4xl font-black text-nature-400 tabular-nums"
              >
                ₹{ticker !== null ? ticker : (topBid?.amount || listing?.currentBid || listing?.startingPrice || 0)}
              </motion.div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-end gap-1">
                <Users size={10} /> Total Bids
              </p>
              <p className="text-3xl font-black text-white">{bids.length}</p>
            </div>
          </div>
        </div>

        {/* Bid leaderboard */}
        <div className="h-72 overflow-y-auto scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700 p-4 space-y-2">
          {bids.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
              <TrendingUp size={36} className="mb-3" />
              <p className="font-bold text-sm">No bids yet</p>
              <p className="text-xs">Be the first to bid!</p>
            </div>
          ) : (
            <AnimatePresence>
              {bids.map((bid, idx) => {
                const isTop = idx === 0;
                const isNew = bid.id === newEntryId;
                return (
                  <motion.div
                    key={bid.id}
                    layout
                    initial={{ opacity: 0, x: -40, backgroundColor: '#065f46' }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      backgroundColor: isNew ? '#052e16' : isTop ? '#0a1f0e' : '#18181b'
                    }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl border ${
                      isTop ? 'border-nature-700/50' : isNew ? 'border-nature-800/30' : 'border-zinc-800'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      isTop ? 'bg-yellow-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {isTop ? <Crown size={16} /> : `#${idx + 1}`}
                    </div>

                    {/* Avatar + name */}
                    <div className="w-8 h-8 rounded-full bg-nature-800 flex items-center justify-center text-nature-300 font-black text-xs shrink-0">
                      {bid.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${isTop ? 'text-nature-300' : 'text-white'}`}>
                        {bid.name}
                        {isTop && <span className="ml-2 text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">LEADER</span>}
                        {isNew && <span className="ml-2 text-[9px] bg-nature-500/20 text-nature-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider animate-pulse">NEW</span>}
                      </p>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Clock size={8} /> {formatTime(bid.timestamp)}
                      </p>
                    </div>

                    {/* Bid amount */}
                    <motion.div
                      animate={isNew ? { scale: [1.3, 1] } : {}}
                      className={`text-lg font-black tabular-nums ${isTop ? 'text-nature-400' : 'text-white'}`}
                    >
                      ₹{bid.amount}
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Bid input or Producer Action */}
        {!listing ? null : listing.producer === (window.localStorage.getItem('userId') || listing.producer) ? (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
            <p className="text-xs text-zinc-500 mb-2 font-bold uppercase tracking-wider">
              Producer Action
            </p>
            {bids.length > 0 ? (
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to accept this top bid and close the auction?")) {
                    onPlaceBid('AWARD_BID', bids[0]);
                  }
                }}
                className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 rounded-xl font-black text-sm transition-all shadow-lg shadow-yellow-500/20"
              >
                ACCEPT ₹{bids[0].amount} BID & END AUCTION
              </button>
            ) : (
                <p className="text-sm font-bold text-zinc-400 text-center italic py-2">Waiting for bids to arrive...</p>
            )}
          </div>
        ) : (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
            <p className="text-xs text-zinc-500 mb-2 font-bold uppercase tracking-wider">
              Place a bid (any amount)
            </p>
            <form onSubmit={handleBid} className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                placeholder="Enter bid amount..."
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-xl text-sm font-bold placeholder:text-zinc-600 focus:outline-none focus:border-nature-500"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-6 py-3 bg-nature-600 hover:bg-nature-500 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-nature-600/30"
              >
                BID
              </motion.button>
            </form>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default BidLeaderboard;
