// ============================================================
// App.jsx — ROOT COMPONENT & ROUTE DEFINITIONS
// ============================================================
// This component is the "skeleton" of the entire app.
// It defines:
//   1. Which URL path shows which page component
//   2. The Navbar, which is always visible on every page
// ============================================================

import React from 'react';

// Navbar is always rendered at the top of the screen
import Navbar from './components/Navbar';

// The three page components — each corresponds to one URL route
import Home       from './pages/Home';
import Simulator  from './pages/Simulator';
import Algorithms from './pages/Algorithms';

// Routes  = the container that holds all route definitions
// Route   = maps a URL path to a component
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    // Outer wrapper: full-screen height, dark background, white text
    // These Tailwind classes use our custom design tokens from tailwind.config.js:
    //   bg-darkbg  → #121212 (near-black)
    //   text-white → #ffffff
    //   font-sans  → system sans-serif stack
    <div className="min-h-screen bg-darkbg text-white font-sans">

      {/* Navbar is rendered OUTSIDE <Routes> so it appears
          on EVERY page regardless of the current URL */}
      <Navbar />

      {/* <main> wraps the page content area.
          pb-16 adds padding-bottom so content doesn't hide
          behind any potential floating UI elements */}
      <main className="pb-16">

        {/* Routes is a switch: it looks at the current URL
            and renders the FIRST <Route> whose path matches */}
        <Routes>
          {/* "/" → Landing / Home page */}
          <Route path="/"           element={<Home />}       />

          {/* "/simulator" → The interactive simulation page */}
          <Route path="/simulator"  element={<Simulator />}  />

          {/* "/algorithms" → The educational reference page */}
          <Route path="/algorithms" element={<Algorithms />} />
        </Routes>

      </main>
    </div>
  );
}

export default App;
