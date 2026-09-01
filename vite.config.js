// ============================================================
// vite.config.js — BUILD TOOL CONFIGURATION
// ============================================================
// Vite is the development server and production build tool.
//
// In DEVELOPMENT (npm run dev):
//   - Serves files as native ES Modules (no bundling needed)
//   - Instant server start
//   - Hot Module Replacement (HMR): updates only changed modules
//     without a full page reload
//
// In PRODUCTION (npm run build):
//   - Uses Rollup under the hood to bundle and optimize
//   - Tree-shakes unused code
//   - Minifies JS and CSS
//   - Outputs to the /dist directory
// ============================================================

import { defineConfig } from 'vite'

// @vitejs/plugin-react enables JSX support and React Fast Refresh
// (Fast Refresh = HMR for React components — preserves component state
//  while updating the component's code live)
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react() // enables JSX → JS transformation and React Fast Refresh
  ],
})
