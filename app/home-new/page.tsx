'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const HandHeroSection = dynamic(
  () => import('@/components/homepage/HandHeroSection'),
  { 
    ssr: false,
    loading: () => <div className="h-screen bg-white flex items-center justify-center text-gray-400">Loading...</div>
  }
);

export default function HomeNew() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="relative overflow-x-hidden bg-white">
      <HandHeroSection />
    </main>
  );
}
