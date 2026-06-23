'use client';

import { useEffect, useRef, useState } from 'react';
import { useAnimate } from 'framer-motion';

// Conference date: March 14, 2026
const COUNTDOWN_FROM = '2026-03-14T00:00:00';

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

type TimeUnit = 'Day' | 'Hour' | 'Minute' | 'Second';

export function Countdown() {
  return (
    <div className="flex items-center justify-center gap-1 md:gap-2">
      <CountdownItem unit="Day" label="Days" />
      <span className="text-lg md:text-2xl font-light" style={{ color: '#1a365d' }}>:</span>
      <CountdownItem unit="Hour" label="Hrs" />
      <span className="text-lg md:text-2xl font-light" style={{ color: '#1a365d' }}>:</span>
      <CountdownItem unit="Minute" label="Min" />
      <span className="text-lg md:text-2xl font-light" style={{ color: '#1a365d' }}>:</span>
      <CountdownItem unit="Second" label="Sec" />
    </div>
  );
}

function CountdownItem({ unit, label }: { unit: TimeUnit; label: string }) {
  const { ref, time } = useTimer(unit);
  const display = String(time).padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative overflow-hidden text-center">
        <span
          ref={ref}
          className="block font-mono font-bold"
          style={{ color: '#1a365d', fontSize: 'clamp(18px, 5vw, 32px)' }}
        >
          {display}
        </span>
      </div>
      <span 
        className="font-light"
        style={{ color: '#1a365d', fontSize: 'clamp(8px, 2vw, 12px)' }}
      >
        {label}
      </span>
    </div>
  );
}

function useTimer(unit: TimeUnit) {
  const [ref, animate] = useAnimate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeRef = useRef(0);
  const [time, setTime] = useState(0);

  useEffect(() => {
    handleCountdown();
    intervalRef.current = setInterval(handleCountdown, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCountdown = async () => {
    const end = new Date(COUNTDOWN_FROM);
    const now = new Date();
    const distance = end.getTime() - now.getTime();

    let newTime = 0;
    switch (unit) {
      case 'Day':
        newTime = Math.max(0, Math.floor(distance / DAY));
        break;
      case 'Hour':
        newTime = Math.max(0, Math.floor((distance % DAY) / HOUR));
        break;
      case 'Minute':
        newTime = Math.max(0, Math.floor((distance % HOUR) / MINUTE));
        break;
      default:
        newTime = Math.max(0, Math.floor((distance % MINUTE) / SECOND));
    }

    if (newTime !== timeRef.current) {
      if (ref.current) {
        await animate(
          ref.current,
          { y: ['0%', '-50%'], opacity: [1, 0] },
          { duration: 0.35 }
        );
      }
      timeRef.current = newTime;
      setTime(newTime);
      if (ref.current) {
        await animate(
          ref.current,
          { y: ['50%', '0%'], opacity: [0, 1] },
          { duration: 0.35 }
        );
      }
    }
  };

  return { ref, time };
}

export default Countdown;
