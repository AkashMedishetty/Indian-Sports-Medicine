"use client"

import { MainLayout } from "../../components/layout/MainLayout"
import { motion } from "framer-motion"
import { Shield, Eye, Lock, Users, FileText, Mail } from "lucide-react"
import { conferenceConfig } from "../../config/conference.config"

export default function PrivacyPolicyPage() {
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
                <Shield className="w-12 h-12 text-conference-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-conference-primary to-blue-700 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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

              {/* Information We Collect */}
              <section>
                <div className="flex items-center mb-4">
                  <Eye className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Information We Collect</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    We collect information you provide directly to us, such as when you register for the conference, 
                    submit abstracts, or contact us:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Personal information (name, email address, phone number)</li>
                    <li>Professional information (institution, specialty, credentials)</li>
                    <li>Registration and payment information</li>
                    <li>Abstract submissions and research data</li>
                    <li>Communication preferences</li>
                  </ul>
                </div>
              </section>

              {/* How We Use Information */}
              <section>
                <div className="flex items-center mb-4">
                  <Users className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">How We Use Your Information</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Process your conference registration and payments</li>
                    <li>Communicate with you about the conference</li>
                    <li>Review and manage abstract submissions</li>
                    <li>Provide customer support and respond to inquiries</li>
                    <li>Send you conference updates and relevant information</li>
                    <li>Improve our services and conference experience</li>
                  </ul>
                </div>
              </section>

              {/* Information Sharing */}
              <section>
                <div className="flex items-center mb-4">
                  <Lock className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Information Sharing</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    We do not sell, trade, or otherwise transfer your personal information to third parties without 
                    your consent, except in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>With service providers who assist us in operating the conference</li>
                    <li>When required by law or to protect our rights</li>
                    <li>With your explicit consent for specific purposes</li>
                    <li>In anonymized form for research and statistical purposes</li>
                  </ul>
                </div>
              </section>

              {/* Data Security */}
              <section>
                <div className="flex items-center mb-4">
                  <Shield className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Data Security</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    We implement appropriate security measures to protect your personal information against 
                    unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
                    over the internet is 100% secure.
                  </p>
                </div>
              </section>

              {/* Your Rights */}
              <section>
                <div className="flex items-center mb-4">
                  <FileText className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Your Rights</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>You have the right to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Access and update your personal information</li>
                    <li>Request deletion of your personal data</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Request a copy of your data</li>
                    <li>Lodge a complaint with relevant authorities</li>
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
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Conference Manager:</strong> {conferenceConfig.organizationName}</p>
                    <p><strong>Email:</strong> {conferenceConfig.contact.email}</p>
                    <p><strong>Phone:</strong> {conferenceConfig.contact.phone}</p>
                  </div>
                </div>
              </section>

              {/* Changes to Policy */}
              <section className="bg-yellow-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Changes to This Policy</h2>
                <p className="text-gray-600">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by 
                  posting the new Privacy Policy on this page and updating the "Last Updated" date.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
}