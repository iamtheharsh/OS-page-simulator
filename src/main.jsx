// ============================================================
// main.jsx — APPLICATION ENTRY POINT
// ============================================================
// This is the FIRST JavaScript file that runs in the browser.
// index.html has a single <div id="root"></div> and loads this
// file as a module. Everything starts here.
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';

// The root component that holds all pages and routing
import App from './App.jsx';

// Global base styles (Tailwind directives + body defaults)
import './index.css';

// BrowserRouter enables client-side navigation using the
// browser's History API — so URL changes don't reload the page
import { BrowserRouter } from 'react-router-dom';

// ReactDOM.createRoot() — React 18+ way to mount the app.
// It targets the <div id="root"> in index.html and "injects"
// the entire React component tree inside it.
ReactDOM.createRoot(document.getElementById('root')).render(

  // React.StrictMode is a DEVELOPMENT-ONLY wrapper.
  // It runs components twice to catch side effects and
  // warns about deprecated APIs. Has NO effect in production.
  <React.StrictMode>

    {/* BrowserRouter wraps the whole app so that any
        component anywhere can use React Router hooks like
        useNavigate(), useLocation(), Link, etc. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>

  </React.StrictMode>,
);
