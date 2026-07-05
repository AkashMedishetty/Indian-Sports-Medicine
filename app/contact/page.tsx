"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Input } from "@/conference-backend-core/components/ui/input"
import { Textarea } from "@/conference-backend-core/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/conference-backend-core/components/ui/select"
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from "lucide-react"
import { Navigation } from "@/conference-backend-core/components/Navigation"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"
import { SmoothScroll } from "@/components/concepts/premium/SmoothScroll"
import { Footer } from "@/components/concepts/premium/Sections"
import { ismc } from "@/lib/ismc/content"

const fieldClass =
  "border-[var(--p-border)] bg-[var(--p-surface)] text-[var(--p-text)] placeholder:text-[var(--p-text-faint)] focus-visible:ring-[var(--p-accent)]"

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    } else if (formData.name.length > 100) {
      errors.name = 'Name must be less than 100 characters'
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.name)) {
      errors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    } else if (formData.email.length > 100) {
      errors.email = 'Email must be less than 100 characters'
    }
    if (formData.phone.trim() && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number'
    } else if (formData.phone.trim() && formData.phone.length < 10) {
      errors.phone = 'Phone number must be at least 10 digits'
    }
    if (!formData.subject) {
      errors.subject = 'Please select a subject'
    }
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
    if (!validateForm()) {
      setIsSubmitting(false)
      return
    }
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await response.json()
      if (result.success) {
        setIsSubmitted(true)
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
        setFieldErrors({})
      } else {
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
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const infoItems = [
    {
      icon: MapPin,
      title: 'Venue',
      lines: [conferenceConfig.venue.name, `${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}`, conferenceConfig.venue.country],
    },
    { icon: Phone, title: 'Phone', lines: [conferenceConfig.contact.phone] },
    {
      icon: Mail,
      title: 'Email',
      lines: [conferenceConfig.contact.email, conferenceConfig.contact.supportEmail ? `Support: ${conferenceConfig.contact.supportEmail}` : ''].filter(Boolean),
    },
    { icon: Clock, title: 'Working hours', lines: ['Monday – Friday: 9:00 AM – 6:00 PM', 'Available for conference inquiries'] },
  ]

  return (
    <main className="ismc-body p-page relative min-h-screen overflow-x-hidden">
      <SmoothScroll />
      <Navigation />

      {/* Page header */}
      <header className="p-page relative overflow-hidden">
        <div className="p-hero-mesh pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 pb-6 pt-20 sm:pt-28 lg:px-10">
          <p className="p-fade-up ismc-mono mb-6 text-[11px] uppercase tracking-[0.3em] text-[var(--p-accent-deep)]">TASMC 2026 · {ismc.venue.label}</p>
          <h1 className="p-fade-up ismc-display text-4xl font-semibold leading-[1.03] tracking-[-0.025em] text-[var(--p-text)] sm:text-6xl" style={{ animationDelay: '0.08s' }}>
            Contact us
          </h1>
          <p className="p-fade-up ismc-body mt-6 max-w-2xl text-lg leading-relaxed text-[var(--p-text-muted)]" style={{ animationDelay: '0.16s' }}>
            Questions about registration, abstracts, the programme or sponsorship? Reach the {ismc.name} team and we&apos;ll get back to you.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-24 pt-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Info */}
          <div className="lg:col-span-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {infoItems.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="p-glass flex items-start gap-4 rounded-2xl p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--p-accent) 16%, transparent)' }}>
                      <Icon className="h-5 w-5" style={{ color: 'var(--p-accent-deep)' }} />
                    </span>
                    <div>
                      <h3 className="ismc-display text-base font-semibold text-[var(--p-text)]">{item.title}</h3>
                      {item.lines.map((l, i) => (
                        <p key={i} className="ismc-body text-sm leading-relaxed text-[var(--p-text-muted)]">{l}</p>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            {isSubmitted ? (
              <div className="p-glass flex min-h-[26rem] flex-col items-center justify-center rounded-3xl p-10 text-center">
                <CheckCircle className="mb-5 h-14 w-14" style={{ color: '#16a34a' }} />
                <h2 className="ismc-display text-2xl font-semibold text-[var(--p-text)]">Message sent</h2>
                <p className="ismc-body mt-3 max-w-sm text-[var(--p-text-muted)]">Thank you for contacting us. We&apos;ll get back to you shortly.</p>
                <Button onClick={() => setIsSubmitted(false)} className="mt-6 rounded-full px-6 font-semibold" style={{ background: 'var(--p-accent)', color: '#0a1e40' }}>
                  Send another message
                </Button>
              </div>
            ) : (
              <div className="p-glass rounded-3xl p-6 sm:p-8">
                <h2 className="ismc-display text-xl font-semibold text-[var(--p-text)] sm:text-2xl">Send us a message</h2>
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div>
                    <label className="ismc-body mb-2 block text-sm font-medium text-[var(--p-text)]">Your name *</label>
                    <Input value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Enter your full name" className={`${fieldClass} ${fieldErrors.name ? 'border-red-500' : ''}`} required />
                    {fieldErrors.name && <p className="mt-1 text-sm text-red-500">{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <label className="ismc-body mb-2 block text-sm font-medium text-[var(--p-text)]">Email address *</label>
                    <Input type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} placeholder="your.email@example.com" className={`${fieldClass} ${fieldErrors.email ? 'border-red-500' : ''}`} required />
                    {fieldErrors.email && <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>}
                  </div>
                  <div>
                    <label className="ismc-body mb-2 block text-sm font-medium text-[var(--p-text)]">Phone number</label>
                    <Input type="tel" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="+91 9876543210" className={`${fieldClass} ${fieldErrors.phone ? 'border-red-500' : ''}`} />
                    {fieldErrors.phone && <p className="mt-1 text-sm text-red-500">{fieldErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="ismc-body mb-2 block text-sm font-medium text-[var(--p-text)]">Subject *</label>
                    <Select value={formData.subject} onValueChange={(value) => handleInputChange("subject", value)}>
                      <SelectTrigger className={`${fieldClass} ${fieldErrors.subject ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="registration">Registration Inquiry</SelectItem>
                        <SelectItem value="abstract">Abstract Submission</SelectItem>
                        <SelectItem value="accommodation">Accommodation</SelectItem>
                        <SelectItem value="program">Scientific Program</SelectItem>
                        <SelectItem value="sponsorship">Sponsorship &amp; Exhibition</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.subject && <p className="mt-1 text-sm text-red-500">{fieldErrors.subject}</p>}
                  </div>
                  <div>
                    <label className="ismc-body mb-2 block text-sm font-medium text-[var(--p-text)]">Message *</label>
                    <Textarea value={formData.message} onChange={(e) => handleInputChange("message", e.target.value)} placeholder="Type your message here..." rows={5} className={`${fieldClass} ${fieldErrors.message ? 'border-red-500' : ''}`} required />
                    <div className="mt-1 flex items-center justify-between">
                      <span>{fieldErrors.message && <span className="text-sm text-red-500">{fieldErrors.message}</span>}</span>
                      <span className={`text-xs ${formData.message.length < 10 ? 'text-red-500' : 'text-[var(--p-text-faint)]'}`}>{formData.message.length}/1000</span>
                    </div>
                  </div>
                  {submitError && <div className="text-sm text-red-500">{submitError}</div>}
                  <Button type="submit" disabled={isSubmitting} className="w-full rounded-full font-semibold disabled:opacity-50" style={{ background: 'var(--p-accent)', color: '#0a1e40' }}>
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Sending...' : 'Send message'}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
