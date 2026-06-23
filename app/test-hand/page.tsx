'use client';

import dynamic from 'next/dynamic';

const HandPointCloud = dynamic(() => import('@/components/HandPointCloud'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <div className="text-white/30 text-xl">Loading...</div>
    </div>
  ),
});

export default function TestHandPage() {
  return (
    <div className="relative bg-white">
      {/* Fixed point cloud */}
      <div className="fixed inset-0 bg-white">
        <HandPointCloud />
      </div>

      {/* Scroll progress indicator */}
      <div className="fixed right-10 top-1/2 -translate-y-1/2 h-24 w-px bg-black/10 z-10">
        <div 
          className="absolute top-0 w-full bg-black transition-all duration-100"
          id="scroll-progress"
          style={{ height: '0%' }}
        />
      </div>

      {/* Scrollable sections */}
      <div className="relative z-2 pointer-events-none">
        <section className="h-screen flex flex-col justify-end p-[10vh_8vw]">
          <p className="text-black/30 uppercase tracking-[6px] text-xs font-semibold mb-4">
            Hand Surgery Excellence
          </p>
          <h1 className="text-black text-[clamp(2rem,10vw,6rem)] font-black uppercase leading-[0.8] tracking-[-4px]">
            Resting<br/>State
          </h1>
        </section>
        
        <section className="h-screen flex flex-col justify-end p-[10vh_8vw]">
          <p className="text-black/30 uppercase tracking-[6px] text-xs font-semibold mb-4">
            Precision & Skill
          </p>
          <h1 className="text-black text-[clamp(2rem,10vw,6rem)] font-black uppercase leading-[0.8] tracking-[-4px]">
            Point<br/>Focus
          </h1>
        </section>
        
        <section className="h-screen flex flex-col justify-end p-[10vh_8vw]">
          <p className="text-black/30 uppercase tracking-[6px] text-xs font-semibold mb-4">
            ISSH Midterm CME 2026
          </p>
          <h1 className="text-black text-[clamp(2rem,10vw,6rem)] font-black uppercase leading-[0.8] tracking-[-4px]">
            Final<br/>Dissolve
          </h1>
        </section>
      </div>

      {/* Update scroll progress bar */}
      <script dangerouslySetInnerHTML={{ __html: `
        window.addEventListener('scroll', function() {
          var scrollY = window.scrollY;
          var maxScroll = document.body.scrollHeight - window.innerHeight;
          var progress = Math.min(Math.max(scrollY / maxScroll, 0), 1) * 100;
          var bar = document.getElementById('scroll-progress');
          if (bar) bar.style.height = progress + '%';
        });
      `}} />
    </div>
  );
}
