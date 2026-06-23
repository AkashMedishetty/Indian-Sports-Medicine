'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { CONFERENCE_LOGO, ASSOCIATION_LOGOS } from './constants';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    const targetDate = new Date('2026-04-25T09:00:00').getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-1.5 sm:gap-3 lg:justify-end mt-3 md:mt-4">
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hrs' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Sec' },
      ].map((item) => (
        <div key={item.label} className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#25406b] rounded-lg flex items-center justify-center shadow-md">
            <span className="text-sm sm:text-lg md:text-xl font-bold text-white">{String(item.value).padStart(2, '0')}</span>
          </div>
          <span className="text-[8px] sm:text-[10px] md:text-xs text-[#25406b]/70 font-medium mt-0.5 block">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HeroContent() {
  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 lg:gap-12">
      {/* Left Content */}
      <div className="max-w-2xl">
        {/* Conference Logo */}
        <div className="mb-3 md:mb-6">
          <Image
            src={CONFERENCE_LOGO}
            alt="12th ISSH Midterm CME 2026"
            width={120}
            height={120}
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain"
            priority
          />
        </div>

        {/* Association Logos */}
        <div className="flex items-center gap-3 sm:gap-4 mb-3 md:mb-6 relative w-fit">
          <div className="absolute -inset-2 bg-[#f5f0e8]/80 backdrop-blur-[2px] rounded-xl -z-10" />
          {ASSOCIATION_LOGOS.map((logo, i) => (
            <Image
              key={i}
              src={logo}
              alt={`Association ${i + 1}`}
              width={48}
              height={48}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain"
            />
          ))}
        </div>

        {/* Title */}
        <h1 className="text-[clamp(2rem,10vw,6rem)] font-black leading-[0.9] tracking-[-0.03em] text-[#25406b] mb-4 md:mb-8">
          12th ISSH
          <br />
          <span className="italic">MIDTERM CME</span>
        </h1>

        {/* Register Button */}
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 bg-[#852016] text-white text-sm sm:text-base md:text-xl font-bold rounded-full hover:bg-[#25406b] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-2xl"
        >
          Register Now
          <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>

      {/* Right Content */}
      <div className="max-w-lg lg:text-right mt-2 lg:mt-0">
        <p className="text-base sm:text-lg md:text-2xl lg:text-2xl xl:text-3xl text-[#852016] font-bold leading-snug mb-2 md:mb-6">
          "Inappropriate, Appropriate and Most Appropriate ways to do Hand Surgery"
        </p>
        <p className="text-sm sm:text-base md:text-xl text-[#25406b] font-semibold">
          April 25-26, 2026
        </p>
        <p className="text-sm sm:text-base md:text-xl text-[#25406b]/80 font-medium">
          HICC Novotel, Hyderabad
        </p>
        <p className="text-xs sm:text-sm md:text-lg text-[#25406b]/70 mt-1 md:mt-2 hidden sm:block">
          Join leading hand surgeons for two days of excellence in hand surgery education.
        </p>
        
        {/* Countdown Timer */}
        <CountdownTimer />

        {/* Mega Sponsors */}
        <div className="mt-5 md:mt-8 lg:text-right">
          <div className="inline-block bg-[#852016] text-white text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-3">
            ★ Mega Sponsors ★
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 lg:justify-end">
            {['TVS SURGICALS', 'AFFLUENTIAL PHARMA', 'ARTHREX', 'TAICA PHARMA', 'STONECRAFT'].map((name) => (
              <span key={name} className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white border-2 border-[#ebc975] rounded-xl text-xs sm:text-sm font-extrabold text-[#25406b] tracking-wide shadow-md">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
