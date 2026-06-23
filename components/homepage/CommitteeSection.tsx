'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function CommitteeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ctx = gsap.context(() => {
      gsap.fromTo(contentRef.current, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', end: 'top 50%', scrub: 0.3 },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full py-8 md:py-12" style={{ backgroundColor: '#b8c8d8' }}>
      <div ref={contentRef} className="w-full max-w-7xl mx-auto px-4 md:px-6">
        {/* Organizing Committee */}
        <div className="text-center mb-4 md:mb-8">
          <h2 className="text-xl md:text-3xl font-bold" style={{ color: '#1a365d' }}>Organizing Committee</h2>
        </div>
        
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-12 mb-6 md:mb-12">
          {/* Organising Chairman */}
          <div className="flex items-center gap-3 md:gap-5">
            <div className="w-16 h-16 md:w-28 md:h-28 rounded-full overflow-hidden flex-shrink-0 shadow-lg relative">
              <Image 
                src="/ISCSGCON/pl srinivas.jpeg" 
                alt="Dr. P. L. Srinivas" 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 64px, 112px"
                quality={75}
              />
            </div>
            <div>
              <p className="text-xs md:text-base font-semibold" style={{ color: '#8e518d' }}>Organising Chairman</p>
              <p className="text-sm md:text-xl font-bold" style={{ color: '#1a365d' }}>Dr. P. L. Srinivas</p>
              <p className="text-[10px] md:text-sm font-medium" style={{ color: '#374151' }}>Professor & HOD, Orthopaedics</p>
              <p className="text-[10px] md:text-sm" style={{ color: '#4b5563' }}>Osmania Medical College</p>
            </div>
          </div>
          
          {/* Organising Secretary */}
          <div className="flex items-center gap-3 md:gap-5">
            <div className="w-16 h-16 md:w-28 md:h-28 rounded-full overflow-hidden flex-shrink-0 shadow-lg relative">
              <Image 
                src="/ISCSGCON/supbramanyam.jpeg" 
                alt="Dr. Krishna Subramanyam" 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 64px, 112px"
                quality={75}
              />
            </div>
            <div>
              <p className="text-xs md:text-base font-semibold" style={{ color: '#8e518d' }}>Organising Secretary</p>
              <p className="text-sm md:text-xl font-bold" style={{ color: '#1a365d' }}>Dr. Krishna Subramanyam</p>
              <p className="text-[10px] md:text-sm font-medium" style={{ color: '#374151' }}>Sr. Consultant Orthopedic</p>
              <p className="text-[10px] md:text-sm" style={{ color: '#4b5563' }}>Yashoda Hospitals</p>
            </div>
          </div>
          
          {/* Co-Organizing Secretary */}
          <div className="flex items-center gap-3 md:gap-5">
            <div className="w-16 h-16 md:w-28 md:h-28 rounded-full overflow-hidden flex-shrink-0 shadow-lg relative">
              <Image 
                src="/ISCSGCON/saketh.jpeg" 
                alt="Dr. A.S.P.V.S. Saketh" 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 64px, 112px"
                quality={75}
              />
            </div>
            <div>
              <p className="text-xs md:text-base font-semibold" style={{ color: '#8e518d' }}>Co-Organizing Secretary</p>
              <p className="text-sm md:text-xl font-bold" style={{ color: '#1a365d' }}>Dr. A.S.P.V.S. Saketh</p>
              <p className="text-[10px] md:text-sm font-medium" style={{ color: '#374151' }}>Orthopaedic Surgeon</p>
              <p className="text-[10px] md:text-sm" style={{ color: '#4b5563' }}>Yashoda Hospitals, Malakpet</p>
            </div>
          </div>
        </div>

        {/* ISCSG Header */}
        <div className="text-center mb-4 md:mb-6">
          <div className="inline-flex items-center gap-2 md:gap-3">
            <div className="h-px w-8 md:w-16 bg-gray-400/40" />
            <span className="text-sm md:text-xl font-bold" style={{ color: '#1a365d' }}>INDIAN STEM CELL STUDY GROUP</span>
            <div className="h-px w-8 md:w-16 bg-gray-400/40" />
          </div>
          <p className="text-xs md:text-sm text-gray-600">Association Congress</p>
        </div>

        {/* ISCSG - Grid on mobile, horizontal on desktop */}
        <div className="grid grid-cols-2 md:flex md:justify-center md:flex-wrap gap-3 md:gap-8 mb-6 md:mb-10">
          {[
            { name: 'Dr. V R Ravi', role: 'President', photo: '/ISCSGCON/vr ravi.jpeg' },
            { name: 'Dr. Kanchan Mishra', role: 'President Elect', photo: '/ISCSGCON/Kanchan.jpeg' },
            { name: 'Dr. Manish Khanna', role: 'Founder Chairman', photo: '/ISCSGCON/manish.jpeg', featured: true },
            { name: 'Dr. Shilpa Sharma', role: 'Vice President', photo: '/ISCSGCON/shilpa.jpeg' },
            { name: 'Dr. Madhan Jayeraman', role: 'Secretary General', photo: '/ISCSGCON/madan.jpeg' },
          ].map((m) => (
            <div key={m.name} className={`flex items-center gap-2 md:gap-3 ${m.featured ? 'col-span-2 justify-center' : ''}`}>
              <div className={`${m.featured ? 'w-14 h-14 md:w-24 md:h-24 ring-2 md:ring-4 ring-[#8e518d]/30' : 'w-10 h-10 md:w-20 md:h-20'} rounded-full overflow-hidden flex-shrink-0 shadow-md relative`}>
                <Image 
                  src={m.photo} 
                  alt={m.name} 
                  fill
                  className="object-cover"
                  sizes={m.featured ? "(max-width: 768px) 56px, 96px" : "(max-width: 768px) 40px, 80px"}
                  quality={75}
                />
              </div>
              <div>
                <p className="text-xs md:text-base font-bold leading-tight" style={{ color: '#1a365d' }}>{m.name}</p>
                <p className="text-[10px] md:text-sm" style={{ color: '#8e518d' }}>{m.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Workshop Coordinator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="h-px w-6 md:w-12 bg-gray-400/40" />
            <span className="text-xs md:text-base font-bold uppercase" style={{ color: '#1a365d' }}>Workshop Co-ordinator</span>
            <div className="h-px w-6 md:w-12 bg-gray-400/40" />
          </div>
          <div className="flex justify-center">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-12 h-12 md:w-20 md:h-20 rounded-full overflow-hidden shadow-md relative">
                <Image 
                  src="/ISCSGCON/Lalith mohan.jpeg" 
                  alt="Dr. Lalith Mohan C" 
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 48px, 80px"
                  quality={75}
                />
              </div>
              <div className="text-left">
                <p className="text-sm md:text-base font-bold" style={{ color: '#1a365d' }}>Dr. Lalith Mohan C</p>
                <p className="text-[10px] md:text-sm font-medium" style={{ color: '#374151' }}>Additional Professor • NIMS, Hyderabad</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CommitteeSection;
