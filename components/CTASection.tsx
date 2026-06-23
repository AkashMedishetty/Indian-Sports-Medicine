'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Calendar, MapPin, Users } from 'lucide-react';
import { conferenceConfig } from '@/config/conference.config';

export default function CTASection() {
  return (
    <section className="relative bg-black py-32 overflow-hidden">
      {/* Dramatic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0f1419_0%,#000000_100%)]" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-accent/30 rounded-full filter blur-[150px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-brightBlue/30 rounded-full filter blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-accent/10 border border-accent/30 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-accent font-semibold">Limited Seats Available</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8"
          >
            <span className="text-white">Ready to </span>
            <span className="bg-gradient-to-r from-accent via-orange-400 to-accent bg-clip-text text-transparent">
              Join Us?
            </span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-white/70 text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Secure your spot at {conferenceConfig.shortName} and be part of the future of {conferenceConfig.tagline?.toLowerCase() || 'medical excellence'}
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto"
          >
            {[
              { icon: Calendar, label: 'April 25-26, 2026', value: '2 Days' },
              { icon: MapPin, label: 'HICC Novotel, Hyderabad', value: 'Telangana' },
              { icon: Users, label: 'Expected Delegates', value: '500+' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
              >
                <stat.icon className="w-8 h-8 text-accent mb-3 mx-auto" />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <motion.a
              href="/register"
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,178,70,0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="group px-10 py-5 rounded-full bg-gradient-to-r from-accent to-orange-500 text-black font-bold text-lg flex items-center gap-3 shadow-2xl shadow-accent/50 hover:shadow-accent/70 transition-all duration-300"
            >
              Register Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.a>

            <motion.a
              href="/program-schedule"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 rounded-full bg-white/5 backdrop-blur-xl border-2 border-white/20 text-white font-bold text-lg hover:bg-white/10 hover:border-accent/50 transition-all duration-300"
            >
              View Program
            </motion.a>
          </motion.div>

          {/* Early Bird Notice */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9 }}
            className="mt-8 text-accent text-sm font-medium"
          >
            ⚡ Early Bird discount ends March 31st, 2026
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
