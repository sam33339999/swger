/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#06b6d4',
        light: '#f9fafb',
        dark: '#1f2937',
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      backgroundColor: {
        'glass': 'rgba(255, 255, 255, 0.25)',
        'glass-dark': 'rgba(17, 25, 40, 0.75)',
      },
      borderColor: {
        'glass': 'rgba(255, 255, 255, 0.18)',
      },
    },
  },
  plugins: [],
}
