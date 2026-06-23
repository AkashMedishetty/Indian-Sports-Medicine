'use client';

import { motion } from 'framer-motion';
import { Microscope, Users, Award, BookOpen, Sparkles, Calendar } from 'lucide-react';
import { conferenceConfig } from '@/config/conference.config';

export default function WelcomeSection() {
  const highlights = [
    { icon: Microscope, title: 'Live Surgeries', desc: 'Video Techniques' },
    { icon: Users, title: 'Panel Discussions', desc: 'Expert Debates' },
    { icon: Award, title: 'Best Paper & Poster', desc: 'Awards & Recognition' },
    { icon: BookOpen, title: 'Workshops', desc: 'International Faculty' },
    { icon: Sparkles, title: 'Quiz & Gala Dinner', desc: 'Networking Events' },
    { icon: Calendar, title: 'Re-Live Surgeries', desc: 'Case Studies' },
  ];

  return (
    <section className="relative bg-black py-32 overflow-hidden">
      {/* Same Background as Hero */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0f1419_0%,#000000_100%)]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/20 rounded-full filter blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brightBlue/20 rounded-full filter blur-[120px]" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Mobile: Static Welcome Message */}
        <div className="lg:hidden text-center mb-20">
          <div className="inline-block px-6 py-2 rounded-full bg-accent/10 border border-accent/30 mb-6">
            <span className="text-accent font-semibold">Welcome to {conferenceConfig.shortName}</span>
          </div>
          
          <h2 className="text-5xl lg:text-7xl font-bold mb-8">
            <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              Advancing
            </span>
            <br />
            <span className="bg-gradient-to-r from-accent via-orange-400 to-accent bg-clip-text text-transparent">
              Arthroscopic Excellence
            </span>
          </h2>
          
          <p className="text-white/70 text-xl max-w-3xl mx-auto leading-relaxed">
            Join the Telangana Arthroscopy Society for three transformative days of innovation, 
            collaboration, and cutting-edge medical learning in Hyderabad.
          </p>
        </div>

        {/* Desktop: Animated Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-6 py-2 rounded-full bg-accent/10 border border-accent/30 mb-6"
          >
            <span className="text-accent font-semibold">Welcome to {conferenceConfig.shortName}</span>
          </motion.div>
          
          <h2 className="text-5xl lg:text-7xl font-bold mb-8">
            <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              Advancing
            </span>
            <br />
            <span className="bg-gradient-to-r from-accent via-orange-400 to-accent bg-clip-text text-transparent">
              Arthroscopic Excellence
            </span>
          </h2>
          
          <p className="text-white/70 text-xl max-w-3xl mx-auto leading-relaxed">
            Join the Telangana Arthroscopy Society for three transformative days of innovation, 
            collaboration, and cutting-edge medical learning in Hyderabad.
          </p>
        </motion.div>

        {/* Mobile: Static Conference Highlights */}
        <div className="lg:hidden mb-16">
          <h3 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            <span className="text-white">Conference </span>
            <span className="text-accent">Highlights</span>
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((item, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-accent/50 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-6">
                  <item.icon className="w-7 h-7 text-accent" />
                </div>
                
                <h4 className="text-white text-xl font-bold mb-2">
                  {item.title}
                </h4>
                <p className="text-white/60">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Animated Conference Highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="hidden lg:block mb-16"
        >
          <h3 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            <span className="text-white">Conference </span>
            <span className="text-accent">Highlights</span>
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-accent/50 transition-all duration-300 overflow-hidden"
              >
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/0 group-hover:from-accent/10 group-hover:to-transparent transition-all duration-500" />
                
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="w-7 h-7 text-accent" />
                  </div>
                  
                  <h4 className="text-white text-xl font-bold mb-2 group-hover:text-accent transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-white/60 group-hover:text-white/80 transition-colors">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
