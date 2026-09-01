// ============================================================
// tailwind.config.js — DESIGN SYSTEM CONFIGURATION
// ============================================================
// This file extends the default Tailwind CSS configuration.
// It defines the project's custom design tokens (colors,
// animations) that are used as Tailwind utility classes
// throughout all JSX files.
//
// How Tailwind processes this:
//   1. Scans all files listed in `content` for class names
//   2. Generates ONLY the CSS for classes actually used
//   3. This "purging" of unused styles keeps the final CSS bundle tiny
// ============================================================

/** @type {import('tailwindcss').Config} */
export default {
  // CONTENT PATHS — tells Tailwind WHERE to scan for class names.
  // It will look inside index.html and all JS/JSX/TS/TSX files in src/.
  // Any Tailwind class NOT found in these files is removed in production.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      // ── CUSTOM COLOR TOKENS ──────────────────────────────
      // These extend Tailwind's default color palette.
      // Usage in JSX: className="bg-primary", className="text-darkbg", etc.
      colors: {
        primary: '#E91E63',   // Hot pink — used for: FAULT highlights, CTA buttons,
                              //            active tab/button borders, Pie chart fault slice
        darkbg:  '#121212',   // Near-black — the main page background color
                              //   (also set manually in index.css for body)
        cardbg:  '#1E1E2F',   // Dark navy — all card/panel backgrounds, table body
      },

      // ── CUSTOM ANIMATIONS ────────────────────────────────
      // Defines a "fade in + slide up" animation for the results section.
      // Usage in JSX: className="animate-fade-in-up"
      keyframes: {
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' }, // start: invisible, shifted down
          '100%': { opacity: '1', transform: 'translateY(0)'    }, // end:   fully visible, normal position
        }
      },
      animation: {
        // Maps the keyframe to a usable Tailwind class:
        //   0.5s    → duration: half a second
        //   ease-out → starts fast, decelerates at end (feels natural)
        //   forwards → stays at the final keyframe state after animating
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      }
    },
  },

  // No additional Tailwind plugins are used in this project
  plugins: [],
}
