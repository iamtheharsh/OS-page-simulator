// ============================================================
// Navbar.jsx — STICKY TOP NAVIGATION BAR
// ============================================================
// Renders on every page (mounted in App.jsx outside <Routes>).
// Uses useLocation() to detect the current URL and highlight
// the active navigation link with a pink color.
// ============================================================

import React from 'react';

// Link  → like <a> but prevents full page reload (SPA navigation)
// useLocation → React Router hook that returns the current URL object
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  // location.pathname gives the current URL path, e.g. "/" or "/simulator"
  // We use this to apply the active (pink) style to the matching nav item
  const location = useLocation();

  return (
    // sticky top-0 z-50 → Navbar stays fixed at the top while scrolling
    // bg-[#2D234A] → deep purple background (custom hex, not a Tailwind token)
    // shadow-md → subtle drop shadow below the navbar
    <nav className="bg-[#2D234A] py-4 px-8 flex justify-between items-center text-white sticky top-0 z-50 shadow-md">

      {/* ── LEFT SIDE: Logo + Brand Name ── */}
      <div className="flex items-center gap-3">
        {/* Clicking the logo navigates back to the Home page */}
        <Link to="/" className="flex items-center gap-3">

          {/* Circular white container holds the logo image */}
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
            <img src="/images/logo1.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>

          {/* Brand/app name */}
          <h1 className="text-xl font-bold tracking-wide">Page Replacement Algorithms</h1>
        </Link>
      </div>

      {/* ── RIGHT SIDE: Navigation Links ── */}
      <div className="flex items-center gap-4 text-sm font-bold">

        {/* HOME icon link — shows a house SVG icon instead of text.
            Active check: if current path is "/" → text-pink-400 (highlighted)
            Otherwise: text-gray-300 (dimmed) */}
        <Link
          to="/"
          className={`hover:text-pink-400 transition-colors flex items-center ${
            location.pathname === '/' ? 'text-pink-400' : 'text-gray-300'
          }`}
          title="Home" // tooltip on hover
        >
          {/* Inline SVG: house/home icon from Heroicons */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>

        {/* SIMULATOR button → navigates to the interactive simulator page
            bg-primary = #E91E63 (hot pink, from tailwind.config.js) */}
        <Link
          to="/simulator"
          className="bg-primary hover:bg-pink-600 text-white py-2 px-6 rounded-md transition-colors duration-200"
        >
          Simulator
        </Link>

        {/* ALGORITHMS button → navigates to the educational reference page */}
        <Link
          to="/algorithms"
          className="bg-primary hover:bg-pink-600 text-white py-2 px-6 rounded-md transition-colors duration-200"
        >
          Algorithms
        </Link>

      </div>
    </nav>
  );
};

export default Navbar;
