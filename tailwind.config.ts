import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: '#10263f',
        slate: '#eaf1f8',
        brand: '#2563eb',
        accent: '#f59e0b',
      },
    },
  },
  plugins: [],
};

export default config;
