import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const getColorShades = (shades: number[], name = 'primary') =>
  shades.reduce<Record<number, string>>(
    (a, v) => ({ ...a, [v]: `rgb(var(--tw-clr-${name}-${v}))` }),
    {},
  );

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        primary: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Customize it on globals.css :root
        primary: getColorShades([50, 100, 200, 300, 400, 500, 600, 700]),
      },
    },
  },
  plugins: [],
} satisfies Config;
