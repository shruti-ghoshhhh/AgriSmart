import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, RefreshCw, Minimize2 } from 'lucide-react';
import axios from 'axios';

const WELCOME = "Hi there! 👋 I'm **Agri**, your AI assistant. I can help you with:\n- 🌾 Crop prices & market insights\n- 🛒 How to buy or bid on listings\n- 🚜 Farming tips for producers\n- 📦 Order & account questions\n\nWhat can I help you with today?";

const formatMd = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)/gm, '<span style="display:block;padding-left:8px">• $1</span>')
    .replace(/\n/g, '<br/>');

const SupportChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: WELCOME, id: 0 }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!open && messages.length > 1) setHasUnread(true);
    if (open) setHasUnread(false);
  }, [messages, open]);

  useEffect(() => {
    const handleToggle = () => setOpen(true);
    window.addEventListener('toggle-support-chat', handleToggle);
    return () => window.removeEventListener('toggle-support-chat', handleToggle);
  }, []);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    const userMsg = { role: 'user', text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const res = await axios.post('/api/bot/chat', { message: text, role: 'support' });
      setMessages(prev => [...prev, { role: 'bot', text: res.data.text, id: Date.now() + 1 }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I ran into an issue. Please try again! 🌱', id: Date.now() + 1 }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => setMessages([{ role: 'bot', text: WELCOME, id: 0 }]);

  const quickPrompts = ['How do I place a bid?', 'Show me crop prices', 'How do I track my order?'];

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[9990] w-14 h-14 bg-nature-600 hover:bg-nature-500 text-white rounded-full shadow-2xl shadow-nature-600/40 flex items-center justify-center transition-colors"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={22} />
            </motion.div>
          )}
        </AnimatePresence>
        {hasUnread && !open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-6 z-[9989] w-[360px] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            style={{ maxHeight: '520px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-nature-900 to-zinc-900 p-4 flex items-center gap-3 border-b border-zinc-800">
              <div className="w-10 h-10 bg-nature-600 rounded-2xl flex items-center justify-center shadow-lg shadow-nature-600/30">
                <Bot size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">Agri Support</p>
                <p className="text-nature-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-nature-400 rounded-full animate-pulse inline-block" /> AI Powered · Always Online
                </p>
              </div>
              <button onClick={clearChat} className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-all" title="Clear chat">
                <RefreshCw size={14} />
              </button>
              <button onClick={() => setOpen(false)} className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-all">
                <Minimize2 size={14} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '320px' }}>
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'bot' && (
                      <div className="w-7 h-7 bg-nature-800 rounded-xl flex items-center justify-center mr-2 mt-1 shrink-0">
                        <Bot size={13} className="text-nature-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-nature-600 text-white rounded-br-sm'
                          : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                      }`}
                      dangerouslySetInnerHTML={{ __html: formatMd(msg.text) }}
                    />
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="w-7 h-7 bg-nature-800 rounded-xl flex items-center justify-center mr-2 mt-1 shrink-0">
                      <Bot size={13} className="text-nature-400" />
                    </div>
                    <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick prompts */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
                {quickPrompts.map(p => (
                  <button key={p} onClick={() => { setInput(p); setTimeout(() => sendMessage(), 100); }}
                    className="shrink-0 text-[10px] font-bold text-nature-400 border border-nature-800 px-3 py-1.5 rounded-xl hover:bg-nature-900 transition-all whitespace-nowrap">
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t border-zinc-800 flex gap-2 bg-zinc-900/50">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-nature-500"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-nature-600 hover:bg-nature-500 text-white rounded-xl transition-all disabled:opacity-40"
              >
                <Send size={16} />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportChat;
