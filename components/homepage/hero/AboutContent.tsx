'use client';

import { Monitor, Users, Award, Microscope, Presentation, Handshake, GraduationCap, Stethoscope, Trophy } from 'lucide-react';

export function AboutContent() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-4 md:mb-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#25406b] mb-2">
          Why Attend?
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-[#25406b]/70 max-w-2xl mx-auto">
          Uniquely designed around the critical theme of decision making in Hand Surgery
        </p>
      </div>

      {/* Traffic Light Card */}
      <div className="relative mb-4 md:mb-6">
        <div className="absolute -inset-2 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20 rounded-2xl blur-xl" />
        
        <div className="relative bg-gradient-to-br from-[#1a1a2e]/95 via-[#16213e]/95 to-[#0f0f23]/95 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-6 border border-white/10 shadow-xl">
          
          {/* Header inside card */}
          <div className="text-center mb-3 md:mb-4">
            <h3 className="text-[#ebc975] text-xs md:text-sm font-bold uppercase tracking-wider">
              The Decision Spectrum
            </h3>
          </div>
          
          <div className="flex gap-4 md:gap-8 items-center">
            {/* Traffic Light */}
            <div className="flex-shrink-0">
              <div className="bg-gradient-to-b from-[#3a3a3a] to-[#1a1a1a] rounded-xl md:rounded-2xl p-2 md:p-3 shadow-lg border border-[#4a4a4a]/50">
                <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-lg md:rounded-xl p-1.5 md:p-2">
                  <div className="flex flex-col gap-2 md:gap-3">
                    {/* Red */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-50" />
                      <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-red-400 via-red-500 to-red-700 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400/30">
                        <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                    {/* Yellow */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-yellow-500 rounded-full blur-md opacity-40" />
                      <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)] border border-yellow-300/30">
                        <div className="w-4 h-1 md:w-6 md:h-1.5 bg-[#5a3d2b] rounded-full" />
                      </div>
                    </div>
                    {/* Green */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500 rounded-full blur-md opacity-50" />
                      <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-green-400 via-green-500 to-green-700 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.5)] border border-green-400/30">
                        <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-2 md:gap-3">
              <div className="bg-white/5 rounded-lg px-3 py-2 md:px-4 md:py-3 border-l-3 border-red-500 hover:bg-white/10 transition-colors">
                <h4 className="text-red-400 font-bold text-sm md:text-base uppercase">Inappropriate</h4>
                <p className="text-white/70 text-xs md:text-sm">Red Flags & Mismanaged Hand Surgery Cases</p>
              </div>
              <div className="bg-white/5 rounded-lg px-3 py-2 md:px-4 md:py-3 border-l-3 border-yellow-500 hover:bg-white/10 transition-colors">
                <h4 className="text-yellow-400 font-bold text-sm md:text-base uppercase">Appropriate</h4>
                <p className="text-white/70 text-xs md:text-sm">Safe Hand Surgery Everyone Must Know</p>
              </div>
              <div className="bg-white/5 rounded-lg px-3 py-2 md:px-4 md:py-3 border-l-3 border-green-500 hover:bg-white/10 transition-colors">
                <h4 className="text-green-400 font-bold text-sm md:text-base uppercase">Most Appropriate</h4>
                <p className="text-white/70 text-xs md:text-sm">Expert Techniques & Recent Advances</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conference Highlights - Expanded Grid */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/50 shadow-xl">
        <div className="bg-gradient-to-r from-[#25406b] via-[#3a5a8a] to-[#852016] py-2 md:py-3">
          <h3 className="text-white text-sm md:text-base font-bold text-center uppercase tracking-wider">
            Conference Highlights
          </h3>
        </div>
        
        <div className="grid grid-cols-3 gap-px bg-[#25406b]/10">
          {/* Row 1 */}
          <div className="bg-white p-2 md:p-4 text-center hover:bg-[#ebc975]/10 transition-colors">
            <div className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-1 md:mb-2 rounded-full bg-gradient-to-br from-[#25406b]/10 to-[#25406b]/5 flex items-center justify-center">
              <Monitor className="w-4 h-4 md:w-6 md:h-6 text-[#25406b]" />
            </div>
            <h4 className="text-[#25406b] font-bold text-[9px] md:text-xs uppercase">Screen to Scalpel</h4>
            <p className="text-[#852016] text-[7px] md:text-[10px] hidden sm:block">Surgery Reimagined</p>
          </div>
          
          <div className="bg-white p-2 md:p-4 text-center hover:bg-[#ebc975]/10 transition-colors">
            <div className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-1 md:mb-2 rounded-full bg-gradient-to-br from-[#25406b]/10 to-[#25406b]/5 flex items-center justify-center">
              <Users className="w-4 h-4 md:w-6 md:h-6 text-[#25406b]" />
            </div>
            <h4 className="text-[#25406b] font-bold text-[9px] md:text-xs uppercase">Mentor-Mentee</h4>
            <p className="text-[#852016] text-[7px] md:text-[10px] hidden sm:block">Connect & Grow</p>
          </div>
          
          <div className="bg-white p-2 md:p-4 text-center hover:bg-[#ebc975]/10 transition-colors">
            <div className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-1 md:mb-2 rounded-full bg-gradient-to-br from-[#ebc975]/20 to-[#ebc975]/5 flex items-center justify-center">
              <Trophy className="w-4 h-4 md:w-6 md:h-6 text-[#852016]" />
            </div>
            <h4 className="text-[#25406b] font-bold text-[9px] md:text-xs uppercase">Awards</h4>
            <p className="text-[#852016] text-[7px] md:text-[10px] hidden sm:block">Best Paper & Poster</p>
          </div>
          
          <div className="bg-white p-2 md:p-4 text-center hover:bg-[#ebc975]/10 transition-colors">
            <div className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-1 md:mb-2 rounded-full bg-gradient-to-br from-[#852016]/10 to-[#852016]/5 flex items-center justify-center">
              <Microscope className="w-4 h-4 md:w-6 md:h-6 text-[#852016]" />
            </div>
            <h4 className="text-[#25406b] font-bold text-[9px] md:text-xs uppercase">Live Surgery</h4>
            <p className="text-[#852016] text-[7px] md:text-[10px] hidden sm:block">Real-time Demos</p>
          </div>
          
          <div className="bg-white p-2 md:p-4 text-center hover:bg-[#ebc975]/10 transition-colors">
            <div className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-1 md:mb-2 rounded-full bg-gradient-to-br from-[#25406b]/10 to-[#25406b]/5 flex items-center justify-center">
              <Presentation className="w-4 h-4 md:w-6 md:h-6 text-[#25406b]" />
            </div>
            <h4 className="text-[#25406b] font-bold text-[9px] md:text-xs uppercase">Workshops</h4>
            <p className="text-[#852016] text-[7px] md:text-[10px] hidden sm:block">Hands-on Training</p>
          </div>
          
          <div className="bg-white p-2 md:p-4 text-center hover:bg-[#ebc975]/10 transition-colors">
            <div className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-1 md:mb-2 rounded-full bg-gradient-to-br from-[#ebc975]/20 to-[#ebc975]/5 flex items-center justify-center">
              <Handshake className="w-4 h-4 md:w-6 md:h-6 text-[#852016]" />
            </div>
            <h4 className="text-[#25406b] font-bold text-[9px] md:text-xs uppercase">Networking</h4>
            <p className="text-[#852016] text-[7px] md:text-[10px] hidden sm:block">Build Connections</p>
          </div>
        </div>
        
        {/* Second row - hidden on very small screens to save space */}
        <div className="hidden sm:grid grid-cols-3 gap-px bg-[#25406b]/10 border-t border-[#25406b]/10">
          <div className="bg-white p-3 md:p-4 text-center hover:bg-[#ebc975]/10 transition-colors">
            <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#25406b]/10 to-[#25406b]/5 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-[#25406b]" />
            </div>
            <h4 className="text-[#25406b] font-bold text-[10px] md:text-xs uppercase">CME Credits</h4>
            <p className="text-[#852016] text-[8px] md:text-[10px]">Certified Learning</p>
          </div>
          
          <div className="bg-white p-3 md:p-4 text-center hover:bg-[#ebc975]/10 transition-colors">
            <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#852016]/10 to-[#852016]/5 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 md:w-6 md:h-6 text-[#852016]" />
            </div>
            <h4 className="text-[#25406b] font-bold text-[10px] md:text-xs uppercase">Expert Faculty</h4>
            <p className="text-[#852016] text-[8px] md:text-[10px]">50+ Speakers</p>
          </div>
          
          <div className="bg-white p-3 md:p-4 text-center hover:bg-[#ebc975]/10 transition-colors">
            <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#ebc975]/20 to-[#ebc975]/5 flex items-center justify-center">
              <Award className="w-5 h-5 md:w-6 md:h-6 text-[#852016]" />
            </div>
            <h4 className="text-[#25406b] font-bold text-[10px] md:text-xs uppercase">Case Discussions</h4>
            <p className="text-[#852016] text-[8px] md:text-[10px]">Interactive Sessions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutContent;
