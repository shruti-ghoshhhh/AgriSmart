import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Gavel, 
  MessageSquare, 
  Phone, 
  Settings, 
  LogOut, 
  User as UserIcon, 
  ChevronRight, 
  Menu, 
  X,
  TrendingUp,
  Leaf,
  DollarSign,
  Map as MapIcon,
  LocateFixed,
  Users,
  Zap,
  Package,
  CheckCircle,
  Truck,
  Monitor,
  Search,
  Filter
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import LiveChat from '../components/LiveChat';
import BidLeaderboard from '../components/BidLeaderboard';

// Fix for default marker icons in Leaflet + Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Mock Data for Charts
const carbonData = [
  { name: 'Mon', value: 30 },
  { name: 'Tue', value: 45 },
  { name: 'Wed', value: 35 },
  { name: 'Thu', value: 60 },
  { name: 'Fri', value: 55 },
  { name: 'Sat', value: 80 },
  { name: 'Sun', value: 95 },
];

const costData = [
  { name: 'Mon', value: 100 },
  { name: 'Tue', value: 150 },
  { name: 'Wed', value: 130 },
  { name: 'Thu', value: 240 },
  { name: 'Fri', value: 210 },
  { name: 'Sat', value: 320 },
  { name: 'Sun', value: 450 },
];

const ProducerDashboard = () => {
  const { user, logout, updateProfile } = useAuth();
  const socket = useSocket();
  const joinedRooms = useRef(new Set());
  const [activeTab, setActiveTab] = useState(localStorage.getItem('producer_last_tab') || 'overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newBidNotifications, setNewBidNotifications] = useState({}); // { listingId: newBidAmount }

  useEffect(() => {
    localStorage.setItem('producer_last_tab', activeTab);
  }, [activeTab]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '' });
  const [customers, setCustomers] = useState([]);
  const [listings, setListings] = useState([]);
  const [tempLocation, setTempLocation] = useState(user?.location?.coordinates || [77.2090, 28.6139]);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [leaderboardListing, setLeaderboardListing] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  const [dashboardStats, setDashboardStats] = useState({
    counts: { totalEarnings: 0, carbonSaved: '0kg', marketReach: 0, activeAuctions: 0 },
    timeline: []
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/dashboard/producer', {
          headers: { 'x-auth-token': token }
        });
        setDashboardStats(res.data);
      } catch (err) {
        console.error("Error fetching dashboard stats", err);
      }
    };

    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/users/producers/customers', {
          headers: { 'x-auth-token': token }
        });
        setCustomers(res.data);
      } catch (err) {
        console.error("Error fetching customers", err);
      }
    };

    const fetchMyListings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/listings', {
          headers: { 'x-auth-token': token }
        });
        setListings(res.data.filter(l => l.producer?._id === user?.id || l.producer === user?.id));
      } catch (err) {
        console.error("Error fetching listings", err);
      }
    };
    
    fetchDashboardStats();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'auctions') fetchMyListings();
  }, [activeTab, user]);

  // Join auction rooms for owned listings and listen for bid updates
  useEffect(() => {
    if (!socket || listings.length === 0) return;

    listings
      .filter(l => l.listingType === 'auction')
      .forEach(l => {
        if (!joinedRooms.current.has(l._id)) {
          socket.emit('join-auction', l._id);
          joinedRooms.current.add(l._id);
        }
      });

    const handleBidUpdate = ({ listingId, newBid, bidderName, bids: newBids }) => {
      console.log('📢 Socket Bid Update Received:', { listingId, newBid, bidderName });
      // Update the listing in state
      setListings(prev => prev.map(l =>
        l._id === listingId
          ? { ...l, currentBid: newBid, bids: newBids || [...(l.bids || []), { amount: newBid, name: bidderName }] }
          : l
      ));
      // Update leaderboard if it's open for this listing
      if (window._bidLeaderboardUpdate) {
        window._bidLeaderboardUpdate({ listingId, newBid, bidderName, bids: newBids });
      }
      // Set notification badge
      setNewBidNotifications(prev => ({ ...prev, [listingId]: newBid }));
      // Clear it after 5 seconds
      setTimeout(() => {
        setNewBidNotifications(prev => { const n = { ...prev }; delete n[listingId]; return n; });
      }, 5000);
    };

    socket.on('bid-update', handleBidUpdate);
    return () => {
      socket.off('bid-update', handleBidUpdate);
    };
  }, [socket, listings.length]); // Use listings.length to trigger when list changes

  const stats = [
    { 
      title: 'Carbon Saved', 
      value: dashboardStats.counts.carbonSaved, 
      trend: '+12%', 
      icon: <Leaf className="text-nature-500" />, 
      data: dashboardStats.timeline.length > 0 ? dashboardStats.timeline : carbonData, 
      color: '#22c55e' 
    },
    { 
      title: 'Total Earnings', 
      value: `₹${dashboardStats.counts.totalEarnings.toLocaleString()}`, 
      trend: '+18%', 
      icon: <DollarSign className="text-yellow-500" />, 
      data: dashboardStats.timeline.length > 0 ? dashboardStats.timeline : costData, 
      color: '#eab308' 
    },
    { 
      title: 'Market Reach', 
      value: `${dashboardStats.counts.marketReach} Buyers`, 
      trend: '+5%', 
      icon: <TrendingUp className="text-blue-500" />, 
      data: dashboardStats.timeline.length > 0 ? dashboardStats.timeline : carbonData, 
      color: '#3b82f6' 
    },
  ];

  const sidebarLinks = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'auctions', label: 'My Listings', icon: <Gavel size={20} /> },
    { id: 'orders', label: 'Orders', icon: <Package size={20} /> },
    { id: 'customers', label: 'My Customers', icon: <Users size={20} /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={20} /> },
    { id: 'location', label: 'Store Location', icon: <MapIcon size={20} /> },
    { id: 'feedback', label: 'Feedback', icon: <Settings size={20} /> },
    { id: 'contact', label: 'Contact Us', icon: <Phone size={20} /> },
  ];

  // Fetch orders for producer
  const [producerOrders, setProducerOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [chatContact, setChatContact] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({});

  useEffect(() => {
    if (activeTab !== 'orders') return;
    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/orders/producer', { headers: { 'x-auth-token': token } });
        setProducerOrders(res.data);
      } catch (err) { console.error('Error fetching orders', err); }
      finally { setIsLoadingOrders(false); }
    };
    fetchOrders();
  }, [activeTab]);

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/orders/${orderId}/status`, { status }, { headers: { 'x-auth-token': token } });
      setProducerOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const [newListingData, setNewListingData] = useState({
    title: '',
    description: '',
    cropType: '',
    quantity: '',
    price: '',
    listingType: 'fixed',
    endDate: ''
  });

  const openEditModal = (listing) => {
    setEditingListing({
      _id: listing._id,
      title: listing.title,
      description: listing.description,
      cropType: listing.cropType,
      quantity: listing.quantity,
      price: listing.listingType === 'auction' ? Math.max(listing.startingPrice || 0, listing.currentBid || 0) : listing.price,
      endDate: listing.endDate ? listing.endDate.split('T')[0] : ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditListing = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/listings/${editingListing._id}`, editingListing, {
        headers: { 'x-auth-token': token }
      });
      setListings(prev => prev.map(l => l._id === editingListing._id ? res.data : l));
      setIsEditModalOpen(false);
      setEditingListing(null);
      alert('Listing updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error editing listing');
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/listings/create', newListingData, {
        headers: { 'x-auth-token': token }
      });
      // Refresh listings
      setActiveTab('overview'); // Toggle to force refresh or just call fetch
      setTimeout(() => setActiveTab('auctions'), 100);
      setNewListingData({ title: '', description: '', cropType: '', quantity: '', price: '', listingType: 'fixed', endDate: '' });
    } catch (err) {
      console.error("Error creating listing", err);
    }
  };

  const handleSaveLocation = async () => {
    setIsSavingLocation(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/users/profile/location', { coordinates: tempLocation }, {
        headers: { 'x-auth-token': token }
      });
      alert('Business location updated successfully! You are now visible to consumers nearby.');
    } catch (err) {
      console.error("Error saving location", err);
      const msg = err.response?.data?.message || 'Failed to save location.';
      alert(`Error: ${msg}`);
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    updateProfile(profileData);
    setIsProfileModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-earth-50 dark:bg-zinc-950 flex transition-colors duration-300">
      
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 h-full bg-white dark:bg-zinc-900 border-r border-earth-200 dark:border-zinc-800 z-40 transition-all duration-300"
      >
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${!isSidebarOpen && 'hidden'}`}>
             <div className="bg-nature-500 p-1.5 rounded-lg text-white">
               <Leaf size={20} />
             </div>
             <span className="font-display font-bold text-xl text-earth-900 dark:text-white">AgriSmart</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-earth-100 dark:hover:bg-zinc-800 rounded-lg text-earth-500">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="mt-8 px-3 space-y-2">
          {sidebarLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                activeTab === link.id 
                  ? 'bg-nature-50 dark:bg-nature-900/20 text-nature-600 dark:text-nature-400 font-bold shadow-sm' 
                  : 'text-earth-500 dark:text-earth-400 hover:bg-earth-50 dark:hover:bg-zinc-800'
              }`}
            >
              {link.icon}
              {isSidebarOpen && <span>{link.label}</span>}
              {activeTab === link.id && isSidebarOpen && <ChevronRight size={16} className="ml-auto" />}
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
              {activeTab === 'overview' ? `Welcome back, ${user?.name || 'Producer'}` : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-earth-500 dark:text-earth-400">Here's what's happening on your farm today.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 p-2 pr-4 rounded-full bg-white dark:bg-zinc-900 border border-earth-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-nature-100 dark:bg-nature-900/30 flex items-center justify-center text-nature-600">
                <UserIcon size={20} />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-earth-900 dark:text-white leading-tight">{user?.name || 'User'}</p>
                <p className="text-xs text-earth-500 dark:text-earth-400 capitalize">{user?.role || 'Producer'}</p>
              </div>
            </button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-earth-50 dark:bg-zinc-800 rounded-2xl">
                      {stat.icon}
                    </div>
                    <span className="text-nature-600 dark:text-nature-400 text-sm font-bold">{stat.trend}</span>
                  </div>
                  <h3 className="text-earth-500 dark:text-earth-400 text-sm font-medium mb-1">{stat.title}</h3>
                  <p className="text-2xl font-bold text-earth-900 dark:text-white mb-4">{stat.value}</p>
                  
                  <div className="h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stat.data}>
                        <defs>
                          <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={stat.color} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={stat.color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke={stat.color} fillOpacity={1} fill={`url(#grad-${i})`} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Main Yield Analysis */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold text-earth-900 dark:text-white">Yield Performance Analysis</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-nature-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-nature-600 uppercase tracking-widest">Real-time Data Active</span>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardStats.timeline.length > 0 ? dashboardStats.timeline : [{name: 'No Data', value: 0}]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#39FF14' }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#39FF14" strokeWidth={4} dot={{ r: 4, fill: '#39FF14' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'auctions' && (
          <div className="animate-fade-in-up grid lg:grid-cols-5 gap-8">
            {/* Left: Create Form */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm sticky top-8">
                <h2 className="text-2xl font-bold text-earth-900 dark:text-white mb-6">Create New Listing</h2>
                <form onSubmit={handleCreateListing} className="space-y-4">
                  <div className="flex bg-earth-50 dark:bg-zinc-800 p-1 rounded-xl mb-4">
                    <button 
                      type="button"
                      onClick={() => setNewListingData({...newListingData, listingType: 'fixed'})}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newListingData.listingType === 'fixed' ? 'bg-white dark:bg-zinc-700 shadow-sm text-nature-600' : 'text-earth-500'}`}
                    >
                      Fixed Price
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewListingData({...newListingData, listingType: 'auction'})}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newListingData.listingType === 'auction' ? 'bg-white dark:bg-zinc-700 shadow-sm text-nature-600' : 'text-earth-500'}`}
                    >
                      Auction
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-earth-700 dark:text-earth-300 uppercase tracking-wider">Title</label>
                    <input 
                      type="text" 
                      value={newListingData.title}
                      onChange={(e) => setNewListingData({...newListingData, title: e.target.value})}
                      placeholder="e.g. Premium Organic Wheat" 
                      className="w-full bg-earth-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-500" 
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-earth-700 dark:text-earth-300 uppercase tracking-wider">Crop</label>
                      <input 
                        type="text" 
                        value={newListingData.cropType}
                        onChange={(e) => setNewListingData({...newListingData, cropType: e.target.value})}
                        placeholder="Wheat" 
                        className="w-full bg-earth-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-500" 
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-earth-700 dark:text-earth-300 uppercase tracking-wider">Qty (kg)</label>
                      <input 
                        type="number" 
                        value={newListingData.quantity}
                        onChange={(e) => setNewListingData({...newListingData, quantity: e.target.value})}
                        placeholder="500" 
                        className="w-full bg-earth-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-500" 
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-earth-700 dark:text-earth-300 uppercase tracking-wider">
                      {newListingData.listingType === 'fixed' ? 'Final Price (₹)' : 'Starting Bid (₹)'}
                    </label>
                    <input 
                      type="number" 
                      value={newListingData.price}
                      onChange={(e) => setNewListingData({...newListingData, price: e.target.value})}
                      placeholder="1.20" 
                      className="w-full bg-earth-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-500" 
                      required
                    />
                  </div>
                  {newListingData.listingType === 'auction' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-earth-700 dark:text-earth-300 uppercase tracking-wider">End Date</label>
                      <input 
                        type="date" 
                        value={newListingData.endDate}
                        onChange={(e) => setNewListingData({...newListingData, endDate: e.target.value})}
                        className="w-full bg-earth-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-500" 
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-earth-700 dark:text-earth-300 uppercase tracking-wider">Description</label>
                    <textarea 
                      rows="2" 
                      value={newListingData.description}
                      onChange={(e) => setNewListingData({...newListingData, description: e.target.value})}
                      placeholder="Harvest details..." 
                      className="w-full bg-earth-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-500"
                    ></textarea>
                  </div>
                  <button type="submit" className="w-full bg-nature-600 hover:bg-nature-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 mt-2">
                    Post to Marketplace
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Active Listings */}
            <div className="lg:col-span-3 space-y-6">
               <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="font-bold text-earth-900 dark:text-white">Live Marketplace ({listings.length})</h3>
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-nature-500 animate-pulse"></span>
                    <p className="text-xs text-earth-500 font-bold uppercase tracking-tight">Active Inventory</p>
                  </div>
               </div>

                {listings.filter(l => l.status === 'open').map((listing, idx) => {
                  const hasNewBid = newBidNotifications[listing._id];
                  return (
                  <motion.div 
                     key={listing._id}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: idx * 0.1 }}
                     className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    {hasNewBid && (
                      <div className="absolute top-0 left-0 right-0 bg-nature-500 text-white text-[9px] font-black py-1 text-center tracking-widest flex items-center justify-center gap-1">
                        <Zap size={10} /> NEW BID: ₹{hasNewBid} — {listing.bids?.length || 0} bids
                      </div>
                    )}
                    {listing.listingType === 'fixed' && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-black px-3 py-1 uppercase tracking-widest rounded-bl-xl">Fixed Price</div>
                    )}
                    <div className={`flex justify-between items-start ${hasNewBid ? 'mt-5' : ''}`}>
                      <div className="flex gap-4">
                         <div className="w-16 h-16 rounded-2xl bg-earth-50 dark:bg-zinc-800 flex items-center justify-center text-nature-600 font-bold group-hover:scale-110 transition-transform">
                           {listing.cropType?.charAt(0) || 'C'}
                         </div>
                        <div>
                          <h4 className="font-bold text-earth-900 dark:text-white group-hover:text-nature-600 transition-colors">{listing.title}</h4>
                          <p className="text-sm text-earth-500">{listing.quantity}kg available</p>
                          <div className="flex items-center gap-4 mt-2">
                             <span className="text-xs font-bold text-earth-400">
                               {listing.listingType === 'fixed' ? 'Price: ' : 'Top Bid: '} 
                               <span className="text-earth-900 dark:text-white">₹{listing.listingType === 'fixed' ? listing.price : listing.currentBid}</span>
                             </span>
                             {listing.listingType === 'auction' && (
                               <span className="text-xs font-bold text-earth-400 tracking-tighter bg-earth-50 dark:bg-zinc-800 px-2 py-0.5 rounded italic">Auction</span>
                             )}
                          </div>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${listing.status === 'open' ? 'bg-nature-100 text-nature-700' : 'bg-earth-100 text-earth-700'}`}>
                          {listing.status}
                        </span>
                        {listing.endDate && <p className="text-[10px] text-red-500 font-bold mt-2">Ends {new Date(listing.endDate).toLocaleDateString()}</p>}
                     </div>
                   </div>
                   <div className="flex gap-4 mt-6">
                      {listing.listingType === 'auction' && (
                        <button 
                          onClick={() => setLeaderboardListing(listing)}
                          className="flex-1 bg-nature-600 hover:bg-nature-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <Monitor size={14} /> Monitor Live Bids
                        </button>
                      )}
                      <button onClick={() => openEditModal(listing)} className="flex-1 border border-earth-200 dark:border-zinc-800 text-earth-600 dark:text-earth-400 text-xs font-bold py-2.5 rounded-xl hover:bg-earth-50 dark:hover:bg-zinc-800 transition-all">
                        Edit Listing
                      </button>
                    </div>
                 </motion.div>
                 );
               })}
                {listings.filter(l => l.status === 'open').length === 0 && (
                  <div className="text-center py-20 bg-earth-50/50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-earth-200 dark:border-zinc-800">
                    <p className="text-earth-500 font-medium italic">No active listings in your inventory. Create one to start trading.</p>
                  </div>
                )}

                {/* Closed Auctions Section */}
                {listings.some(l => l.status === 'closed') && (
                  <div className="mt-12 space-y-6">
                    <div className="flex justify-between items-center bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                        <h3 className="font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                           <CheckCircle size={18} /> Past Auctions (Results)
                        </h3>
                    </div>
                    {listings.filter(l => l.status === 'closed').map((listing) => (
                      <div key={listing._id} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm opacity-75 grayscale hover:grayscale-0 transition-all">
                        <div className="flex justify-between items-center">
                          <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold">
                              {listing.cropType?.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-earth-900 dark:text-white leading-tight">{listing.title}</h4>
                              <p className="text-xs text-earth-500">Ended on {new Date(listing.awardedAt || listing.updatedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-nature-600 uppercase tracking-widest mb-1">Winner</p>
                             <div className="flex items-center gap-2 bg-nature-50 dark:bg-nature-950/30 px-3 py-1.5 rounded-xl border border-nature-100 dark:border-nature-900/30">
                                <p className="text-sm font-black text-nature-700 dark:text-nature-400">{listing.winner?.name || 'Winner Found'}</p>
                                <p className="text-xs font-bold text-nature-600">₹{listing.winningBid || listing.currentBid}</p>
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="animate-fade-in-up space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm">
               <h2 className="text-2xl font-bold text-earth-900 dark:text-white mb-2">My Customer Directory</h2>
               <p className="text-earth-500">A historical record of every consumer who has purchased from your farm.</p>
            </div>

            <div className="grid gap-6">
              {customers.map((customer, idx) => (
                <motion.div 
                  key={customer._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm overflow-hidden"
                >
                  <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-2xl bg-nature-100 dark:bg-nature-900/30 flex items-center justify-center text-nature-600 font-bold text-xl">
                         {customer.name?.charAt(0)}
                       </div>
                       <div>
                         <h3 className="font-bold text-earth-900 dark:text-white text-lg">{customer.name}</h3>
                         <p className="text-sm text-earth-500">{customer.email}</p>
                         <div className="flex gap-2 mt-2">
                            <span className="text-[10px] font-bold bg-earth-100 dark:bg-zinc-800 text-earth-600 px-2 py-1 rounded-full uppercase">Verified Buyer</span>
                            <span className="text-[10px] font-bold bg-nature-50 dark:bg-nature-900/20 text-nature-600 px-2 py-1 rounded-full uppercase">{customer.orders.length} Orders</span>
                         </div>
                       </div>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => { setChatContact(customer); setActiveTab('messages'); }}
                        className="flex-1 md:flex-none bg-earth-50 dark:bg-zinc-800 text-earth-700 dark:text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-earth-100 transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare size={16} /> Contact
                      </button>
                    </div>
                  </div>

                  {/* Order History Sub-section */}
                  <div className="bg-earth-50/50 dark:bg-zinc-900/50 p-6 border-t border-earth-100 dark:border-zinc-800">
                    <h4 className="text-xs font-black text-earth-400 uppercase tracking-widest mb-4">Recent Transactions</h4>
                    <div className="space-y-3">
                      {customer.orders.map((order, oIdx) => (
                        <div key={oIdx} className="flex justify-between items-center text-sm">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-nature-500"></div>
                              <span className="font-bold text-earth-700 dark:text-earth-300">{order.item}</span>
                           </div>
                           <div className="flex items-center gap-6">
                              <span className="text-earth-400 text-xs">{new Date(order.date).toLocaleDateString()}</span>
                              <span className="font-black text-nature-600">${order.amount}</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
              {customers.length === 0 && (
                <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-earth-200 dark:border-zinc-800">
                   <div className="w-20 h-20 bg-earth-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-earth-300">
                      <Users size={40} />
                   </div>
                   <h3 className="text-xl font-bold text-earth-900 dark:text-white mb-2">No Customers Yet</h3>
                   <p className="text-earth-500 max-w-xs mx-auto">Once consumers start buying your products or winning auctions, they will appear here in your directory.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ORDERS TAB - Producer */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in-up space-y-4">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-earth-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-earth-900 dark:text-white">Incoming Orders</h2>
              <p className="text-earth-500 text-sm">Manage and fulfill orders from your customers.</p>
            </div>
            {isLoadingOrders ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-nature-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : producerOrders.length === 0 ? (
              <div className="text-center py-16 bg-earth-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-earth-200 dark:border-zinc-800">
                <Package size={40} className="mx-auto text-earth-300 mb-3" />
                <p className="text-earth-500 font-medium">No orders yet.</p>
              </div>
            ) : (
              producerOrders.map((order) => {
                const statusColors = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', dispatched: 'bg-purple-100 text-purple-700', delivered: 'bg-nature-100 text-nature-700', completed: 'bg-green-100 text-green-700' };
                return (
                  <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-earth-900 dark:text-white">{order.listing?.title || 'Order'}</h3>
                        <p className="text-sm text-earth-500">From: {order.buyer?.name} • {order.quantity}kg • ₹{order.totalAmount}</p>
                        {order.deliveryAddress?.label && <p className="text-xs text-earth-400 mt-1">📍 {order.deliveryAddress.label}</p>}
                        {order.paymentStatus === 'escrowed' && (
                          <div className="mt-2 text-[10px] bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/30 inline-block">
                            <span className="font-black uppercase tracking-wider">Funds Escrowed</span> — Held until delivery.
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${statusColors[order.status] || 'bg-zinc-100 text-zinc-700'}`}>{order.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <button onClick={() => handleUpdateOrderStatus(order._id, 'approved')}
                          className="flex items-center gap-1 text-sm font-bold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all">
                          <CheckCircle size={14} /> Approve Order
                        </button>
                      )}
                      {order.status === 'approved' && (
                        <button onClick={() => handleUpdateOrderStatus(order._id, 'dispatched')}
                          className="flex items-center gap-1 text-sm font-bold bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-all">
                          <Truck size={14} /> Mark Dispatched
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <button onClick={() => handleUpdateOrderStatus(order._id, 'completed')}
                          className="flex items-center gap-1 text-sm font-bold bg-nature-600 text-white px-4 py-2 rounded-xl hover:bg-nature-700 transition-all">
                          <CheckCircle size={14} /> Mark Complete
                        </button>
                      )}
                      <button onClick={() => { setChatContact(order.buyer); setActiveTab('messages'); }}
                        className="text-sm font-bold text-earth-400 hover:text-earth-700 border border-earth-200 dark:border-zinc-700 px-4 py-2 rounded-xl transition-all flex items-center gap-1">
                        <MessageSquare size={14} /> Message Buyer
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* MESSAGES TAB - Producer */}
        {activeTab === 'messages' && (
          <div className="animate-fade-in-up h-[600px]">
            {chatContact ? (
              <LiveChat currentUser={user} contact={chatContact} onBack={() => setChatContact(null)} />
            ) : (
              <div className="bg-white dark:bg-zinc-900 h-full rounded-3xl border border-earth-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-4 text-earth-400">
                <MessageSquare size={48} className="opacity-30" />
                <p className="font-bold text-lg">No chat selected</p>
                <p className="text-sm">Go to Orders and click "Message Buyer" to start chatting.</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback Section - Redesigned */}
        {activeTab === 'feedback' && (
          <div className="animate-fade-in-up max-w-2xl mx-auto space-y-6">
            <div className="bg-gradient-to-br from-nature-900/40 to-zinc-900 border border-nature-800/30 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 text-nature-400/10 text-[120px] font-black leading-none select-none">★</div>
              <h2 className="text-2xl font-black text-white mb-2">Share Your Thoughts</h2>
              <p className="text-nature-300/70 text-sm">Your insights help shape the future of peer-to-peer agriculture. We read every single one.</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-earth-200 dark:border-zinc-800 p-8 space-y-5">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-earth-400 mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {['Platform', 'Pricing', 'Logistics', 'Auctions', 'Support', 'Other'].map(cat => (
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
                  placeholder="Tell us what's working, what could be better..."
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
          </div>
        )}

        {activeTab === 'location' && (
          <div className="animate-fade-in-up space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div>
                   <h2 className="text-2xl font-bold text-earth-900 dark:text-white mb-2">Register Store Location</h2>
                   <p className="text-earth-500">Pick your farm's precise spot on the map to be discovered by local consumers.</p>
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent('detect-location-producer'))}
                      className="flex items-center gap-2 bg-earth-50 dark:bg-zinc-800 text-earth-700 dark:text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-earth-100 transition-all shadow-sm"
                    >
                      <LocateFixed size={18} /> Use My GPS
                    </button>
                    <button 
                      onClick={handleSaveLocation}
                      disabled={isSavingLocation}
                      className="bg-nature-600 hover:bg-nature-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-nature-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSavingLocation ? 'Saving...' : 'Save Location'}
                    </button>
                 </div>
               </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-earth-200 dark:border-zinc-800 shadow-sm h-[600px] overflow-hidden relative">
              <div className="absolute top-8 left-8 z-[1000] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-4 rounded-2xl border border-earth-100 dark:border-zinc-800 shadow-xl max-w-xs pointer-events-none">
                 <p className="text-xs font-black text-nature-600 uppercase tracking-widest mb-1">Interactive Setup</p>
                 <p className="text-sm text-earth-600 dark:text-earth-400 leading-snug">Click anywhere on the map to place your business pin. Consumers will see this exact location.</p>
              </div>
               <MapContainer 
                  center={[tempLocation[1], tempLocation[0]]} 
                  zoom={12} 
                  className="h-full w-full rounded-2xl"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationHandlerProducer setTempLocation={setTempLocation} />
                  <MapClickHandler setTempLocation={setTempLocation} />
                  <Marker position={[tempLocation[1], tempLocation[0]]}>
                    <Popup>
                       <div className="p-2 text-center">
                         <p className="font-bold text-nature-600">Your Store</p>
                         <p className="text-[10px] text-earth-400">Drag or click to move</p>
                       </div>
                    </Popup>
                  </Marker>
                </MapContainer>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
               <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/20">
                  <h4 className="font-bold text-blue-900 dark:text-blue-400 mb-2">Why set a location?</h4>
                  <p className="text-sm text-blue-800/70 dark:text-blue-400/60 leading-relaxed">Visibility is the key to P2P trade. By pinning your location, you appear in the "Producers Nearby" map for consumers within a 50km radius, increasing your chance of direct sales by up to 300%.</p>
               </div>
               <div className="bg-earth-50 dark:bg-zinc-900 p-6 rounded-3xl border border-earth-100 dark:border-zinc-800/50">
                  <h4 className="font-bold text-earth-900 dark:text-white mb-2">Coordinates</h4>
                  <div className="flex gap-4">
                     <div>
                       <p className="text-[10px] text-earth-400 font-bold uppercase">Longitude</p>
                       <p className="font-mono text-sm">{tempLocation[0].toFixed(6)}</p>
                     </div>
                     <div>
                       <p className="text-[10px] text-earth-400 font-bold uppercase">Latitude</p>
                       <p className="font-mono text-sm">{tempLocation[1].toFixed(6)}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* CONTACT */}
        {activeTab === 'contact' && (
          <div className="animate-fade-in-up space-y-6">
            <div className="bg-gradient-to-r from-nature-900 via-zinc-900 to-zinc-950 rounded-3xl p-8 relative overflow-hidden border border-nature-800/30">
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #22c55e 0%, transparent 60%)' }} />
              <h2 className="text-3xl font-black text-white mb-2 relative">Get In Touch 👋</h2>
              <p className="text-nature-300/70 relative text-sm max-w-md">We're here to help. Reach us through any channel — our team responds within 24 hours.</p>
            </div>
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
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-earth-200 dark:border-zinc-800 p-8">
              <h3 className="font-black text-earth-900 dark:text-white text-lg mb-6">Send a Message</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div><label className="text-xs font-black uppercase tracking-widest text-earth-400 mb-2 block">Your Name</label>
                  <input type="text" id="p-contact-name" className="w-full bg-earth-50 dark:bg-zinc-800 border border-earth-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-earth-900 dark:text-white text-sm focus:ring-2 focus:ring-nature-500 outline-none transition-all" placeholder="Your full name" /></div>
                <div><label className="text-xs font-black uppercase tracking-widest text-earth-400 mb-2 block">Email</label>
                  <input type="email" id="p-contact-email" className="w-full bg-earth-50 dark:bg-zinc-800 border border-earth-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-earth-900 dark:text-white text-sm focus:ring-2 focus:ring-nature-500 outline-none transition-all" placeholder="your@email.com" /></div>
              </div>
              <div className="mb-4"><label className="text-xs font-black uppercase tracking-widest text-earth-400 mb-2 block">Subject</label>
                <input type="text" id="p-contact-subject" className="w-full bg-earth-50 dark:bg-zinc-800 border border-earth-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-earth-900 dark:text-white text-sm focus:ring-2 focus:ring-nature-500 outline-none transition-all" placeholder="How can we help?" /></div>
              <div className="mb-6"><label className="text-xs font-black uppercase tracking-widest text-earth-400 mb-2 block">Message</label>
                <textarea rows="4" id="p-contact-message" className="w-full bg-earth-50 dark:bg-zinc-800 border border-earth-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-earth-900 dark:text-white text-sm focus:ring-2 focus:ring-nature-500 outline-none resize-none transition-all" placeholder="Describe your issue or question..." /></div>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  const name = document.getElementById('p-contact-name')?.value;
                  const email = document.getElementById('p-contact-email')?.value;
                  const subject = document.getElementById('p-contact-subject')?.value;
                  const message = document.getElementById('p-contact-message')?.value;
                  if (!name || !email || !message) return alert('Please fill in all required fields.');
                  try {
                    const res = await axios.post('/api/contact', { name, email, subject, message });
                    alert('✅ ' + res.data.message);
                  } catch (err) { alert(err.response?.data?.message || 'Failed to send message.'); }
                }}
                className="bg-nature-600 hover:bg-nature-500 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-nature-600/20 transition-all text-sm tracking-wide uppercase"
              >📬 Send Message</motion.button>
            </div>
          </div>
        )}

      </main>

      {/* Profile Edit Modal Overlay */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-8 w-full max-w-md relative z-10 border border-earth-200 dark:border-zinc-800 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-earth-900 dark:text-white mb-6">Edit Profile</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-earth-700 dark:text-earth-300">Full Name</label>
                  <input 
                    type="text" 
                    value={profileData.name} 
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full bg-earth-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-500" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-earth-700 dark:text-earth-300">Email Address</label>
                  <input 
                    type="email" 
                    value={profileData.email} 
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full bg-earth-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-500" 
                  />
                </div>
                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setIsProfileModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-earth-200 dark:border-zinc-800 font-bold hover:bg-earth-50 dark:hover:bg-zinc-800">Cancel</button>
                  <button type="submit" className="flex-1 bg-nature-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-nature-600/30">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Listing Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-8 w-full max-w-md relative z-10 border border-earth-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-earth-900 dark:text-white mb-6">Edit Listing</h2>
              <form onSubmit={handleEditListing} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-earth-700 dark:text-earth-300 uppercase">Title</label>
                  <input type="text" value={editingListing.title} onChange={e => setEditingListing({...editingListing, title: e.target.value})} className="w-full bg-earth-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-500" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-earth-700 dark:text-earth-300 uppercase">Crop Type</label>
                    <input type="text" value={editingListing.cropType} onChange={e => setEditingListing({...editingListing, cropType: e.target.value})} className="w-full bg-earth-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-500" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-earth-700 dark:text-earth-300 uppercase">Qty (kg)</label>
                    <input type="number" value={editingListing.quantity} onChange={e => setEditingListing({...editingListing, quantity: e.target.value})} className="w-full bg-earth-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-500" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-earth-700 dark:text-earth-300 uppercase">Price / Start Bid (₹)</label>
                  <input type="number" step="0.01" value={editingListing.price} onChange={e => setEditingListing({...editingListing, price: e.target.value})} className="w-full bg-earth-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-500" required />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-earth-700 dark:text-earth-300 uppercase tracking-wider">Description</label>
                    <textarea 
                      rows="2" 
                      value={editingListing.description}
                      onChange={(e) => setEditingListing({...editingListing, description: e.target.value})}
                      className="w-full bg-earth-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-nature-500"
                    ></textarea>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-earth-200 dark:border-zinc-800 font-bold hover:bg-earth-50 dark:hover:bg-zinc-800">Cancel</button>
                  <button type="submit" className="flex-1 bg-nature-600 hover:bg-nature-700 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg shadow-nature-600/30">Save Updates</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bid Leaderboard Modal */}
      {leaderboardListing && (
        <BidLeaderboard 
          listing={leaderboardListing} 
          onClose={() => setLeaderboardListing(null)} 
          onPlaceBid={async (type, bidData) => {
            if (type === 'AWARD_BID') {
              try {
                const token = window.localStorage.getItem('token');
                await axios.post(`/api/listings/award/${leaderboardListing._id}`, { userId: bidData.user?._id || bidData.user, amount: bidData.amount }, { headers: { 'x-auth-token': token }});
                setLeaderboardListing(null);
                // Update listing in state to show as closed
                setMyListings(prev => prev.map(l =>
                  l._id === leaderboardListing._id
                    ? { ...l, status: 'closed', winner: bidData.user }
                    : l
                ));
                // Show success toast
                const toast = document.createElement('div');
                toast.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:99999;background:#22c55e;color:white;padding:14px 28px;border-radius:16px;font-weight:900;font-size:15px;box-shadow:0 20px 40px rgba(34,197,94,0.3);transition:all 0.3s';
                toast.textContent = '🏆 Auction closed! Winner has been notified via email.';
                document.body.appendChild(toast);
                setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
              } catch(err) {
                alert(err.response?.data?.message || 'Error closing auction.');
              }
            }
          }}
        />
      )}
    </div>
  );
};

// Helper component for map interactions
const LocationHandlerProducer = ({ setTempLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    const handleDetect = () => {
      map.locate().on('locationfound', (e) => {
        map.flyTo(e.latlng, 15, { duration: 4 });
        setTempLocation([e.latlng.lng, e.latlng.lat]);
      });
    };
    
    window.addEventListener('detect-location-producer', handleDetect);
    return () => window.removeEventListener('detect-location-producer', handleDetect);
  }, [map, setTempLocation]);

  return null;
};

// Component to handle map clicks
const MapClickHandler = ({ setTempLocation }) => {
  useMapEvents({
    click: (e) => {
      setTempLocation([e.latlng.lng, e.latlng.lat]);
    },
  });
  return null;
};

export default ProducerDashboard;
