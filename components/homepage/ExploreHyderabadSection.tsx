'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const attractions = [
  {
    name: 'Hussain Sagar',
    image: '/HYD/Hussian.png',
    description: 'Iconic Buddha statue at Tank Bund',
  },
  {
    name: 'Golconda Fort',
    image: '/HYD/Golconda.png',
    description: 'Historic fortress with acoustic wonders',
  },
  {
    name: 'Birla Mandir',
    image: '/HYD/birlamandir.jpg',
    description: 'Stunning hilltop temple with city views',
  },
  {
    name: 'HITEC City',
    image: '/HYD/Hitec City.jpg',
    description: 'India\'s premier IT hub',
  },
  {
    name: 'Ramoji Film City',
    image: '/HYD/Ramoji.png',
    description: 'World\'s largest film studio complex',
  },
  {
    name: 'Salar Jung Museum',
    image: '/HYD/Slarjung.png',
    description: 'One of the largest art museums',
  },
];

export function ExploreHyderabadSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'top 50%',
            scrub: 0.3,
          },
        }
      );

      // Cards stagger animation
      if (cardsRef.current) {
        const cards = cardsRef.current.children;
        gsap.fromTo(
          cards,
          { opacity: 0, y: 50, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.1,
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 75%',
              end: 'top 35%',
              scrub: 0.3,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-12 md:py-16 overflow-hidden"
      style={{ backgroundColor: '#b8c8d8' }}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8e518d 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8e518d 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-6 md:mb-10">
          <p className="text-xs md:text-sm font-medium uppercase tracking-wider mb-1 text-[#8e518d]">
            Discover the City of Pearls
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2" style={{ color: '#1a365d' }}>
            Explore Hyderabad
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto">
            Heritage meets modernity in India&apos;s vibrant city
          </p>
        </div>

        {/* Image Grid */}
        <div
          ref={cardsRef}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
        >
          {attractions.map((place, index) => (
            <div
              key={place.name}
              className={`group relative overflow-hidden rounded-xl md:rounded-2xl cursor-pointer ${
                index === 0 ? 'col-span-2 md:col-span-2 md:row-span-2' : ''
              }`}
            >
              <div className={`relative ${index === 0 ? 'aspect-[16/9] md:aspect-auto md:h-full md:min-h-[320px]' : 'aspect-square md:aspect-[4/3]'}`}>
                <Image
                  src={place.image}
                  alt={place.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes={index === 0 ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 50vw, 33vw'}
                  quality={75}
                  loading="lazy"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5">
                  <h3 className={`font-bold text-white mb-0.5 ${index === 0 ? 'text-base md:text-xl' : 'text-sm md:text-base'}`}>
                    {place.name}
                  </h3>
                  <p className={`text-white/80 ${index === 0 ? 'text-xs md:text-sm' : 'text-[10px] md:text-xs'}`}>
                    {place.description}
                  </p>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-[#8e518d]/0 group-hover:bg-[#8e518d]/20 transition-colors duration-300" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom info */}
        <div className="mt-6 md:mt-10 text-center">
          <div className="inline-flex items-center gap-2 md:gap-4 bg-white/80 backdrop-blur-sm rounded-full px-4 md:px-6 py-2 md:py-3 shadow-lg">
            <span className="text-gray-600 text-xs md:text-sm">Conference Venue:</span>
            <span className="font-semibold text-xs md:text-sm" style={{ color: '#1a365d' }}>Taj Deccan, Hyderabad</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ExploreHyderabadSection;
