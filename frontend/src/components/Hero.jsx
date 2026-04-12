import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sprout, TrendingUp, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Hero = () => {
  const [stats, setStats] = React.useState({ producers: 0, consumers: 0, auctions: 0 });

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/public/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch public stats', err);
      }
    };
    fetchStats();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-24 overflow-hidden pb-20 lg:pb-0">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -z-10 w-full h-full overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[60%] rounded-full bg-nature-200/30 dark:bg-nature-900/20 blur-3xl mix-blend-multiply dark:mix-blend-soft-light opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[50%] rounded-full bg-yellow-100/40 dark:bg-yellow-900/10 blur-3xl mix-blend-multiply dark:mix-blend-soft-light opacity-50 animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <motion.div 
            className="flex flex-col gap-6 text-center lg:text-left pt-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-nature-50 dark:bg-nature-900/30 text-nature-700 dark:text-nature-400 px-4 py-2 rounded-full font-medium w-fit mx-auto lg:mx-0 border border-nature-100 dark:border-nature-800">
              <Sprout size={18} />
              <span>Cultivating the Future of Trade</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] dark:text-white">
              Direct from Farm <br />
              to <span className="text-gradient">Your Table</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-earth-700 dark:text-earth-300 max-w-2xl mx-auto lg:mx-0">
              AgriSmart connects local farmers directly with consumers. 
              Experience transparent, peer-to-peer agriculture trading with fair prices and assured quality.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-4">
              <Link to="/signup" className="bg-nature-600 hover:bg-nature-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-nature-600/30 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                Join the Marketplace
                <ArrowRight size={20} />
              </Link>
              <a href="#features" className="bg-white hover:bg-earth-50 text-earth-900 border border-earth-200 px-8 py-4 rounded-full font-bold text-lg shadow-sm transition-all hover:border-earth-300 dark:bg-earth-900 dark:border-earth-700 dark:text-white dark:hover:bg-earth-800 dark:hover:border-earth-600 flex items-center justify-center">
                Learn More
              </a>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-8 flex items-center justify-center lg:justify-start gap-8 border-t border-earth-200 dark:border-earth-800 pt-8">
               <div className="flex flex-col">
                  <div className="font-bold text-3xl text-nature-900 dark:text-nature-400">{stats.producers.toLocaleString()}</div>
                  <div className="text-sm text-earth-500 dark:text-earth-400 font-medium">Active Farmers</div>
               </div>
               <div className="w-px h-12 bg-earth-200 dark:bg-earth-800"></div>
               <div className="flex flex-col">
                  <div className="font-bold text-3xl text-nature-900 dark:text-nature-400">{stats.auctions.toLocaleString()}</div>
                  <div className="text-sm text-earth-500 dark:text-earth-400 font-medium">Active Auctions</div>
               </div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="hidden lg:block relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Hero Visual Container - Keeping the user's preferred "Green Box" */}
            <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden bg-earth-100 dark:bg-zinc-900 shadow-2xl mr-8 mt-12 group">
               {/* Vibrant Gradient Background */}
               <div className="absolute inset-0 bg-gradient-to-br from-nature-400 via-nature-600 to-nature-950 transition-all duration-700 group-hover:scale-110"></div>
               
               {/* Technical Grid Pattern */}
               <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iMC4wNSIgc3Ryb2tlLXdpZHRoPSIwLjUiPjxwYXRoIGQ9Ik0wIDQwTDQwIDBNMCAwTDQwIDQwIi8+PC9zdmc+')] mix-blend-overlay opacity-60"></div>
               
               {/* Ambient Glows */}
               <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 blur-[80px] rounded-full"></div>
               <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-nature-400/20 blur-[100px] rounded-full"></div>

               {/* Feature Layers Refined */}
               <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center gap-8 px-6">
                  
                  {/* Card 1: Direct Trade */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-[240px] glass-dark p-4 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md self-start"
                  >
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-nature-500/20 rounded-xl text-nature-400">
                          <Sprout size={20} />
                       </div>
                       <div>
                          <p className="text-white font-bold text-sm">Direct Trade</p>
                          <p className="text-white/50 text-[10px]">P2P Farm Marketplace</p>
                       </div>
                    </div>
                  </motion.div>

                  {/* Card 2: Verified Source */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-full max-w-[240px] glass-dark p-4 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl z-20"
                  >
                    <div className="flex flex-col gap-3">
                       <div className="flex items-center justify-between">
                          <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                             <ShieldCheck size={20} />
                          </div>
                          <div className="bg-nature-500/20 text-nature-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Verified</div>
                       </div>
                       <div>
                          <p className="text-white font-bold text-md">Trusted Networks</p>
                          <p className="text-white/50 text-xs">Certified Organic Producers</p>
                       </div>
                    </div>
                  </motion.div>

                  {/* Card 3: Secure Logistics */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="w-full max-w-[240px] glass-dark p-4 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md self-end"
                  >
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-yellow-500/20 rounded-xl text-yellow-400">
                          <TrendingUp size={20} />
                       </div>
                       <div>
                          <p className="text-white font-bold text-sm">Smart Logistics</p>
                          <p className="text-white/50 text-[10px]">Optimized Supply Chain</p>
                       </div>
                    </div>
                  </motion.div>
               </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
