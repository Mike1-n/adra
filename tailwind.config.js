/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#00856A',
          dark: '#006B56',
          light: '#E8F5F1',
          white: '#FFFFFF',
          black: '#1C1C1C',
          gray: '#F5F7F6',
        },
        adra: {
          primary: '#00856A',
          dark: '#006B56',
          light: '#E8F5F1',
          white: '#FFFFFF',
          black: '#1C1C1C',
          gray: '#F5F7F6',
          50: '#E8F5F1',
          100: '#E8F5F1',
          200: '#c2eadc',
          300: '#8ed6c1',
          400: '#00a382',
          500: '#00856A', // Primary
          600: '#006B56', // Dark Green
          700: '#005443',
          800: '#003e32',
          900: '#002921',
          navy: '#1C1C1C',
          card: '#222423',
          accent: '#00856A',
        },
        emerald: {
          50: '#E8F5F1',  // Light Green
          100: '#E8F5F1',
          200: '#c2eadc',
          300: '#8ed6c1',
          400: '#00a382',
          500: '#00856A', // Primary
          600: '#006B56', // Dark Green
          700: '#005443',
          800: '#003e32',
          900: '#002921',
          950: '#001a15',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          850: '#111827',
          900: '#0F172A',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
        'card-glow': '0 0 25px -5px rgba(0, 133, 106, 0.12)',
        'brand-glow': '0 0 20px -2px rgba(0, 133, 106, 0.20)',
      }
    },
  },
  plugins: [],
}
