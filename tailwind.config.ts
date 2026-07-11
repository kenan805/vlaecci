import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // VLAECCI brand palette - soft beauty tones
        cream: {
          50: '#FDFCFA',
          100: '#FAF8F4',
          200: '#F5F1E9',
          300: '#EDE6DA',
          400: '#E0D5C4',
        },
        sand: {
          50: '#F7F4EF',
          100: '#EDE8E0',
          200: '#DED5C8',
          300: '#C4B8A8',
          400: '#A89885',
        },
        brown: {
          50: '#8B7355',
          100: '#6B5344',
          200: '#5A4A3D',
          300: '#4A3D32',
          400: '#3D3329',
        },
        accent: {
          rose: '#C9A88E',
          sage: '#9CAF88',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
