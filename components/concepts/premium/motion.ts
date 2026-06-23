// Shared motion language for the premium (MYDNA-style) sections.
// Slow, calm, premium easing. Every consumer also honours prefers-reduced-motion.

export const EASE = [0.16, 1, 0.3, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.08, ease: EASE },
  }),
};

export const lineRise = {
  hidden: { y: '115%' },
  show: (i = 0) => ({
    y: '0%',
    transition: { duration: 0.95, delay: 0.1 + i * 0.09, ease: EASE },
  }),
};

export const fade = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({ opacity: 1, transition: { duration: 0.9, delay: i * 0.08, ease: EASE } }),
};

export const inView = { once: true, margin: '-80px' } as const;
