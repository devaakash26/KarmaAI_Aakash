/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'media', // or 'class'
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#2d3748', // Custom darker gray
          850: '#1e2030', // Custom even darker gray
        }
      },
      backgroundColor: {
        'gray-850': 'var(--gray-850)',
      },
      // Add custom hover variants
      variants: {
        extend: {
          backgroundColor: ['dark', 'dark-hover', 'hover'],
        },
      },
    },
  },
  plugins: [
    // Add custom plugin to handle dark mode hover states
    function({ addUtilities }) {
      const newUtilities = {
        '.dark-hover-bg-gray-700': {
          '@media (prefers-color-scheme: dark)': {
            '&:hover': {
              backgroundColor: 'rgba(55, 65, 81, 0.5)',
            },
          },
        },
      }
      addUtilities(newUtilities)
    },
  ],
} 