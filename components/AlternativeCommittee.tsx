'use client';

import { motion } from 'framer-motion';
import { Crown, Users, Shield } from 'lucide-react';

const committeeData = {
  organizing: [
    { name: 'Dr Sunil Apsing', role: 'President', icon: Crown },
    { name: 'Dr G Veda Prakash', role: 'Conference Secretary', icon: Shield },
    { name: 'Dr Raghuveer Reddy', role: 'Founder-President', icon: Crown },
  ],
  executive: [
    { name: 'Dr B Raja Ramesh', role: 'Vice President' },
    { name: 'P S Jaya Prasad', role: 'Secretary' },
    { name: 'Dr M Kaushik Reddy', role: 'Treasurer' },
  ],
  ecMembers: [
    'Dr G Shashi Kanth',
    'Dr Sukesh Rao',
    'Dr N Somashekhar Reddy',
    'Dr Jagan Mohan Reddy',
    'Dr Puma Chandra Tejaswi',
    'Dr Lalith Mohan',
    'Dr Deepthi Nandan Reddy',
  ],
};

export default function AlternativeCommittee() {
  return (
    <section id="committee" className="relative bg-[#f5f0eb] py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-0 w-[700px] h-[700px] bg-[#fdb246]/20 rounded-full filter blur-[140px]" />
          <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-[#0e192b]/10 rounded-full filter blur-[140px]" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-6 py-2 rounded-full bg-[#fdb246]/10 border border-[#fdb246]/30 mb-6"
          >
            <span className="text-[#0e192b] font-semibold">Leadership</span>
          </motion.div>
          
          <h2 className="text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-[#fdb246]">
              Organizing
            </span>
            <br />
            <span className="text-[#0e192b]">Committee</span>
          </h2>
        </motion.div>

        {/* Main Committee Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {committeeData.organizing.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              whileHover={{ y: -12, scale: 1.03 }}
              className="group relative p-8 rounded-3xl bg-gradient-to-br from-[#fdb246]/20 via-[#fdb246]/10 to-transparent backdrop-blur-xl border border-[#fdb246]/30 hover:border-[#fdb246]/60 transition-all duration-500 overflow-hidden shadow-lg"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#fdb246]/0 to-[#fdb246]/0 group-hover:from-[#fdb246]/20 group-hover:to-transparent transition-all duration-500" />
              
              <div className="relative">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#fdb246]/30 to-[#fdb246]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <member.icon className="w-8 h-8 text-[#fdb246]" />
                </div>
                
                {/* Name */}
                <h3 className="text-[#0e192b] text-2xl font-bold mb-2 group-hover:text-[#fdb246] transition-colors">
                  {member.name}
                </h3>
                
                {/* Role */}
                <p className="text-[#fdb246] font-semibold uppercase tracking-wider text-sm">
                  {member.role}
                </p>

                {/* Decorative Line */}
                <div className="mt-6 h-1 w-16 bg-gradient-to-r from-[#fdb246] to-transparent rounded-full group-hover:w-full transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Executive Committee */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-10 rounded-3xl bg-gradient-to-br from-[#0e192b]/10 to-transparent backdrop-blur-xl border border-[#0e192b]/20 mb-16 shadow-lg"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#0e192b]/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#0e192b]" />
            </div>
            <h3 className="text-3xl font-bold text-[#0e192b]">
              TAS <span className="text-[#fdb246]">Executive Committee</span>
            </h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {committeeData.executive.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl bg-white border border-[#0e192b]/10 hover:border-[#fdb246]/40 hover:bg-[#fdb246]/5 transition-all duration-300 shadow-md"
              >
                <p className="text-[#0e192b] font-bold text-lg mb-2 group-hover:text-[#fdb246] transition-colors">
                  {member.name}
                </p>
                <p className="text-[#0e192b]/70 text-sm uppercase tracking-wider">
                  {member.role}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* EC Members Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-center mb-8">
            <span className="text-[#0e192b]">TAS EC </span>
            <span className="text-[#fdb246]">Members</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {committeeData.ecMembers.map((name, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="p-5 rounded-2xl bg-white backdrop-blur-xl border border-[#0e192b]/10 hover:border-[#fdb246]/30 transition-all duration-300 text-center group shadow-md"
              >
                <p className="text-[#0e192b] font-medium group-hover:text-[#fdb246] transition-colors">
                  {name}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
