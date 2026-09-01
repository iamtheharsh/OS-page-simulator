# 🏗️ Architecture & Workflow — OS Page Replacement Visualizer

> A complete, file-by-file technical breakdown of how every layer of this project works together — from the browser boot sequence to the algorithm logic to Vercel deployment.

---

## 1. 30,000-ft View — Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│  index.html  →  main.jsx  →  App.jsx  →  Pages/Components  │
│                    ↑                          ↑             │
│             BrowserRouter              React Router DOM     │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌───────────▼──────────────┐
           │   src/utils/simulator.js  │   ← Pure algorithm functions
           │  (FIFO, Optimal, LRU,     │
           │   LFU, MFU, parsePages)   │
           └───────────────────────────┘
                       │  (same functions, re-imported)
           ┌───────────▼──────────────┐
           │ scripts/analyze_perf.mjs  │   ← Node.js benchmarking
           └───────────────────────────┘

           ┌───────────────────────────┐
           │  cpp_core/simulator.cpp   │   ← C++ reference (Emscripten/WASM)
           └───────────────────────────┘

           ┌───────────────────────────┐
           │    Vercel CDN + vercel.json│  ← Deployment & routing fix
           └───────────────────────────┘
```

---

## 2. Complete File Tree & What Each File Does

```
Page Replacement Visualizer/
│
├── index.html                 ← Single HTML shell (SPA entry point)
├── vite.config.js             ← Vite build tool config
├── tailwind.config.js         ← Design tokens (colors, animations)
├── postcss.config.js          ← PostCSS for Tailwind compilation
├── package.json               ← Dependencies + npm scripts
├── vercel.json                ← Deployment routing rules
├── .oxlintrc.json             ← Linter config (oxlint)
│
├── src/
│   ├── main.jsx               ← React DOM mount + BrowserRouter wrap
│   ├── App.jsx                ← Route definitions (/, /simulator, /algorithms)
│   ├── index.css              ← Global base styles + Tailwind directives
│   │
│   ├── components/
│   │   └── Navbar.jsx         ← Sticky top nav with active route highlight
│   │
│   ├── pages/
│   │   ├── Home.jsx           ← Landing page (hero + info cards + algo showcase)
│   │   ├── Simulator.jsx      ← Core interactive simulator (inputs → table → chart)
│   │   └── Algorithms.jsx     ← Tabbed reference page (theory for each algorithm)
│   │
│   └── utils/
│       └── simulator.js       ← ALL algorithm logic (pure functions)
│
├── cpp_core/
│   └── simulator.cpp          ← Identical algorithms in C++ (Emscripten-ready)
│
├── scripts/
│   └── analyze_performance.mjs← Node.js benchmark: 50-test LRU vs FIFO analysis
│
├── public/
│   └── images/                ← Static assets (screenshots, algo diagrams, logo)
│
└── ANALYSIS.md                ← Auto-generated benchmark output (44.63% proof)
```

---

## 3. The Boot Sequence — From Browser Request to Rendered UI

This is the exact sequence of events every time someone opens the app:

```
Step 1: Browser requests URL (e.g. https://yoursite.com/)
         ↓
Step 2: Vercel CDN intercepts → vercel.json rewrites ALL paths to /index.html
         ↓
Step 3: Browser receives index.html:
        <div id="root"></div>
        <script type="module" src="/src/main.jsx"></script>
         ↓
Step 4: Vite serves main.jsx as a native ES Module
         ↓
Step 5: main.jsx executes:
        - Imports React, ReactDOM, App, index.css, BrowserRouter
        - ReactDOM.createRoot(document.getElementById('root'))
        - Wraps <App /> in <React.StrictMode> + <BrowserRouter>
        - .render() — paints the first pixels to the screen
         ↓
Step 6: App.jsx evaluates — reads current URL path via React Router
        - "/"           → renders <Home />
        - "/simulator"  → renders <Simulator />
        - "/algorithms" → renders <Algorithms />
        Always renders <Navbar /> above the matched page
         ↓
Step 7: Simulator.jsx runs useEffect on mount → calls runSimulation('FIFO')
        → auto-populates results table with the default example sequence
         ↓
Step 8: UI is fully interactive
```

---

## 4. Design System — Tailwind Config Decoded

All colors and animations used across every JSX file come from **`tailwind.config.js`**:

```js
colors: {
  primary:  '#E91E63',   // Hot pink — used for FAULT rows, active buttons,
                         // primary CTA buttons, Pie Chart fault slice
  darkbg:   '#121212',   // Near-black page background (also set in index.css body)
  cardbg:   '#1E1E2F',   // Dark navy — all card/panel backgrounds
}

animation: {
  'fade-in-up': 'fade-in-up 0.5s ease-out forwards'
  // Keyframe: opacity 0→1, translateY 20px→0
  // Applied to the results section in Simulator.jsx:
  // className="animate-fade-in-up"
}
```

**Other inline color values used directly in JSX:**
| Value | Usage |
|-------|-------|
| `#2D234A` | Navbar background (deep purple) |
| `#151520` | Table header row, algo cards on Home page |
| `#2A2A40` | Input fields, stat cards, table row hover |
| `#8B7FE8` | Algo acronym text on Home page (light purple) |
| `#4CAF50` | HIT cells and hits stat card border |
| `bg-green-500` | HIT highlighted frame cell |

---

## 5. Routing Architecture

React Router DOM v7 handles all navigation. There are **zero full page reloads** in the entire app.

```
BrowserRouter (main.jsx)
    └── App.jsx
          ├── <Navbar />        ← always visible, reads location.pathname
          └── <Routes>
                ├── <Route path="/"            → <Home />       />
                ├── <Route path="/simulator"   → <Simulator />  />
                └── <Route path="/algorithms"  → <Algorithms /> />
```

**Navbar active state logic** (`Navbar.jsx`):
```js
const location = useLocation();
// If location.pathname === '/' → Home icon turns pink
// /simulator and /algorithms buttons are always styled as primary buttons
```

**The Vercel 404 Fix** (`vercel.json`):
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
Without this: typing `yoursite.com/simulator` directly → Vercel's file server returns 404 (no physical file exists at `/simulator`).  
With this: Vercel always serves `index.html` → React Router reads the URL → renders the correct component.

---

## 6. The Home Page — `Home.jsx`

The Home page is **purely presentational** (no state, no side effects). Structure:

```
<Home />
  ├── Section 1: Hero
  │     ├── Left: H1 headline + description + "Go to Simulator →" Link button
  │     └── Right: <img src="/images/pageReplacement1.png" />
  │
  ├── Section 2: Info Cards (4 cards, data-driven from an inline array)
  │     ├── "What is a Page?"
  │     ├── "What is a Frame?"
  │     ├── "What is Paging?"
  │     └── "What is a Page Fault?"
  │
  └── Section 3: Algorithm Showcase (5 cards, data-driven from an inline array)
        ├── FIFO card
        ├── OPR card
        ├── LRU card
        ├── LFU card
        └── MFU card + "Learn More →" Link to /algorithms
```

**Key pattern:** Both the info cards and algorithm cards use `.map()` over an inline JavaScript array to render identically structured JSX — clean, DRY, maintainable.

---

## 7. The Algorithms Page — `Algorithms.jsx`

An educational reference page with a **tab-based UI**. All content lives in the `algoData` object at the top of the file:

```
algoData = {
  FIFO:    { name, desc, strengths[], weaknesses[], image }
  Optimal: { ... }
  LRU:     { ... }
  LFU:     { ... }
  MFU:     { ... }
}
```

**State:** Single `useState('FIFO')` — tracks which tab is active.

**Render flow:**
```
User clicks tab → setActiveTab('LRU')
                       ↓
             const data = algoData['LRU']
                       ↓
         Re-renders: name, description, strengths, weaknesses, image
```

Each algorithm tab renders:
1. Name + description paragraph
2. Two-column grid: **Strengths** (green border) + **Weaknesses** (red border)
3. Algorithm flow diagram image from `/public/images/`

---

## 8. The Core Engine — `src/utils/simulator.js`

This is the brain of the entire project. **Six pure exported functions:**

### `parsePages(pagesStr)` — Input Sanitizer
```
Input:  "7, 0, 1, 2" (user's raw string)
Steps:
  1. replace(/[^0-9, ]/g, '')   → strips all non-digit/non-separator chars
  2. split(/[ ,]+/)             → splits on one or more spaces/commas
  3. filter(s => s.trim() !== '')  → removes empty tokens
  4. map(Number)                → converts strings to integers
Output: [7, 0, 1, 2]
```

### Algorithm Return Shape — Every function returns the same structure:
```js
[
  { page: 7, fault: true,  frames: [7, -1, -1, -1] },
  { page: 0, fault: true,  frames: [7,  0, -1, -1] },
  { page: 1, fault: true,  frames: [7,  0,  1, -1] },
  { page: 7, fault: false, frames: [7,  0,  1, -1] }, // HIT
  ...
]
```
`frames: [...mem]` — a **snapshot copy** of memory at that exact step. Uses spread operator to avoid reference sharing between steps.

---

### `simulateFIFO(numFrames, pages)` — Circular Queue

```
Data structures:
  mem[]          = frames array, initialized to -1 (empty)
  replaceIndex   = integer pointer, starts at 0

For each page p:
  IF p is in mem[]  → HIT, do nothing
  ELSE              → FAULT
      mem[replaceIndex] = p           ← overwrite the "oldest" frame
      replaceIndex = (replaceIndex + 1) % numFrames   ← advance pointer circularly
```

**Visual example (3 frames):**
```
Step 1: p=1 → FAULT → mem=[1,-1,-1], ptr=1
Step 2: p=2 → FAULT → mem=[1, 2,-1], ptr=2
Step 3: p=3 → FAULT → mem=[1, 2, 3], ptr=0
Step 4: p=4 → FAULT → mem=[4, 2, 3], ptr=1  ← evicts page 1 (it was first in)
Step 5: p=1 → FAULT → mem=[4, 1, 3], ptr=2  ← evicts page 2
```

---

### `simulateOptimal(numFrames, pages)` — Look-Ahead

```
Data structures:
  mem[]    = frames array (-1 = empty)

For each page p at index i:
  IF hit → record snapshot
  IF fault:
    IF mem has an empty slot (-1) → fill it
    ELSE:
      For each frame j:
        Scan pages[i+1 ... end] to find next occurrence of mem[j]
        If never found → nextUse = Infinity
      Evict frame j with the LARGEST nextUse (farthest future use)
      mem[replaceIdx] = p
```

**Why this gives minimum faults:** By always keeping pages that will be needed soonest, it maximally defers future faults.

---

### `simulateLRU(numFrames, pages)` — Timestamp Tracking

```
Data structures:
  mem[]      = frames array (-1 = empty)
  lastUsed[] = parallel array, stores the step index when mem[j] was last used

For each page p at index i:
  HIT:
    hitIdx = mem.indexOf(p)
    lastUsed[hitIdx] = i   ← update timestamp
  FAULT:
    IF empty slot → fill it, lastUsed[emptyIdx] = i
    ELSE:
      Find j where lastUsed[j] is MINIMUM (= least recently used)
      mem[lruIdx] = p
      lastUsed[lruIdx] = i
```

**Comparison with lastUsed array:**
```
After step 5:  mem=[7, 0, 1], lastUsed=[3, 1, 4]
Step 6: p=2, FAULT → scan lastUsed: min is index 1 (value=1) → evict mem[1]=0
```

---

### `simulateLFU(numFrames, pages)` — Frequency + FIFO Tie-break

```
Data structures:
  mem[]        = frames array
  freq[]       = how many times mem[j] has been accessed
  insertTime[] = when mem[j] was placed in this frame (for tie-breaking)

HIT:   freq[hitIdx]++
FAULT: 
  IF empty slot:
    mem[slot] = p, freq[slot] = 1, insertTime[slot] = i
  ELSE:
    Find lfuIdx = frame with MINIMUM freq[]
    TIE BREAK: if freq[j] === freq[lfuIdx] AND insertTime[j] < insertTime[lfuIdx]
               → prefer older insertion (FIFO)
    mem[lfuIdx] = p, freq[lfuIdx] = 1, insertTime[lfuIdx] = i
```

---

### `simulateMFU(numFrames, pages)` — Inverted LFU

**Identical structure to LFU**, except the eviction criterion is reversed:

```
LFU: find frame with MINIMUM freq  → "least used, evict it"
MFU: find frame with MAXIMUM freq  → "most used, evict it"

Same FIFO tie-break via insertTime[] when frequencies are equal.
```

---

## 9. The Simulator Page — `Simulator.jsx` — Complete Data Flow

This is the most complex component. Here's the **complete data flow** from user input to rendered table:

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INPUT LAYER                           │
│                                                                 │
│  <input type="number"> → framesStr (useState)                   │
│  <input type="text">   → pagesStr  (useState)                   │
│                                                                 │
│  User clicks algorithm button (e.g. "LRU")                      │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
                   runSimulation('LRU')
                           │
             ┌─────────────▼───────────────────┐
             │  VALIDATION LAYER                │
             │  parseInt(framesStr) → numFrames  │
             │  if NaN or <= 0 → setError(...)  │
             │  parsePages(pagesStr) → pages[]  │
             │  if length === 0 → setError(...) │
             └─────────────┬───────────────────┘
                           ↓
             ┌─────────────▼───────────────────┐
             │  ALGORITHM EXECUTION             │
             │  algorithms['LRU'].func          │
             │  = simulateLRU(numFrames, pages) │
             │  returns simResults[]            │
             └─────────────┬───────────────────┘
                           ↓
                   setResults(simResults)
                   setActiveAlgo('LRU')
                           │
             ┌─────────────▼───────────────────┐
             │  REACT RE-RENDER                 │
             │  Virtual DOM diff computed       │
             │  Only changed table cells update │
             └─────────────┬───────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│                    RENDER LAYER                                  │
│                                                                  │
│  results.map((step, stepIdx) => <tr>                             │
│    <td> P{stepIdx+1} ({step.page}) </td>                         │
│    {step.frames.map((frame, frameIdx) =>                         │
│      <td className={highlighted ? (fault?pink:green) : ''}>     │
│        {frame !== -1 ? frame : ''}                               │
│      </td>                                                       │
│    )}                                                            │
│    <td className={fault?pink:green}> FAULT / HIT </td>           │
│  </tr>)                                                          │
│                                                                  │
│  + Summary Cards (fault count, hit count)                        │
│  + <Pie> chart (Chart.js)                                        │
└──────────────────────────────────────────────────────────────────┘
```

### Cell Highlighting Logic (the tricky part)

```js
let highlightIndex = -1;

if (step.fault) {
  if (stepIdx === 0) {
    // First step: no previous row exists
    highlightIndex = step.frames.findIndex(f => f !== -1); // first filled frame
  } else {
    const prevFrames = results[stepIdx - 1].frames;
    // Find which frame index changed between this step and the last
    highlightIndex = step.frames.findIndex((f, i) => f !== prevFrames[i]);
  }
} else {
  // Hit: find the frame holding the accessed page
  highlightIndex = step.frames.indexOf(step.page);
}
```

---

## 10. Pie Chart — Chart.js Integration

```
Library: chart.js v4 + react-chartjs-2 v5

Registration (tree-shaking — only import what you use):
  ChartJS.register(ArcElement, Tooltip, Legend)
       ↑           ↑           ↑        ↑
    engine    pie slices    tooltips  legend

Data source (computed inline, re-calculated on every render):
  faults = results.filter(r => r.fault).length
  hits   = results.filter(r => !r.fault).length

Colors:
  Faults slice → #E91E63  (primary pink, matches FAULT row color)
  Hits slice   → #4CAF50  (green, matches HIT row color)

Border:
  borderColor: '#1E1E2F' (cardbg) → creates a gap effect between slices

Legend:
  position: 'bottom'
  color: '#e2e8f0' (light gray)
  font: Inter (matches body font)
```

---

## 11. The State Machine of `Simulator.jsx`

```
INITIAL STATE:
  framesStr = '4'
  pagesStr  = '7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2'
  activeAlgo = 'FIFO'
  results   = null
  error     = ''
        ↓
  useEffect on mount → runSimulation('FIFO')
        ↓
POPULATED STATE:
  results   = [{ page, fault, frames }, ...] (13 steps)
  activeAlgo = 'FIFO'
        ↓
User changes algo → runSimulation('LRU')
        ↓
UPDATED STATE:
  results   = new 13-step array for LRU
  activeAlgo = 'LRU'
  → table and Pie Chart re-render with new data
        ↓
User clicks Reset → handleReset()
        ↓
RESET STATE:
  framesStr = '4'
  pagesStr  = ''       ← clears input
  results   = null     ← hides table and chart
  error     = ''
```

---

## 12. The C++ Layer — `cpp_core/simulator.cpp`

The C++ file is a **1:1 mirror** of `simulator.js` in C++. It was written to be compiled to WebAssembly (WASM) via **Emscripten**.

```cpp
#include <emscripten/bind.h>   ← Emscripten's C++ binding API

// All 5 algorithm functions implemented in C++
// Each takes: (int num_frames, std::string pagesStr)
// Each returns: std::string  ← hand-built JSON string

// At the bottom:
EMSCRIPTEN_BINDINGS(simulator_module) {
    function("simulateFIFO",    &simulateFIFO);
    function("simulateOptimal", &simulateOptimal);
    function("simulateLRU",     &simulateLRU);
    function("simulateLFU",     &simulateLFU);
    function("simulateMFU",     &simulateMFU);
}
```

**How EMSCRIPTEN_BINDINGS works:**  
It generates JavaScript glue code that lets the browser call these C++ functions by name:
```js
// After WASM loads, you'd call:
Module.simulateLRU(3, "1,2,3,1,2,3,4");
// Returns: '[{"page":1,"fault":true,"frames":[1,-1,-1]}, ...]'
```

**Why it was NOT used in production:**
- MIME type mismatch (`application/wasm`) on Vercel's CDN.
- Adds dynamic import complexity to Vite's build pipeline.
- Zero perceptible performance benefit for arrays of ~100 elements.
- Decision: keep as technical reference only.

---

## 13. Benchmarking Pipeline — `scripts/analyze_performance.mjs`

This is a standalone Node.js script (ESM module) that proves LRU > FIFO with real data.

```
PIPELINE:

Step 1: Import pure functions
  import { simulateFIFO, simulateLRU } from '../src/utils/simulator.js'
  ↑ Works because simulator.js is framework-agnostic pure JS

Step 2: Generate 50 test cases
  Each test case:
    - frames: random int between 3–4
    - pages: array with strong LOCALITY OF REFERENCE
      (e.g., working set of 5 pages, randomly repeated 60–80 times)

Step 3: Run both algorithms on each test
  fifoResults = simulateFIFO(frames, pages)
  lruResults  = simulateLRU(frames, pages)
  fifoFaults  = fifoResults.filter(r => r.fault).length
  lruFaults   = lruResults.filter(r => r.fault).length

Step 4: Calculate reduction
  reduction% = ((fifoFaults - lruFaults) / fifoFaults) * 100

Step 5: Aggregate across 50 tests
  totalFIFO = sum of all fifoFaults
  totalLRU  = sum of all lruFaults
  avgReduction = ((totalFIFO - totalLRU) / totalFIFO) * 100

Step 6: Output markdown table → piped to ANALYSIS.md
  Result: 44.63% average fault reduction
```

**Key result from ANALYSIS.md:**
| Metric | Value |
|--------|-------|
| Total tests | 50 |
| Total FIFO faults | 1508 |
| Total LRU faults | 835 |
| Average reduction | **44.63%** |

---

## 14. Deployment Architecture on Vercel

```
GitHub Repo
    ↓ (push to main)
Vercel CI/CD Pipeline
    ↓
npm install          ← installs all node_modules
npm run build        ← vite build
    ↓ Vite's Rollup bundler:
    - Transpiles JSX → JS
    - Tree-shakes unused Chart.js components
    - Processes Tailwind CSS (PurgeCSS removes unused classes)
    - Outputs optimized static files to /dist
    ↓
/dist/
  index.html
  assets/
    index-[hash].js    ← all JS bundled + minified
    index-[hash].css   ← all CSS bundled + minified

Vercel deploys /dist to CDN edge nodes globally
    ↓
vercel.json rewrite rule:
  ANY URL path → serve /dist/index.html
    ↓
React Router takes over client-side navigation
```

---

## 15. Component Dependency Map

```
main.jsx
  └── App.jsx
        ├── Navbar.jsx
        │     └── react-router-dom (Link, useLocation)
        │
        ├── Home.jsx
        │     └── react-router-dom (Link)
        │
        ├── Simulator.jsx
        │     ├── react (useState, useEffect)
        │     ├── src/utils/simulator.js
        │     │     ├── parsePages
        │     │     ├── simulateFIFO
        │     │     ├── simulateOptimal
        │     │     ├── simulateLRU
        │     │     ├── simulateLFU
        │     │     └── simulateMFU
        │     └── chart.js + react-chartjs-2
        │           ├── ChartJS (register)
        │           ├── ArcElement
        │           ├── Tooltip
        │           ├── Legend
        │           └── Pie
        │
        └── Algorithms.jsx
              └── react (useState)
```

---

## 16. Key Design Decisions Summary

| Decision | What was chosen | Why |
|----------|----------------|-----|
| Framework | React 19 | Component model + Virtual DOM for dynamic state |
| Build tool | Vite 8 | Native ESM dev server, instant HMR, Rollup production builds |
| Styling | Tailwind CSS 3 | Utility-first rapid prototyping, enforced design tokens |
| Routing | React Router DOM 7 | SPA navigation without page reloads |
| Charting | Chart.js 4 + react-chartjs-2 | Tree-shakeable, reactive via React props |
| Linter | oxlint | Extremely fast Rust-based linter (vs ESLint) |
| Algorithm core language | JavaScript (not C++/WASM) | Simpler deployment, same perf for small inputs |
| Deployment | Vercel | Zero-config for Vite/React, global CDN, `vercel.json` routing |
| State management | Vanilla `useState` | All state is local to one component, no need for Redux/Zustand |
| Algorithm return type | Pure function → array of step objects | Testable, reusable in both React and Node.js contexts |
