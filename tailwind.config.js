/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f6efe2',
        paperDeep: '#eadfca',
        ink: '#1f2a35',
        mutedInk: '#667684',
        cinnabar: '#b6453d',
        celadon: '#7ba99c',
      },
      boxShadow: {
        paper: '0 20px 60px rgba(68, 54, 35, 0.10)',
      },
      fontFamily: {
        song: ['"Noto Serif SC"', '"Songti SC"', '"SimSun"', 'serif'],
        sans: ['"Inter"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
