'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { conferenceConfig } from '@/config/conference.config';

export default function WelcomeLetter() {
  return (
    <section className="relative bg-black py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0f1419_0%,#000000_100%)]" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-accent/20 rounded-full filter blur-[120px]" />
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8">
        {/* Mobile: Static Version */}
        <div className="lg:hidden">
          <div className="text-center mb-12">
            <div className="inline-block px-6 py-2 rounded-full bg-accent/10 border border-accent/30 mb-6">
              <span className="text-accent font-semibold">Welcome Message</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-accent via-orange-400 to-accent bg-clip-text text-transparent">
                Dear Colleagues
              </span>
            </h2>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10">
            <div className="mb-6">
              <Quote className="w-12 h-12 text-accent/40" />
            </div>
            
            <div className="space-y-6 text-white/80 leading-relaxed">
              <p>
                On behalf of the {conferenceConfig.organizationName}, it is my distinct pleasure to welcome you 
                to <strong className="text-white">{conferenceConfig.shortName}</strong> - {conferenceConfig.name}.
              </p>
              
              <p>
                This year&apos;s conference promises to be an exceptional gathering of minds, bringing together 
                renowned international and national faculty, distinguished experts, and passionate learners 
                under one roof in the vibrant city of {conferenceConfig.venue.city}.
              </p>
              
              <p>
                Over the conference days, we will explore cutting-edge techniques, engage in thought-provoking 
                panel discussions, and participate in hands-on workshops. {conferenceConfig.shortName} offers 
                a comprehensive platform for learning, sharing, and networking.
              </p>
              
              <p>
                We are committed to fostering innovation, collaboration, and excellence in our field. 
                This conference is not just about advancing our skills—it&apos;s about building lasting 
                relationships and strengthening our professional community.
              </p>
              
              <p className="text-white font-medium">
                We look forward to welcoming you to {conferenceConfig.venue.city} and creating an unforgettable experience together.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-white/80 text-sm">— From Organizing Committee, {conferenceConfig.shortName}</p>
            </div>
          </div>
        </div>

        {/* Desktop: Animated Version */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block"
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block px-6 py-2 rounded-full bg-accent/10 border border-accent/30 mb-6"
            >
              <span className="text-accent font-semibold">Welcome Message</span>
            </motion.div>
            <h2 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-accent via-orange-400 to-accent bg-clip-text text-transparent">
                Dear Colleagues
              </span>
            </h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-accent/30 transition-all duration-500"
          >
            <div className="mb-6">
              <Quote className="w-12 h-12 text-accent/40" />
            </div>
            
            <div className="space-y-6 text-white/80 text-lg leading-relaxed">
              <p>
                On behalf of the {conferenceConfig.organizationName}, it is my distinct pleasure to welcome you 
                to <strong className="text-white">{conferenceConfig.shortName}</strong> - {conferenceConfig.name}.
              </p>
              
              <p>
                This year&apos;s conference promises to be an exceptional gathering of minds, bringing together 
                renowned international and national faculty, distinguished experts, and passionate learners 
                under one roof in the vibrant city of {conferenceConfig.venue.city}.
              </p>
              
              <p>
                Over the conference days, we will explore cutting-edge techniques, engage in thought-provoking 
                panel discussions, and participate in hands-on workshops. {conferenceConfig.shortName} offers 
                a comprehensive platform for learning, sharing, and networking.
              </p>
              
              <p>
                We are committed to fostering innovation, collaboration, and excellence in our field. 
                This conference is not just about advancing our skills—it&apos;s about building lasting 
                relationships and strengthening our professional community.
              </p>
              
              <p className="text-white font-medium text-xl">
                We look forward to welcoming you to {conferenceConfig.venue.city} and creating an unforgettable experience together.
              </p>
            </div>

            <div className="mt-10 pt-8 border-t border-white/10 text-center">
              <p className="text-white/80">— From Organizing Committee, {conferenceConfig.shortName}</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
