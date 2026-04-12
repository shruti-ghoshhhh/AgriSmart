import React from 'react';
import { Leaf, Globe, MessageCircle, Share2, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-zinc-950 text-earth-900 dark:text-earth-100 py-16 border-t border-earth-100 dark:border-zinc-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
               <div className="bg-nature-500 p-1.5 rounded-lg text-white">
                 <Leaf size={20} />
               </div>
                <span className="font-display font-bold text-2xl text-earth-900 dark:text-white tracking-tight">
                  Agri<span className="text-nature-600 dark:text-nature-400">Smart</span>
                </span>
            </div>
            <p className="text-earth-400 text-sm leading-relaxed mb-6">
              Cultivating a sustainable future by bridging the gap between local producers and conscious consumers globally.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-earth-400 hover:text-nature-400 transition-colors"><Globe size={20} /></a>
              <a href="#" className="text-earth-400 hover:text-nature-400 transition-colors"><MessageCircle size={20} /></a>
              <a href="#" className="text-earth-400 hover:text-nature-400 transition-colors"><Share2 size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-earth-900 dark:text-white font-bold mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-earth-400">
              <li><a href="#" className="hover:text-nature-400 transition-colors">Marketplace</a></li>
              <li><a href="#" className="hover:text-nature-400 transition-colors">For Farmers</a></li>
              <li><a href="#" className="hover:text-nature-400 transition-colors">For Consumers</a></li>
              <li><a href="#" className="hover:text-nature-400 transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-earth-900 dark:text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-earth-400">
              <li><a href="#" className="hover:text-nature-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-nature-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-nature-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-nature-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-earth-900 dark:text-white font-bold mb-6">Stay Updated</h4>
            <p className="text-earth-500 dark:text-earth-400 text-sm mb-4">Subscribe to our newsletter for the latest agricultural market updates.</p>
            <div className="flex bg-earth-50 dark:bg-zinc-900 rounded-lg p-1 border border-earth-200 dark:border-zinc-800">
              <input 
                type="email" 
                placeholder="Enter email" 
                className="bg-transparent text-earth-900 dark:text-white px-3 py-2 w-full focus:outline-none text-sm placeholder:text-earth-400 dark:placeholder:text-earth-600"
              />
              <button className="bg-nature-600 hover:bg-nature-500 text-white p-2 rounded-md transition-colors">
                <Mail size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-earth-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-earth-500 dark:text-earth-500">
          <p>&copy; {new Date().getFullYear()} AgriSmart Inc. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-nature-600 dark:hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-nature-600 dark:hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
