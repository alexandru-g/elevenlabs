/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#1A1D21',
          secondary: '#232629',
          tertiary: '#2C2F33',
          hover: '#35383C',
        },
        accent: {
          blue: '#5B9FE3',
          cyan: '#4ECDC4',
          purple: '#8B7FE8',
          amber: '#F4A259',
          red: '#E76F51',
        },
        status: {
          active: '#4ECDC4',
          warning: '#F4A259',
          critical: '#E76F51',
          success: '#6BCF7F',
        },
        text: {
          primary: '#E8EAED',
          secondary: '#9AA0A6',
          tertiary: '#6C7278',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: '11px',
        sm: '13px',
        base: '15px',
        lg: '17px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 4px 16px rgba(0, 0, 0, 0.3)',
        elevated: '0 8px 32px rgba(0, 0, 0, 0.4)',
        glow: '0 0 20px rgba(91, 159, 227, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'waveform': 'waveform 0.5s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        waveform: {
          '0%': { transform: 'scaleY(0.3)' },
          '100%': { transform: 'scaleY(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
