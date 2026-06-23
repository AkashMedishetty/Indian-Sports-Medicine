'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Users, GraduationCap, UserPlus } from 'lucide-react';

const pricingData = [
  {
    category: 'TAS Member',
    earlyBird: '₹4,500',
    regular: '₹6,000',
    icon: Users,
    featured: true,
  },
  {
    category: 'Non-TAS Member',
    earlyBird: '₹5,500*',
    regular: '₹7,000*',
    icon: Users,
    featured: false,
  },
  {
    category: 'Post-Graduate',
    earlyBird: '₹1,500',
    regular: '₹3,000',
    icon: GraduationCap,
    featured: false,
  },
  {
    category: 'Accompanying Person',
    earlyBird: '₹3,000',
    regular: '₹4,000',
    icon: UserPlus,
    featured: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="relative bg-black py-32 overflow-hidden">
      {/* Same Background as Hero */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0f1419_0%,#000000_100%)]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brightBlue/20 rounded-full filter blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full filter blur-[120px]" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Mobile: Static Header */}
        <div className="lg:hidden text-center mb-16">
          <div className="inline-block px-6 py-2 rounded-full bg-accent/10 border border-accent/30 mb-6">
            <span className="text-accent font-semibold">Registration Fees</span>
          </div>
          
          <h2 className="text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-white">Choose Your </span>
            <span className="bg-gradient-to-r from-accent via-orange-400 to-accent bg-clip-text text-transparent">
              Registration
            </span>
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center text-white/70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full" />
              <span className="text-accent font-semibold">Early Bird:</span>
              <span>31st March 2026</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white/50 rounded-full" />
              <span className="text-white/80 font-semibold">Regular:</span>
              <span>1st April - 24th April 2026</span>
            </div>
          </div>
        </div>

        {/* Desktop: Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-6 py-2 rounded-full bg-accent/10 border border-accent/30 mb-6"
          >
            <span className="text-accent font-semibold">Registration Fees</span>
          </motion.div>
          
          <h2 className="text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-white">Choose Your </span>
            <span className="bg-gradient-to-r from-accent via-orange-400 to-accent bg-clip-text text-transparent">
              Registration
            </span>
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center text-white/70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full" />
              <span className="text-accent font-semibold">Early Bird:</span>
              <span>31st March 2026</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white/50 rounded-full" />
              <span className="text-white/80 font-semibold">Regular:</span>
              <span>1st April - 24th April 2026</span>
            </div>
          </div>
        </motion.div>

        {/* Mobile: Static Pricing Cards */}
        <div className="lg:hidden grid grid-cols-2 gap-4 mb-12">
          {pricingData.map((item, i) => (
            <div
              key={i}
              className={`p-6 rounded-3xl backdrop-blur-xl border transition-all duration-300 ${
                item.featured
                  ? 'bg-gradient-to-br from-accent/20 to-accent/5 border-accent/50'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {item.featured && (
                <div className="px-3 py-1 rounded-full bg-accent text-black text-xs font-bold mb-4">
                  POPULAR
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                item.featured ? 'bg-accent/20' : 'bg-white/10'
              }`}>
                <item.icon className={item.featured ? 'w-6 h-6 text-accent' : 'w-6 h-6 text-white/60'} />
              </div>
              
              <h3 className="text-white text-lg font-bold mb-4">{item.category}</h3>
              
              <div className="mb-4 pb-4 border-b border-white/10">
                <div className="text-xs text-accent font-semibold mb-1 uppercase tracking-wider">Early Bird</div>
                <div className="text-2xl font-bold text-accent">{item.earlyBird}</div>
              </div>
              
              <div>
                <div className="text-xs text-white/60 font-semibold mb-1 uppercase tracking-wider">Regular</div>
                <div className="text-xl font-bold text-white/80">{item.regular}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Animated Pricing Cards */}
        <div className="hidden lg:grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {pricingData.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`group relative p-8 rounded-3xl backdrop-blur-xl border transition-all duration-300 overflow-hidden ${
                item.featured
                  ? 'bg-gradient-to-br from-accent/20 to-accent/5 border-accent/50'
                  : 'bg-white/5 border-white/10 hover:border-accent/30'
              }`}
            >
              {/* Featured Badge */}
              {item.featured && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-accent text-black text-xs font-bold">
                  POPULAR
                </div>
              )}

              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/0 group-hover:from-accent/10 group-hover:to-transparent transition-all duration-500" />
              
              <div className="relative">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                  item.featured ? 'bg-accent/20' : 'bg-white/10'
                }`}>
                  <item.icon className={item.featured ? 'w-7 h-7 text-accent' : 'w-7 h-7 text-white/60'} />
                </div>
                
                {/* Category */}
                <h3 className="text-white text-xl font-bold mb-6">{item.category}</h3>
                
                {/* Early Bird Pricing */}
                <div className="mb-6 pb-6 border-b border-white/10">
                  <div className="text-xs text-accent font-semibold mb-2 uppercase tracking-wider">Early Bird</div>
                  <div className="text-3xl font-bold text-accent">{item.earlyBird}</div>
                </div>
                
                {/* Regular Pricing */}
                <div>
                  <div className="text-xs text-white/60 font-semibold mb-2 uppercase tracking-wider">Regular</div>
                  <div className="text-2xl font-bold text-white/80">{item.regular}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-accent/10 to-transparent border border-accent/20"
        >
          <CheckCircle className="w-6 h-6 text-accent flex-shrink-0" />
          <p className="text-white/90 text-lg">
            <span className="text-accent font-bold">*Free TAS Life Membership</span> included with Non-TAS Member registration
          </p>
        </motion.div>
      </div>
    </section>
  );
}
