import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07080B',
          900: '#0A0C11',
          850: '#0E1117',
          800: '#12151C',
          750: '#171B24',
          700: '#1E2330',
        },
        chalk: '#F4F6FA',
        muted: '#949DAF',
        faint: '#7A8496',
        accent: {
          DEFAULT: '#7B8CFF',
          soft: '#A3AFFF',
          deep: '#5566E0',
        },
        signal: '#56D6C4',
        legacy: '#D8A25E',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        label: '0.18em',
        meta: '0.08em',
      },
      maxWidth: {
        shell: '1240px',
      },
      screens: {
        xs: '460px',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'rise': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'dash': {
          to: { strokeDashoffset: '-1000' },
        },
        'breathe': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.75' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        rise: 'rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        dash: 'dash 14s linear infinite',
        breathe: 'breathe 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
