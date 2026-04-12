import React from 'react';
import { motion } from 'framer-motion';
import { Store, Truck, LineChart, Handshake, CheckCircle2 } from 'lucide-react';

const features = [
  {
    icon: <Store size={32} />,
    title: 'Direct Marketplace',
    description: 'Farmers list their produce directly. Consumers buy without middlemen, ensuring freshness and better prices.'
  },
  {
    icon: <Handshake size={32} />,
    title: 'Fair Negotiations',
    description: 'Transparent pricing with built-in negotiation tools. Both parties agree on terms that make sense for them.'
  },
  {
    icon: <Truck size={32} />,
    title: 'Smart Logistics',
    description: 'Integrated delivery options so farmers can focus on growing, while buyers get their goods reliably.'
  },
  {
    icon: <LineChart size={32} />,
    title: 'Market Insights',
    description: 'Real-time data on crop prices and demand to help producers make informed decisions.'
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-white dark:bg-zinc-950 relative transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-nature-600 font-bold tracking-wider uppercase text-sm mb-4"
          >
            What We Do
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-nature-950 dark:text-white mb-6"
          >
            Empowering the Agricultural Community
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-earth-600 dark:text-earth-400"
          >
            AgriSmart is a revolutionary peer-to-peer platform eliminating the friction in traditional agricultural supply chains. Get to know what we offer.
          </motion.p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-8 hover:bg-nature-50 dark:hover:bg-nature-900/10 border border-earth-100 dark:border-zinc-800 hover:border-nature-200 dark:hover:border-nature-500 transition-all group hover:-translate-y-2 shadow-sm hover:shadow-xl"
            >
              <div className="bg-earth-50 dark:bg-zinc-800 w-16 h-16 rounded-2xl flex items-center justify-center text-nature-600 dark:text-nature-400 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-nature-900 dark:text-nature-100 mb-4">{feature.title}</h3>
              <p className="text-earth-600 dark:text-earth-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section inside the same block */}
        <div className="grid lg:grid-cols-2 gap-16 items-center pt-8 border-t border-earth-100 dark:border-earth-800">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-nature-600 font-bold tracking-wider uppercase text-sm mb-4"
            >
              How It Benefits You
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold text-nature-950 dark:text-white mb-6"
            >
              Growing Together, <br/>
              <span className="text-nature-600 dark:text-nature-400">Prospering Together.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-earth-600 dark:text-earth-400 mb-10"
            >
              Whether you are tending the soil or preparing a meal, AgriSmart shifts the balance to benefit those who truly matter.
            </motion.p>

            <div className="space-y-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex gap-6"
              >
                <div className="bg-nature-100 dark:bg-earth-800 text-nature-700 dark:text-nature-400 p-4 rounded-2xl h-fit shadow-inner">
                  <span className="text-2xl font-bold">01</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-nature-950 dark:text-white mb-2">For Farmers</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-earth-700 dark:text-earth-300">
                      <CheckCircle2 className="text-nature-500 shrink-0 mt-1" size={18} />
                      <span>Retain up to 40% more profit per yield.</span>
                    </li>
                    <li className="flex items-start gap-2 text-earth-700 dark:text-earth-300">
                      <CheckCircle2 className="text-nature-500 shrink-0 mt-1" size={18} />
                      <span>Direct feedback and long-term buyer relationships.</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex gap-6"
              >
                <div className="bg-nature-100 dark:bg-earth-800 text-nature-700 dark:text-nature-400 p-4 rounded-2xl h-fit shadow-inner">
                  <span className="text-2xl font-bold">02</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-nature-950 dark:text-white mb-2">For Consumers</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-earth-700 dark:text-earth-300">
                      <CheckCircle2 className="text-nature-500 shrink-0 mt-1" size={18} />
                      <span>Traceable, organic, and fresher produce.</span>
                    </li>
                    <li className="flex items-start gap-2 text-earth-700 dark:text-earth-300">
                      <CheckCircle2 className="text-nature-500 shrink-0 mt-1" size={18} />
                      <span>Lower costs by cutting out wholesale retail markups.</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="aspect-square rounded-full border border-earth-200 dark:border-earth-800 p-8">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-nature-400 to-nature-600 flex items-center justify-center relative overflow-hidden shadow-2xl">
                 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPgo8L3JlY3Q+CjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj4KPC9yZWN0Pgo8L3N2Zz4=')]"></div>
                 <div className="text-center z-10 glass dark:bg-earth-900/60 p-8 rounded-3xl mx-12 border-white/40 dark:border-white/10">
                   <div className="text-5xl font-bold text-nature-900 dark:text-white mb-2">+40%</div>
                   <div className="text-earth-700 dark:text-earth-300 font-bold tracking-wide text-sm uppercase">Average Profit Increase</div>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default Features;
