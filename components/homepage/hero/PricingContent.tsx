'use client';

import Link from 'next/link';

const registrationPricing = [
  { category: 'ISSH Member', earlyBird: '₹5,000', regular: '₹6,000', spot: '₹7,000' },
  { category: 'Non ISSH Member', earlyBird: '₹6,000', regular: '₹7,000', spot: '₹8,000' },
  { category: 'Postgraduate', earlyBird: '₹2,500', regular: '₹3,000', spot: '₹3,500' },
  { category: 'Accompanying Person/Spouse', earlyBird: '₹3,000', regular: '₹3,500', spot: '₹4,000' },
];

const accommodationPricing = [
  { type: 'Single Accommodation', price: '₹10,000/Day' },
  { type: 'Sharing Accommodation', price: '₹7,500/Day' },
];

export function PricingContent() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-3 md:mb-10">
        <p className="text-[10px] sm:text-sm font-medium uppercase tracking-[0.2em] mb-1 md:mb-2 text-[#852016]">
          Registration & Accommodation
        </p>
        <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#25406b] mb-1 md:mb-2">
          Conference Pricing
        </h2>
        <p className="text-xs md:text-base text-[#25406b]/70">
          April 25-26, 2026 • HICC Novotel, Hyderabad
        </p>
      </div>

      {/* Registration Table */}
      <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden border border-white/50 mb-4 md:mb-6">
        <div className="bg-[#5a3d2b] text-white text-center py-2 md:py-3">
          <h3 className="font-bold text-sm md:text-base">Registration Details <span className="text-[#ebc975]">[18% GST Extra]</span></h3>
        </div>
        
        {/* Table Header */}
        <div className="grid grid-cols-4 bg-[#5a3d2b] text-white text-[10px] md:text-sm">
          <div className="p-1.5 md:p-3 font-semibold border-r border-white/20">Category</div>
          <div className="p-1.5 md:p-3 text-center border-r border-white/20">
            <div className="font-bold text-[9px] md:text-sm">Early Bird</div>
            <div className="text-[7px] md:text-xs opacity-80">Upto 31st Mar</div>
          </div>
          <div className="p-1.5 md:p-3 text-center border-r border-white/20">
            <div className="font-bold text-[9px] md:text-sm">Regular</div>
            <div className="text-[7px] md:text-xs opacity-80">1st Apr - 24th Apr</div>
          </div>
          <div className="p-1.5 md:p-3 text-center">
            <div className="font-bold text-[9px] md:text-sm">Spot</div>
            <div className="text-[7px] md:text-xs opacity-80">25th-26th Apr</div>
          </div>
        </div>

        {/* Consultant Header */}
        <div className="bg-[#f5f0e8] text-[#5a3d2b] text-center py-1.5 md:py-2 font-semibold text-xs md:text-sm border-b border-[#5a3d2b]/20">
          Consultant
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[#25406b]/10">
          {registrationPricing.map((item, index) => (
            <div
              key={item.category}
              className={`grid grid-cols-4 transition-colors hover:bg-[#ebc975]/20 ${
                index % 2 === 0 ? 'bg-white/60' : 'bg-white/30'
              }`}
            >
              <div className="p-1.5 md:p-3 flex items-center border-r border-[#25406b]/10">
                <span className="font-medium text-[9px] md:text-sm text-[#25406b]">{item.category}</span>
              </div>
              <div className="p-1.5 md:p-3 flex items-center justify-center border-r border-[#25406b]/10">
                <span className="text-xs md:text-lg font-bold text-[#852016]">{item.earlyBird}</span>
              </div>
              <div className="p-1.5 md:p-3 flex items-center justify-center border-r border-[#25406b]/10">
                <span className="text-xs md:text-lg font-bold text-[#25406b]">{item.regular}</span>
              </div>
              <div className="p-1.5 md:p-3 flex items-center justify-center">
                <span className="text-xs md:text-lg font-bold text-[#25406b]">{item.spot}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accommodation Table */}
      <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden border border-white/50 mb-4 md:mb-6">
        <div className="bg-[#5a3d2b] text-white text-center py-2 md:py-3">
          <h3 className="font-bold text-sm md:text-base">Accommodation @ Novotel <span className="text-[#ebc975]">[18% GST Extra]</span></h3>
        </div>
        
        <div className="divide-y divide-[#25406b]/10">
          {accommodationPricing.map((item, index) => (
            <div
              key={item.type}
              className={`grid grid-cols-2 transition-colors hover:bg-[#ebc975]/20 ${
                index % 2 === 0 ? 'bg-white/60' : 'bg-white/30'
              }`}
            >
              <div className="p-2 md:p-3 flex items-center border-r border-[#25406b]/10">
                <span className="font-medium text-xs md:text-sm text-[#25406b]">{item.type}</span>
              </div>
              <div className="p-2 md:p-3 flex items-center">
                <span className="text-sm md:text-lg font-bold text-[#852016]">{item.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-2 md:p-4 mb-3 md:mb-6">
        <ul className="text-[9px] md:text-xs text-[#25406b]/80 space-y-0.5 md:space-y-1.5">
          <li className="flex items-start gap-1.5">
            <span className="text-[#852016] mt-0.5">•</span>
            <span>Conference registration is mandatory for all attendees.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#852016] mt-0.5">•</span>
            <span>Registration fee includes entry to scientific sessions, conference lunches, and banquet.</span>
          </li>
          <li className="flex items-start gap-1.5 hidden sm:flex">
            <span className="text-[#852016] mt-0.5">•</span>
            <span>Accommodation fee is per day and exclusive of 18% GST.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#852016] mt-0.5">•</span>
            <span>Early bird rates apply only for payments received before 31st March.</span>
          </li>
          <li className="flex items-start gap-1.5 hidden sm:flex">
            <span className="text-[#852016] mt-0.5">•</span>
            <span>GST invoice will be provided upon request.</span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-[#852016] text-white text-sm md:text-base font-bold rounded-full hover:bg-[#25406b] transition-all duration-300 hover:scale-105 shadow-lg"
        >
          Register Now
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
