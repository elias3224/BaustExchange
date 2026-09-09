import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4fb',
          100: '#d6e4f4',
          500: '#1d4e89',
          600: '#194271',
          700: '#143459',
        },
      },
    },
  },
  plugins: [],
};

export default config;
