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

export default function AlternativePricing() {
  return (
    <section id="pricing" className="relative bg-white py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#0e192b]/10 rounded-full filter blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#fdb246]/20 rounded-full filter blur-[120px]" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Mobile: Static Header */}
        <div className="lg:hidden text-center mb-16">
          <div className="inline-block px-6 py-2 rounded-full bg-[#fdb246]/10 border border-[#fdb246]/30 mb-6">
            <span className="text-[#0e192b] font-semibold">Registration Fees</span>
          </div>
          
          <h2 className="text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-[#0e192b]">Choose Your </span>
            <span className="text-[#fdb246]">
              Registration
            </span>
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center text-[#0e192b]/70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#fdb246] rounded-full" />
              <span className="text-[#fdb246] font-semibold">Early Bird:</span>
              <span>31st March 2026</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-[#0e192b]/20" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#0e192b]/50 rounded-full" />
              <span className="text-[#0e192b]/80 font-semibold">Regular:</span>
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
            className="inline-block px-6 py-2 rounded-full bg-[#fdb246]/10 border border-[#fdb246]/30 mb-6"
          >
            <span className="text-[#0e192b] font-semibold">Registration Fees</span>
          </motion.div>
          
          <h2 className="text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-[#0e192b]">Choose Your </span>
            <span className="text-[#fdb246]">
              Registration
            </span>
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center text-[#0e192b]/70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#fdb246] rounded-full" />
              <span className="text-[#fdb246] font-semibold">Early Bird:</span>
              <span>31st March 2026</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-[#0e192b]/20" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#0e192b]/50 rounded-full" />
              <span className="text-[#0e192b]/80 font-semibold">Regular:</span>
              <span>1st April - 24th April 2026</span>
            </div>
          </div>
        </motion.div>

        {/* Mobile: Static Pricing Cards */}
        <div className="lg:hidden grid grid-cols-2 gap-4 mb-12">
          {pricingData.map((item, i) => (
            <div
              key={i}
              className={`p-6 rounded-3xl backdrop-blur-xl border transition-all duration-300 shadow-lg ${
                item.featured
                  ? 'bg-gradient-to-br from-[#fdb246]/20 to-[#fdb246]/5 border-[#fdb246]/50'
                  : 'bg-[#f5f0eb] border-[#0e192b]/10'
              }`}
            >
              {item.featured && (
                <div className="px-3 py-1 rounded-full bg-[#fdb246] text-[#0e192b] text-xs font-bold mb-4">
                  POPULAR
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                item.featured ? 'bg-[#fdb246]/20' : 'bg-[#0e192b]/10'
              }`}>
                <item.icon className={item.featured ? 'w-6 h-6 text-[#fdb246]' : 'w-6 h-6 text-[#0e192b]/60'} />
              </div>
              
              <h3 className="text-[#0e192b] text-lg font-bold mb-4">{item.category}</h3>
              
              <div className="mb-4 pb-4 border-b border-[#0e192b]/10">
                <div className="text-xs text-[#fdb246] font-semibold mb-1 uppercase tracking-wider">Early Bird</div>
                <div className="text-2xl font-bold text-[#fdb246]">{item.earlyBird}</div>
              </div>
              
              <div>
                <div className="text-xs text-[#0e192b]/60 font-semibold mb-1 uppercase tracking-wider">Regular</div>
                <div className="text-xl font-bold text-[#0e192b]/80">{item.regular}</div>
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
              className={`group relative p-8 rounded-3xl backdrop-blur-xl border transition-all duration-300 overflow-hidden shadow-lg ${
                item.featured
                  ? 'bg-gradient-to-br from-[#fdb246]/20 to-[#fdb246]/5 border-[#fdb246]/50'
                  : 'bg-[#f5f0eb] border-[#0e192b]/10 hover:border-[#fdb246]/30'
              }`}
            >
              {/* Featured Badge */}
              {item.featured && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#fdb246] text-[#0e192b] text-xs font-bold">
                  POPULAR
                </div>
              )}

              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#fdb246]/0 to-[#fdb246]/0 group-hover:from-[#fdb246]/10 group-hover:to-transparent transition-all duration-500" />
              
              <div className="relative">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                  item.featured ? 'bg-[#fdb246]/20' : 'bg-[#0e192b]/10'
                }`}>
                  <item.icon className={item.featured ? 'w-7 h-7 text-[#fdb246]' : 'w-7 h-7 text-[#0e192b]/60'} />
                </div>
                
                {/* Category */}
                <h3 className="text-[#0e192b] text-xl font-bold mb-6">{item.category}</h3>
                
                {/* Early Bird Pricing */}
                <div className="mb-6 pb-6 border-b border-[#0e192b]/10">
                  <div className="text-xs text-[#fdb246] font-semibold mb-2 uppercase tracking-wider">Early Bird</div>
                  <div className="text-3xl font-bold text-[#fdb246]">{item.earlyBird}</div>
                </div>
                
                {/* Regular Pricing */}
                <div>
                  <div className="text-xs text-[#0e192b]/60 font-semibold mb-2 uppercase tracking-wider">Regular</div>
                  <div className="text-2xl font-bold text-[#0e192b]/80">{item.regular}</div>
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
          className="flex items-center justify-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-[#fdb246]/10 to-transparent border border-[#fdb246]/20"
        >
          <CheckCircle className="w-6 h-6 text-[#fdb246] flex-shrink-0" />
          <p className="text-[#0e192b]/90 text-lg">
            <span className="text-[#fdb246] font-bold">*Free TAS Life Membership</span> included with Non-TAS Member registration
          </p>
        </motion.div>
      </div>
    </section>
  );
}
