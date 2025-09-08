/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'hindi': ['Noto Sans Devanagari', 'Arial', 'sans-serif'],
      },
      colors: {
        'whatsapp': {
          'primary': '#25D366',
          'light': '#DCF8C6',
          'cream': '#F7F7F7',
          'dark': '#128C7E',
          'gray': '#667781',
          'border': '#E5E5E5',
        }
      },
      animation: {
        'typing': 'typing 1.5s infinite',
      },
      keyframes: {
        typing: {
          '0%, 60%, 100%': { opacity: '0.2' },
          '30%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};