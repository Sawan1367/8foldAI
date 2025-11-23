/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app': '#f8fafc',
        '--brand': '#2563eb',
        '--muted': '#64748b',
      }
    },
  },
  plugins: [],
}
