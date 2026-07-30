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
        // ink + navy + mission were the pre-HubSpot palette. Every page in
        // the app was written against these class names, so instead of
        // sweeping ~1,500 references we repoint the values at the HubSpot
        // equivalents. `bg-navy-900`, `text-ink-600`, `text-mission-300`
        // still work — they just render in HubSpot tones now.
        ink: { // neutrals — was custom slate, now points at hs-slate
          50:  '#f5f8fa',
          100: '#eaf0f6',
          200: '#dfe3eb',
          300: '#cbd6e2',
          400: '#a3b8cf',
          500: '#7c98b6',
          600: '#516f90',
          700: '#425b76',
          800: '#33475b',  // page text on white
          900: '#213343',  // headlines
        },
        navy: { // primary brand — was custom deep navy, now points at hs-navy
          50:  '#eaf0f6',
          100: '#dfe3eb',
          200: '#cbd6e2',
          300: '#a3b8cf',
          400: '#7c98b6',
          500: '#516f90',
          600: '#425b76',
          700: '#33475b',
          800: '#213343',
          900: '#0d1926',  // primary brand
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
        mission: { // was amber/gold — now points at HubSpot orange so
                   // legacy `text-mission-300` etc. render as the new accent.
          50:  '#fff5f1',
          100: '#ffe4d9',
          200: '#ffc3ac',
          300: '#ff9c78',
          400: '#ff8562',
          500: '#ff7a59',
          600: '#f55a35',
          700: '#e14b28',
          800: '#b3391e',
          900: '#7a2712',
        },

        // ============================================
        // HubSpot Console redesign — Aug 2026
        // ============================================
        // HubSpot's actual palette lifted from their design system so the
        // app reads as a console tool rather than a generic dashboard.
        // Use `orange` for primary CTAs, `hs-navy` for headers/sidebar,
        // `hs-slate` scale for neutrals.
        orange: { // HubSpot signature orange — primary CTA + brand accent
          50:  '#fff5f1',
          100: '#ffe4d9',
          200: '#ffc3ac',
          300: '#ff9c78',
          400: '#ff8562',
          500: '#ff7a59',  // primary
          600: '#f55a35',
          700: '#e14b28',
          800: '#b3391e',
          900: '#7a2712',
        },
        'hs-navy': { // HubSpot dark navy — headers, sidebar, headline text
          50:  '#eaf0f6',
          100: '#dfe3eb',
          200: '#cbd6e2',
          300: '#a3b8cf',
          400: '#7c98b6',
          500: '#516f90',
          600: '#425b76',
          700: '#33475b',  // body text + sidebar
          800: '#213343',
          900: '#0d1926',
        },
        'hs-slate': { // Neutrals — cards, borders, backgrounds
          50:  '#f5f8fa',  // page background
          100: '#eaf0f6',
          200: '#dfe3eb',
          300: '#cbd6e2',  // card border
          400: '#a3b8cf',
          500: '#7c98b6',
          600: '#516f90',
          700: '#425b76',
          800: '#33475b',
          900: '#213343',
        },
        'hs-teal': { // HubSpot success/positive
          50:  '#e5f5f3',
          500: '#00bda5',
          600: '#00a693',
          700: '#008878',
        },
        'hs-red': { // HubSpot destructive/error
          50:  '#fdeeef',
          500: '#f2545b',
          600: '#e13e46',
          700: '#c62d34',
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
        // HubSpot pairs Lexend Deca with Inter for headings — softer glyph
        // shapes than Inter alone. Falls back cleanly if Lexend Deca isn't
        // loaded.
        display: ['"Lexend Deca"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 15px rgba(59, 130, 246, 0.5)',
        // v2 NGO design — subtle, layered.
        'card':  '0 1px 2px 0 rgb(15 30 61 / 0.04), 0 1px 3px 0 rgb(15 30 61 / 0.06)',
        'lift':  '0 4px 6px -1px rgb(15 30 61 / 0.06), 0 2px 4px -2px rgb(15 30 61 / 0.04)',
        'pop':   '0 10px 15px -3px rgb(15 30 61 / 0.08), 0 4px 6px -4px rgb(15 30 61 / 0.04)',
        // HubSpot console redesign — flatter and quieter than the older shadows.
        'hs-card':   '0 1px 2px rgb(0 0 0 / 0.04)',
        'hs-lift':   '0 2px 4px rgb(0 0 0 / 0.06), 0 4px 8px rgb(0 0 0 / 0.04)',
        'hs-drawer': '-4px 0 12px rgb(0 0 0 / 0.08)',
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