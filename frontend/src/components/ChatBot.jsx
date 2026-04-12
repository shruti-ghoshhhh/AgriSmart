import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import axios from 'axios';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hello! I am your AgriSmart Assistant 🌱 How can I help you today with pricing, yields, or navigating the site?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // No auth required — bot is public
      // Optionally pass user role from localStorage if logged in
      let role = 'visitor';
      try {
        const stored = localStorage.getItem('user');
        if (stored) role = JSON.parse(stored)?.role || 'visitor';
      } catch (_) {}

      const res = await axios.post('/api/bot/chat', { message: userMessage, role });
      setMessages(prev => [...prev, { role: 'model', text: res.data.text }]);
    } catch (err) {
      const errorText = err.response?.data?.message || 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'model', text: errorText }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-nature-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-nature-700 transition-colors"
          >
            <MessageSquare size={30} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className={`bg-white dark:bg-zinc-900 border border-earth-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
              isMinimized ? 'h-16 w-64' : 'h-[500px] w-80 md:w-96'
            }`}
          >
            {/* Header */}
            <div className="bg-nature-600 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Bot size={20} />
                </div>
                <div>
                   <h3 className="font-bold text-sm">AgriSmart AI</h3>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
                      <span className="text-[10px] text-white/80 uppercase font-bold tracking-wider">Online</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/10 rounded-lg">
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Container */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-earth-50/30 dark:bg-zinc-950/20"
                >
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                          msg.role === 'user' ? 'bg-zinc-800 text-white' : 'bg-nature-100 text-nature-600'
                        }`}>
                          {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-nature-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-zinc-800 text-earth-900 dark:text-zinc-200 border border-earth-100 dark:border-zinc-700 shadow-sm rounded-tl-none'
                        }`}>
                           {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                       <div className="flex gap-2">
                         <div className="w-8 h-8 rounded-lg bg-nature-100 text-nature-600 flex items-center justify-center">
                            <Bot size={16} />
                         </div>
                         <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-earth-100 dark:border-zinc-700 flex gap-1">
                            <span className="w-1.5 h-1.5 bg-nature-600 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-nature-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-nature-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                         </div>
                       </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 border-t border-earth-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-2">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about prices or yield..."
                    className="flex-1 bg-earth-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-nature-500 text-earth-900 dark:text-white"
                  />
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="p-2 bg-nature-600 text-white rounded-xl hover:bg-nature-700 transition-colors disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatBot;
