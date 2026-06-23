'use client';

import { forwardRef } from 'react';

interface WelcomeSectionProps {
  className?: string;
}

export const WelcomeSection = forwardRef<HTMLDivElement, WelcomeSectionProps>(
  function WelcomeSection({ className = '' }, ref) {
    return (
      <div
        ref={ref}
        className={`welcome-content ${className}`}
        style={{ opacity: 0 }}
      >
        <div className="max-w-2xl">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight"
            style={{ color: '#1a365d' }}
          >
            Welcome to ISCSGCON 2026
          </h2>
          <p
            className="text-base md:text-lg lg:text-xl mb-6 leading-relaxed"
            style={{ color: '#1a365d' }}
          >
            Join us for the 8th International Conference on Stem Cells and Regenerative Medicine. 
            This prestigious event brings together world-renowned researchers, clinicians, and 
            industry leaders to share groundbreaking discoveries and innovations in stem cell science.
          </p>
          <p
            className="text-base md:text-lg lg:text-xl mb-8 leading-relaxed"
            style={{ color: '#1a365d' }}
          >
            Experience two days of inspiring keynotes, cutting-edge research presentations, 
            and networking opportunities with the pioneers shaping the future of regenerative medicine.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 md:p-6">
              <p className="text-2xl md:text-3xl font-bold" style={{ color: '#8e518d' }}>50+</p>
              <p className="text-sm md:text-base" style={{ color: '#1a365d' }}>Expert Speakers</p>
            </div>
            <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 md:p-6">
              <p className="text-2xl md:text-3xl font-bold" style={{ color: '#8e518d' }}>1000+</p>
              <p className="text-sm md:text-base" style={{ color: '#1a365d' }}>Attendees Expected</p>
            </div>
            <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 md:p-6">
              <p className="text-2xl md:text-3xl font-bold" style={{ color: '#8e518d' }}>2</p>
              <p className="text-sm md:text-base" style={{ color: '#1a365d' }}>Days of Innovation</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default WelcomeSection;
