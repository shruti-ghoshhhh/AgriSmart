import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Gavel, 
  MessageSquare, 
  LogOut, 
  User as UserIcon, 
  Trash2, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  X,
  Menu,
  AlertCircle,
  Search,
  Filter,
  UserPlus,
  Edit3,
  Ban,
  Unlock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ counts: {}, timeline: [] });
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  // New states for CRUD modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'consumer' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    
    setLoading(true);
    setError(null);
    try {
      const statsRes = await axios.get('/api/admin/stats', config);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error fetching admin stats", err);
      const msg = err.response ? `Stats Hub: ${err.response.status} ${err.response.data?.message || err.message}` : "Failed to load stats. Check backend.";
      setError(msg);
    }

    try {
      const usersRes = await axios.get('/api/admin/users', config);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (err) {
      console.error("Error fetching users", err);
      if (!error) {
        const msg = err.response ? `Users: ${err.response.status} ${err.response.data?.message || err.message}` : "Users API failed.";
        setError(msg);
      }
    }

    try {
      const feedbackRes = await axios.get('/api/admin/feedback', config);
      setFeedback(feedbackRes.data || []);
    } catch (err) {
      console.error("Error fetching feedback", err);
    }

    try {
      const auctionsRes = await axios.get('/api/admin/auctions', config);
      setAuctions(auctionsRes.data || []);
    } catch (err) {
      console.error("Error fetching auctions", err);
    }

    setLoading(false);
  };

  const handleDeleteAuction = async (id) => {
    if (window.confirm('Confirm deletion of this listing? This action cannot be undone.')) {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      try {
        await axios.delete(`/api/admin/auctions/${id}`, config);
        setAuctions(auctions.filter(a => a._id !== id));
      } catch (err) {
        alert('Error deleting auction/listing');
      }
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action is permanent.')) {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      try {
        await axios.delete(`/api/admin/users/${id}`, config);
        setUsers(users.filter(u => u._id !== id));
      } catch (err) {
        alert('Error deleting user');
      }
    }
  };

  const handleResolveFeedback = async (id) => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
      await axios.post(`/api/admin/feedback/resolve/${id}`, {}, config);
      setFeedback(feedback.map(f => f._id === id ? { ...f, status: 'resolved' } : f));
    } catch (err) {
      alert('Error resolving feedback');
    }
  };

  const handleArchiveFeedback = async (id) => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
      await axios.patch(`/api/admin/feedback/archive/${id}`, {}, config);
      setFeedback(feedback.filter(f => f._id !== id));
    } catch (err) {
      alert('Error archiving feedback');
    }
  };

  const handleToggleBan = async (id) => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
      const res = await axios.patch(`/api/admin/users/ban/${id}`, {}, config);
      setUsers(users.map(u => u._id === id ? { ...u, isBanned: res.data.isBanned } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Error toggling ban status');
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ name: '', email: '', password: '', role: 'consumer' });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };

    try {
      if (modalMode === 'create') {
        const res = await axios.post('/api/admin/users', formData, config);
        setUsers([res.data, ...users]);
      } else {
        const res = await axios.put(`/api/admin/users/${selectedUser._id}`, formData, config);
        setUsers(users.map(u => u._id === selectedUser._id ? { ...u, ...res.data } : u));
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sidebarLinks = [
    { id: 'overview', label: 'Control Tower', icon: <LayoutDashboard size={20} /> },
    { id: 'users', label: 'Community Ops', icon: <Users size={20} /> },
    { id: 'auctions', label: 'Auction Monitor', icon: <Gavel size={20} /> },
    { id: 'feedback', label: 'Support Queue', icon: <MessageSquare size={20} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-nature-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium">Accessing Secure Admin Layer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex transition-colors duration-300">
      
      {/* Admin Sidebar - Dark Theme Preferred */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 h-full bg-zinc-950 border-r border-zinc-800 z-40 transition-all duration-300"
      >
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${!isSidebarOpen && 'hidden'}`}>
             <div className="bg-nature-600 p-1.5 rounded-lg text-white font-bold tracking-tighter">AS</div>
             <span className="font-display font-bold text-xl text-white">Admin Hub</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">
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
                  ? 'bg-nature-600 text-white font-bold shadow-lg shadow-nature-600/30' 
                  : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              }`}
            >
              {link.icon}
              {isSidebarOpen && <span>{link.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-0 w-full px-3">
          <button onClick={logout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-medium">
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-[280px]' : 'ml-[80px]'} p-8`}>
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">
              {sidebarLinks.find(l => l.id === activeTab)?.label}
            </h1>
            <p className="text-zinc-500">Platform-wide management and logistics control.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-nature-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                <div className="w-2 h-2 rounded-full bg-nature-500"></div>
                Secure Connection
             </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
            <AlertCircle size={18} />
            <p className="font-medium">{error}</p>
            <button onClick={fetchDashboardData} className="ml-auto underline text-xs">Retry Connection</button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Quick Stats Grid */}
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { label: 'Producers', val: stats.counts.producersCount, icon: <TrendingUp className="text-nature-400" /> },
                  { label: 'Consumers', val: stats.counts.consumersCount, icon: <Users className="text-blue-400" /> },
                  { label: 'Active Auctions', val: stats.counts.auctionsCount, icon: <Gavel className="text-yellow-400" /> },
                  { label: 'Pending Help', val: stats.counts.pendingFeedback, icon: <AlertCircle className="text-red-400" /> },
                ].map((s, i) => (
                  <div key={i} className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-zinc-800 rounded-2xl">{s.icon}</div>
                    </div>
                    <h3 className="text-zinc-500 text-sm font-medium mb-1">{s.label}</h3>
                    <p className="text-3xl font-bold text-white">{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Growth Analytics Chart */}
              <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 shadow-sm">
                  <h2 className="text-xl font-bold text-white mb-8">Platform Growth Trajectory</h2>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.timeline}>
                        <defs>
                          <linearGradient id="colorPro" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCon" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Area type="monotone" dataKey="producers" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorPro)" />
                        <Area type="monotone" dataKey="consumers" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCon)" />
                        <Area type="monotone" dataKey="auctions" stroke="#eab308" strokeWidth={3} fillOpacity={0} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
               key="users"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-6"
            >
               {/* Controls */}
               <div className="flex justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 text-zinc-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search users by name or email..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-nature-500 outline-none"
                    />
                  </div>
                  <button 
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-nature-600 hover:bg-nature-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-nature-600/20"
                  >
                    <UserPlus size={18} />
                    Add New User
                  </button>
               </div>

               {/* Table */}
               <div className="bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-800/50 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                       <tr>
                         <th className="px-6 py-4">User Details</th>
                         <th className="px-6 py-4">Tier/Role</th>
                         <th className="px-6 py-4">Joined On</th>
                         <th className="px-6 py-4">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                       {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                         <tr key={u._id} className="hover:bg-zinc-800/30 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${u.isBanned ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-nature-400'}`}>
                                    {u.name.charAt(0)}
                                 </div>
                                 <div className={u.isBanned ? 'opacity-50' : ''}>
                                   <div className="flex items-center gap-2">
                                     <p className="font-bold text-white">{u.name}</p>
                                     {u.isBanned && <span className="bg-red-500 text-[8px] text-white px-1.5 py-0.5 rounded font-black uppercase">Banned</span>}
                                   </div>
                                   <p className="text-xs text-zinc-500">{u.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter ${
                                u.role === 'producer' ? 'bg-nature-500/10 text-nature-400' : 'bg-blue-500/10 text-blue-400'
                              }`}>
                                {u.role}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-sm text-zinc-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button onClick={() => openEditModal(u)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit User"><Edit3 size={18} /></button>
                                <button 
                                  onClick={() => handleToggleBan(u._id)} 
                                  className={`p-2 rounded-lg transition-colors ${u.isBanned ? 'text-green-500 hover:bg-green-500/10' : 'text-yellow-500 hover:bg-yellow-500/10'}`}
                                  title={u.isBanned ? 'Unban User' : 'Ban User'}
                                >
                                  {u.isBanned ? <Unlock size={18} /> : <Ban size={18} />}
                                </button>
                                <button onClick={() => handleDeleteUser(u._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete User"><Trash2 size={18} /></button>
                              </div>
                           </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
               </div>
            </motion.div>
          )}

          {activeTab === 'feedback' && (
             <motion.div 
               key="feedback"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="grid lg:grid-cols-2 gap-6"
             >
                 {feedback.filter(f => f.status !== 'archived').map((f) => (
                  <div key={f._id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500"><MessageSquare size={18} /></div>
                          <div>
                            <h4 className="font-bold text-white">{f.subject}</h4>
                            <p className="text-xs text-zinc-500">from {f.user?.name || 'Deleted User'}</p>
                          </div>
                       </div>
                       <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${f.status === 'resolved' ? 'bg-nature-500/20 text-nature-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                         {f.status}
                       </span>
                    </div>
                    <p className="text-zinc-400 text-sm mb-6 leading-relaxed italic">"{f.message}"</p>
                    <div className="flex justify-end gap-3 mt-auto border-t border-zinc-800 pt-4">
                       {f.status !== 'resolved' && (
                         <button onClick={() => handleResolveFeedback(f._id)} className="flex items-center gap-2 bg-nature-600 hover:bg-nature-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-nature-600/20">
                           <CheckCircle size={14} /> Resolve Ticket
                         </button>
                       )}
                       <button onClick={() => handleArchiveFeedback(f._id)} className="text-zinc-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold border border-zinc-800">Archive</button>
                    </div>
                  </div>
                ))}
                {feedback.filter(f => f.status !== 'archived').length === 0 && <div className="lg:col-span-2 text-center py-20 text-zinc-500 font-medium border-2 border-dashed border-zinc-800 rounded-3xl">No support tickets in queue.</div>}
             </motion.div>
          )}

          {activeTab === 'auctions' && (
             <motion.div 
               key="auctions"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm overflow-hidden"
             >
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-zinc-950/50 text-xs uppercase tracking-widest text-zinc-500">
                       <tr>
                         <th className="px-6 py-4 font-bold">Listing Title</th>
                         <th className="px-6 py-4 font-bold">Producer</th>
                         <th className="px-6 py-4 font-bold">Type</th>
                         <th className="px-6 py-4 font-bold">Top Bid / Price</th>
                         <th className="px-6 py-4 font-bold">Status</th>
                         <th className="px-6 py-4 font-bold ext-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                       {auctions.map((a) => (
                         <tr key={a._id} className="hover:bg-zinc-800/30 transition-colors">
                           <td className="px-6 py-4">
                              <p className="font-bold text-white">{a.title}</p>
                              <p className="text-xs text-zinc-500">{a.quantity}kg • {a.cropType}</p>
                           </td>
                           <td className="px-6 py-4 text-sm text-zinc-400">
                              {a.producer?.name || 'Unknown'}
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter ${
                                a.listingType === 'auction' ? 'bg-nature-500/10 text-nature-400' : 'bg-blue-500/10 text-blue-400'
                              }`}>
                                {a.listingType}
                              </span>
                           </td>
                           <td className="px-6 py-4 font-mono text-sm text-white">
                              ${a.listingType === 'auction' ? a.currentBid : a.price}
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter ${
                                a.status === 'open' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                              }`}>
                                {a.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button onClick={() => handleDeleteAuction(a._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Listing">
                                 <Trash2 size={18} />
                              </button>
                           </td>
                         </tr>
                       ))}
                       {auctions.length === 0 && (
                         <tr>
                           <td colSpan="6" className="text-center py-10 text-zinc-500 font-medium italic">No active listings/auctions.</td>
                         </tr>
                       )}
                    </tbody>
                 </table>
               </div>
             </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* CRUD User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display font-bold text-white">
                  {modalMode === 'create' ? 'Create Global Account' : 'Edit User Profile'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500"><X size={20} /></button>
              </div>

              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-nature-500"
                    placeholder="Enter user full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-nature-500"
                    placeholder="Enter unique email"
                  />
                </div>
                {modalMode === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Initial Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-nature-500"
                      placeholder="Assign secure password"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Platform Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-nature-500"
                  >
                    <option value="consumer">Consumer (Standard User)</option>
                    <option value="producer">Producer (Merchant)</option>
                    <option value="admin">Admin (System Access)</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-zinc-800 text-zinc-400 font-bold hover:bg-zinc-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 bg-nature-600 hover:bg-nature-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-nature-600/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Syncing...' : modalMode === 'create' ? 'Register User' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
