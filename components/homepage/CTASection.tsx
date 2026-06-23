'use client';

import Link from 'next/link';
import { conferenceConfig } from '@/config/conference.config';

export function CTASection() {
  const config = conferenceConfig;
  
  // Format date
  const startDate = new Date(config.eventDate.start);
  const endDate = new Date(config.eventDate.end);
  const dateStr = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  return (
    <section
      className="relative w-full flex-[2] flex items-center justify-center py-12 md:py-16 lg:py-20 overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${config.theme.light} 0%, ${config.theme.secondary}20 50%, ${config.theme.light} 100%)` }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] opacity-30"
          style={{ background: `radial-gradient(circle, ${config.theme.secondary} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-[80px] opacity-20"
          style={{ background: `radial-gradient(circle, ${config.theme.accent} 0%, transparent 70%)` }}
        />
      </div>

      {/* Content - visible immediately */}
      <div className="relative z-10 max-w-4xl lg:max-w-3xl xl:max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
        <p className="text-xs md:text-sm font-medium uppercase tracking-wider mb-3" style={{ color: config.theme.accent }}>
          {dateStr} • {config.venue.city}
        </p>
        
        <h2 className="text-2xl md:text-4xl lg:text-4xl xl:text-5xl font-bold mb-4 md:mb-6 leading-tight" style={{ color: config.theme.primary }}>
          Be Part of the Premier<br />
          <span style={{ color: config.theme.accent }}>Hand & Wrist Surgery Conference</span>
        </h2>
        
        <p className="text-sm md:text-base lg:text-base xl:text-lg mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: `${config.theme.primary}cc` }}>
          {config.tagline}. Connect with leading hand surgeons, researchers, and specialists from across India and beyond.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center mb-8 md:mb-10">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-6 md:px-8 lg:px-6 xl:px-8 py-3 md:py-4 text-sm md:text-base font-semibold rounded-full text-white hover:opacity-90 transition-all hover:scale-105 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${config.theme.accent} 0%, ${config.theme.primary} 100%)` }}
          >
            Register Now
            <svg className="w-4 h-4 md:w-5 md:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          
          <Link
            href="/program-schedule"
            className="inline-flex items-center justify-center px-6 md:px-8 lg:px-6 xl:px-8 py-3 md:py-4 text-sm md:text-base font-semibold rounded-full border-2 hover:opacity-80 transition-all"
            style={{ borderColor: config.theme.primary, color: config.theme.primary }}
          >
            View Program
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 md:gap-10 lg:gap-6 xl:gap-10 max-w-md mx-auto">
          {[
            { value: '80+', label: 'Expert Speakers' },
            { value: '500+', label: 'Delegates' },
            { value: '2', label: 'Days' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-bold" style={{ color: config.theme.accent }}>{stat.value}</p>
              <p className="text-xs md:text-sm" style={{ color: config.theme.primary }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Accommodation Note */}
        <div className="mt-8 md:mt-10 p-4 rounded-xl border max-w-lg mx-auto" style={{ borderColor: `${config.theme.accent}40`, background: `${config.theme.accent}08` }}>
          <p className="text-xs md:text-sm font-medium" style={{ color: config.theme.primary }}>
            🏨 Hotel Accommodation at Novotel HICC — Single ₹10,000 / Sharing ₹7,500 per night (+ GST)
          </p>
          <p className="text-xs mt-1" style={{ color: `${config.theme.primary}99` }}>
            Check-in: 2:00 PM | Check-out: 12:00 PM
          </p>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
