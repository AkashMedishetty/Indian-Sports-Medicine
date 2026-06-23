"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from "lucide-react"
import { Navigation } from "../../components/Navigation"
import Link from "next/link"
import { conferenceConfig } from "../../config/conference.config"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    } else if (formData.name.length > 100) {
      errors.name = 'Name must be less than 100 characters'
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.name)) {
      errors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    } else if (formData.email.length > 100) {
      errors.email = 'Email must be less than 100 characters'
    }
    
    // Phone validation (optional but must be valid if provided)
    if (formData.phone.trim() && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number'
    } else if (formData.phone.trim() && formData.phone.length < 10) {
      errors.phone = 'Phone number must be at least 10 digits'
    }
    
    // Subject validation
    if (!formData.subject) {
      errors.subject = 'Please select a subject'
    }
    
    // Message validation
    if (!formData.message.trim()) {
      errors.message = 'Message is required'
    } else if (formData.message.length < 10) {
      errors.message = 'Message must be at least 10 characters'
    } else if (formData.message.length > 1000) {
      errors.message = 'Message must be less than 1000 characters'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')
    setFieldErrors({})

    // Frontend validation
    if (!validateForm()) {
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        setIsSubmitted(true)
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
        setFieldErrors({})
      } else {
        // Handle API validation errors
        if (result.errors && Array.isArray(result.errors)) {
          const apiErrors: Record<string, string> = {}
          result.errors.forEach((error: string) => {
            if (error.includes('name:')) apiErrors.name = error.split(': ')[1]
            else if (error.includes('email:')) apiErrors.email = error.split(': ')[1]
            else if (error.includes('phone:')) apiErrors.phone = error.split(': ')[1]
            else if (error.includes('subject:')) apiErrors.subject = error.split(': ')[1]
            else if (error.includes('message:')) apiErrors.message = error.split(': ')[1]
          })
          setFieldErrors(apiErrors)
        }
        setSubmitError(result.message || 'Failed to send message')
      }
    } catch (error) {
      setSubmitError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Navigation />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center p-8 lg:p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md mx-4"
        >
          <CheckCircle className="w-12 h-12 lg:w-16 lg:h-16 text-green-500 mx-auto mb-4 lg:mb-6" />
          <h2 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3 lg:mb-4">Message Sent Successfully!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4 lg:mb-6 text-sm lg:text-base">Thank you for contacting us. We will get back to you shortly.</p>
          <Button onClick={() => setIsSubmitted(false)} className="bg-conference-primary hover:bg-conference-primary dark:bg-yellow-500 dark:hover:bg-conference-primary">
            Send Another Message
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <div className="pt-20 lg:pt-24 pb-12">
        {/* Header */}
        <section className="py-12 lg:py-16 bg-gradient-to-r from-conference-primary to-blue-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 lg:mb-6">Contact Us</h1>
              <p className="text-lg lg:text-xl max-w-3xl mx-auto">
                Have questions about the conference? Get in touch with our team and we'll be happy to assist you.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8 text-gray-800 dark:text-gray-100">Get In Touch</h2>
                <div className="space-y-6 lg:space-y-8">
                  <div className="flex items-start">
                    <div className="bg-yellow-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
                      <MapPin className="w-6 h-6 text-conference-primary dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Conference Manager</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Ms. Lakhshmi Prabha
                        <br />
                        Conference Manager
                        <br />
                        Hyderabad, Telangana
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-yellow-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
                      <Phone className="w-6 h-6 text-conference-primary dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Phone</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        +91 9052192744
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-yellow-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
                      <Mail className="w-6 h-6 text-conference-primary dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Email</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {conferenceConfig.contact.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-yellow-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
                      <Clock className="w-6 h-6 text-conference-primary dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Working Hours</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Monday - Friday: 9:00 AM - 6:00 PM
                        <br />
                        Available for conference inquiries
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 lg:p-8">
                  <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6 text-gray-800 dark:text-gray-100">Send Us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Name *</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter your full name"
                        className={`dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${fieldErrors.name ? 'border-red-500 dark:border-red-500' : ''}`}
                        required
                      />
                      {fieldErrors.name && (
                        <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="your.email@example.com"
                        className={`dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${fieldErrors.email ? 'border-red-500 dark:border-red-500' : ''}`}
                        required
                      />
                      {fieldErrors.email && (
                        <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+91 9876543210"
                        className={`dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${fieldErrors.phone ? 'border-red-500 dark:border-red-500' : ''}`}
                      />
                      {fieldErrors.phone && (
                        <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject *</label>
                      <Select value={formData.subject} onValueChange={(value) => handleInputChange("subject", value)}>
                        <SelectTrigger className={`dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${fieldErrors.subject ? 'border-red-500 dark:border-red-500' : ''}`}>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                          <SelectItem value="registration" className="dark:text-gray-100 dark:hover:bg-gray-600">Registration Inquiry</SelectItem>
                          <SelectItem value="abstract" className="dark:text-gray-100 dark:hover:bg-gray-600">Abstract Submission</SelectItem>
                          <SelectItem value="accommodation" className="dark:text-gray-100 dark:hover:bg-gray-600">Accommodation</SelectItem>
                          <SelectItem value="program" className="dark:text-gray-100 dark:hover:bg-gray-600">Scientific Program</SelectItem>
                          <SelectItem value="sponsorship" className="dark:text-gray-100 dark:hover:bg-gray-600">Sponsorship & Exhibition</SelectItem>
                          <SelectItem value="other" className="dark:text-gray-100 dark:hover:bg-gray-600">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldErrors.subject && (
                        <p className="text-red-500 text-sm mt-1">{fieldErrors.subject}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message * (minimum 10 characters)</label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        placeholder="Type your message here (at least 10 characters)..."
                        rows={5}
                        className={`dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${fieldErrors.message ? 'border-red-500 dark:border-red-500' : ''}`}
                        required
                      />
                      <div className="flex justify-between items-center mt-1">
                        <div>
                          {fieldErrors.message && (
                            <p className="text-red-500 text-sm">{fieldErrors.message}</p>
                          )}
                        </div>
                        <p className={`text-xs ${formData.message.length < 10 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                          {formData.message.length}/1000 characters
                        </p>
                      </div>
                    </div>
                    {submitError && (
                      <div className="text-red-600 dark:text-red-400 text-sm mb-4">
                        {submitError}
                      </div>
                    )}
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-conference-primary hover:bg-conference-primary dark:bg-yellow-500 dark:hover:bg-conference-primary disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section - Commented out as requested */}
        {/*
        <section className="py-12 md:py-16 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 md:mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 dark:text-white">Frequently Asked Questions</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto text-sm md:text-base">Find answers to common questions about the conference.</p>
            </motion.div>

            <div className="max-w-4xl mx-auto">
              {[
                {
                  question: "What are the registration fees for the conference?",
                  answer:
                    "Registration fees vary depending on your category (regular delegate, student, international delegate, etc.). Early bird registration offers a 50% discount. Please visit the Registration page for detailed fee structure.",
                },
                {
                  question: "Is accommodation included in the registration fee?",
                  answer:
                    "No, accommodation is not included in the registration fee. However, we have partnered with several hotels near the venue to provide special rates for conference delegates.",
                },
                {
                  question: "What is the deadline for abstract submission?",
                  answer:
                    "The deadline for abstract submission is June 30, 2026. Authors will be notified of acceptance by July 15, 2026.",
                },
                {
                  question: "Will there be CME credits for attending the conference?",
                  answer:
                    "Yes, the conference is accredited for CME credits. Certificates will be provided to all registered delegates who attend the sessions.",
                },
                {
                  question: "How can I become a sponsor or exhibitor?",
                  answer:
                    `We offer various sponsorship and exhibition opportunities. Please contact our sponsorship team at ${conferenceConfig.contact.email} for more information.`,
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="mb-6"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-3">{faq.question}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">{faq.answer}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        */}

        {/* Map Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 md:mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 dark:text-white">Find Us</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto text-sm md:text-base">
                The conference will be held at HICC Novotel, Hyderabad, Telangana.
              </p>
            </motion.div>

            <div className="rounded-2xl overflow-hidden shadow-xl h-64 md:h-96 bg-gray-200 dark:bg-gray-700">
              {/* Placeholder for map - in a real implementation, you would use Google Maps or similar */}
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <div className="text-center">
                  <MapPin className="w-10 h-10 md:w-12 md:h-12 text-conference-primary dark:text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-700 dark:text-gray-200 font-semibold text-sm md:text-base">Interactive Map Placeholder</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">HICC Novotel, Hyderabad, Telangana</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-12 md:py-16 bg-gradient-to-r from-conference-primary to-blue-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">Stay Updated</h2>
              <p className="text-lg md:text-xl mb-6 md:mb-8 max-w-2xl mx-auto">
                Subscribe to our newsletter to receive the latest updates about the conference.
              </p>
              <div className="max-w-md mx-auto">
                <form className="flex flex-col sm:flex-row gap-4">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="bg-white text-gray-800 flex-1"
                    required
                  />
                  <Button type="submit" className="bg-white text-conference-primary hover:bg-gray-100 px-6 py-2">
                    Subscribe
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}
