"use client"

import { motion } from "framer-motion"
import { Navigation } from "../../components/Navigation"
import { conferenceConfig } from "../../config/conference.config"
import { Calendar, MapPin, Users, Award } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              About {conferenceConfig.shortName}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {conferenceConfig.name}
            </p>
          </div>

          {/* Conference Info Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Calendar className="w-10 h-10 text-conference-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2">Dates</h3>
              <p className="text-gray-600">
                {new Date(conferenceConfig.eventDate.start).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric' 
                })} - {new Date(conferenceConfig.eventDate.end).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <MapPin className="w-10 h-10 text-conference-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2">Venue</h3>
              <p className="text-gray-600">
                {conferenceConfig.venue.name}, {conferenceConfig.venue.city}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <Users className="w-10 h-10 text-conference-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2">Organization</h3>
              <p className="text-gray-600">{conferenceConfig.organizationName}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <Award className="w-10 h-10 text-conference-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2">Theme</h3>
              <p className="text-gray-600">{conferenceConfig.tagline}</p>
            </div>
          </div>

          {/* About Content */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">About the Conference</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 mb-4">
                The {conferenceConfig.name} ({conferenceConfig.shortName}) is a premier gathering 
                of neurovascular specialists, researchers, and healthcare professionals dedicated to 
                advancing the field of cerebrovascular medicine.
              </p>
              <p className="text-gray-700 mb-4">
                This year's conference brings together leading experts from around the world to share 
                cutting-edge research, innovative treatment approaches, and best practices in the 
                management of cerebrovascular diseases.
              </p>
              <p className="text-gray-700 mb-4">
                Join us for three days of inspiring keynote presentations, interactive workshops, 
                poster sessions, and networking opportunities with colleagues from across the globe.
              </p>
            </div>
          </div>

          {/* Objectives */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Conference Objectives</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-conference-primary text-white flex items-center justify-center mr-3 mt-1">
                  1
                </span>
                <p className="text-gray-700">
                  Promote excellence in cerebrovascular care through knowledge sharing and collaboration
                </p>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-conference-primary text-white flex items-center justify-center mr-3 mt-1">
                  2
                </span>
                <p className="text-gray-700">
                  Showcase the latest research and innovations in neurovascular medicine
                </p>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-conference-primary text-white flex items-center justify-center mr-3 mt-1">
                  3
                </span>
                <p className="text-gray-700">
                  Provide hands-on training and skill development opportunities
                </p>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-conference-primary text-white flex items-center justify-center mr-3 mt-1">
                  4
                </span>
                <p className="text-gray-700">
                  Foster networking and collaboration among healthcare professionals
                </p>
              </li>
            </ul>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
