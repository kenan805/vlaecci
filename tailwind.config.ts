import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // VLAECCI brand palette — CSS-variable backed so the whole admin can theme (light/dark)
        white: 'rgb(var(--c-white) / <alpha-value>)',
        cream: {
          50: 'rgb(var(--c-cream-50) / <alpha-value>)',
          100: 'rgb(var(--c-cream-100) / <alpha-value>)',
          200: 'rgb(var(--c-cream-200) / <alpha-value>)',
          300: 'rgb(var(--c-cream-300) / <alpha-value>)',
          400: 'rgb(var(--c-cream-400) / <alpha-value>)',
        },
        sand: {
          50: 'rgb(var(--c-sand-50) / <alpha-value>)',
          100: 'rgb(var(--c-sand-100) / <alpha-value>)',
          200: 'rgb(var(--c-sand-200) / <alpha-value>)',
          300: 'rgb(var(--c-sand-300) / <alpha-value>)',
          400: 'rgb(var(--c-sand-400) / <alpha-value>)',
        },
        brown: {
          50: 'rgb(var(--c-brown-50) / <alpha-value>)',
          100: 'rgb(var(--c-brown-100) / <alpha-value>)',
          200: 'rgb(var(--c-brown-200) / <alpha-value>)',
          300: 'rgb(var(--c-brown-300) / <alpha-value>)',
          400: 'rgb(var(--c-brown-400) / <alpha-value>)',
        },
        accent: {
          rose: 'rgb(var(--c-accent-rose) / <alpha-value>)',
          sage: 'rgb(var(--c-accent-sage) / <alpha-value>)',
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
