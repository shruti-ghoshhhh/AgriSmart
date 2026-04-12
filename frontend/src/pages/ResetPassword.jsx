import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Leaf } from 'lucide-react';
import axios from 'axios';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus('error');
      setMsg('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setStatus('error');
      setMsg('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`/api/auth/reset-password/${token}`, { password });
      setStatus('success');
      setMsg(res.data.message);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setStatus('error');
      setMsg(err.response?.data?.message || 'Something went wrong. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl p-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-nature-400 to-nature-600 p-2 rounded-xl text-white">
            <Leaf size={24} />
          </div>
          <span className="font-bold text-2xl text-white tracking-tight">
            Agri<span className="text-nature-400">Smart</span>
          </span>
        </div>

        <h1 className="text-2xl font-black text-white mb-2">Set New Password 🔑</h1>
        <p className="text-zinc-400 text-sm mb-8">Choose a strong password for your account.</p>

        {status && (
          <div className={`p-4 rounded-2xl text-sm font-bold mb-6 ${
            status === 'success'
              ? 'bg-nature-900/40 text-nature-400 border border-nature-700'
              : 'bg-red-900/30 text-red-400 border border-red-800'
          }`}>
            {status === 'success' ? '✅ ' : '❌ '}{msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2 block">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                <Lock size={16} />
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-nature-500 focus:border-transparent outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2 block">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                <Lock size={16} />
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-nature-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading || status === 'success'}
            className="w-full bg-nature-600 hover:bg-nature-500 disabled:opacity-60 text-white font-black py-4 rounded-2xl shadow-lg shadow-nature-600/20 transition-all mt-2"
          >
            {loading ? 'Resetting...' : status === 'success' ? '✓ Redirecting to Login...' : 'Reset Password'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
