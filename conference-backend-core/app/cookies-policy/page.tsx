"use client"

import { MainLayout } from "../../components/layout/MainLayout"
import { motion } from "framer-motion"
import { Cookie, Settings, Eye, Shield, Trash2, Mail } from "lucide-react"
import { conferenceConfig } from "../../config/conference.config"

export default function CookiesPolicyPage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-yellow-100 p-4 rounded-full">
                <Cookie className="w-12 h-12 text-conference-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-conference-primary to-blue-700 bg-clip-text text-transparent">
              Cookies Policy
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Learn how we use cookies and similar technologies to improve your experience on our website.
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
          >
            <div className="space-y-8">
              {/* Last Updated */}
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <p className="text-sm text-gray-600">
                  <strong>Last Updated:</strong> December 2024
                </p>
              </div>

              {/* What Are Cookies */}
              <section>
                <div className="flex items-center mb-4">
                  <Cookie className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">What Are Cookies?</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Cookies are small text files that are stored on your device when you visit our website. 
                    They help us provide you with a better experience by remembering your preferences and 
                    understanding how you use our site.
                  </p>
                </div>
              </section>

              {/* Types of Cookies */}
              <section>
                <div className="flex items-center mb-4">
                  <Settings className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Types of Cookies We Use</h2>
                </div>
                <div className="space-y-6">
                  {/* Essential Cookies */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Essential Cookies</h3>
                    <p className="text-conference-primary text-sm mb-2">
                      These cookies are necessary for the website to function properly and cannot be disabled.
                    </p>
                    <ul className="list-disc list-inside text-conference-primary text-sm space-y-1">
                      <li>Session management</li>
                      <li>Security features</li>
                      <li>Basic website functionality</li>
                      <li>Form submission handling</li>
                    </ul>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Analytics Cookies</h3>
                    <p className="text-green-700 text-sm mb-2">
                      These cookies help us understand how visitors interact with our website.
                    </p>
                    <ul className="list-disc list-inside text-green-600 text-sm space-y-1">
                      <li>Google Analytics</li>
                      <li>Page view tracking</li>
                      <li>User behavior analysis</li>
                      <li>Performance monitoring</li>
                    </ul>
                  </div>

                  {/* Functional Cookies */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">Functional Cookies</h3>
                    <p className="text-purple-700 text-sm mb-2">
                      These cookies enable enhanced functionality and personalization.
                    </p>
                    <ul className="list-disc list-inside text-conference-accent text-sm space-y-1">
                      <li>Language preferences</li>
                      <li>User interface settings</li>
                      <li>Registration form data</li>
                      <li>Accessibility features</li>
                    </ul>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Marketing Cookies</h3>
                    <p className="text-conference-primary text-sm mb-2">
                      These cookies are used to deliver relevant advertisements and track campaign effectiveness.
                    </p>
                    <ul className="list-disc list-inside text-conference-primary text-sm space-y-1">
                      <li>Social media integration</li>
                      <li>Advertising personalization</li>
                      <li>Campaign tracking</li>
                      <li>Retargeting</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Third-Party Cookies */}
              <section>
                <div className="flex items-center mb-4">
                  <Eye className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Third-Party Cookies</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Our website may contain content from third-party services that may set their own cookies:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Google Analytics:</strong> For website analytics and performance tracking</li>
                    <li><strong>Social Media Platforms:</strong> For social sharing and integration</li>
                    <li><strong>Payment Processors:</strong> For secure payment processing</li>
                    <li><strong>Video Platforms:</strong> For embedded video content</li>
                    <li><strong>Map Services:</strong> For location and venue information</li>
                  </ul>
                </div>
              </section>

              {/* Managing Cookies */}
              <section>
                <div className="flex items-center mb-4">
                  <Settings className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Managing Your Cookie Preferences</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    You can control and manage cookies in several ways:
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Browser Settings</h3>
                    <p className="text-sm mb-2">Most browsers allow you to:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>View and delete cookies</li>
                      <li>Block cookies from specific sites</li>
                      <li>Block third-party cookies</li>
                      <li>Clear all cookies when you close the browser</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Cookie Consent Banner</h3>
                    <p className="text-sm">
                      When you first visit our website, you'll see a cookie consent banner where you can 
                      choose which types of cookies to accept or reject.
                    </p>
                  </div>
                </div>
              </section>

              {/* Impact of Disabling Cookies */}
              <section>
                <div className="flex items-center mb-4">
                  <Trash2 className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Impact of Disabling Cookies</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    If you choose to disable cookies, some features of our website may not function properly:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Registration forms may not save your progress</li>
                    <li>User preferences may not be remembered</li>
                    <li>Some interactive features may be limited</li>
                    <li>Analytics data may be incomplete</li>
                    <li>Social media integration may not work</li>
                  </ul>
                </div>
              </section>

              {/* Data Retention */}
              <section>
                <div className="flex items-center mb-4">
                  <Shield className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Data Retention</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>Different types of cookies are stored for different periods:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                    <li><strong>Persistent Cookies:</strong> Stored for a specific period (usually 1-2 years)</li>
                    <li><strong>Analytics Cookies:</strong> Typically stored for 2 years</li>
                    <li><strong>Marketing Cookies:</strong> Usually stored for 30 days to 1 year</li>
                  </ul>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <div className="flex items-center mb-4">
                  <Mail className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Contact Us</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    If you have any questions about our use of cookies, please contact us:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Conference Manager:</strong> {conferenceConfig.organizationName}</p>
                    <p><strong>Email:</strong> {conferenceConfig.contact.email}</p>
                    <p><strong>Phone:</strong> {conferenceConfig.contact.phone}</p>
                  </div>
                </div>
              </section>

              {/* Updates to Policy */}
              <section className="bg-yellow-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Updates to This Policy</h2>
                <p className="text-gray-600">
                  We may update this Cookies Policy from time to time to reflect changes in our practices 
                  or for other operational, legal, or regulatory reasons. Please check this page periodically 
                  for updates.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
}