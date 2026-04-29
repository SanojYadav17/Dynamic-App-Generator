import type { Config } from 'tailwindcss';

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: '#0b1020',
        paper: '#f7f4ee',
        sand: '#e8dcc7',
        ember: '#ff7a59',
        mint: '#7ee0c3',
        sky: '#7cc4ff'
      },
      boxShadow: {
        glow: '0 20px 60px rgba(15, 23, 42, 0.14)'
      },
      backgroundImage: {
        'radial-grid': 'radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.08) 1px, transparent 0)'
      }
    }
  },
  plugins: []
};

export default config;