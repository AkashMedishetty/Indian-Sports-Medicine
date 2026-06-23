'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock, Utensils, ShoppingBag, Camera, Building2, Plane, Car, Train } from 'lucide-react';
import { Navigation } from '@/conference-backend-core/components/Navigation';

const hiccImages = [
  { src: '/HYD/Novotel-Hyderabad-Convention-Centre.jpg', alt: 'HICC Novotel Convention Center' },
];

const attractions = [
  {
    name: 'Charminar',
    description: 'Iconic 16th-century monument and mosque, symbol of Hyderabad',
    image: '/HYD/charminar.jpg',
    category: 'Heritage',
  },
  {
    name: 'Golconda Fort',
    description: 'Historic fortress with acoustic architecture and panoramic views',
    image: '/HYD/Golconda.png',
    category: 'Heritage',
  },
  {
    name: 'Hussain Sagar',
    description: 'Heart-shaped lake with Buddha statue, boating & lakeside promenade',
    image: '/HYD/Hussian.png',
    category: 'Nature',
  },
  {
    name: 'Ramoji Film City',
    description: "World's largest integrated film studio complex & entertainment destination",
    image: '/HYD/Ramoji.png',
    category: 'Entertainment',
  },
  {
    name: 'Salar Jung Museum',
    description: 'One of the largest one-man collections of antiques in the world',
    image: '/HYD/Slarjung.png',
    category: 'Museum',
  },
  {
    name: 'Birla Mandir',
    description: 'Beautiful white marble temple on Naubath Pahad hill',
    image: '/HYD/birlamandir.jpg',
    category: 'Spiritual',
  },
];

const foodItems = [
  { name: 'Hyderabadi Biryani', description: 'World-famous aromatic rice dish with tender meat', icon: '🍚' },
  { name: 'Haleem', description: 'Rich slow-cooked meat stew, especially during Ramadan', icon: '🥘' },
  { name: 'Irani Chai & Osmania Biscuits', description: 'Iconic tea-time combo at heritage cafes', icon: '☕' },
  { name: 'Double Ka Meetha', description: 'Traditional bread pudding dessert', icon: '🍮' },
  { name: 'Mirchi Ka Salan', description: 'Spicy peanut-sesame curry with green chilies', icon: '🌶️' },
  { name: 'Qubani Ka Meetha', description: 'Apricot dessert topped with cream', icon: '🍑' },
];

const shoppingSpots = [
  { name: 'Laad Bazaar', description: 'Famous for bangles, pearls & traditional jewelry', icon: '💎' },
  { name: 'Charminar Market', description: 'Perfumes, ittar, and traditional wear', icon: '🛍️' },
  { name: 'Shilparamam', description: 'Arts & crafts village with handloom products', icon: '🎨' },
  { name: 'Inorbit Mall', description: 'Modern shopping with international brands', icon: '🏬' },
];

export default function VenuePage() {
  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#25406b] via-[#25406b]/90 to-[#852016]" />
        <div className="absolute inset-0 bg-[url('/HYD/Hitec City.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[#ebc975] text-sm md:text-base uppercase tracking-[0.3em] mb-4">
              12th ISSH Midterm CME 2026
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
              Conference Venue
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-2">
              HICC Novotel, Hyderabad
            </p>
            <p className="text-lg text-[#ebc975]">
              April 25-26, 2026
            </p>
            <div className="flex items-center justify-center gap-2 mt-6 text-white/80">
              <MapPin className="w-5 h-5" />
              <span>Hyderabad, Telangana, India</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HICC Venue Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-[#25406b] mb-4">
              HICC - Novotel Convention Centre
            </h2>
            <p className="text-lg text-[#25406b]/70 max-w-3xl mx-auto">
              One of India's premier convention centers, offering world-class facilities for conferences and events
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Venue Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-2xl"
            >
              <Image
                src="/HYD/Novotel-Hyderabad-Convention-Centre.jpg"
                alt="HICC Novotel"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#25406b]/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-xl font-bold">HICC Novotel</p>
                <p className="text-sm opacity-80">HITEC City, Hyderabad</p>
              </div>
            </motion.div>

            {/* Venue Details */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#852016] rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#25406b] mb-1">Address</h3>
                    <p className="text-[#25406b]/70">
                      HICC-Novotel, HITEC City<br />
                      Madhapur, Hyderabad<br />
                      Telangana 500081, India
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#852016] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#25406b] mb-1">Facilities</h3>
                    <ul className="text-[#25406b]/70 space-y-1">
                      <li>• Large Convention Hall (1000+ capacity)</li>
                      <li>• Multiple Breakout Rooms</li>
                      <li>• State-of-the-art AV Equipment</li>
                      <li>• On-site Accommodation</li>
                      <li>• Fine Dining Restaurants</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-lg text-center">
                  <Plane className="w-6 h-6 text-[#852016] mx-auto mb-2" />
                  <p className="text-xs text-[#25406b]/70">Airport</p>
                  <p className="text-sm font-bold text-[#25406b]">30 min</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-lg text-center">
                  <Train className="w-6 h-6 text-[#852016] mx-auto mb-2" />
                  <p className="text-xs text-[#25406b]/70">Railway</p>
                  <p className="text-sm font-bold text-[#25406b]">25 min</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-lg text-center">
                  <Car className="w-6 h-6 text-[#852016] mx-auto mb-2" />
                  <p className="text-xs text-[#25406b]/70">City Center</p>
                  <p className="text-sm font-bold text-[#25406b]">20 min</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Google Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <div className="bg-white rounded-2xl p-4 shadow-xl">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.3025889584!2d78.3714!3d17.4435!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93dc8c5d69df%3A0x19688beb557fa0ee!2sHICC%20-%20Hyderabad%20International%20Convention%20Centre!5e0!3m2!1sen!2sin!4v1234567890"
                width="100%"
                height="400"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="HICC Location"
              />
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <a
                  href="https://maps.google.com/?q=HICC+Hyderabad+International+Convention+Centre"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#25406b] text-white py-3 px-6 rounded-xl font-semibold text-center hover:bg-[#25406b]/90 transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" />
                  View on Google Maps
                </a>
                <a
                  href="https://maps.google.com/directions?daddr=HICC+Hyderabad+International+Convention+Centre"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 border-2 border-[#25406b] text-[#25406b] py-3 px-6 rounded-xl font-semibold text-center hover:bg-[#25406b]/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Car className="w-5 h-5" />
                  Get Directions
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Hyderabad */}
      <section className="py-16 md:py-24 px-4 bg-[#25406b]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-[#ebc975] text-sm uppercase tracking-[0.2em] mb-2">Discover</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              The City of Pearls
            </h2>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Hyderabad, the capital of Telangana, is a vibrant blend of rich history, 
              modern technology, and warm hospitality. Known for its iconic monuments, 
              delectable cuisine, and thriving IT industry.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center"
            >
              <div className="text-4xl mb-3">🏛️</div>
              <h3 className="text-xl font-bold text-white mb-2">400+ Years of History</h3>
              <p className="text-white/70 text-sm">Founded in 1591, rich in Nizami heritage and culture</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center"
            >
              <div className="text-4xl mb-3">💻</div>
              <h3 className="text-xl font-bold text-white mb-2">IT Hub of India</h3>
              <p className="text-white/70 text-sm">Home to major tech companies and Cyberabad</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center"
            >
              <div className="text-4xl mb-3">🍽️</div>
              <h3 className="text-xl font-bold text-white mb-2">Culinary Paradise</h3>
              <p className="text-white/70 text-sm">World-famous Biryani and authentic Nizami cuisine</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Places to Visit */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Camera className="w-5 h-5 text-[#852016]" />
              <p className="text-[#852016] text-sm uppercase tracking-[0.2em]">Explore</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[#25406b] mb-4">
              Places to Visit
            </h2>
            <p className="text-lg text-[#25406b]/70">
              Don't miss these iconic attractions during your stay
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attractions.map((place, index) => (
              <motion.div
                key={place.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={place.image}
                    alt={place.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-[#852016] text-white text-xs px-3 py-1 rounded-full">
                    {place.category}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-[#25406b] mb-2">{place.name}</h3>
                  <p className="text-[#25406b]/70 text-sm">{place.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Things to Eat */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-[#852016] to-[#5a1510]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Utensils className="w-5 h-5 text-[#ebc975]" />
              <p className="text-[#ebc975] text-sm uppercase tracking-[0.2em]">Taste</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Must-Try Hyderabadi Food
            </h2>
            <p className="text-lg text-white/70">
              Indulge in the legendary flavors of Hyderabad
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {foodItems.map((food, index) => (
              <motion.div
                key={food.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-colors"
              >
                <div className="text-4xl mb-3">{food.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{food.name}</h3>
                <p className="text-white/70 text-sm">{food.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Shopping */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShoppingBag className="w-5 h-5 text-[#852016]" />
              <p className="text-[#852016] text-sm uppercase tracking-[0.2em]">Shop</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[#25406b] mb-4">
              Shopping in Hyderabad
            </h2>
            <p className="text-lg text-[#25406b]/70">
              From traditional bazaars to modern malls
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shoppingSpots.map((spot, index) => (
              <motion.div
                key={spot.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center"
              >
                <div className="text-4xl mb-3">{spot.icon}</div>
                <h3 className="text-lg font-bold text-[#25406b] mb-2">{spot.name}</h3>
                <p className="text-[#25406b]/70 text-sm">{spot.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 bg-[#25406b]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Ready to Join Us in Hyderabad?
            </h2>
            <p className="text-lg text-white/70 mb-8">
              Register now to secure your spot at the 12th ISSH Midterm CME 2026
            </p>
            <a
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#852016] text-white text-lg font-bold rounded-full hover:bg-[#6a1912] transition-colors shadow-lg"
            >
              Register Now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
