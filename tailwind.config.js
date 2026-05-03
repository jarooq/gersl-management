/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === GERSL Design System v2 (NGO Pro) ===
        // Brand: navy "trust" primary + existing blue secondary + amber mission accent.
        // The old `primary` (Tailwind blue) is preserved as `brand` for back-compat.
        ink: {
          50:  '#f5f7fa',
          100: '#e7ecf2',
          200: '#cfd8e3',
          300: '#a8b8cc',
          400: '#7891b0',
          500: '#506f93',
          600: '#3a5879',
          700: '#2c4561',
          800: '#1f3450',  // page text on white
          900: '#0f1e36',  // headlines
        },
        navy: {
          50:  '#eef2f9',
          100: '#d6deef',
          200: '#aebde0',
          300: '#7c93cb',
          400: '#506fb4',
          500: '#2e519d',
          600: '#1f3e85',
          700: '#1a346c',
          800: '#162b58',
          900: '#0d1d3d',  // primary brand
        },
        brand: { // existing blue, kept for legacy gradients/buttons
          50: '#eff6ff',  100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a',
        },
        primary: { // alias for backwards-compat with existing class names
          50: '#eff6ff',  100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a',
        },
        mission: { // amber/gold — for impact metrics, beneficiaries served
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        success: { 50: '#ecfdf5', 600: '#059669', 700: '#047857' },
        danger:  { 50: '#fef2f2', 600: '#dc2626', 700: '#b91c1c' },
        warn:    { 50: '#fffbeb', 600: '#d97706', 700: '#b45309' },

        border: "hsl(214.3 31.8% 91.4%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222.2 84% 4.9%)",
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222.2 84% 4.9%)",
        },
        muted: {
          DEFAULT: "hsl(210 40% 96.1%)",
          foreground: "hsl(215.4 16.3% 46.9%)",
        },
      },
      fontSize: {
        'display': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h1':      ['1.875rem',{ lineHeight: '2.25rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h2':      ['1.5rem',  { lineHeight: '2rem',    letterSpacing: '-0.015em', fontWeight: '600' }],
        'h3':      ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em', fontWeight: '600' }],
      },
      borderRadius: {
        'lg2': '0.625rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 15px rgba(59, 130, 246, 0.5)',
        // v2 NGO design — subtle, layered.
        'card':  '0 1px 2px 0 rgb(15 30 61 / 0.04), 0 1px 3px 0 rgb(15 30 61 / 0.06)',
        'lift':  '0 4px 6px -1px rgb(15 30 61 / 0.06), 0 2px 4px -2px rgb(15 30 61 / 0.04)',
        'pop':   '0 10px 15px -3px rgb(15 30 61 / 0.08), 0 4px 6px -4px rgb(15 30 61 / 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    {
      pattern: /bg-(blue|green|purple|red|orange|yellow|indigo|pink|teal|cyan)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /text-(blue|green|purple|red|orange|yellow|indigo|pink|teal|cyan)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /border-(blue|green|purple|red|orange|yellow|indigo|pink|teal|cyan)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /from-(blue|green|purple|red|orange|yellow|indigo|pink|teal|cyan)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /to-(blue|green|purple|red|orange|yellow|indigo|pink|teal|cyan)-(50|100|200|300|400|500|600|700|800|900)/,
    },
  ],
}