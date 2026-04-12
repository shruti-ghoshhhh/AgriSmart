import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Map as MapIcon, 
  Heart, 
  MessageSquare, 
  Phone, 
  LogOut, 
  User as UserIcon, 
  ChevronRight, 
  Menu, 
  X,
  TrendingDown,
  DollarSign,
  LocateFixed,
  Star,
  ExternalLink,
  Zap,
  Package,
  CheckCircle,
  Search,
  Filter
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import BidLeaderboard from '../components/BidLeaderboard';
import AddressModal from '../components/AddressModal';
import LiveChat from '../components/LiveChat';

// Fix for default marker icons in Leaflet + Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let ProducerPinIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    className: 'producer-marker'
});

let UserPinIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    className: 'user-marker'
});

L.Marker.prototype.options.icon = ProducerPinIcon;

// Mock Data for Charts
const savingsData = [
  { name: 'Mon', value: 20 },
  { name: 'Tue', value: 35 },
  { name: 'Wed', value: 45 },
  { name: 'Thu', value: 40 },
  { name: 'Fri', value: 70 },
  { name: 'Sat', value: 90 },
  { name: 'Sun', value: 110 },
];

const purchaseData = [
  { name: 'Jan', value: 150 },
  { name: 'Feb', value: 220 },
  { name: 'Mar', value: 480 },
  { name: 'Apr', value: 390 },
  { name: 'May', value: 550 },
  { name: 'Jun', value: 780 },
];

const ConsumerDashboard = () => {
  const { user, logout, updateProfile } = useAuth();
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState(localStorage.getItem('consumer_last_tab') || 'overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const joinedRooms = useRef(new Set());

  useEffect(() => {
    localStorage.setItem('consumer_last_tab', activeTab);
  }, [activeTab]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '' });
  const [producers, setProducers] = useState([]);
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState(user?.favorites || []);
  const [isLoadingProducers, setIsLoadingProducers] = useState(true);
  const [mapTarget, setMapTarget] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  const [liveBidToast, setLiveBidToast] = useState(null);
  const [pulsedListings, setPulsedListings] = useState(new Set());
  // Bid leaderboard
  const [leaderboardListing, setLeaderboardListing] = useState(null);
  // Address modal
  const [addressModalCallback, setAddressModalCallback] = useState(null);
  // Orders
  const [myOrders, setMyOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  // Messaging
  const [chatContact, setChatContact] = useState(null);
  const [chatContacts, setChatContacts] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({});
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    counts: { totalSpent: 0, costSaved: '$0.00', goodsBought: '0 units', ordersCount: 0 },
    timeline: []
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingProducers(true);
      try {
        const token = localStorage.getItem('token');
        const [prodRes, listRes, statsRes, favRes] = await Promise.all([
          axios.get('/api/users/producers'),
          axios.get('/api/listings'),
          axios.get('/api/dashboard/consumer', { headers: { 'x-auth-token': token } }),
          axios.get('/api/favorites/my', { headers: { 'x-auth-token': token } })
        ]);
        setProducers(prodRes.data);
        setListings(listRes.data);
        setDashboardStats(statsRes.data);
        if (favRes.data && Array.isArray(favRes.data)) {
          setFavorites(favRes.data.map(f => f._id));
        }
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      } finally {
        setIsLoadingProducers(false);
      }
    };
    fetchData();
  }, []);

  // Join all auction rooms and listen for bid updates
  useEffect(() => {
    if (!socket || listings.length === 0) return;

    // Join rooms for all open auction listings
    listings
      .filter(l => l.listingType === 'auction')
      .forEach(l => {
        if (!joinedRooms.current.has(l._id)) {
          socket.emit('join-auction', l._id);
          joinedRooms.current.add(l._id);
        }
      });

    // Listen for real-time bid updates
    const handleBidUpdate = ({ listingId, newBid, bidderName, bids: newBids }) => {
      setListings(prev => prev.map(l =>
        l._id === listingId
          ? { ...l, currentBid: newBid, bids: newBids || [...(l.bids || []), { amount: newBid, name: bidderName }] }
          : l
      ));
      // Update leaderboard if it's open for this listing
      if (window._bidLeaderboardUpdate) {
        window._bidLeaderboardUpdate({ listingId, newBid, bidderName, bids: newBids });
      }
      // Pulse animation
      setPulsedListings(prev => new Set([...prev, listingId]));
      setTimeout(() => setPulsedListings(prev => { const s = new Set(prev); s.delete(listingId); return s; }), 2000);
      // Toast notification
      setLiveBidToast({ listingId, newBid, bidderName });
      setTimeout(() => setLiveBidToast(null), 3500);
    };

    socket.on('bid-update', handleBidUpdate);
    return () => socket.off('bid-update', handleBidUpdate);
  }, [socket, listings.length]);

  const stats = [
    { 
      title: 'Total Savings', 
      value: dashboardStats.counts.costSaved, 
      trend: '+12%', 
      icon: <DollarSign className="text-nature-500" />, 
      data: dashboardStats.timeline.length > 0 ? dashboardStats.timeline : savingsData, 
      color: '#22c55e' 
    },
    { 
      title: 'Total Spent', 
      value: `₹${dashboardStats.counts.totalSpent.toLocaleString()}`, 
      trend: 'History', 
      icon: <ShoppingBag className="text-yellow-500" />, 
      data: dashboardStats.timeline.length > 0 ? dashboardStats.timeline : savingsData, 
      color: '#eab308' 
    },
    { 
      title: 'Goods Bought', 
      value: dashboardStats.counts.goodsBought, 
      trend: '+18%', 
      icon: <TrendingDown className="text-blue-500" />, 
      data: dashboardStats.timeline.length > 0 ? dashboardStats.timeline : savingsData, 
      color: '#3b82f6' 
    },
  ];

  const sidebarLinks = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'marketplace', label: 'P2P Marketplace', icon: <ShoppingBag size={20} /> },
    { id: 'orders', label: 'My Orders', icon: <Package size={20} /> },
    { id: 'map', label: 'Producers Nearby', icon: <MapIcon size={20} /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={20} /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart size={20} /> },
    { id: 'feedback', label: 'Feedback', icon: <Star size={20} /> },
    { id: 'contact', label: 'Contact Us', icon: <Phone size={20} /> },
  ];

  // Fetch orders when tab switches to orders
  useEffect(() => {
    if (activeTab !== 'orders') return;
    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/orders/my', { headers: { 'x-auth-token': token } });
        setMyOrders(res.data);
      } catch (err) { console.error('Error fetching orders', err); }
      finally { setIsLoadingOrders(false); }
    };
    fetchOrders();
  }, [activeTab]);

  const handleToggleProducerFavorite = async (producerId) => {
    const token = localStorage.getItem('token');
    try {
      if (favorites.includes(producerId)) {
        const res = await axios.delete(`/api/users/favorite/${producerId}`, {
          headers: { 'x-auth-token': token }
        });
        setFavorites(res.data);
      } else {
        const res = await axios.post(`/api/users/favorite/${producerId}`, {}, {
          headers: { 'x-auth-token': token }
        });
        setFavorites(res.data);
      }
    } catch (err) {
      console.error("Error updating favorites", err);
    }
  };

  // Show address modal first, then run the callback with the chosen address
  const withAddress = (callback) => {
    setAddressModalCallback(() => callback);
  };

  const handleCheckoutWithRazorpay = (listing, address) => {
    const token = localStorage.getItem('token');
    
    // Step 1: Create Order on backend
    axios.post(`/api/payment/checkout/${listing._id}`, {}, { headers: { 'x-auth-token': token } })
      .then(res => {
        const { razorpayOrderId, amount, currency, key, totalAmount } = res.data;
        
        // If dummy keys are used or Razorpay script fails, simulate it
        if (!key || key.startsWith('rzp_test_dummy')) {
          simulateEscrowPayment(listing._id, address, totalAmount, razorpayOrderId);
          return;
        }

        const options = {
          key: key,
          amount: amount,
          currency: currency,
          name: "AgriSmart Escrow",
          description: `Secure Escrow for ${listing.title}`,
          order_id: razorpayOrderId,
          handler: function (response) {
            // Step 2: Verify on Backend
            axios.post('/api/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              listingId: listing._id,
              deliveryAddress: address,
              totalAmount: totalAmount
            }, { headers: { 'x-auth-token': token } })
            .then(verifyRes => {
              alert('✅ Escrow secured! ' + verifyRes.data.message);
              // Refresh listings and switch to orders
              axios.get('/api/listings').then(r => setListings(r.data));
              setActiveTab('orders');
            })
            .catch(err => alert(err.response?.data?.message || 'Payment verification failed'));
          },
          prefill: {
            name: user?.name || "Consumer",
            email: user?.email || "",
          },
          theme: {
            color: "#22c55e"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
           alert('Payment failed: ' + response.error.description);
        });
        rzp.open();
      })
      .catch(err => {
        alert(err.response?.data?.message || 'Checkout failed. Item may be locked or sold.');
      });
  };

  const simulateEscrowPayment = (listingId, address, totalAmount, fallbackOrderId) => {
    const token = localStorage.getItem('token');
    axios.post('/api/payment/verify', {
      razorpayOrderId: fallbackOrderId,
      razorpayPaymentId: 'pay_sim_' + Date.now(),
      razorpaySignature: 'simulated_sig',
      listingId: listingId,
      deliveryAddress: address,
      totalAmount: totalAmount
    }, { headers: { 'x-auth-token': token } })
    .then(verifyRes => {
      alert('✅ SIMULATED PAYMENT: Escrow secured! ' + verifyRes.data.message);
      axios.get('/api/listings').then(r => setListings(r.data));
      setActiveTab('orders');
    })
    .catch(err => alert(err.response?.data?.message || 'Simulated payment failed'));
  };

  const handleBuyNow = (listing) => {
    withAddress(async (address) => {
      setAddressModalCallback(null);
      handleCheckoutWithRazorpay(listing, address);
    });
  };

  const handlePlaceBid = async (amount) => {
    if (!amount || isNaN(amount)) return;
    const token = localStorage.getItem('token');
    setIsBidding(true);
    try {
      await axios.post(`/api/listings/bid/${leaderboardListing._id}`, { amount: Number(amount) }, {
        headers: { 'x-auth-token': token }
      });
      // No refresh needed — socket will update the leaderboard in real time
    } catch (err) {
      alert(err.response?.data?.message || 'Bidding failed');
    } finally {
      setIsBidding(false);
    }
  };

  const handleMarkReceived = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/orders/${orderId}/status`, { status: 'delivered' }, {
        headers: { 'x-auth-token': token }
      });
      setMyOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'delivered' } : o));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order');
    }
  };

  const handleToggleListingFavorite = async (listingId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/favorites/toggle', { listingId }, { headers: { 'x-auth-token': token } });
      setFavorites(res.data.favorites);
    } catch (err) {
      console.error('Error toggling favorite', err);
    }
  };

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         l.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (l.producer?.name && l.producer.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (showOnlyFavorites) return favorites.includes(l._id) && matchesSearch;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-earth-50 dark:bg-zinc-950 flex transition-colors duration-300">

      {/* Live Bid Toast Notification */}
      <AnimatePresence>
        {liveBidToast && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-nature-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm"
          >
            <Zap size={16} className="animate-pulse" />
            <span className="text-lime-200">{liveBidToast?.bidderName || 'Someone'}</span> bid <span className="text-lime-300 text-base">₹{liveBidToast?.newBid}</span> live!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Address Modal */}
      <AnimatePresence>
        {addressModalCallback && (
          <AddressModal
            onConfirm={addressModalCallback}
            onCancel={() => setAddressModalCallback(null)}
          />
        )}
      </AnimatePresence>

      {/* Bid Leaderboard Modal */}
      <AnimatePresence>
        {leaderboardListing && (
          <BidLeaderboard
            listing={leaderboardListing}
            onClose={() => setLeaderboardListing(null)}
            onPlaceBid={handlePlaceBid}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 h-full bg-white dark:bg-zinc-900 border-r border-earth-200 dark:border-zinc-800 z-40 transition-all duration-300"
      >
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${!isSidebarOpen && 'hidden'}`}>
             <div className="bg-nature-500 p-1.5 rounded-lg text-white font-bold tracking-tighter shadow-lg shadow-nature-500/20">AS</div>
             <span className="font-display font-bold text-xl text-earth-900 dark:text-white">AgriSmart</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-earth-100 dark:hover:bg-zinc-800 rounded-lg text-earth-500 transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="mt-8 px-3 space-y-2">
          {sidebarLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                if (activeTab === link.id && link.id === 'map') {
                  window.dispatchEvent(new CustomEvent('auto-fit-map'));
                }
                setActiveTab(link.id);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                activeTab === link.id 
                  ? 'bg-nature-600 text-white font-bold shadow-lg shadow-nature-600/30' 
                  : 'text-earth-500 dark:text-earth-400 hover:bg-earth-50 dark:hover:bg-zinc-800'
              }`}
            >
              {link.icon}
              {isSidebarOpen && <span>{link.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-0 w-full px-3">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-medium"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-[280px]' : 'ml-[80px]'} p-8`}>
        
        {/* Top Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold text-earth-900 dark:text-white">
              {activeTab === 'overview' ? `Hello, ${user?.name || 'Consumer'}` : activeTab.split('_').join(' ').charAt(0).toUpperCase() + activeTab.split('_').join(' ').slice(1)}
            </h1>
            <p className="text-earth-500 dark:text-earth-400">Fresh harvest is just a click away.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 p-2 pr-4 rounded-full bg-white dark:bg-zinc-900 border border-earth-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-nature-100 dark:bg-nature-900/30 flex items-center justify-center text-nature-600 font-bold">
                {user?.name?.charAt(0) || <UserIcon size={20} />}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-earth-900 dark:text-white leading-tight">{user?.name || 'User'}</p>
                <p className="text-xs text-earth-500 dark:text-earth-400 capitalize">{user?.role || 'Consumer'}</p>
              </div>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                  <div 
                    key={i}
                    className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-earth-50 dark:bg-zinc-800 rounded-2xl">{stat.icon}</div>
                      <span className="text-nature-600 dark:text-nature-400 text-sm font-bold">{stat.trend}</span>
                    </div>
                    <h3 className="text-earth-500 dark:text-earth-400 text-sm font-medium mb-1">{stat.title}</h3>
                    <p className="text-2xl font-bold text-earth-900 dark:text-white mb-4">{stat.value}</p>
                    <div className="h-16 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stat.data}>
                          <Area type="monotone" dataKey="value" stroke={stat.color} fill={stat.color} fillOpacity={0.1} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>

              {/* Goods Bought Analysis */}
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm">
                  <h2 className="text-xl font-bold text-earth-900 dark:text-white mb-8">Purchase History Analysis</h2>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardStats.timeline.length > 0 ? dashboardStats.timeline : [{name: 'No Data', value: 0}]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                        <Line type="monotone" dataKey="value" stroke="#39FF14" strokeWidth={4} dot={{ r: 4, fill: '#39FF14' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div 
              key="map"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-earth-900 dark:text-white">Find your favourite producers nearby!</h2>
                  <p className="text-earth-500 text-sm">Discover fresh, organic harvests in your community.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setIsLoadingProducers(true);
                      axios.get('/api/users/producers').then(res => {
                        setProducers(res.data);
                        setIsLoadingProducers(false);
                      });
                    }}
                    className="p-3 bg-earth-50 dark:bg-zinc-800 text-earth-500 rounded-2xl hover:bg-earth-100 transition-all active:scale-95"
                    title="Refresh Hubs"
                  >
                    <Star size={20} className={isLoadingProducers ? 'animate-spin' : ''} />
                  </button>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('detect-location'))}
                    className="flex items-center gap-2 bg-nature-600 hover:bg-nature-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-nature-600/30 active:scale-95"
                  >
                    <LocateFixed size={20} />
                    Detect My Location
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm h-[550px] overflow-hidden relative">
                {isLoadingProducers && (
                  <div className="absolute inset-0 z-[2000] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-nature-200 border-t-nature-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-earth-500 font-bold">Scanning for producers...</p>
                  </div>
                )}
                
                {!isLoadingProducers && producers.filter(p => p.location?.coordinates).length === 0 && (
                  <div className="absolute inset-0 z-[2000] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                    <MapIcon size={48} className="text-earth-300 mb-4" />
                    <h3 className="text-xl font-bold text-earth-900 dark:text-white mb-2">No Producers Found</h3>
                    <p className="text-earth-500 max-w-xs">We couldn't find any producers in our network yet. Try expanding your search or checking back later.</p>
                  </div>
                )}

                <MapContainer 
                  center={[20, 77]} 
                  zoom={5} 
                  className="h-full w-full rounded-2xl"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationHandler target={mapTarget} setUserLocation={setUserLocation} />
                  <AutoFitBounds producers={producers} />
                  
                  {/* My Location Marker */}
                  {userLocation && (
                    <Marker 
                      position={[userLocation.lat, userLocation.lng]} 
                      icon={UserPinIcon}
                    >
                      <Popup>
                        <div className="p-2 text-center">
                          <p className="font-bold text-nature-600">Your Location</p>
                          <p className="text-[10px] text-earth-500">Discovering local hubs...</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {producers.filter(p => p.location?.coordinates).map(producer => (
                  <Marker 
                    key={producer._id} 
                    position={[producer.location.coordinates[1], producer.location.coordinates[0]]}
                    icon={ProducerPinIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-bold text-earth-900 mb-1">{producer.name}</h4>
                        <p className="text-xs text-earth-500 mb-3">Farm Producer</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleToggleProducerFavorite(producer._id)}
                            className="bg-nature-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <Heart size={12} fill={favorites.includes(producer._id) ? "currentColor" : "none"} />
                            {favorites.includes(producer._id) ? "Favorited" : "Favorite"}
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </motion.div>
          )}

          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm">
                <div className="relative w-full md:max-w-md">
                   <Search className="absolute left-4 top-3.5 text-earth-300" size={18} />
                   <input 
                     type="text" 
                     placeholder="Search crops, farms, or categories..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-earth-50 dark:bg-zinc-800 border border-earth-100 dark:border-zinc-700 rounded-2xl pl-12 pr-4 py-3 text-earth-900 dark:text-white focus:ring-2 focus:ring-nature-500 outline-none transition-all"
                   />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => setShowOnlyFavorites(false)}
                    className={`flex-1 md:flex-none px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${!showOnlyFavorites ? 'bg-nature-600 text-white shadow-lg shadow-nature-600/30' : 'bg-earth-50 dark:bg-zinc-800 text-earth-600 dark:text-zinc-400'}`}
                  >
                    <ShoppingBag size={14} /> All Listings
                  </button>
                  <button 
                    onClick={() => setShowOnlyFavorites(true)}
                    className={`flex-1 md:flex-none px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${showOnlyFavorites ? 'bg-nature-600 text-white shadow-lg shadow-nature-600/30' : 'bg-earth-50 dark:bg-zinc-800 text-earth-600 dark:text-zinc-400'}`}
                  >
                    <Heart size={14} fill={showOnlyFavorites ? "currentColor" : "none"} /> Favorites
                  </button>
                </div>
              </div>

              <motion.div 
                 key="marketplace"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredListings.map((listing) => {
                  const isPulsing = pulsedListings.has(listing._id);
                  const isFav = favorites.includes(listing._id);
                  return (
                  <motion.div
                    key={listing._id}
                    animate={isPulsing ? { scale: [1, 1.02, 1], borderColor: ['#e2e8f0', '#22c55e', '#e2e8f0'] } : {}}
                    transition={{ duration: 0.5 }}
                    className="bg-white dark:bg-zinc-900 p-0 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                  >
                     {isPulsing && (
                       <div className="absolute top-0 left-0 right-0 bg-nature-500 text-white text-[9px] font-black py-1 text-center tracking-widest flex items-center justify-center gap-1 z-10">
                         <Zap size={10} /> LIVE BID UPDATED!
                       </div>
                     )}
                     <div className="relative h-40 overflow-hidden">
                        <img 
                          src={listing.imageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800'} 
                          alt={listing.title}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute top-3 left-3 flex gap-2">
                           <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${listing.listingType === 'fixed' ? 'bg-blue-600 text-white' : 'bg-nature-600 text-white'}`}>
                             {listing.listingType}
                           </span>
                        </div>
                        <button 
                          onClick={() => handleToggleListingFavorite(listing._id)}
                          className="absolute top-3 right-3 p-2 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-all text-white"
                        >
                          <Heart size={16} fill={isFav ? "#ef4444" : "none"} color={isFav ? "#ef4444" : "currentColor"} />
                        </button>
                        <div className="absolute bottom-3 left-3 text-white">
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{listing.cropType}</p>
                           <h3 className="font-bold capitalize">{listing.title}</h3>
                        </div>
                    </div>
                    <div className="p-5">
                       <p className="text-sm text-earth-500 mb-4 flex items-center gap-1">by <span className="font-bold">{listing.producer?.name || 'Local Farm'}</span></p>

                   <div className="flex items-center justify-between mb-2">
                      <motion.span
                        key={listing.currentBid}
                        initial={{ scale: 1.2, color: '#22c55e' }}
                        animate={{ scale: 1, color: '#15803d' }}
                        className="text-xl font-bold text-nature-700"
                      >
                        {listing.listingType === 'fixed' ? `₹${listing.price}` : `₹${listing.currentBid}`}
                      </motion.span>
                      <span className="text-[10px] uppercase font-black text-earth-400">
                        {listing.listingType === 'fixed' ? 'Fixed Price' : `Current Bid • ${listing.bids?.length || 0} Bids`}
                      </span>
                   </div>

                   <div className="flex gap-2">
                      {listing.listingType === 'fixed' ? (
                        <button
                          onClick={() => handleBuyNow(listing)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                        >
                          Buy & Escrow
                        </button>
                      ) : listing.winner && (listing.winner === user?._id || listing.winner?._id === user?._id) ? (
                        <button
                          onClick={() => handleCheckoutWithRazorpay(listing, {})}
                          className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white py-2 rounded-xl text-sm font-black shadow-lg shadow-yellow-500/30 transition-all active:scale-95 flex items-center justify-center gap-1 animate-pulse"
                        >
                          🏆 Pay Now — You Won!
                        </button>
                      ) : (
                        <button
                          onClick={() => setLeaderboardListing(listing)}
                          className="flex-1 bg-nature-600 hover:bg-nature-700 text-white py-2 rounded-xl text-sm font-bold shadow-lg shadow-nature-600/20 transition-all active:scale-95 flex items-center justify-center gap-1"
                        >
                          <Zap size={14} /> Live Bids
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
                );
              })}
              {listings.length === 0 && (
                <div className="col-span-full text-center py-20 bg-earth-50/50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-earth-200 dark:border-zinc-800">
                  <p className="text-earth-500 font-medium">No active listings available in the marketplace currently.</p>
                </div>
              )}
            </motion.div>
          </div>
          )}

          {/* MY ORDERS TAB */}
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-earth-200 dark:border-zinc-800">
                <h2 className="text-xl font-bold text-earth-900 dark:text-white">My Orders</h2>
                <p className="text-earth-500 text-sm">Track your purchases and bid wins.</p>
              </div>
              {isLoadingOrders ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-nature-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : myOrders.length === 0 ? (
                <div className="text-center py-16 bg-earth-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-earth-200 dark:border-zinc-800">
                  <Package size={40} className="mx-auto text-earth-300 mb-3" />
                  <p className="text-earth-500 font-medium">No orders placed yet.</p>
                </div>
              ) : (
                myOrders.map((order) => {
                  const statusColors = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', dispatched: 'bg-purple-100 text-purple-700', delivered: 'bg-nature-100 text-nature-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
                  return (
                    <div key={order._id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-earth-900 dark:text-white">{order.listing?.title || 'Order'}</h3>
                          <p className="text-sm text-earth-500 mb-1">From: {order.seller?.name} • {order.quantity}kg • ₹{order.totalAmount}</p>
                          {order.paymentStatus === 'escrowed' && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded uppercase font-black tracking-widest"><Package size={10}/> Escrowed Secured</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${statusColors[order.status] || 'bg-zinc-100 text-zinc-700'}`}>{order.status}</span>
                      </div>
                      {order.deliveryAddress?.label && <p className="text-xs text-earth-400 mb-3">📍 {order.deliveryAddress.label}</p>}
                      <div className="flex gap-2">
                        {order.status === 'dispatched' && (
                          <button onClick={() => handleMarkReceived(order._id)} className="flex items-center gap-1 text-sm font-bold text-nature-600 hover:text-nature-700 border border-nature-300 px-4 py-2 rounded-xl transition-all">
                            <CheckCircle size={14} /> Mark as Received
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (!order.seller?._id) return alert('Seller info unavailable. Try refreshing the orders.');
                            setChatContact(order.seller);
                            setActiveTab('messages');
                          }}
                          className="text-sm font-bold text-earth-400 hover:text-earth-700 border border-earth-200 dark:border-zinc-700 px-4 py-2 rounded-xl transition-all flex items-center gap-1">
                          <MessageSquare size={14} /> Message Seller
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-[600px]">
              {chatContact ? (
                <LiveChat
                  currentUser={user}
                  contact={chatContact}
                  onBack={() => setChatContact(null)}
                />
              ) : (
                <div className="bg-white dark:bg-zinc-900 h-full rounded-3xl border border-earth-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-4 text-earth-400">
                  <MessageSquare size={48} className="opacity-30" />
                  <p className="font-bold text-lg">No chat selected</p>
                  <p className="text-sm">Go to My Orders and click "Message Seller" to start chatting.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'favorites' && (
            <motion.div 
              key="favorites"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 max-w-2xl"
            >
              {producers.filter(p => favorites.includes(p._id)).length > 0 ? (
                producers.filter(p => favorites.includes(p._id)).map(producer => (
                  <div key={producer._id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-nature-50 dark:bg-nature-900/30 flex items-center justify-center text-nature-600 font-bold">{producer.name.charAt(0)}</div>
                      <div>
                        <h4 className="font-bold text-earth-900 dark:text-white">{producer.name}</h4>
                        <p className="text-xs text-earth-500">Trusted Partner</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleToggleProducerFavorite(producer._id)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"><Heart fill="currentColor" size={20} /></button>
                       <button 
                         onClick={() => {
                           setMapTarget({ 
                             lat: producer.location.coordinates[1], 
                             lng: producer.location.coordinates[0],
                             _t: Date.now() 
                           });
                           setActiveTab('map');
                         }}
                         className="flex items-center gap-2 bg-earth-100 dark:bg-zinc-800 text-earth-700 dark:text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-nature-500 hover:text-white transition-all"
                       >
                         <MapIcon size={16} />
                         View on Map
                       </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-earth-200 dark:border-zinc-800">
                   <p className="text-earth-500 font-medium">You haven't favorited any producers yet.</p>
                   <button onClick={() => setActiveTab('map')} className="text-nature-600 font-bold mt-2">Find producers nearby</button>
                </div>
              )}
            </motion.div>
          )}
          
          {/* FEEDBACK TAB */}
          {activeTab === 'feedback' && (
            <motion.div key="feedback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-br from-nature-900/40 to-zinc-900 border border-nature-800/30 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-nature-400/10 text-[120px] font-black leading-none select-none">★</div>
                <h2 className="text-2xl font-black text-white mb-2">Share Your Experience</h2>
                <p className="text-nature-300/70 text-sm">Your feedback shapes the future of AgriSmart. We read every single one.</p>
              </div>

              {/* Form */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-earth-200 dark:border-zinc-800 p-8 space-y-5">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-earth-400 mb-2 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {['Platform', 'Pricing', 'Delivery', 'Quality', 'Support', 'Other'].map(cat => (
                      <button key={cat} type="button"
                        onClick={() => setFeedbackForm(p => ({ ...p, subject: cat }))}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          feedbackForm?.subject === cat
                            ? 'bg-nature-600 text-white shadow-lg shadow-nature-600/20'
                            : 'bg-earth-50 dark:bg-zinc-800 text-earth-600 dark:text-zinc-300 hover:bg-earth-100 dark:hover:bg-zinc-700'
                        }`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-earth-400 mb-2 block">Your Message</label>
                  <textarea rows="5"
                    value={feedbackForm?.message || ''}
                    onChange={e => setFeedbackForm(p => ({ ...p, message: e.target.value }))}
                    className="w-full bg-earth-50 dark:bg-zinc-800 border border-earth-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-earth-900 dark:text-white focus:ring-2 focus:ring-nature-500 focus:border-transparent outline-none resize-none transition-all"
                    placeholder="Tell us what you think — what's working, what could be better..."
                  />
                </div>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={async () => {
                    if (!feedbackForm?.message) return;
                    try {
                      const token = localStorage.getItem('token');
                      await axios.post('/api/feedback', { subject: feedbackForm.subject || 'General', message: feedbackForm.message }, { headers: { 'x-auth-token': token } });
                      alert('✅ Thank you! Your feedback has been submitted.');
                      setFeedbackForm({});
                    } catch (err) { alert('Failed to submit feedback.'); }
                  }}
                  className="w-full bg-nature-600 hover:bg-nature-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-nature-600/20 transition-all text-sm tracking-wide uppercase"
                >
                  Submit Feedback
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* CONTACT TAB */}
          {activeTab === 'contact' && (
            <motion.div key="contact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Hero banner */}
              <div className="bg-gradient-to-r from-nature-900 via-zinc-900 to-zinc-950 rounded-3xl p-8 relative overflow-hidden border border-nature-800/30">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #22c55e 0%, transparent 60%)' }} />
                <h2 className="text-3xl font-black text-white mb-2 relative">Get In Touch 👋</h2>
                <p className="text-nature-300/70 relative text-sm max-w-md">We're here to help. Reach us through any channel below — our team responds within 24 hours.</p>
              </div>

              {/* Contact cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: '📞', title: 'Call Us', sub: 'Mon–Sat · 9am–7pm', value: '+91 82748 09586', href: 'tel:+918274809586' },
                  { icon: '✉️', title: 'Email Us', sub: 'We reply within 24h', value: 'ghosh1shruti958@gmail.com', href: 'mailto:ghosh1shruti958@gmail.com' },
                  { icon: '🤖', title: 'AI Support', sub: 'Available 24/7', value: 'Chat with Agri', href: null }
                ].map((c, i) => (
                  <motion.div key={i} whileHover={{ y: -4 }}
                    onClick={() => { if (!c.href) window.dispatchEvent(new CustomEvent('toggle-support-chat')); }}
                    className={`bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-earth-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all ${!c.href ? 'cursor-pointer' : ''}`}>
                    <div className="text-3xl mb-3">{c.icon}</div>
                    <h4 className="font-black text-earth-900 dark:text-white mb-1">{c.title}</h4>
                    <p className="text-[10px] text-earth-400 uppercase tracking-wider font-bold mb-2">{c.sub}</p>
                    {c.href ? (
                      <a href={c.href} className="text-nature-600 hover:text-nature-500 font-bold text-sm transition-colors">{c.value}</a>
                    ) : (
                      <p className="text-nature-600 font-bold text-sm underline decoration-nature-600/30 underline-offset-4">{c.value}</p>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Contact form */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-earth-200 dark:border-zinc-800 p-8">
                <h3 className="font-black text-earth-900 dark:text-white text-lg mb-6">Send a Message</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-earth-400 mb-2 block">Your Name</label>
                    <input type="text" id="contact-name"
                      className="w-full bg-earth-50 dark:bg-zinc-800 border border-earth-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-earth-900 dark:text-white text-sm focus:ring-2 focus:ring-nature-500 outline-none transition-all"
                      placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-earth-400 mb-2 block">Email</label>
                    <input type="email" id="contact-email"
                      className="w-full bg-earth-50 dark:bg-zinc-800 border border-earth-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-earth-900 dark:text-white text-sm focus:ring-2 focus:ring-nature-500 outline-none transition-all"
                      placeholder="your@email.com" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-black uppercase tracking-widest text-earth-400 mb-2 block">Subject</label>
                  <input type="text" id="contact-subject"
                    className="w-full bg-earth-50 dark:bg-zinc-800 border border-earth-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-earth-900 dark:text-white text-sm focus:ring-2 focus:ring-nature-500 outline-none transition-all"
                    placeholder="How can we help?" />
                </div>
                <div className="mb-6">
                  <label className="text-xs font-black uppercase tracking-widest text-earth-400 mb-2 block">Message</label>
                  <textarea rows="4" id="contact-message"
                    className="w-full bg-earth-50 dark:bg-zinc-800 border border-earth-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-earth-900 dark:text-white text-sm focus:ring-2 focus:ring-nature-500 outline-none resize-none transition-all"
                    placeholder="Describe your issue or question..." />
                </div>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={async () => {
                    const name = document.getElementById('contact-name')?.value;
                    const email = document.getElementById('contact-email')?.value;
                    const subject = document.getElementById('contact-subject')?.value;
                    const message = document.getElementById('contact-message')?.value;
                    if (!name || !email || !message) return alert('Please fill in all required fields.');
                    try {
                      const res = await axios.post('/api/contact', { name, email, subject, message });
                      alert('✅ ' + res.data.message);
                    } catch (err) { alert(err.response?.data?.message || 'Failed to send message.'); }
                  }}
                  className="bg-nature-600 hover:bg-nature-500 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-nature-600/20 transition-all text-sm tracking-wide uppercase flex items-center gap-2"
                >
                  📬 Send Message
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isBidModalOpen && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsBidModalOpen(false)}
                className="absolute inset-0 bg-nature-950/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-8 shadow-2xl relative z-10 border border-earth-200 dark:border-zinc-800"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-earth-900 dark:text-white">Place a Bid</h2>
                  <button onClick={() => setIsBidModalOpen(false)} className="text-earth-400 hover:text-earth-600"><X /></button>
                </div>
                
                <div className="bg-earth-50 dark:bg-zinc-800 p-4 rounded-2xl mb-6">
                   <p className="text-sm text-earth-500 mb-1">Current Highest Bid</p>
                   <p className="text-3xl font-black text-nature-600">₹{selectedListing?.currentBid}</p>
                </div>

                <form onSubmit={handlePlaceBid} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-earth-400 uppercase tracking-widest mb-2">Your Bid Amount (₹)</label>
                    <input 
                      type="number" 
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Enter more than ₹${selectedListing?.currentBid}`}
                      className="w-full bg-earth-50 dark:bg-zinc-800 border-2 border-earth-100 dark:border-zinc-700 rounded-2xl px-6 py-4 text-xl font-bold focus:border-nature-500 outline-none transition-all"
                      min={selectedListing?.currentBid + 1}
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isBidding}
                    className="w-full bg-nature-600 hover:bg-nature-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-nature-600/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isBidding ? 'Confirming Bid...' : 'Place Official Bid'}
                  </button>
                  <p className="text-center text-[10px] text-earth-400">By placing a bid, you commit to purchasing the item if you are the winner at auction end.</p>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
};

// Helper component for map interactions
const LocationHandler = ({ target, setUserLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 14, { duration: 3 });
    }
  }, [target, map]);

  useEffect(() => {
    const handleDetect = () => {
      map.locate().once('locationfound', (e) => {
        map.flyTo(e.latlng, 15, { duration: 4 });
        setUserLocation(e.latlng);
      });
    };

    const handleAutoFit = () => {
      window.dispatchEvent(new CustomEvent('trigger-auto-fit'));
    };
    
    window.addEventListener('detect-location', handleDetect);
    window.addEventListener('auto-fit-map', handleAutoFit);
    return () => {
      window.removeEventListener('detect-location', handleDetect);
      window.removeEventListener('auto-fit-map', handleAutoFit);
    };
  }, [map, setUserLocation]);

  return null;
};

// Helper component to auto-focus map on producers
const AutoFitBounds = ({ producers }) => {
  const map = useMap();
  const [hasFitted, setHasFitted] = useState(false);

  useEffect(() => {
    const performFit = () => {
      if (producers.length > 0) {
        const validProducers = producers.filter(p => p.location?.coordinates);
        if (validProducers.length > 0) {
          const bounds = L.latLngBounds(validProducers.map(p => [p.location.coordinates[1], p.location.coordinates[0]]));
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
          setHasFitted(true);
        }
      }
    };

    if (producers.length > 0 && !hasFitted) {
      performFit();
    }

    const handleManualTrigger = () => performFit();
    window.addEventListener('trigger-auto-fit', handleManualTrigger);
    return () => window.removeEventListener('trigger-auto-fit', handleManualTrigger);
  }, [producers, map, hasFitted]);

  return null;
};

export default ConsumerDashboard;
