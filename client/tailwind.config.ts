import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        'times-roman': ['Times New Roman', 'Times', 'serif'],
        sans: ['Poppins', 'sans-serif'],
        serif: ['Times New Roman', 'Times', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
