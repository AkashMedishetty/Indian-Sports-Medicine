"use client"

import { Navigation } from "../../components/Navigation"
import { conferenceConfig } from "../../config/conference.config"

export default function SpeakersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero section with gradient background */}
      <section
        className="relative flex items-center justify-center px-4 py-24 sm:py-32 md:py-40 lg:py-48"
        style={{
          background: `linear-gradient(135deg, ${conferenceConfig.theme.primary} 0%, ${conferenceConfig.theme.accent} 100%)`,
        }}
      >
        <div className="text-center max-w-3xl mx-auto">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
            style={{ color: "#ebc975" }}
          >
            Coming Soon
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-4">
            Our distinguished speakers for {conferenceConfig.name} will be announced shortly.
          </p>
          <p className="text-sm sm:text-base text-white/70">
            Stay tuned for updates on our lineup of experts in hand and wrist surgery.
          </p>
        </div>
      </section>
    </div>
  )
}
