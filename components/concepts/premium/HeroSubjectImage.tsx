'use client';

/**
 * Hero subject: the athlete as a transparent cut-out (no white background, so no
 * box in any theme), grayscaled for a duotone look and flipped to run toward the
 * copy. object-contain shows the whole figure with no cropping.
 */
export function HeroSubjectImage() {
  return (
    <div className="relative h-full w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ismc/athletes/v4.png"
        alt="Athlete"
        className="absolute inset-0 h-full w-full object-contain object-center"
        style={{ filter: 'grayscale(1) contrast(1.06)', transform: 'scaleX(-1)' }}
      />
    </div>
  );
}
