'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from './motion';

/** Low-poly wireframe runner that draws itself on. Theme-agnostic strokes. */
const N: Record<string, [number, number]> = {
  head: [60, 15], neck: [55, 25], shoulder: [52, 30], chest: [50, 41], hip: [46, 58],
  elbowBack: [40, 41], handBack: [30, 53],
  elbowFront: [66, 40], handFront: [77, 33],
  kneeFront: [58, 77], ankleFront: [70, 93], toeFront: [79, 97],
  kneeBack: [34, 81], ankleBack: [24, 99], toeBack: [17, 103],
};
const E: [string, string][] = [
  ['head', 'neck'], ['neck', 'shoulder'], ['shoulder', 'chest'], ['chest', 'hip'],
  ['shoulder', 'elbowBack'], ['elbowBack', 'handBack'],
  ['shoulder', 'elbowFront'], ['elbowFront', 'handFront'],
  ['hip', 'kneeFront'], ['kneeFront', 'ankleFront'], ['ankleFront', 'toeFront'],
  ['hip', 'kneeBack'], ['kneeBack', 'ankleBack'], ['ankleBack', 'toeBack'],
  // facets
  ['neck', 'chest'], ['chest', 'elbowFront'], ['chest', 'elbowBack'],
  ['hip', 'chest'], ['shoulder', 'hip'], ['head', 'shoulder'], ['hip', 'kneeFront'],
];

export function HeroSubjectVector() {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full w-full items-center justify-center">
      <motion.svg
        viewBox="0 0 100 115"
        className="h-[88%] w-auto"
        initial={reduce ? undefined : { opacity: 0 }}
        animate={reduce ? undefined : { opacity: 1 }}
        transition={{ duration: 0.6 }}
        aria-hidden="true"
      >
        {/* faint floor ellipse */}
        <ellipse cx="50" cy="107" rx="34" ry="3" fill="none" stroke="var(--p-hairline)" strokeWidth="0.4" />
        {E.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={N[a][0]} y1={N[a][1]} x2={N[b][0]} y2={N[b][1]}
            stroke="var(--p-subject)" strokeWidth="0.5" strokeLinecap="round"
            initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: EASE }}
          />
        ))}
        {Object.entries(N).map(([k, [x, y]], i) => (
          <motion.circle
            key={k}
            cx={x} cy={y} r={k === 'head' ? 4.4 : 1.2}
            fill={k === 'head' ? 'none' : 'var(--p-accent)'}
            stroke={k === 'head' ? 'var(--p-subject)' : 'none'}
            strokeWidth={k === 'head' ? 0.6 : 0}
            initial={{ scale: reduce ? 1 : 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 + i * 0.04, duration: 0.5, ease: EASE }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          />
        ))}
      </motion.svg>
    </div>
  );
}
