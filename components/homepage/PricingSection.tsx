'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const pricingCategories = [
  {
    title: 'ISSH Member',
    earlyBird: '₹5,000',
    regular: '₹6,000',
    spot: '₹7,000',
  },
  {
    title: 'Non ISSH Member',
    earlyBird: '₹6,000',
    regular: '₹7,000',
    spot: '₹8,000',
  },
  {
    title: 'Postgraduate',
    earlyBird: '₹2,500',
    regular: '₹3,000',
    spot: '₹3,500',
  },
  {
    title: 'Accompanying Person/Spouse',
    earlyBird: '₹3,000',
    regular: '₹3,500',
    spot: '₹4,000',
  },
];

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Fade in the entire pricing section
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'top 30%',
            scrub: 0.5,
          },
        }
      );

      // Stagger animate table rows
      gsap.fromTo(
        '.pricing-row',
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.pricing-table',
            start: 'top 75%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen flex items-center justify-center py-16 md:py-24 overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #c8d4c8 0%, #d4cfc5 30%, #e8e4dc 100%)',
      }}
    >
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-[10%] left-[5%] w-[40vw] h-[40vh] rounded-full blur-[120px] opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(235, 201, 117, 0.5) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-[10%] right-[5%] w-[35vw] h-[35vh] rounded-full blur-[100px] opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(133, 32, 22, 0.2) 0%, transparent 70%)' }}
        />
      </div>

      <div ref={contentRef} className="relative z-10 w-full max-w-5xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="text-xs md:text-sm font-medium uppercase tracking-[0.2em] mb-3 text-[#852016]">
            Registration
          </p>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-[#25406b] mb-4">
            Conference Pricing
          </h2>
          <p className="text-base md:text-lg text-[#25406b]/70 max-w-2xl mx-auto">
            April 25-26, 2026 • HICC Novotel, Hyderabad
          </p>
        </div>

        {/* Pricing Table */}
        <div className="pricing-table bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          {/* Table Header */}
          <div className="grid grid-cols-4 bg-[#852016] text-white">
            <div className="p-4 md:p-6 font-semibold text-sm md:text-base border-r border-white/20">
              Category
            </div>
            <div className="p-4 md:p-6 text-center border-r border-white/20">
              <div className="font-bold text-sm md:text-lg">Early Bird</div>
              <div className="text-xs md:text-sm opacity-80">Upto 31st March</div>
            </div>
            <div className="p-4 md:p-6 text-center border-r border-white/20">
              <div className="font-bold text-sm md:text-lg">Regular</div>
              <div className="text-xs md:text-sm opacity-80">15th Mar – 24th Apr</div>
            </div>
            <div className="p-4 md:p-6 text-center">
              <div className="font-bold text-sm md:text-lg">Spot</div>
              <div className="text-xs md:text-sm opacity-80">At the Conference</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[#25406b]/10">
            {pricingCategories.map((category, index) => (
              <div
                key={category.title}
                className={`pricing-row grid grid-cols-4 transition-all duration-300 ${
                  hoveredRow === index ? 'bg-[#ebc975]/20' : index % 2 === 0 ? 'bg-white/40' : 'bg-white/20'
                }`}
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <div className="p-4 md:p-6 flex items-center border-r border-[#25406b]/10">
                  <span className="font-semibold text-sm md:text-base text-[#25406b]">
                    {category.title}
                  </span>
                </div>
                <div className="p-4 md:p-6 flex items-center justify-center border-r border-[#25406b]/10">
                  <span className="text-lg md:text-2xl font-bold text-[#852016]">
                    {category.earlyBird}
                  </span>
                </div>
                <div className="p-4 md:p-6 flex items-center justify-center border-r border-[#25406b]/10">
                  <span className="text-lg md:text-2xl font-bold text-[#25406b]">
                    {category.regular}
                  </span>
                </div>
                <div className="p-4 md:p-6 flex items-center justify-center">
                  <span className="text-lg md:text-2xl font-bold text-[#25406b]">
                    {category.spot}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 md:mt-8 text-center">
          <p className="text-sm md:text-base text-[#25406b]/60 mb-6">
            * All prices are exclusive of 18% GST.
          </p>
          
          {/* CTA Button */}
          <Link
            href="/register"
            className="inline-flex items-center gap-3 px-8 py-4 md:px-10 md:py-5 bg-[#852016] text-white text-base md:text-lg font-bold rounded-full hover:bg-[#25406b] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-2xl"
          >
            Register Now
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
