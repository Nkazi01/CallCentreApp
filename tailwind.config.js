/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // IY Finance Brand Colors
        'header-nav': '#0D4D3D',
        'primary-cta': '#708238',
        'logo-accent': '#7CB342',
        'success': '#4CAF50',
        'background': '#FFFFFF',
        'secondary-bg': '#F5F5F5',
        'text-primary': '#333333',
        'text-secondary': '#999999',
        'border': '#E0E0E0',
        'status-success': '#4CAF50',
        'status-progress': '#2196F3',
        'status-warning': '#FF9800',
        'status-error': '#F44336',
        'status-neutral': '#9E9E9E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

