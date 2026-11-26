/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#F6F8F6',
        surface: '#FFFFFF',
        border: '#E4EBE5',
        brand: {
          DEFAULT: '#1B5E42',
          hover: '#144832',
        },
        amber: {
          plumage: '#D97706',
        },
        ink: {
          primary: '#111827',
          secondary: '#4B5563',
          muted: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
