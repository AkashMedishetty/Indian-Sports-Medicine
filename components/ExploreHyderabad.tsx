'use client';

import { motion } from 'framer-motion';
import { MapPin, Clock, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { conferenceConfig } from '@/config/conference.config';

const attractions = [
  {
    name: 'Golconda Fort',
    image: '/HYD/Golconda.png',
    description: 'A 13th-century fortress with stunning acoustics and panoramic city views',
    type: 'Historical',
    color: 'from-orange-500/20',
  },
  {
    name: 'Hitec City',
    image: '/HYD/Hitec City.jpg',
    description: 'The IT hub of India showcasing modern infrastructure and innovation',
    type: 'Modern',
    color: 'from-blue-500/20',
  },
  {
    name: 'Hussain Sagar',
    image: '/HYD/Hussian.png',
    description: 'Heart-shaped lake with iconic Buddha statue connecting twin cities',
    type: 'Landmark',
    color: 'from-cyan-500/20',
  },
  {
    name: 'Ramoji Film City',
    image: '/HYD/Ramoji.png',
    description: 'World\'s largest film city and a magical entertainment destination',
    type: 'Entertainment',
    color: 'from-purple-500/20',
  },
  {
    name: 'Salar Jung Museum',
    image: '/HYD/Slarjung.png',
    description: 'One of India\'s three National Museums with priceless collections',
    type: 'Cultural',
    color: 'from-amber-500/20',
  },
  {
    name: 'Birla Mandir',
    image: '/HYD/birlamandir.jpg',
    description: 'Magnificent white marble temple atop a hill with serene ambiance',
    type: 'Spiritual',
    color: 'from-pink-500/20',
  },
];

export default function ExploreHyderabad() {
  return (
    <section className="relative bg-black py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0f1419_0%,#000000_100%)]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 right-0 w-[700px] h-[700px] bg-accent/20 rounded-full filter blur-[140px]" />
          <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-brightBlue/20 rounded-full filter blur-[140px]" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Mobile: Static Header */}
        <div className="lg:hidden text-center mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-accent/10 border border-accent/30 mb-6">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="text-accent font-semibold">Discover the City</span>
          </div>
          
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-white">Explore </span>
            <span className="bg-gradient-to-r from-accent via-orange-400 to-accent bg-clip-text text-transparent">
              Hyderabad
            </span>
          </h2>
          
          <p className="text-white/70 text-base max-w-2xl mx-auto">
            While you&apos;re here for {conferenceConfig.shortName}, discover the rich heritage and vibrant culture of the City of Pearls
          </p>
        </div>

        {/* Desktop: Animated Header */}
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
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-accent/10 border border-accent/30 mb-6"
          >
            <MapPin className="w-4 h-4 text-accent" />
            <span className="text-accent font-semibold">Discover the City</span>
          </motion.div>
          
          <h2 className="text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-white">Explore </span>
            <span className="bg-gradient-to-r from-accent via-orange-400 to-accent bg-clip-text text-transparent">
              Hyderabad
            </span>
          </h2>
          
          <p className="text-white/70 text-xl max-w-3xl mx-auto">
            While you&apos;re here for {conferenceConfig.shortName}, discover the rich heritage and vibrant culture of the City of Pearls
          </p>
        </motion.div>

        {/* Mobile: Static Masonry Grid */}
        <div className="lg:hidden grid grid-cols-1 gap-6">
          {attractions.map((place, i) => (
            <div
              key={i}
              className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl border border-white/10"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={place.image}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              </div>
              
              <div className="p-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 backdrop-blur-xl border border-accent/30 mb-3">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-accent text-sm font-semibold">{place.type}</span>
                </div>
                
                <h3 className="text-white text-2xl font-bold mb-2">
                  {place.name}
                </h3>
                <p className="text-white/70 text-base leading-relaxed">
                  {place.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Animated Masonry Grid */}
        <div className="hidden lg:grid grid-cols-3 grid-rows-[repeat(4,minmax(250px,1fr))] gap-6">
          {attractions.map((place, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -12, scale: 1.02 }}
              className={`group relative rounded-3xl overflow-hidden bg-gradient-to-br ${place.color} to-transparent backdrop-blur-xl border border-white/10 hover:border-accent/40 transition-all duration-500 cursor-pointer ${
                i === 0 || i === 2 || i === 3 ? 'row-span-2' : ''
              }`}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={place.image}
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                
                {/* Glow Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-accent/0 via-accent/0 to-accent/0 group-hover:from-accent/20 group-hover:via-accent/10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              </div>
              
              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 transform transition-all duration-500">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 backdrop-blur-xl border border-accent/30 mb-3">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-accent text-sm font-semibold">{place.type}</span>
                </div>
                
                <h3 className="text-white text-2xl font-bold mb-2 group-hover:text-accent transition-colors">
                  {place.name}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed group-hover:text-white/90 transition-colors">
                  {place.description}
                </p>

                {/* Decorative Line */}
                <div className="mt-4 h-1 w-12 bg-gradient-to-r from-accent to-transparent rounded-full group-hover:w-full transition-all duration-500" />
              </div>

              {/* Icon Indicator */}
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Fun Fact Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 backdrop-blur-xl"
        >
          <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
            <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-accent" />
            </div>
            <div className="text-center lg:text-left">
              <h4 className="text-white text-lg lg:text-xl font-bold mb-1">
                Plan Your Visit
              </h4>
              <p className="text-white/70 text-sm lg:text-base">
                Most attractions are within 30-45 minutes from the conference venue. Take time to experience the perfect blend of tradition and modernity!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
