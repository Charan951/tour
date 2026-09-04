import type { Config } from 'tailwindcss';

/**
 * Tailwind v4: the design system lives in `src/styles/globals.css` under `@theme`
 * (colours, fonts, radii, shadows, easing). This file only sets `content` for
 * class scanning — do not re-declare tokens here.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
} satisfies Config;
