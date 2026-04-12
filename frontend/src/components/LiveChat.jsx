import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

const LiveChat = ({ currentUser, contact, onBack }) => {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/messages/conversation/${contact._id}`, {
          headers: { 'x-auth-token': token }
        });
        setMessages(res.data);
      } catch (err) {
        console.error('Error loading messages:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [contact._id]);

  useEffect(() => {
    if (!socket || !currentUser || !contact) return;
    socket.emit('join-chat', { myId: currentUser.id, otherId: contact._id });

    const handleMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
    };
    socket.on('receive-message', handleMessage);
    return () => socket.off('receive-message', handleMessage);
  }, [socket, currentUser, contact]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('send-message', {
      senderId: currentUser.id,
      receiverId: contact._id,
      text: input.trim(),
      senderName: currentUser.name
    });
    setInput('');
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-zinc-800 bg-zinc-900/60">
        {onBack && (
          <button onClick={onBack} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all">
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="w-10 h-10 rounded-2xl bg-nature-800 flex items-center justify-center text-nature-300 font-black">
          {contact.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-white text-sm">{contact.name}</p>
          <p className="text-[10px] text-nature-400 capitalize font-bold">{contact.role} • Live</p>
        </div>
        <div className="ml-auto w-2 h-2 bg-nature-400 rounded-full animate-pulse" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-nature-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
            <p className="text-3xl">💬</p>
            <p className="text-sm font-bold">Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, idx) => {
              const isMe = (msg.sender?._id || msg.sender) === currentUser.id;
              return (
                <motion.div
                  key={msg._id || idx}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] space-y-1`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium ${
                      isMe
                        ? 'bg-nature-600 text-white rounded-br-sm'
                        : 'bg-zinc-800 text-white rounded-bl-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <p className={`text-[10px] text-zinc-600 ${isMe ? 'text-right' : 'text-left'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Message ${contact.name}...`}
          className="flex-1 bg-zinc-800 border border-zinc-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium placeholder:text-zinc-500 focus:outline-none focus:border-nature-500"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="submit"
          disabled={!input.trim()}
          className="p-2.5 bg-nature-600 hover:bg-nature-500 text-white rounded-xl transition-all disabled:opacity-40"
        >
          <Send size={18} />
        </motion.button>
      </form>
    </div>
  );
};

export default LiveChat;
