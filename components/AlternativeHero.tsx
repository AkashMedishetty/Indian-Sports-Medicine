  'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Menu, ArrowRight } from 'lucide-react';
import { conferenceConfig } from '@/config/conference.config';

const KneeModel3D = dynamic(() => import('./KneeModel3D'), { ssr: false });
const ShaderBackground = dynamic(() => import('./ShaderBackground'), { ssr: false });

export default function AlternativeHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#f5f0eb]">
      
      {/* Animated Shader Background */}
      <ShaderBackground />
      
      {/* Main Container */}
      <div className="relative z-10 px-4 sm:px-8 lg:px-16 py-6 sm:py-8">
        <div className="max-w-[1400px] mx-auto">
          
          {/* Top: Logo | Contact/Menu/All Pages */}
          <div className="flex items-center justify-between mb-6 sm:mb-10">
            {/* Logo - TAS */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0e192b] flex items-center justify-center">
                <span className="text-lg sm:text-xl font-bold text-[#fdb246]">TAS</span>
              </div>
            </motion.div>

            {/* Center: Navigation Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="hidden lg:flex items-center gap-2"
            >
              <a href="#committee" className="px-4 py-2.5 text-sm text-[#0e192b] bg-white hover:bg-white/80 rounded-full font-medium transition-all border border-gray-200">
                Committee
              </a>
              <Link href="/program-schedule" className="px-4 py-2.5 text-sm text-[#0e192b] bg-white hover:bg-white/80 rounded-full font-medium transition-all border border-gray-200">
                Program
              </Link>
              <Link href="/abstracts" className="px-4 py-2.5 text-sm text-[#0e192b] bg-white hover:bg-white/80 rounded-full font-medium transition-all border border-gray-200">
                Abstracts
              </Link>
              <Link href="/pricing" className="px-4 py-2.5 text-sm text-[#0e192b] bg-white hover:bg-white/80 rounded-full font-medium transition-all border border-gray-200">
                Pricing
              </Link>
              <Link href="/venue" className="px-4 py-2.5 text-sm text-[#0e192b] bg-white hover:bg-white/80 rounded-full font-medium transition-all border border-gray-200">
                Venue
              </Link>
              <Link href="/contact" className="px-4 py-2.5 text-sm text-[#0e192b] bg-white hover:bg-white/80 rounded-full font-medium transition-all border border-gray-200">
                Contact
              </Link>
              <Link href="/auth/login" className="px-4 py-2.5 text-sm text-[#0e192b] hover:text-[#0e192b]/80 font-medium transition-all">
                Log in
              </Link>
              <Link href="/register" className="px-5 py-2.5 text-sm text-white bg-[#0e192b] hover:bg-[#0e192b]/90 rounded-full font-bold transition-all shadow-sm">
                Register
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="md:hidden"
            >
              <button className="p-2 text-[#0e192b]">
                <Menu size={24} />
              </button>
            </motion.div>
          </div>

          {/* Main Grid: Left Content + Right Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-10 items-end">
            
            {/* LEFT SIDE - Direct content on background (NO CARD) */}
            <div className="relative flex flex-col justify-end pb-8 lg:pb-12">
              
              {/* Accent blob decoration in background */}
              <div className="absolute bottom-[15%] left-[-10%] w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] bg-gradient-to-br from-[#fdb246]/35 to-[#0e192b]/15 rounded-full blur-[120px] -z-10" />
              
              {/* Sparkle decoration */}
              <svg className="absolute top-[8%] right-[20%] w-12 h-12 sm:w-16 sm:h-16 text-[#fdb246] opacity-35" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>

              <div className="relative z-10 space-y-5 sm:space-y-6">
                
                {/* Registration Badge */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#fdb246]/40 bg-[#fdb246]/10"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fdb246] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#fdb246]"></span>
                  </span>
                  <span className="text-[#0e192b] text-xs font-bold tracking-wide uppercase">Registration Open</span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] tracking-tighter"
                >
                  <span className="text-[#fdb246]">{conferenceConfig.shortName.split(' ')[0]}</span>
                  <br />
                  <span className="text-[#0e192b]">{conferenceConfig.shortName.split(' ').slice(1).join(' ')}</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="space-y-1"
                >
                  <p className="text-xl sm:text-2xl lg:text-3xl text-[#0e192b] font-bold">
                    {conferenceConfig.name}
                  </p>
                  <p className="text-base sm:text-lg lg:text-xl text-[#0e192b]/70">
                    {conferenceConfig.organizationName}
                  </p>
                </motion.div>

                {/* Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex flex-wrap gap-3"
                >
                  <Link href="/register" className="px-7 py-3 bg-[#fdb246] hover:bg-[#fdb246]/90 text-[#0e192b] font-bold rounded-full shadow-lg transition-all text-sm sm:text-base inline-block text-center">
                    Register Now
                  </Link>
                  <Link href="/pricing" className="px-7 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-[#0e192b] font-semibold rounded-full transition-all text-sm sm:text-base inline-block text-center">
                    View Pricing
                  </Link>
                </motion.div>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-[#0e192b]/70 text-sm sm:text-base leading-relaxed max-w-lg"
                >
                  Join us for three transformative days of cutting-edge techniques, live surgeries, and hands-on workshops. Network with renowned international and national faculty in the vibrant city of Hyderabad.
                </motion.p>
              </div>
            </div>

            {/* Right Column - Stacked Cards - Bottom Aligned */}
            <div className="flex flex-col gap-5 justify-end">
              
              {/* 3D Model Card - Primary color background - SQUARE */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-[#0e192b] rounded-[28px] shadow-lg relative overflow-hidden aspect-square w-full"
              >
                {/* 3D Model Container */}
                <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-8">
                  <div className="w-full h-full">
                    <KneeModel3D />
                  </div>
                </div>
              </motion.div>

              {/* Bottom Two Cards - Stats Grid */}
              <div className="grid grid-cols-2 gap-5">
                
                {/* Quick Stats Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-[#0e192b] rounded-[24px] p-6 shadow-lg relative overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform"
                >
                  <div className="absolute inset-0 bg-[#fdb246]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-white mb-3">At a Glance</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-white/70 text-xs">Attendees</span>
                        <span className="text-xl font-bold text-white">500+</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-white/70 text-xs">Speakers</span>
                        <span className="text-xl font-bold text-white">50+</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-white/70 text-xs">Days</span>
                        <span className="text-xl font-bold text-white">3</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Venue Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="bg-[#0e192b] rounded-[24px] p-6 shadow-lg relative overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform"
                >
                  <div className="absolute inset-0 bg-[#fdb246]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-white mb-3">Venue</h3>
                    <p className="text-2xl font-bold text-white mb-1">Hyderabad</p>
                    <p className="text-white/70 text-sm">July 18-19, 2026</p>
                  </div>
                </motion.div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
