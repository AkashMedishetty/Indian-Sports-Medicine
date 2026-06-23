'use client';

import { Sparkles, Award, Users, BookOpen, Stethoscope, HandMetal } from 'lucide-react';

export function WelcomeContent() {
  return (
    <div className="w-full md:ml-auto md:max-w-xl lg:max-w-2xl lg:mr-12">
      {/* Mobile: Add top padding for point cloud space */}
      <div className="pt-8 md:pt-0">
        {/* Decorative badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#852016]/10 to-[#ebc975]/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4 border border-[#ebc975]/30">
          <Sparkles className="w-4 h-4 text-[#ebc975]" />
          <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.15em] text-[#852016]">
            Dear Esteemed Colleagues
          </p>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 leading-tight">
          <span className="text-[#25406b]">Welcome to</span>
          <br />
          <span className="bg-gradient-to-r from-[#25406b] via-[#852016] to-[#25406b] bg-clip-text text-transparent">
            ISSH Midterm CME 2026
          </span>
        </h2>

        {/* Welcome Letter */}
        <div className="relative">
          <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-[#ebc975] via-[#852016] to-[#25406b] rounded-full hidden md:block" />
          
          <div className="space-y-3 md:space-y-4 text-sm sm:text-base md:text-lg text-[#25406b]/80 leading-relaxed md:pl-4">
            <p>
              It is our immense privilege and honor to invite you to the{' '}
              <span className="font-semibold text-[#25406b]">
                12th ISSH Midterm CME Hyderabad 2026
              </span>
              , a landmark gathering that brings together the finest minds in hand surgery from across the nation and beyond.
            </p>
            <p>
              This prestigious conference unites leading hand surgeons, clinicians, researchers, and innovators who are collectively shaping the future of hand surgery and upper extremity care.
            </p>
            <p className="hidden sm:block">
              Our meticulously curated scientific program explores the thought-provoking theme:{' '}
              <span className="font-semibold text-[#852016] italic">
                "Inappropriate, Appropriate and Most Appropriate ways to do Hand Surgery"
              </span>
              — a journey through evidence-based practices, surgical excellence, and clinical wisdom.
            </p>
            <p className="hidden md:block text-[#25406b]/70">
              Join us for two transformative days of knowledge exchange, hands-on workshops, live surgical demonstrations, and networking opportunities that will elevate your practice and inspire innovation.
            </p>
          </div>
        </div>

        {/* Conference Highlights */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-6 md:mt-8">
          <div className="group bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-[#25406b]/10 hover:border-[#ebc975]/50 transition-all hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[#852016]/10">
                <Stethoscope className="w-4 h-4 text-[#852016]" />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#852016]">50+</p>
            </div>
            <p className="text-[10px] sm:text-xs text-[#25406b] font-medium">Expert Speakers</p>
          </div>
          
          <div className="group bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-[#25406b]/10 hover:border-[#ebc975]/50 transition-all hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[#25406b]/10">
                <Users className="w-4 h-4 text-[#25406b]" />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#852016]">300+</p>
            </div>
            <p className="text-[10px] sm:text-xs text-[#25406b] font-medium">Delegates Expected</p>
          </div>
          
          <div className="group bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-[#25406b]/10 hover:border-[#ebc975]/50 transition-all hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[#ebc975]/20">
                <BookOpen className="w-4 h-4 text-[#852016]" />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#852016]">10+</p>
            </div>
            <p className="text-[10px] sm:text-xs text-[#25406b] font-medium">Scientific Sessions</p>
          </div>
          
          <div className="group bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-[#25406b]/10 hover:border-[#ebc975]/50 transition-all hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[#852016]/10">
                <HandMetal className="w-4 h-4 text-[#852016]" />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#852016]">2</p>
            </div>
            <p className="text-[10px] sm:text-xs text-[#25406b] font-medium">Days of Excellence</p>
          </div>
        </div>

        {/* Special Features */}
        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 bg-[#25406b]/5 rounded-full px-3 py-1.5 text-xs text-[#25406b] border border-[#25406b]/10">
            <Award className="w-3 h-3 text-[#ebc975]" />
            Live Surgery
          </span>
          <span className="inline-flex items-center gap-1.5 bg-[#852016]/5 rounded-full px-3 py-1.5 text-xs text-[#852016] border border-[#852016]/10">
            <Award className="w-3 h-3 text-[#ebc975]" />
            Workshops
          </span>
          <span className="inline-flex items-center gap-1.5 bg-[#25406b]/5 rounded-full px-3 py-1.5 text-xs text-[#25406b] border border-[#25406b]/10">
            <Award className="w-3 h-3 text-[#ebc975]" />
            Awards
          </span>
          <span className="inline-flex items-center gap-1.5 bg-[#852016]/5 rounded-full px-3 py-1.5 text-xs text-[#852016] border border-[#852016]/10">
            <Award className="w-3 h-3 text-[#ebc975]" />
            Networking
          </span>
        </div>
      </div>
    </div>
  );
}
