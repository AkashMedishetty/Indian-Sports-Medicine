"use client"

import { MainLayout } from "../../components/layout/MainLayout"
import { motion } from "framer-motion"
import { FileText, Users, CreditCard, AlertTriangle, Scale, Mail } from "lucide-react"
import { conferenceConfig } from "../../config/conference.config"

export default function TermsConditionsPage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-50 py-20">
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
                <Scale className="w-12 h-12 text-conference-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-conference-primary to-gray-900 bg-clip-text text-transparent">
              Terms & Conditions
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Please read these terms and conditions carefully before registering for the ${conferenceConfig.shortName} Conference.
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
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-conference-primary">
                <p className="text-sm text-gray-600">
                  <strong>Last Updated:</strong> December 2024
                </p>
              </div>

              {/* Acceptance of Terms */}
              <section>
                <div className="flex items-center mb-4">
                  <FileText className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Acceptance of Terms</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    By registering for the ${conferenceConfig.shortName} Conference, you agree to be bound by these Terms and Conditions. 
                    If you do not agree to these terms, please do not register for the conference.
                  </p>
                </div>
              </section>

              {/* Registration and Payment */}
              <section>
                <div className="flex items-center mb-4">
                  <CreditCard className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Registration and Payment</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Registration is confirmed only upon receipt of full payment</li>
                    <li>All fees are quoted in Indian Rupees (INR) unless otherwise specified</li>
                    <li>Payment can be made through approved payment methods only</li>
                    <li>Registration fees are non-transferable between individuals</li>
                    <li>Group discounts may be available for institutional registrations</li>
                    <li>Student registrations require valid student ID verification</li>
                  </ul>
                </div>
              </section>

              {/* Cancellation and Refund Policy */}
              <section>
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Cancellation and Refund Policy</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>Cancellation requests must be submitted in writing to the conference organizers:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>90+ days before conference:</strong> 90% refund (10% processing fee)</li>
                    <li><strong>60-89 days before conference:</strong> 75% refund</li>
                    <li><strong>30-59 days before conference:</strong> 50% refund</li>
                    <li><strong>Less than 30 days:</strong> No refund</li>
                    <li><strong>No-shows:</strong> No refund</li>
                  </ul>
                  <p className="mt-4">
                    Refunds will be processed within 30 business days of approval and will be credited to the original payment method.
                  </p>
                </div>
              </section>

              {/* Conference Changes */}
              <section>
                <div className="flex items-center mb-4">
                  <Users className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Conference Changes and Cancellation</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    The organizers reserve the right to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Modify the conference program, speakers, or schedule</li>
                    <li>Change the venue if necessary</li>
                    <li>Cancel the conference due to circumstances beyond our control</li>
                    <li>Limit the number of attendees</li>
                  </ul>
                  <p className="mt-4">
                    In case of conference cancellation by organizers, full refunds will be provided. 
                    The organizers are not liable for any additional costs incurred by attendees.
                  </p>
                </div>
              </section>

              {/* Code of Conduct */}
              <section>
                <div className="flex items-center mb-4">
                  <Users className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Code of Conduct</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>All attendees are expected to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Maintain professional behavior at all times</li>
                    <li>Respect fellow attendees, speakers, and staff</li>
                    <li>Follow all venue rules and regulations</li>
                    <li>Not engage in any form of harassment or discrimination</li>
                    <li>Respect intellectual property rights</li>
                    <li>Not record sessions without explicit permission</li>
                  </ul>
                  <p className="mt-4">
                    Violation of the code of conduct may result in removal from the conference without refund.
                  </p>
                </div>
              </section>

              {/* Intellectual Property */}
              <section>
                <div className="flex items-center mb-4">
                  <FileText className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Intellectual Property</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All conference materials are protected by copyright</li>
                    <li>Attendees may not reproduce or distribute conference materials without permission</li>
                    <li>Abstract submissions remain the property of the authors</li>
                    <li>The conference organizers may use submitted abstracts for conference proceedings</li>
                    <li>Photography and videography may occur during the event for promotional purposes</li>
                  </ul>
                </div>
              </section>

              {/* Liability Limitation */}
              <section>
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Limitation of Liability</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    The conference organizers, sponsors, and venue are not liable for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Personal injury or property damage</li>
                    <li>Loss or theft of personal belongings</li>
                    <li>Travel delays or cancellations</li>
                    <li>Accommodation issues</li>
                    <li>Force majeure events</li>
                  </ul>
                  <p className="mt-4">
                    Attendees are advised to obtain appropriate travel and health insurance.
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <div className="flex items-center mb-4">
                  <Mail className="w-6 h-6 text-conference-primary mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Contact Information</h2>
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    For questions regarding these terms and conditions, please contact:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Conference Manager:</strong> {conferenceConfig.organizationName}</p>
                    <p><strong>Email:</strong> {conferenceConfig.contact.email}</p>
                    <p><strong>Phone:</strong> {conferenceConfig.contact.phone}</p>
                  </div>
                </div>
              </section>

              {/* Governing Law */}
              <section className="bg-yellow-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Governing Law</h2>
                <p className="text-gray-600">
                  These terms and conditions are governed by the laws of India. Any disputes arising from 
                  these terms will be subject to the jurisdiction of the courts in {conferenceConfig.venue.city}, {conferenceConfig.venue.state}.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
}