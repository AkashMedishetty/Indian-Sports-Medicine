'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { conferenceConfig } from '@/config/conference.config';

export function FooterSection() {
  const currentYear = new Date().getFullYear();
  const config = conferenceConfig;

  const startDate = new Date(config.eventDate.start);
  const endDate = new Date(config.eventDate.end);
  const dateStr = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const quickLinks = [
    { name: 'About', href: '/about' },
    { name: 'Program', href: '/program-schedule' },
    { name: 'Register', href: '/register' },
    { name: 'Venue', href: '/venue' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <footer className="relative flex-1" style={{ backgroundColor: config.theme.primary }}>
      <div className="h-full px-5 py-6 md:py-8 lg:px-8 xl:px-5 flex flex-col">
        {/* Mobile Layout - FULLY VERTICAL, BIGGER TEXT */}
        <div className="md:hidden flex flex-col h-full">
          {/* Logo + Name */}
          <div className="flex items-center gap-4 mb-5">
            <Image src="/logos/1.png" alt={config.shortName} width={56} height={56} className="object-contain" />
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{config.shortName}</h3>
              <p className="text-base" style={{ color: config.theme.secondary }}>{dateStr}</p>
            </div>
          </div>

          {/* Organized By logos */}
          <div className="mb-5">
            <p className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: config.theme.secondary }}>Organized By</p>
            <div className="flex gap-4">
              <Image src="/logos/3.png" alt="ISSH" width={48} height={48} className="object-contain bg-white/10 rounded-lg p-1.5" />
              <Image src="/logos/4.png" alt="TOSA" width={48} height={48} className="object-contain bg-white/10 rounded-lg p-1.5" />
              <Image src="/logos/5.png" alt="TCOS" width={48} height={48} className="object-contain bg-white/10 rounded-lg p-1.5" />
              <Image src="/logos/logo.png" alt="Partner" width={48} height={48} className="object-contain bg-white/10 rounded-lg p-1.5" />
            </div>
          </div>

          {/* Contact */}
          <div className="mb-5">
            <p className="text-sm font-bold mb-2 uppercase tracking-wider" style={{ color: config.theme.secondary }}>Contact</p>
            <p className="text-base font-semibold text-white mb-2">Apple Events</p>
            <p className="text-base text-white/90 mb-1">Ms. Lakhshmi Prabha</p>
            <a href={`tel:${config.contact.phone}`} className="text-base text-white/80 flex items-center gap-2 py-1.5">
              <Phone className="w-5 h-5" />{config.contact.phone}
            </a>
            <a href={`mailto:${config.contact.email}`} className="text-base text-white/80 flex items-center gap-2 py-1.5">
              <Mail className="w-5 h-5" /><span className="truncate">{config.contact.email}</span>
            </a>
          </div>

          {/* Quick Links */}
          <div className="mb-5">
            <p className="text-sm font-bold mb-2 uppercase tracking-wider" style={{ color: config.theme.secondary }}>Quick Links</p>
            <div className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <Link key={link.name} href={link.href} className="text-base text-white/80 py-1">{link.name}</Link>
              ))}
            </div>
          </div>

          {/* Bottom: Copyright + Tech Partner */}
          <div className="mt-auto pt-4 border-t border-white/20">
            <div className="mb-3">
              <p className="text-sm text-white/50">Tech Partner</p>
              <a href="https://purplehatevents.in" target="_blank" rel="noopener noreferrer" className="text-base font-semibold" style={{ color: config.theme.secondary }}>PurpleHat Events</a>
            </div>
            <p className="text-sm text-white/60">© {currentYear} {config.shortName}. All rights reserved.</p>
            <div className="flex gap-5 mt-2">
              <Link href="/privacy-policy" className="text-sm text-white/60">Privacy Policy</Link>
              <Link href="/terms-conditions" className="text-sm text-white/60">Terms & Conditions</Link>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex md:flex-col md:h-full max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6 xl:gap-10 flex-1">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Image src="/logos/1.png" alt={config.shortName} width={56} height={56} className="object-contain" />
                <div>
                  <h3 className="text-base font-bold text-white">{config.shortName}</h3>
                  <p style={{ color: config.theme.secondary }} className="text-sm">{config.eventDate.start.split('-')[0]}</p>
                </div>
              </div>
              <p className="text-sm text-white/70">{config.organizationName}</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-white/90">
                  <Calendar className="w-4 h-4" style={{ color: config.theme.secondary }} />
                  <span>{dateStr}</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-4 h-4" style={{ color: config.theme.secondary }} />
                  <span>{config.venue.city}</span>
                </div>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: config.theme.secondary }}>Quick Links</h4>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-white/80 hover:text-white">{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: config.theme.secondary }}>Contact</h4>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">Apple Events</p>
                <p className="text-sm text-white/90">Ms. Lakhshmi Prabha</p>
                <a href={`tel:${config.contact.phone}`} className="flex items-center gap-2 text-sm text-white/80 hover:text-white">
                  <Phone className="w-4 h-4" />{config.contact.phone}
                </a>
                <a href={`mailto:${config.contact.email}`} className="flex items-center gap-2 text-sm text-white/80 hover:text-white min-w-0">
                  <Mail className="w-4 h-4 flex-shrink-0" /><span className="truncate">{config.contact.email}</span>
                </a>
              </div>
            </div>

            {/* Organized By */}
            <div>
              <h4 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: config.theme.secondary }}>Organized By</h4>
              <div className="flex flex-wrap gap-3 mb-4">
                <Image src="/logos/3.png" alt="ISSH" width={44} height={44} className="object-contain bg-white/10 rounded-lg p-1 lg:w-9 lg:h-9 xl:w-11 xl:h-11" />
                <Image src="/logos/4.png" alt="TOSA" width={44} height={44} className="object-contain bg-white/10 rounded-lg p-1 lg:w-9 lg:h-9 xl:w-11 xl:h-11" />
                <Image src="/logos/5.png" alt="TCOS" width={44} height={44} className="object-contain bg-white/10 rounded-lg p-1 lg:w-9 lg:h-9 xl:w-11 xl:h-11" />
                <Image src="/logos/logo.png" alt="Partner" width={44} height={44} className="object-contain bg-white/10 rounded-lg p-1 lg:w-9 lg:h-9 xl:w-11 xl:h-11" />
              </div>
              <div className="pt-3 border-t border-white/20">
                <p className="text-xs text-white/60">Tech Partner</p>
                <a href="https://purplehatevents.in" target="_blank" rel="noopener noreferrer" className="text-sm font-bold" style={{ color: config.theme.secondary }}>PurpleHat Events</a>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-5 pt-4 border-t border-white/20 flex justify-between items-center">
            <p className="text-sm text-white/60">© {currentYear} {config.shortName}. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className="text-sm text-white/60 hover:text-white">Privacy Policy</Link>
              <Link href="/terms-conditions" className="text-sm text-white/60 hover:text-white">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default FooterSection;
