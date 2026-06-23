'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Countdown } from './Countdown';

const StemCellOrb = dynamic(
  () => import('./StemCellOrb').then((mod) => mod.StemCellOrb),
  {
    ssr: false,
    loading: () => null,
  }
);

// Register GSAP plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function HeroSection() {
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Refs for GSAP animations
  const sectionRef = useRef<HTMLElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const welcomeRef = useRef<HTMLDivElement>(null);
  const crosshairVRef = useRef<HTMLDivElement>(null);
  const crosshairHRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Only run scroll animation on desktop (md breakpoint = 768px)
    const isDesktop = window.innerWidth >= 768;
    if (!isDesktop) return;
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=100%',
            scrub: 0.8,
            pin: true,
          },
        });

        // Fade out hero content
        tl.to(heroContentRef.current, {
          opacity: 0,
          y: -30,
          duration: 0.4,
        }, 0);

        // Move orb to left (no scale change)
        tl.to(orbRef.current, {
          x: '-28vw',
          duration: 0.6,
        }, 0);

        // Move vertical crosshair with orb
        tl.to(crosshairVRef.current, {
          x: '-28vw',
          duration: 0.6,
        }, 0);

        // Fade horizontal crosshair
        tl.to(crosshairHRef.current, {
          opacity: 0,
          duration: 0.3,
        }, 0);

        // Parallax blobs
        tl.to(blob1Ref.current, {
          y: -60,
          x: -30,
          scale: 1.1,
          duration: 0.6,
        }, 0);

        tl.to(blob2Ref.current, {
          y: 50,
          x: 20,
          scale: 0.85,
          duration: 0.6,
        }, 0);

        // Fade in welcome content
        tl.fromTo(welcomeRef.current, 
          { opacity: 0, x: 60 },
          { opacity: 1, x: 0, duration: 0.5 },
          0.15
        );
      }, sectionRef);

      return () => ctx.revert();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <section 
        ref={sectionRef}
        className="relative h-screen w-full overflow-hidden" 
        style={{ backgroundColor: '#b8c8d8' }}
      >
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            ref={blob1Ref}
            className="absolute rounded-full"
            style={{
              top: '-100px',
              left: '-100px',
              width: '350px',
              height: '350px',
              background: 'radial-gradient(circle, rgba(100,120,140,0.6) 0%, rgba(100,120,140,0.2) 50%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
          <div
            ref={blob2Ref}
            className="absolute rounded-full"
            style={{
              bottom: '-100px',
              right: '-100px',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(90,110,130,0.5) 0%, rgba(90,110,130,0.2) 50%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
        </div>

        {/* Crosshair lines */}
        <div className="absolute inset-0 pointer-events-none z-10 hidden md:block">
          <div ref={crosshairVRef} className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
          <div ref={crosshairHRef} className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
        </div>

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-50 px-4 md:px-6 lg:px-10 py-4 md:py-5 lg:py-6 flex items-center justify-between">
          <Link href="/" className="text-xl md:text-2xl lg:text-4xl tracking-tight drop-shadow-sm" style={{ color: '#8e518d' }}>
            <span className="font-bold">ISCSG</span><span className="font-light">CON 2026</span>
          </Link>

          <nav className="hidden md:flex items-center gap-3 lg:gap-5 xl:gap-6">
            <Link href="/about" className="text-xs lg:text-sm xl:text-base text-black/70 hover:text-black transition-colors">Committee</Link>
            <Link href="/program-schedule" className="text-xs lg:text-sm xl:text-base text-black/70 hover:text-black transition-colors">Program</Link>
            <Link href="/abstracts" className="text-xs lg:text-sm xl:text-base text-black/70 hover:text-black transition-colors">Abstracts</Link>
            <Link href="/pricing" className="text-xs lg:text-sm xl:text-base text-black/70 hover:text-black transition-colors">Pricing</Link>
            <Link href="/venue" className="text-xs lg:text-sm xl:text-base text-black/70 hover:text-black transition-colors">Venue</Link>
            <Link href="/register" className="text-xs lg:text-sm xl:text-base text-black/70 hover:text-black transition-colors">Register</Link>
            <Link href="/contact" className="text-xs lg:text-sm xl:text-base text-black/70 hover:text-black transition-colors">Contact</Link>
          </nav>

          <button
            className="md:hidden p-2 text-black/70"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </header>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 md:hidden pt-20 px-6" style={{ backgroundColor: '#b8c8d8' }}>
            <nav className="flex flex-col gap-4">
              <Link href="/about" className="text-xl text-black/80 py-3 border-b border-black/10" onClick={() => setMenuOpen(false)}>Committee</Link>
              <Link href="/program-schedule" className="text-xl text-black/80 py-3 border-b border-black/10" onClick={() => setMenuOpen(false)}>Program</Link>
              <Link href="/abstracts" className="text-xl text-black/80 py-3 border-b border-black/10" onClick={() => setMenuOpen(false)}>Abstracts</Link>
              <Link href="/pricing" className="text-xl text-black/80 py-3 border-b border-black/10" onClick={() => setMenuOpen(false)}>Pricing</Link>
              <Link href="/venue" className="text-xl text-black/80 py-3 border-b border-black/10" onClick={() => setMenuOpen(false)}>Venue</Link>
              <Link href="/register" className="text-xl text-black/80 py-3 border-b border-black/10" onClick={() => setMenuOpen(false)}>Register</Link>
              <Link href="/contact" className="text-xl text-black/80 py-3 border-b border-black/10" onClick={() => setMenuOpen(false)}>Contact</Link>
            </nav>
          </div>
        )}

        {/* ============ DESKTOP LAYOUT ============ */}
        <div className="hidden md:block absolute inset-0">
          {/* 3D Stem Cell Orb - dead center on crosshair */}
          <div 
            ref={orbRef}
            className="absolute left-1/2 top-1/2 z-20"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-[35vmin] h-[35vmin] lg:w-[42vmin] lg:h-[42vmin] xl:w-[48vmin] xl:h-[48vmin]">
              <StemCellOrb />
            </div>
          </div>

          {/* Hero Content - fades out on scroll */}
          <div ref={heroContentRef} className="absolute inset-0">
            {/* LEFT SIDE - ABOVE horizontal line */}
            <div className="absolute z-30 left-8" style={{ bottom: '52%' }}>
              <p className="text-base lg:text-xl xl:text-2xl mb-2" style={{ color: '#1a365d' }}>
                8th International Conference on Stem Cells
              </p>
              <h2 className="text-4xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight" style={{ color: '#8e518d' }}>
                ISCSGCON<br />2026
              </h2>
            </div>

            {/* LEFT SIDE - BELOW horizontal line */}
            <div className="absolute z-30 left-8" style={{ top: '52%', maxWidth: '450px' }}>
              <p className="text-base lg:text-xl xl:text-2xl mb-1" style={{ color: '#1a365d' }}>
                Regenerative Medicine
              </p>
              <p className="text-xl lg:text-2xl xl:text-3xl font-semibold mb-2" style={{ color: '#1a365d' }}>
                MEET THE MASTERS
              </p>
              <p className="text-sm lg:text-base xl:text-lg mb-6" style={{ color: '#1a365d' }}>
                March 14-15, 2026 • Taj Deccan, Hyderabad
              </p>
              <Link
                href="/register"
                className="inline-block px-8 lg:px-10 py-3 lg:py-4 text-base lg:text-lg text-white font-semibold rounded-full transition-all hover:scale-105 mb-4"
                style={{ backgroundColor: '#8e518d' }}
              >
                Register Now
              </Link>
              <div className="mt-2">
                <Countdown />
              </div>
            </div>

            {/* RIGHT SIDE - ABOVE horizontal line */}
            <div className="absolute z-30 right-8" style={{ bottom: '52%' }}>
              <p className="text-sm lg:text-base xl:text-lg font-semibold text-black mb-3 text-center leading-tight">
                INDIAN STEM CELL STUDY GROUP<br />ASSOCIATION CONGRESS
              </p>
              <p className="text-xs lg:text-sm text-black/70 mb-4 text-center">In association with</p>
              <div className="flex flex-nowrap justify-center items-center gap-2 lg:gap-4 xl:gap-5">
                <Image src="/LOGOS/1.png" alt="Partner 1" width={50} height={50} className="object-contain w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14" sizes="56px" quality={75} />
                <Image src="/LOGOS/2.png" alt="Partner 2" width={50} height={50} className="object-contain w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14" sizes="56px" quality={75} />
                <Image src="/LOGOS/4.png" alt="Partner 4" width={50} height={50} className="object-contain w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14" sizes="56px" quality={75} />
                <Image src="/LOGOS/5.png" alt="Partner 5" width={50} height={50} className="object-contain w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14" sizes="56px" quality={75} />
                <Image src="/LOGOS/6.png" alt="Partner 6" width={50} height={50} className="object-contain w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14" sizes="56px" quality={75} />
              </div>
            </div>

            {/* RIGHT SIDE - BELOW horizontal line */}
            <div className="absolute z-30 right-8" style={{ top: '52%' }}>
              <p className="text-sm lg:text-base xl:text-lg font-semibold text-black mb-1 text-center">
                DEPARTMENT OF ORTHOPEDICS
              </p>
              <p className="text-xs lg:text-sm text-black/70 mb-2 text-center">
                Yashoda Hospitals Malakpet
              </p>
              <div className="flex justify-center">
                <Image src="/LOGOS/3.png" alt="Yashoda Hospitals" width={160} height={160} className="object-contain w-28 h-28 lg:w-36 lg:h-36 xl:w-40 xl:h-40" sizes="160px" quality={75} />
              </div>
            </div>
          </div>

          {/* Welcome Section - fades in on scroll */}
          <div 
            ref={welcomeRef}
            className="absolute right-6 lg:right-12 xl:right-20 top-1/2 -translate-y-1/2 z-30 max-w-md lg:max-w-lg xl:max-w-xl opacity-0 overflow-y-auto max-h-[85vh] pr-2"
          >
            <p className="text-xs lg:text-sm font-medium uppercase tracking-wider mb-2" style={{ color: '#8e518d' }}>
              Dear Esteemed Colleagues
            </p>
            <h2 className="text-xl lg:text-2xl xl:text-3xl font-bold mb-3 leading-tight" style={{ color: '#1a365d' }}>
              Welcome to ISCSGCON 2026
            </h2>
            <p className="text-xs lg:text-sm xl:text-base mb-3 leading-relaxed" style={{ color: '#1a365d' }}>
              It is our privilege to invite you to the <span className="font-semibold">8th International Conference on Stem Cells and Regenerative Medicine</span>, 
              scheduled for March 14-15, 2026 at Taj Deccan, Hyderabad. This prestigious gathering brings together 
              leading researchers, clinicians, and innovators shaping the future of cellular therapy.
            </p>
            <p className="text-xs lg:text-sm xl:text-base mb-3 leading-relaxed" style={{ color: '#1a365d' }}>
              Our scientific program features <span className="font-semibold">Hands-on Workshops</span> covering advanced techniques in 
              mesenchymal stem cell isolation, PRP preparation, and regenerative orthopedic procedures. 
              <span className="font-semibold"> CME Symposiums</span> will address cutting-edge topics including cartilage regeneration, 
              bone healing applications, and the latest in cellular immunotherapy.
            </p>
            <p className="text-xs lg:text-sm xl:text-base mb-4 leading-relaxed" style={{ color: '#1a365d' }}>
              An enriching experience awaits you with keynote sessions from international pioneers, 
              abstract presentations, and networking opportunities. We look forward to hosting you 
              in the vibrant city of Hyderabad.
            </p>
            <div className="flex flex-wrap gap-2 lg:gap-3">
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-2 lg:p-3 text-center min-w-[70px]">
                <p className="text-lg lg:text-xl font-bold" style={{ color: '#8e518d' }}>50+</p>
                <p className="text-[10px] lg:text-xs" style={{ color: '#1a365d' }}>Speakers</p>
              </div>
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-2 lg:p-3 text-center min-w-[70px]">
                <p className="text-lg lg:text-xl font-bold" style={{ color: '#8e518d' }}>300+</p>
                <p className="text-[10px] lg:text-xs" style={{ color: '#1a365d' }}>Attendees</p>
              </div>
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-2 lg:p-3 text-center min-w-[70px]">
                <p className="text-lg lg:text-xl font-bold" style={{ color: '#8e518d' }}>15+</p>
                <p className="text-[10px] lg:text-xs" style={{ color: '#1a365d' }}>Workshops</p>
              </div>
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-2 lg:p-3 text-center min-w-[70px]">
                <p className="text-lg lg:text-xl font-bold" style={{ color: '#8e518d' }}>2</p>
                <p className="text-[10px] lg:text-xs" style={{ color: '#1a365d' }}>Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ MOBILE LAYOUT (no scroll animation) ============ */}
        <div className="md:hidden h-full flex flex-col items-center justify-between pt-16 pb-4 px-2">
          {/* Top: Partners */}
          <div className="text-center w-full">
            <p className="font-semibold text-black leading-tight text-base">
              INDIAN STEM CELL STUDY GROUP<br />ASSOCIATION CONGRESS
            </p>
            <p className="text-black/70 text-sm mt-1 mb-2">In association with</p>
            <div className="flex flex-wrap justify-center items-center gap-4">
              <Image src="/LOGOS/1.png" alt="Partner 1" width={48} height={48} className="object-contain" sizes="48px" />
              <Image src="/LOGOS/2.png" alt="Partner 2" width={48} height={48} className="object-contain" sizes="48px" />
              <Image src="/LOGOS/4.png" alt="Partner 4" width={48} height={48} className="object-contain" sizes="48px" />
              <Image src="/LOGOS/5.png" alt="Partner 5" width={48} height={48} className="object-contain" sizes="48px" />
              <Image src="/LOGOS/6.png" alt="Partner 6" width={48} height={48} className="object-contain" sizes="48px" />
            </div>
          </div>

          {/* Center: Orb + Title */}
          <div className="flex flex-col items-center flex-1 justify-center py-4 w-full">
            <div className="w-52 h-52">
              <StemCellOrb />
            </div>
            <div className="text-center mt-3 w-full px-2">
              <p className="text-base mb-1" style={{ color: '#1a365d' }}>
                8th International Conference on Stem Cells
              </p>
              <h2 className="font-bold tracking-tight text-5xl leading-none mb-2" style={{ color: '#8e518d' }}>
                ISCSGCON 2026
              </h2>
              <p className="text-base" style={{ color: '#1a365d' }}>Regenerative Medicine</p>
              <p className="font-semibold text-xl mb-2" style={{ color: '#1a365d' }}>MEET THE MASTERS</p>
              <p className="text-base mb-4" style={{ color: '#1a365d' }}>March 14-15, 2026 • Taj Deccan, Hyderabad</p>
              <Link
                href="/register"
                className="inline-block text-white font-semibold rounded-full text-lg px-10 py-3.5"
                style={{ backgroundColor: '#8e518d' }}
              >
                Register Now
              </Link>
            </div>
          </div>

          {/* Bottom: Yashoda + Countdown stacked */}
          <div className="flex flex-col items-center w-full gap-1">
            <div className="text-center">
              <p className="font-semibold text-black text-sm">DEPARTMENT OF ORTHOPEDICS</p>
              <p className="text-black/70 text-xs mb-1">Yashoda Hospitals Malakpet</p>
              <Image src="/LOGOS/3.png" alt="Yashoda Hospitals" width={100} height={100} className="object-contain mx-auto" sizes="100px" />
            </div>
            <Countdown />
          </div>
        </div>
      </section>

    </>
  );
}

export default HeroSection;
