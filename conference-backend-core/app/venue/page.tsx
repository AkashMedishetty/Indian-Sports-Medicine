"use client"

import { motion } from "framer-motion"
import { MapPin, Building2, Car, Hotel, Globe } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Navigation } from "../../components/Navigation"
import { conferenceConfig } from "../../config/conference.config"

export default function VenuePage() {
  const { venue, shortName, name } = conferenceConfig

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <div className="pt-20 pb-8 lg:pt-24 lg:pb-12">
        {/* Hero Section */}
        <section className="relative h-[50vh] lg:h-[60vh] overflow-hidden bg-gradient-to-r from-gray-800 to-gray-900">
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white px-4"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 lg:mb-6">Conference Venue</h1>
              
              <div className="mb-6">
                <p className="text-base md:text-lg lg:text-xl max-w-3xl mx-auto mb-6">
                  Join us at the prestigious {venue.name} for {shortName}.
                  <br />
                  <span className="text-yellow-200">A premier institution in the heart of {venue.city}, {venue.state}</span>
                </p>
              </div>

              <div className="flex justify-center mb-6">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700 text-white rounded-full shadow-2xl font-bold"
                    onClick={() => { if (typeof window !== 'undefined') { window.location.assign('/register') } }}
                  >
                    Register Now
                  </Button>
                </motion.div>
              </div>

              <div className="flex items-center justify-center space-x-2 text-sm md:text-base lg:text-lg">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                <span>{venue.city}, {venue.state}</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Venue Details Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 via-green-600 to-blue-600 bg-clip-text text-transparent">
                {venue.name}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                A prestigious venue with state-of-the-art facilities for {name}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Venue Information */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Location</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {venue.name}<br />
                        {venue.address && <>{venue.address}<br /></>}
                        {venue.city}, {venue.state} {venue.pincode && venue.pincode}<br />
                        {venue.country}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Hotel className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Facilities</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        • Large Auditorium (500+ capacity)<br />
                        • Multiple Breakout Rooms<br />
                        • Exhibition Hall<br />
                        • Modern AV Equipment<br />
                        • Wi-Fi & Technical Support
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Car className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Accessibility</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {conferenceConfig.venue.accessibility?.map((item, index) => (
                          <span key={index}>• {item}<br /></span>
                        )) || (
                          <>
                            • Easy access from major transportation hubs<br />
                            • Ample parking available<br />
                            • Wheelchair accessible
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Interactive Google Map */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">Interactive Map</h3>
                  
                  {/* Google Maps Embed */}
                  <div className="w-full h-80 rounded-xl overflow-hidden mb-4">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.1234567890123!2d78.12345678901234!3d15.12345678901234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTXCsDA3JzM0LjQiTiA3OMKwMDcnMzQuNCJF!5e0!3m2!1sen!2sin!4v1234567890123"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`${venue.name} Location`}
                    ></iframe>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(`${venue.name} ${venue.city} ${venue.state} ${venue.country}`)}`, '_blank')}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      View on Google Maps
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                      onClick={() => window.open(`https://maps.google.com/directions?daddr=${encodeURIComponent(`${venue.name} ${venue.city} ${venue.state} ${venue.country}`)}`, '_blank')}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Get Directions
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Accommodation Section */}
        <section className="py-16 bg-blue-50 dark:bg-gray-800/50">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                Hotel Accommodation
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Stay at Novotel HICC, Hyderabad — the conference venue hotel
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-blue-100 dark:border-gray-700"
                >
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Single Room</h3>
                  <p className="text-3xl font-bold text-blue-600 mb-1">₹10,000 <span className="text-sm font-normal text-gray-500">/ night</span></p>
                  <p className="text-sm text-gray-500">+ 18% GST</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-blue-100 dark:border-gray-700"
                >
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Sharing Room</h3>
                  <p className="text-3xl font-bold text-blue-600 mb-1">₹7,500 <span className="text-sm font-normal text-gray-500">/ night</span></p>
                  <p className="text-sm text-gray-500">+ 18% GST</p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-blue-100 dark:border-gray-700 text-center"
              >
                <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-gray-700 dark:text-gray-300">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Check-in Time</p>
                    <p className="text-2xl font-bold text-green-600">2:00 PM</p>
                  </div>
                  <div className="hidden sm:block w-px h-10 bg-gray-300 dark:bg-gray-600"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Check-out Time</p>
                    <p className="text-2xl font-bold text-red-500">12:00 PM</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  You can book accommodation during registration. Available dates: April 23 – 27, 2026.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">Ready to Join Us in {venue.city}?</h2>
              <p className="text-lg md:text-xl mb-6 md:mb-8 max-w-2xl mx-auto">
                Register now to secure your spot at {name}.
              </p>
              <a href="/register">
                <Button className="bg-white text-conference-primary hover:bg-yellow-50 hover:text-yellow-800 px-6 md:px-8 py-3 md:py-4 text-base md:text-lg rounded-full font-bold shadow-lg border-2 border-white">
                  Register Now
                </Button>
              </a>
            </motion.div>
          </div>
        </section>

      </div>
    </div>
  )
}
