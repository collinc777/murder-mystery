/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'polar': {
          'gold': '#C6A962',
          'red': '#8B0000',
          'green': '#1B4D3E',
          'snow': '#F4F7F7',
          'night': '#1A1B1F',
          'steam': '#7C7C7C'
        }
      },
      fontFamily: {
        'holiday': ['Mountains of Christmas', 'cursive'],
        'ticket': ['Courier Prime', 'monospace']
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'steam': {
          '0%, 100%': { opacity: '0.3', transform: 'translateY(0)' },
          '50%': { opacity: '0.8', transform: 'translateY(-10px)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'steam': 'steam 2s ease-in-out infinite'
      },
      backgroundImage: {
        'snow-pattern': "url('/snow-pattern.png')",
        'train-tracks': "url('/train-tracks.png')"
      }
    },
  },
  plugins: [],
}

