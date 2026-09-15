import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  /** 'icon' = compact round button (navbar). 'row' = labelled row (menus/settings). */
  variant?: 'icon' | 'row';
  className?: string;
}

/** Sun / moon / monitor dark-mode switch, wired to ThemeContext.
 *  Cycles: system (OS) → light → dark → system. */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
}) => {
  const { mode, resolved, toggle } = useTheme();
  const isDark = resolved === 'dark';

  // Icon and label based on the active stored mode (not just resolved brightness).
  const icon =
    mode === 'system' ? <Monitor size={18} /> :
    mode === 'dark'   ? <Moon size={18} />    :
                        <Sun size={18} />;

  const modeLabel =
    mode === 'system' ? 'System (auto)' :
    mode === 'dark'   ? 'Dark'          :
                        'Light';

  const nextLabel =
    mode === 'system' ? `Switch to ${isDark ? 'light' : 'dark'} mode` :
    mode === 'light'  ? 'Switch to dark mode'                          :
                        'Switch to system (auto) mode';

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={nextLabel}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl2 border border-line bg-white px-4 py-3 text-left transition-colors hover:border-ocean-300 ${className}`}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl2 bg-fill text-ocean-600">
            {icon}
          </span>
          <span>
            <span className="block text-sm font-bold text-ink">Theme</span>
            <span className="block text-xs text-slate-muted">{modeLabel}</span>
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
      aria-label={nextLabel}
      title={`${modeLabel} — click to cycle`}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-slate-body transition-colors hover:text-ocean-600 hover:border-ocean-300 ${className}`}
    >
      {icon}
    </button>
  );
};
