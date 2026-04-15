/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nasa-blue': '#0B3D91',
        'nasa-red': '#FC3D21',
        'space-black': '#0a0a0f',
        'lunar-gray': '#4a4a4a',
        'console-green': '#00ff00',
        'warning-amber': '#ffc107',
        'danger-red': '#dc3545',
      },
      fontFamily: {
        'mono': ['Space Mono', 'Courier New', 'monospace'],
        'display': ['Orbitron', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'thrust': 'thrust 0.1s ease-in-out infinite',
        'stars': 'twinkle 2s ease-in-out infinite',
      },
      keyframes: {
        thrust: {
          '0%, 100%': { opacity: 0.8, transform: 'scaleY(1)' },
          '50%': { opacity: 1, transform: 'scaleY(1.2)' },
        },
        twinkle: {
          '0%, 100%': { opacity: 0.3 },
          '50%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
