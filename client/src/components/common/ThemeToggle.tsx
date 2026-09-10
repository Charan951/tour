import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  /** 'icon' = compact round button (navbar). 'row' = labelled row (menus/settings). */
  variant?: 'icon' | 'row';
  className?: string;
}

/** Sun / moon dark-mode switch, wired to ThemeContext. */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
}) => {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl2 border border-line bg-white px-4 py-3 text-left transition-colors hover:border-ocean-300 ${className}`}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl2 bg-fill text-ocean-600">
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
          </span>
          <span>
            <span className="block text-sm font-bold text-ink">Dark mode</span>
            <span className="block text-xs text-slate-muted">
              {isDark ? 'On' : 'Off'}
            </span>
          </span>
        </span>
        <span
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            isDark ? 'bg-ocean-600' : 'bg-line'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              isDark ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-slate-body transition-colors hover:text-ocean-600 hover:border-ocean-300 ${className}`}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
