'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NAV_ITEMS } from './constants';

export function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Navigation */}
      <header className="fixed top-0 left-0 w-full px-4 sm:px-6 md:px-8 lg:px-12 py-4 md:py-6 flex justify-between items-center z-[100] bg-gradient-to-b from-[#f5f0e8] to-transparent">
        <Link
          href="/"
          className="text-lg md:text-xl lg:text-2xl font-bold text-[#25406b] hover:text-[#852016] transition-colors"
        >
          ISSH Midterm
        </Link>
        
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm lg:text-base text-[#25406b]/80 hover:text-[#25406b] transition-colors font-medium"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/register"
            className="relative text-base lg:text-xl xl:text-2xl text-[#25406b] font-bold group"
          >
            Register
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#852016] scale-x-0 transition-transform duration-300 group-hover:scale-x-100 origin-left" />
          </Link>
        </nav>
        
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-[#25406b]"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="fixed inset-0 z-[90] md:hidden pt-20 px-6 bg-[#f5f0e8]">
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              className="text-xl text-[#25406b] py-3 border-b border-[#25406b]/10 font-bold"
              onClick={() => setMenuOpen(false)}
            >
              ISSH Midterm
            </Link>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-xl text-[#25406b] py-3 border-b border-[#25406b]/10"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/register"
              className="text-xl text-[#25406b] py-3 border-b border-[#25406b]/10 font-semibold"
              onClick={() => setMenuOpen(false)}
            >
              Register
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
