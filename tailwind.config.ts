import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Basma FinTech palette
        navy: {
          DEFAULT: '#0A192F',
          50: '#E6ECF4',
          100: '#C1CEDF',
          200: '#8FA4C2',
          300: '#5D7AA5',
          400: '#2B5088',
          500: '#14386F',
          600: '#0F2A56',
          700: '#0A192F',
          800: '#07132A',
          900: '#040B1A',
        },
        electric: {
          DEFAULT: '#0070F3',
          400: '#3391FF',
          500: '#0070F3',
          600: '#005CC9',
        },
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        glow: '0 0 40px rgba(0, 112, 243, 0.35)',
        'glow-sm': '0 0 20px rgba(0, 112, 243, 0.25)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.5s ease-out',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '80%, 100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
