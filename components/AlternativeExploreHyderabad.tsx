'use client';

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import { conferenceConfig } from '@/config/conference.config';

const attractions = [
  {
    name: 'Golconda Fort',
    image: '/HYD/Golconda.png',
    description: 'A 13th-century fortress with stunning acoustics and panoramic city views',
    type: 'Historical',
    color: 'from-[#fdb246]/20',
  },
  {
    name: 'Hitec City',
    image: '/HYD/Hitec City.jpg',
    description: 'The IT hub of India showcasing modern infrastructure and innovation',
    type: 'Modern',
    color: 'from-[#0e192b]/20',
  },
  {
    name: 'Hussain Sagar',
    image: '/HYD/Hussian.png',
    description: 'Heart-shaped lake with iconic Buddha statue connecting twin cities',
    type: 'Landmark',
    color: 'from-[#fdb246]/15',
  },
  {
    name: 'Ramoji Film City',
    image: '/HYD/Ramoji.png',
    description: 'World\'s largest film city and a magical entertainment destination',
    type: 'Entertainment',
    color: 'from-[#0e192b]/15',
  },
  {
    name: 'Salar Jung Museum',
    image: '/HYD/Slarjung.png',
    description: 'One of India\'s three National Museums with priceless collections',
    type: 'Cultural',
    color: 'from-[#fdb246]/25',
  },
  {
    name: 'Birla Mandir',
    image: '/HYD/birlamandir.jpg',
    description: 'Magnificent white marble temple atop a hill with serene ambiance',
    type: 'Spiritual',
    color: 'from-[#0e192b]/20',
  },
];

export default function AlternativeExploreHyderabad() {
  return (
    <section className="relative bg-[#f5f0eb] py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 right-0 w-[700px] h-[700px] bg-[#fdb246]/20 rounded-full filter blur-[140px]" />
          <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-[#0e192b]/10 rounded-full filter blur-[140px]" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Mobile: Static Header */}
        <div className="lg:hidden text-center mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#fdb246]/10 border border-[#fdb246]/30 mb-6">
            <MapPin className="w-4 h-4 text-[#fdb246]" />
            <span className="text-[#0e192b] font-semibold">Discover the City</span>
          </div>
          
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-[#0e192b]">Explore </span>
            <span className="text-[#fdb246]">
              Hyderabad
            </span>
          </h2>
          
          <p className="text-[#0e192b]/70 text-base max-w-2xl mx-auto">
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
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#fdb246]/10 border border-[#fdb246]/30 mb-6"
          >
            <MapPin className="w-4 h-4 text-[#fdb246]" />
            <span className="text-[#0e192b] font-semibold">Discover the City</span>
          </motion.div>
          
          <h2 className="text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-[#0e192b]">Explore </span>
            <span className="text-[#fdb246]">
              Hyderabad
            </span>
          </h2>
          
          <p className="text-[#0e192b]/70 text-xl max-w-3xl mx-auto leading-relaxed">
            While you&apos;re here for {conferenceConfig.shortName}, discover the rich heritage and vibrant culture of the City of Pearls
          </p>
        </motion.div>

        {/* Mobile: Static Attraction Grid */}
        <div className="lg:hidden grid grid-cols-2 gap-4">
          {attractions.map((attraction, i) => (
            <div
              key={i}
              className="group relative rounded-2xl overflow-hidden bg-white border border-[#0e192b]/10 shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={attraction.image}
                  alt={attraction.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${attraction.color} to-transparent`} />
              </div>
              
              <div className="p-4">
                <div className="text-xs font-semibold text-[#fdb246] mb-1 uppercase tracking-wide">
                  {attraction.type}
                </div>
                <h3 className="text-[#0e192b] font-bold text-sm mb-1">{attraction.name}</h3>
                <p className="text-[#0e192b]/60 text-xs line-clamp-2">{attraction.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Animated Attraction Grid */}
        <div className="hidden lg:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {attractions.map((attraction, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative rounded-3xl overflow-hidden bg-white border border-[#0e192b]/10 hover:border-[#fdb246]/50 transition-all duration-300 shadow-lg"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={attraction.image}
                  alt={attraction.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${attraction.color} to-transparent`} />
                
                {/* Type Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-[#0e192b]/10">
                  <span className="text-[#0e192b] text-xs font-semibold uppercase tracking-wide">
                    {attraction.type}
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <h3 className="text-[#0e192b] text-xl font-bold mb-2 group-hover:text-[#fdb246] transition-colors">
                  {attraction.name}
                </h3>
                <p className="text-[#0e192b]/70 text-sm leading-relaxed">
                  {attraction.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
