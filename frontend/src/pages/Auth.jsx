import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, ArrowLeft, Mail, Lock, User, Briefcase, Tractor, ShoppingBasket, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MapPicker from '../components/MapPicker';

const roles = [
  { id: 'consumer', icon: <ShoppingBasket size={24} />, title: 'Consumer', desc: 'Buy fresh produce directly' },
  { id: 'producer', icon: <Tractor size={24} />, title: 'Producer', desc: 'Sell your harvest' },
  { id: 'admin', icon: <Briefcase size={24} />, title: 'Admin', desc: 'Platform management' },
];

const Auth = ({ mode = "login" }) => {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState('consumer');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    try {
      const res = await axios.post('/api/auth/forgot-password', { email: forgotEmail });
      alert('📩 ' + res.data.message);
      setIsForgotModalOpen(false);
    } catch (err) {
      console.error('Forgot password error:', err);
      const detail = err.response?.data?.message || err.message || 'No details available';
      alert(`❌ Error processing request: ${detail}\n\nPlease check your internet connection or try again later.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password } 
        : { ...formData, role: selectedRole, location: locationData };
      
      const res = await axios.post(endpoint, payload);
      console.log('Success:', res.data);
      
      // Use login method from context
      login(res.data.user, res.data.token);
      
      // Role-based redirection
      if (res.data.user.role === 'producer') {
        navigate('/dashboard/producer');
      } else if (res.data.user.role === 'consumer') {
        navigate('/dashboard/consumer');
      } else if (res.data.user.role === 'admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-earth-50 dark:bg-earth-950 flex transition-colors duration-300">
      
      {/* Left Panel - Visuals Overlay */}
      <div className="hidden lg:flex w-1/2 bg-nature-950 p-16 relative overflow-hidden flex-col justify-between border-r border-earth-200 dark:border-earth-800">
        
        {/* Advanced Mesh Gradient Background */}
        <div className="absolute inset-0 z-0 bg-[#020617]">
          <motion.div 
            animate={{ 
              x: [0, 50, -50, 0],
              y: [0, -30, 30, 0],
              scale: [1, 1.2, 0.9, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-nature-600/20 blur-[120px]"
          />
          <motion.div 
            animate={{ 
              x: [0, -40, 40, 0],
              y: [0, 50, -50, 0],
              scale: [1, 0.8, 1.1, 1]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-nature-800/20 blur-[120px]"
          />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iMC4wNSIgc3Ryb2tlLXdpZHRoPSIwLjUiPjxwYXRoIGQ9Ik0wIDQwTDQwIDBNMCAwTDQwIDQwIi8+PC9zdmc+')] mix-blend-overlay opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-nature-950 via-transparent to-transparent"></div>
        </div>

        {/* Top Navigation */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-nature-400 transition-all font-medium group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Return to Landing</span>
          </Link>
        </div>

        {/* Centerpiece: Floating Premium Cards */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-8">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-sm ml-[-40px]"
          >
            <div className="glass-dark border border-white/10 p-5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4 group hover:border-nature-500/50 transition-colors">
               <div className="p-3 bg-nature-500/20 rounded-xl text-nature-400">
                  <ShoppingBasket size={24} />
               </div>
               <div>
                 <h3 className="text-white font-bold">Direct P2P Trading</h3>
                 <p className="text-white/50 text-xs">Bypass middlemen for fair rates.</p>
               </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="w-full max-w-sm mr-[-60px]"
          >
            <div className="glass-dark border border-white/10 p-5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4 group hover:border-blue-500/50 transition-colors">
               <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                  <Mail size={24} />
               </div>
               <div>
                 <h3 className="text-white font-bold">Encrypted Comms</h3>
                 <p className="text-white/50 text-xs">Secure negotiation platform.</p>
               </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="w-full max-w-sm ml-[-20px]"
          >
            <div className="glass-dark border border-white/10 p-5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4 group hover:border-yellow-500/50 transition-colors">
               <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400">
                  <Leaf size={24} />
               </div>
               <div>
                 <h3 className="text-white font-bold">Eco-Verified Roots</h3>
                 <p className="text-white/50 text-xs">Supporting sustainable farms.</p>
               </div>
            </div>
          </motion.div>

        </div>

        {/* Bottom Branding Section */}
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-6">
             <div className="bg-gradient-to-br from-nature-400 to-nature-600 p-2.5 rounded-2xl text-white shadow-lg shadow-nature-500/20">
               <Leaf size={32} />
             </div>
             <span className="font-display font-bold text-4xl text-white tracking-tighter">
               Agri<span className="text-nature-400">Smart</span>
             </span>
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-6 leading-[1.1]">
            {isLogin ? "Welcome back to the source." : "Your farm-to-table journey starts here."}
          </h1>
          <p className="text-nature-200/70 text-lg leading-relaxed max-w-sm">
            {isLogin 
              ? "Access your command center to manage auctions and trade fresh produce." 
              : "Connecting farmers and families through a direct, transparent P2P marketplace."}
          </p>
        </div>

      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative overflow-y-auto">
        <Link to="/" className="lg:hidden absolute top-8 left-8 inline-flex items-center gap-2 text-nature-600 hover:text-nature-800 transition-colors">
            <ArrowLeft size={20} />
            <span className="font-medium text-sm">Back</span>
        </Link>
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-display font-bold text-earth-900 dark:text-white mb-2">
              {isLogin ? "Log in to your account" : "Create your account"}
            </h2>
            <p className="text-earth-500 dark:text-earth-400 mb-6">
              {isLogin 
                ? "Welcome back! Please enter your details." 
                : "Choose your role and enter your details to get started."}
            </p>

            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-medium mb-6">
                {errorMsg}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-8"
                >
                  <label className="block text-sm font-semibold text-earth-900 dark:text-earth-200 mb-3">I am joining as a:</label>
                  <div className="grid grid-cols-3 gap-3">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                          selectedRole === role.id 
                            ? 'border-nature-500 bg-nature-50 dark:bg-nature-900/40 text-nature-700 dark:text-nature-400 shadow-sm' 
                            : 'border-earth-200 dark:border-earth-800 hover:border-nature-300 dark:hover:border-nature-700 text-earth-500 dark:text-earth-400 hover:bg-earth-100 dark:hover:bg-earth-800'
                        }`}
                      >
                        <div className="mb-2">{role.icon}</div>
                        <span className="text-xs font-bold">{role.title}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div 
                    key="fullname-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-semibold text-earth-900 dark:text-earth-200 mb-1.5">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-earth-400">
                        <User size={18} />
                      </div>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-nature-500/50 focus:border-nature-500 transition-all text-earth-900 dark:text-white placeholder:text-earth-400 dark:placeholder:text-earth-600"
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-semibold text-earth-900 dark:text-earth-200 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-earth-400">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-nature-500/50 focus:border-nature-500 transition-all text-earth-900 dark:text-white placeholder:text-earth-400 dark:placeholder:text-earth-600"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-earth-900 dark:text-earth-200">Password</label>
                  {isLogin && <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-sm font-medium text-nature-600 dark:text-nature-500 hover:text-nature-700 dark:hover:text-nature-400">Forgot password?</button>}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-earth-400">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-white dark:bg-earth-900 border border-earth-200 dark:border-earth-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-nature-500/50 focus:border-nature-500 transition-all text-earth-900 dark:text-white placeholder:text-earth-400 dark:placeholder:text-earth-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-earth-400 hover:text-earth-700 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {!isLogin && selectedRole === 'producer' && (
                <div className="mt-6 pt-6 border-t border-earth-100 dark:border-zinc-800">
                  <MapPicker onLocationSelect={setLocationData} />
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-nature-600 hover:bg-nature-700 disabled:opacity-70 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-nature-600/30 transition-all transform hover:-translate-y-0.5 mt-6"
              >
                {loading ? 'Processing...' : (isLogin ? "Sign In" : "Create Account")}
              </button>

            </form>

            <p className="mt-8 text-center text-sm text-earth-600 dark:text-earth-400 font-medium">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Link 
                to={isLogin ? "/signup" : "/login"} 
                className="text-nature-600 hover:text-nature-800 dark:text-nature-400 dark:hover:text-nature-300 font-bold transition-colors"
              >
                {isLogin ? "Sign up" : "Log in"}
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    
      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-earth-900 rounded-3xl p-8 w-full max-w-sm relative z-10 border border-earth-200 dark:border-earth-800 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-earth-900 dark:text-white mb-2">Reset Password</h2>
              <p className="text-sm text-earth-500 dark:text-earth-400 mb-6">Enter your email and we'll send you a recovery link.</p>
              
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-earth-400">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-earth-50 dark:bg-earth-950 border border-earth-200 dark:border-earth-800 rounded-xl focus:ring-2 focus:ring-nature-500 outline-none text-earth-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setIsForgotModalOpen(false)} className="flex-1 py-3 rounded-xl border border-earth-200 dark:border-earth-800 font-bold hover:bg-earth-50 dark:hover:bg-earth-800 text-earth-700 dark:text-earth-300">Cancel</button>
                  <button type="submit" className="flex-1 bg-nature-600 hover:bg-nature-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-nature-600/30">Send Link</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Auth;
