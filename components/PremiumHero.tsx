'use client';

import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

const KneeModel3D = dynamic(() => import('./KneeModel3D'), { ssr: false });

export default function PremiumHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const magneticRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.98]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  // Mouse position for magnetic effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-black pt-20"
    >
      {/* Cinematic Gradient Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0f1419_0%,#000000_100%)]" />
        
        {/* Animated Mesh Gradients */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-accent/30 rounded-full filter blur-[150px] animate-float" />
          <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-brightBlue/30 rounded-full filter blur-[150px] animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/20 rounded-full filter blur-[130px] animate-float" style={{ animationDelay: '4s' }} />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
        
      </div>

      {/* Magnetic Follower Element - Hidden on Mobile */}
      <motion.div
        className="hidden lg:block fixed z-20 pointer-events-none mix-blend-difference"
        style={{
          x: useTransform(smoothX, (v) => v - 30),
          y: useTransform(smoothY, (v) => v - 30),
        }}
      >
        <motion.div
          className="w-16 h-16 rounded-full border-2 border-accent/50 flex items-center justify-center"
          whileHover={{ scale: 1.5 }}
        >
          <motion.div 
            className="w-3 h-3 rounded-full bg-accent"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>

      {/* 3D Knee Model - Stays in hero, doesn't scroll */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-[35%] -translate-y-1/2 right-0 w-[390px] h-[390px] lg:w-[960px] lg:h-[960px] lg:top-[22%] lg:right-[7%] -mr-[35%] lg:mr-0 pointer-events-auto z-[2]"
        style={{ 
          opacity: 0.35,
          filter: 'blur(0.5px)'
        }}
      >
        <KneeModel3D />
      </motion.div>

      {/* Main Content */}
      <motion.div 
        style={{ opacity, scale, y }}
        className="relative z-10 min-h-screen flex items-center overflow-visible"
      >
        <div className="w-full max-w-[2000px] mx-auto px-8 lg:pl-32 lg:pr-8">
          <div className="flex gap-12 items-stretch flex-nowrap">
            
            {/* Left: Bold Typography & Content */}
            <div className="flex-1 space-y-8 max-w-4xl">
              {/* Eyebrow Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-accent/30 bg-accent/5 backdrop-blur-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                <span className="text-accent text-sm font-medium tracking-wide uppercase">Registration Open</span>
              </motion.div>

              {/* Main Title - Split TAS/CON */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <h1 className="text-8xl lg:text-9xl xl:text-[12rem] font-bold leading-[0.85] tracking-tighter">
                  <span className="block mb-2">
                    <span className="bg-gradient-to-r from-accent via-orange-400 to-accent bg-clip-text text-transparent">TAS</span>
                    <span className="text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,0.3)]">CON</span>
                  </span>
                  <span className="block text-white text-7xl lg:text-8xl xl:text-[8rem]">
                    2026
                  </span>
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="space-y-3"
              >
                <p className="text-2xl lg:text-3xl text-white/70 font-light">
                  3rd Annual Conference
                </p>
                <p className="text-lg text-white/50">
                  Telangana Arthroscopy Society
                </p>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-wrap gap-4 pt-4"
              >
                <button className="group relative px-10 py-5 bg-gradient-to-r from-accent to-orange-500 rounded-full text-black font-bold text-lg overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    Register Now
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </button>

                <button className="px-10 py-5 border-2 border-white/20 hover:border-white/40 rounded-full text-white font-semibold text-lg backdrop-blur-sm transition-all">
                  View Program
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="flex gap-8 pt-8 border-t border-white/10"
              >
                <div>
                  <div className="text-4xl font-bold text-white mb-1">500+</div>
                  <div className="text-white/50 text-sm">Attendees</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-1">July 18-19</div>
                  <div className="text-white/50 text-sm">Hyderabad</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-1">CME</div>
                  <div className="text-white/50 text-sm">Credits</div>
                </div>
              </motion.div>
            </div>

            {/* Right: Vertical Landmark Column - Completely Right Aligned */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="hidden lg:flex flex-col gap-2 items-end justify-start flex-shrink-0 absolute right-16 top-[5%]"
            >
              {[
                { src: '/image (59).png', name: 'Buddha Statue', color: '#2196F3', offsetX: 45, brightness: 1.35 },
                { src: '/image (58).png', name: 'Charminar', color: '#f97316', offsetX: 0, brightness: 1.35 },
                { src: '/image (57).png', name: 'Birla Mandir', color: '#ffb246', offsetX: 0, brightness: 1.35 },
                { src: '/image (60).png', name: 'Golconda Fort', color: '#a855f7', offsetX: 0, brightness: 1.8 },
              ].map((landmark, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="group cursor-pointer flex flex-col items-center gap-2"
                >
                  <motion.div
                    whileHover={{ 
                      scale: 1.15,
                      y: -8,
                      transition: { duration: 0.3 }
                    }}
                    className="relative"
                    style={{ transform: `translateX(${landmark.offsetX}px)` }}
                  >
                  {/* Toned Down Lighting Background */}
                  <motion.div
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-90 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 30%, transparent 70%)`,
                      filter: 'blur(40px)',
                      width: '150%',
                      height: '150%',
                      left: '-25%',
                      top: '-25%',
                    }}
                  />

                  {/* White Spotlight Effect */}
                  <div 
                    className="absolute -inset-20 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(255,255,255,0.6) 0%, transparent 70%)',
                      filter: 'blur(60px)',
                    }}
                  />
                  
                  {/* Enhanced Large Image - Toned Down */}
                  <motion.img
                    src={landmark.src}
                    alt={landmark.name}
                    className="relative z-10 object-contain drop-shadow-2xl"
                    style={{
                      width: '200px',
                      height: '200px',
                      minWidth: '200px',
                      minHeight: '200px',
                      filter: `brightness(${landmark.brightness}) contrast(1.2) saturate(1.1)`,
                      opacity: 0.8,
                    }}
                    whileHover={{ 
                      filter: `brightness(2.2) contrast(1.35) saturate(1.35) drop-shadow(0 0 30px rgba(255,255,255,0.7))`,
                      opacity: 1,
                    }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* White Rim Light Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                    style={{
                      boxShadow: 'inset 0 0 50px rgba(255,255,255,0.4), 0 0 50px rgba(255,255,255,0.3)',
                      filter: 'blur(20px)',
                    }}
                  />

                  </motion.div>

                  {/* Name Label - Always Visible Below */}
                  <p className="text-white/60 text-xs font-medium group-hover:text-white transition-colors">
                    {landmark.name}
                  </p>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>

      </motion.div>

      {/* Mobile: Horizontal Monuments at Bottom */}
      <div className="lg:hidden absolute bottom-0 left-0 right-0 pb-6 bg-gradient-to-t from-black/80 to-transparent pt-8">
        <div className="flex items-end justify-center gap-6 max-w-4xl mx-auto px-4">
          {[
            { src: '/image (59).png', name: 'Buddha Statue', offsetX: 10 },
            { src: '/image (58).png', name: 'Charminar', offsetX: 0 },
            { src: '/image (57).png', name: 'Birla Mandir', offsetX: 0 },
            { src: '/image (60).png', name: 'Golconda Fort', offsetX: 0 },
          ].map((landmark, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div style={{ transform: `translateX(${landmark.offsetX}px)` }}>
                <img
                  src={landmark.src}
                  alt={landmark.name}
                  className="w-16 h-16 object-contain"
                  style={{
                    filter: 'brightness(1.1) drop-shadow(0 0 4px rgba(255,255,255,0.15))',
                  }}
                />
              </div>
              <p className="text-white/50 text-[10px] font-medium text-center">
                {landmark.name}
              </p>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
