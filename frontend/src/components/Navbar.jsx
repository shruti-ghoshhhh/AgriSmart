import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Menu, X, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'glass py-4 shadow-lg' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="bg-nature-500 p-2 rounded-xl text-white shadow-lg">
              <Leaf size={24} />
            </div>
            <span className="font-display font-bold text-2xl text-nature-950 dark:text-white tracking-tight">
              Agri<span className="text-nature-600 dark:text-nature-400">Smart</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
          </div>

          {/* Destkop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <button 
              onClick={toggleTheme} 
              className="p-2.5 rounded-xl bg-earth-100 dark:bg-earth-800 text-earth-700 dark:text-earth-200 hover:text-nature-600 dark:hover:text-nature-400 transition-all active:scale-95 shadow-sm border border-earth-200 dark:border-earth-700"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={22} className="text-yellow-400" /> : <Moon size={22} className="text-indigo-600" />}
            </button>
            <Link to="/login" className="font-medium text-nature-700 dark:text-nature-300 hover:text-nature-900 dark:hover:text-white transition-colors px-4 py-2 block">
              Login
            </Link>
            <Link to="/signup" className="bg-nature-600 hover:bg-nature-700 text-white px-6 py-2 rounded-full font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 block">
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-lg bg-earth-100 dark:bg-earth-800 text-earth-700 dark:text-earth-200"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={22} className="text-yellow-400" /> : <Moon size={22} className="text-indigo-600" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-earth-900 dark:text-earth-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden glass dark:bg-earth-900 absolute top-full left-0 w-full border-t border-earth-200 dark:border-earth-800 py-4 px-4 flex flex-col gap-4 shadow-xl"
        >
          <div className="h-px bg-earth-200 dark:bg-earth-800 my-2"></div>
          <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-left font-medium text-nature-700 dark:text-nature-300 p-2 hover:bg-nature-50 dark:hover:bg-earth-800 rounded-lg block">
            Login
          </Link>
          <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="w-full text-center bg-nature-600 text-white font-medium p-3 rounded-lg shadow-sm block">
            Sign Up
          </Link>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
