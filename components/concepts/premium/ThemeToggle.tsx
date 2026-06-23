'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-[var(--p-glass-border)] ${className}`}
      style={{ borderColor: 'var(--p-glass-border)', color: 'var(--p-text)' }}
    >
      {mounted ? (
        dark ? <Sun className="h-[15px] w-[15px]" /> : <Moon className="h-[15px] w-[15px]" />
      ) : (
        <span className="h-[15px] w-[15px]" />
      )}
    </button>
  );
}
