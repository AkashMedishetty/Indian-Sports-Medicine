/**
 * ISMC 2026 — shared homepage content.
 *
 * Single source of truth for the marketing/landing concepts so all three stay
 * factually identical. Conference-wide values (name, theme) come from the
 * backend config; poster-specific facts live here until the client confirms them.
 */
import { conferenceConfig } from '@/config/conference.config';

export const ismc = {
  name: conferenceConfig.name, // "Indian Sports Medicine Conference 2026"
  shortName: conferenceConfig.shortName, // "ISMC 2026"
  titleLines: ['Indian', 'Sports', 'Medicine'] as const,
  kicker: 'Conference',
  tagline: conferenceConfig.tagline ?? 'Uniting Science, Practice & Performance for Stronger Athletes',
  closing: 'Together, Advancing Sports Health. Elevating Performance.',

  dates: {
    main: '5 & 6 September 2026',
    mainShort: 'Sep 5–6, 2026',
    workshop: '7 September 2026',
    iso: { start: '2026-09-05T09:00:00+05:30', end: '2026-09-06T18:00:00+05:30' },
  },

  venue: {
    city: conferenceConfig.venue.city, // Hyderabad
    state: conferenceConfig.venue.state, // Telangana
    label: 'Hyderabad, India',
    note: 'Venue to be announced',
  },

  registration: {
    status: 'Open Soon' as const,
    secretary: 'Dr. Nithin',
  },

  organizers: [
    {
      name: 'Indian Association of Sports Medicine',
      short: 'IASM',
      scope: 'National',
      logo: '/logos/iasm.png', // TODO: add crest from poster
    },
    {
      name: 'Telangana Association of Sports Medicine',
      short: 'TASM',
      scope: 'Telangana',
      logo: '/logos/tasm.png', // TODO: add crest from poster
    },
  ],

  // The arc of an athlete — used as section pillars across concepts.
  pillars: [
    { key: 'science', label: 'Science', line: 'Evidence, biomechanics and the research behind performance.' },
    { key: 'practice', label: 'Practice', line: 'Diagnosis, repair and rehabilitation from the people who do it.' },
    { key: 'performance', label: 'Performance', line: 'Return-to-play and the pursuit of the next personal best.' },
  ],

  // Highlights for the "why attend" rail.
  highlights: [
    { stat: '2', label: 'Days of sessions', sub: 'Sep 5–6, 2026' },
    { stat: '+1', label: 'Hands-on workshop', sub: 'Sep 7, 2026' },
    { stat: '2', label: 'National & state bodies', sub: 'IASM × TASM' },
    { stat: 'CME', label: 'Accredited learning', sub: 'For the full team' },
  ],

  nav: [
    { label: 'About', href: '/about' },
    { label: 'Program', href: '/program-schedule' },
    { label: 'Workshop', href: '/register#workshops' },
    { label: 'Abstracts', href: '/abstracts' },
    { label: 'Venue', href: '/venue' },
    { label: 'Contact', href: '/contact' },
  ],

  cta: {
    register: '/register',
    abstracts: '/abstracts',
    program: '/program-schedule',
    login: '/auth/login',
    contact: '/contact',
  },

  // Keyword marquee strip
  marqueeWords: [
    'Science', 'Practice', 'Performance', 'Return-to-play', 'Biomechanics',
    'Rehabilitation', 'Hyderabad', 'Sep 5–6 2026',
  ],

  // "About the conference" stepper — the arc of an athlete
  programStepper: [
    { label: 'Injury', caption: 'The mechanism and the moment of load failure.' },
    { label: 'Diagnosis', caption: 'Imaging, biomechanics and evidence-led assessment.' },
    { label: 'Treatment', caption: 'Surgical and conservative care pathways.' },
    { label: 'Rehabilitation', caption: 'Staged, measured recovery and conditioning.' },
    { label: 'Return-to-play', caption: 'Back to sport — stronger, and built to last.' },
  ],

  about: {
    overline: 'About the conference',
    heading: 'Two days that follow the full signal of an athlete.',
    // two-tone paragraph: words flagged `em: true` render solid, the rest muted
    body: [
      { t: 'The Indian Sports Medicine Conference unites ', em: false },
      { t: 'science, practice and performance', em: true },
      { t: ' — from the evidence in the lab to the moment an athlete ', em: false },
      { t: 'returns to play', em: true },
      { t: '. Two days of sessions on September 5–6, then a hands-on workshop on the 7th.', em: false },
    ],
  },

  // Committee — placeholders (TODO: confirm names/photos)
  committee: [
    { name: 'Dr. Nithin', role: 'Conference Secretary', org: 'TASM', photo: '/ismc/committee/secretary.jpg' },
    { name: 'To be announced', role: 'Organising Chairman', org: 'IASM', photo: '/ismc/committee/chairman.jpg' },
    { name: 'To be announced', role: 'Scientific Chair', org: 'IASM', photo: '/ismc/committee/scientific.jpg' },
    { name: 'To be announced', role: 'Treasurer', org: 'TASM', photo: '/ismc/committee/treasurer.jpg' },
    { name: 'To be announced', role: 'Workshop Convener', org: 'TASM', photo: '/ismc/committee/workshop.jpg' },
    { name: 'To be announced', role: 'Joint Secretary', org: 'IASM', photo: '/ismc/committee/joint.jpg' },
  ],

  // Venue & host city (Hyderabad)
  hostCity: {
    name: 'Hyderabad',
    tagline: 'The City of Pearls',
    intro:
      'A hub for sports science and elite healthcare, Hyderabad blends rich heritage with world-class infrastructure — the right stage for a national sports medicine conference.',
    image: '/ismc/venue/hyderabad.jpg', // TODO: add host-city image
    facts: [
      { k: 'Venue', v: 'To be announced' },
      { k: 'Dates', v: 'Sep 5–6, 2026' },
      { k: 'Workshop', v: 'Sep 7, 2026' },
    ],
    highlights: [
      { title: 'Sports Medicine Excellence', desc: 'Leading rehabilitation institutes and elite orthopaedic & physiotherapy centres.' },
      { title: 'World-class Connectivity', desc: '30 minutes from Rajiv Gandhi International Airport; metro access across the city.' },
      { title: 'Culture & Cuisine', desc: 'Charminar, Golconda, Hussain Sagar — and the famous Hyderabadi biryani.' },
    ],
    landmarks: [
      { name: 'Charminar', img: '/ismc/venue/charminar.jpg' },
      { name: 'Golconda Fort', img: '/ismc/venue/golconda.png' },
      { name: 'Hussain Sagar', img: '/ismc/venue/hussain-sagar.png' },
      { name: 'Birla Mandir', img: '/ismc/venue/birla-mandir.jpg' },
      { name: 'HITEC City', img: '/ismc/venue/hitec-city.jpg' },
    ],
  },

  // Brochures (downloads) — placeholder PDFs in /public/brochures
  brochures: [
    { title: 'Conference Brochure', desc: 'Overview, themes and key dates.', file: '/brochures/ismc-2026-brochure.pdf', kind: 'PDF' },
    { title: 'Scientific Programme', desc: 'Full two-day agenda and workshop.', file: '/brochures/ismc-2026-programme.pdf', kind: 'PDF' },
    { title: 'Registration Form', desc: 'Offline registration & categories.', file: '/brochures/ismc-2026-registration.pdf', kind: 'PDF' },
  ],
} as const;

export type IsmcContent = typeof ismc;
