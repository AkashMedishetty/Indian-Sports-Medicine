'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { conferenceConfig } from '@/conference-backend-core/config/conference.config';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'About Conference', href: '#about' },
    { name: 'Scientific Program', href: '#program' },
    { name: 'Registration', href: '#registration' },
    { name: 'Abstracts', href: '#abstracts' },
    { name: 'Venue Information', href: '#venue' },
    { name: 'Committee', href: '#committee' },
  ];

  const socialLinks = [
    { name: 'LinkedIn', icon: 'linkedin', href: '#', color: '#0077B5' },
    { name: 'Twitter', icon: 'twitter', href: '#', color: '#1DA1F2' },
    { name: 'Facebook', icon: 'facebook', href: '#', color: '#1877F2' },
    { name: 'Instagram', icon: 'instagram', href: '#', color: '#E4405F' },
    { name: 'YouTube', icon: 'youtube', href: '#', color: '#FF0000' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '#privacy' },
    { name: 'Terms & Conditions', href: '#terms' },
    { name: 'Cookies Policy', href: '#cookies' },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-black via-gray-900 to-black border-t border-white/10">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent opacity-50" />
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Section */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold mb-4">
                <span className="text-accent">TAS</span>
                <span className="text-white/80">CON</span>
                <span className="text-accent">2026</span>
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Excellence in Arthroscopic Care through innovation, collaboration, and excellence. 
                Join us in Hyderabad for three transformative days of medical learning.
              </p>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-white/70">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>{new Date(conferenceConfig.eventDate.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(conferenceConfig.eventDate.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>{conferenceConfig.venue.city}, {conferenceConfig.venue.state}</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <span className="text-accent font-bold">500+</span>
                  <span>Expected Delegates</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Links */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.href}
                      className="text-white/60 hover:text-accent transition-colors duration-300 text-sm flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Contact Information */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Contact Information</h4>
              
              <div className="space-y-4">
                <div>
                  <p className="text-white/80 font-semibold mb-2">Conference Manager</p>
                  <p className="text-white/60 text-sm">Mr. Lakshmi Prabha</p>
                </div>

                <div className="space-y-2">
                  <a 
                    href={`mailto:${conferenceConfig.contact.email}`}
                    className="flex items-center gap-2 text-white/60 hover:text-accent transition-colors text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    {conferenceConfig.contact.email}
                  </a>
                  <a 
                    href={`tel:${conferenceConfig.contact.phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-2 text-white/60 hover:text-accent transition-colors text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    {conferenceConfig.contact.phone}
                  </a>
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <MapPin className="w-4 h-4" />
                    {conferenceConfig.venue.city}, {conferenceConfig.venue.state}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-white/80 font-semibold mb-1 text-sm">Apple Events</p>
                  <p className="text-white/60 text-xs">Lakshmi Prabha: +91 9052967744</p>
                  <p className="text-white/60 text-xs">Conference Management</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tech Partner */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Tech Partner</h4>
              <a 
                href="https://purplehatevents.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <div className="text-2xl font-bold bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent hover:from-purple-500 hover:to-accent transition-all duration-300">
                  PurpleHat Tech
                </div>
                <p className="text-white/40 text-sm mt-2">purplehatevents.in</p>
              </a>
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm text-center md:text-left">
              © {currentYear} {conferenceConfig.shortName} Conference. All rights reserved.
              <br className="md:hidden" />
              <span className="hidden md:inline"> | </span>
              {conferenceConfig.venue.city}, {conferenceConfig.venue.state}
            </p>
            
            <div className="flex gap-6">
              {legalLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-white/40 hover:text-accent transition-colors text-xs"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
