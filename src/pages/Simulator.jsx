// ============================================================
// Simulator.jsx — MAIN INTERACTIVE SIMULATOR PAGE
// ============================================================
// This is the most complex component in the project. It:
//   1. Accepts user input (frames count + page reference string)
//   2. Validates the input
//   3. Runs the selected algorithm (via pure functions from simulator.js)
//   4. Renders a step-by-step color-coded results table
//   5. Shows a summary section with a Pie Chart (Chart.js)
//
// STATE VARIABLES:
//   framesStr  → raw string value of the "Number of Frames" input
//   pagesStr   → raw string value of the "Page Sequence" input
//   activeAlgo → which algorithm button is currently selected
//   results    → array of step objects returned by the algorithm
//   error      → validation error message string (empty = no error)
// ============================================================

import React, { useState, useEffect } from 'react';

// Import all 5 algorithm functions + the input parser
import {
  simulateFIFO,
  simulateOptimal,
  simulateLRU,
  simulateLFU,
  simulateMFU,
  parsePages
} from '../utils/simulator';

// Chart.js core + the react-chartjs-2 wrapper component
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// CHART.JS TREE-SHAKING REGISTRATION:
// Chart.js v4 uses a "tree-shakeable" architecture.
// You must explicitly register the components you use.
// ArcElement → the pie/donut chart slices
// Tooltip    → hover tooltips
// Legend     → the color legend below the chart
ChartJS.register(ArcElement, Tooltip, Legend);

// ────────────────────────────────────────────────────────────
// ALGORITHM REGISTRY
// ────────────────────────────────────────────────────────────
// Maps each algorithm key to its display name and pure function.
// This object drives BOTH the tab buttons AND the simulation call.
// Adding a new algorithm = just add a new entry here.
// ────────────────────────────────────────────────────────────
const algorithms = {
  FIFO:    { name: 'First-In-First-Out (FIFO)',         func: simulateFIFO    },
  Optimal: { name: 'Optimal Page Replacement (OPR)',    func: simulateOptimal },
  LRU:     { name: 'Least Recently Used (LRU)',         func: simulateLRU     },
  LFU:     { name: 'Least Frequently Used (LFU)',       func: simulateLFU     },
  MFU:     { name: 'Most Frequently Used (MFU)',        func: simulateMFU     },
};

// ────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────
const Simulator = () => {

  // ── STATE DECLARATIONS ──────────────────────────────────
  // Controlled inputs: React "owns" the input value via state.
  // Every keystroke updates the state, which re-renders the input.
  const [framesStr,  setFramesStr]  = useState('4');   // default: 4 frames
  const [pagesStr,   setPagesStr]   = useState('7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2'); // default example

  // Which algorithm tab is currently active
  const [activeAlgo, setActiveAlgo] = useState('FIFO');

  // The simulation output: array of { page, fault, frames } objects
  // null = simulation hasn't run yet (hides the results section)
  const [results, setResults] = useState(null);

  // Validation error message; empty string = no error
  const [error, setError] = useState('');

  // ── MAIN SIMULATION FUNCTION ─────────────────────────────
  // Called when the user clicks any algorithm button.
  // algoKey defaults to the current activeAlgo if not provided.
  const runSimulation = (algoKey = activeAlgo) => {
    setError(''); // clear any previous error

    // VALIDATION 1: frames must be a positive integer
    const numFrames = parseInt(framesStr, 10); // base 10 parse
    if (isNaN(numFrames) || numFrames <= 0) {
      setError('Number of frames must be a positive integer.');
      setResults(null); // hide any stale results
      return;
    }

    // VALIDATION 2: page sequence must not be empty after parsing
    const pages = parsePages(pagesStr);
    if (pages.length === 0) {
      setError('Please enter a valid page sequence.');
      setResults(null);
      return;
    }

    // Update which algo is shown as "active" in the button row
    setActiveAlgo(algoKey);

    // Look up and call the pure algorithm function
    const algoFunc = algorithms[algoKey].func;
    const simResults = algoFunc(numFrames, pages);

    // Store results in state → triggers re-render of the table
    setResults(simResults);
  };

  // ── RESET HANDLER ────────────────────────────────────────
  // Clears all inputs and hides the results section.
  const handleReset = () => {
    setFramesStr('4');
    setPagesStr('');    // clears the page sequence input
    setResults(null);   // hides the entire results table + chart
    setError('');
  };

  // ── AUTO-RUN ON MOUNT ────────────────────────────────────
  // useEffect with [] runs ONCE, right after the component
  // first renders (equivalent to componentDidMount in class components).
  // This auto-populates the results table with FIFO on page load
  // so users immediately see a demonstration.
  useEffect(() => {
    runSimulation('FIFO');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // ^ Suppresses the ESLint warning about missing dependencies.
    //   We intentionally only want this to run once on mount.
  }, []); // empty dependency array = run only on first render

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-darkbg text-white font-sans py-12 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* ── CONTROLS CARD ──────────────────────────────────
            Contains all user inputs:
            1. Number of Frames (number input)
            2. Page Sequence (text input)
            3. Algorithm selection buttons
            4. Reset button
        ─────────────────────────────────────────────────── */}
        <div className="bg-cardbg rounded-2xl p-8 border border-gray-800 shadow-xl">
          <h2 className="text-3xl font-bold text-center mb-8">Simulator</h2>

          {/* Input row: 3-column grid on md+, stacks on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            {/* FRAMES INPUT — numeric, min=1 */}
            <div className="flex flex-col">
              <label className="text-sm font-bold text-gray-300 mb-2">Number of Frames</label>
              <input
                type="number"
                value={framesStr}
                onChange={(e) => setFramesStr(e.target.value)} // controlled input
                className="bg-[#2A2A40] text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:border-primary transition-colors"
                min="1"
              />
            </div>

            {/* PAGE SEQUENCE INPUT — text, spans 2 columns on md+ */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-bold text-gray-300 mb-2">Page Sequence (comma/space separated)</label>
              <input
                type="text"
                value={pagesStr}
                onChange={(e) => setPagesStr(e.target.value)} // controlled input
                className="bg-[#2A2A40] text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2"
              />
            </div>
          </div>

          {/* VALIDATION ERROR MESSAGE — only renders if error string is non-empty */}
          {error && <p className="text-red-500 mb-4 text-sm font-bold">{error}</p>}

          {/* ALGORITHM BUTTONS — generated dynamically from the algorithms object
              Active button: bg-primary with glow box-shadow
              Inactive button: bg-pink-600, turns primary on hover
          */}
          <div className="flex flex-wrap justify-center gap-4">
            {Object.keys(algorithms).map(algo => (
              <button
                key={algo}
                onClick={() => runSimulation(algo)} // run simulation with this algorithm
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  activeAlgo === algo
                    ? 'bg-primary text-white shadow-[0_0_15px_rgba(233,30,99,0.5)]' // active: glow effect
                    : 'bg-pink-600 text-white hover:bg-primary'                       // inactive: hover to primary
                }`}
              >
                {algo}
              </button>
            ))}

            {/* RESET BUTTON — always shown, clears everything */}
            <button
              onClick={handleReset}
              className="px-6 py-2 rounded-lg font-bold bg-gray-600 text-white hover:bg-gray-500 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* ── RESULTS SECTION ────────────────────────────────
            Only renders when `results` is not null (i.e., after
            running a simulation). The `&&` short-circuit operator
            ensures this block is completely hidden until results exist.
            animate-fade-in-up: custom Tailwind animation from tailwind.config.js
            → opacity 0→1 + translateY 20px→0 over 0.5 seconds
        ─────────────────────────────────────────────────── */}
        {results && (
          <div className="animate-fade-in-up">

            {/* Algorithm name heading — shows full name e.g. "Least Recently Used (LRU)" */}
            <h2 className="text-3xl font-bold text-center mb-8">
              {algorithms[activeAlgo].name}
            </h2>

            {/* ── SIMULATION TABLE ─────────────────────────
                overflow-x-auto → horizontal scroll on small screens
                Table columns:
                  Col 1: "Page" — step number + page number e.g. "P1 (7)"
                  Col 2..N: One column per memory frame
                  Col N+1: "Result" — shows HIT or FAULT
            ────────────────────────────────────────────── */}
            <div className="overflow-x-auto rounded-xl border border-gray-800 shadow-xl">
              <table className="w-full text-center border-collapse">

                {/* TABLE HEADER */}
                <thead>
                  <tr className="bg-[#151520] text-xs font-bold tracking-wider text-gray-400 uppercase">
                    <th className="p-4 border border-gray-800">Page</th>

                    {/* Dynamically generate one "Frame N" header per frame.
                        Uses results[0].frames.length to know how many frames there are. */}
                    {results.length > 0 && results[0].frames.map((_, i) => (
                      <th key={i} className="p-4 border border-gray-800">Frame {i + 1}</th>
                    ))}

                    <th className="p-4 border border-gray-800">Result</th>
                  </tr>
                </thead>

                {/* TABLE BODY */}
                <tbody className="bg-cardbg text-sm">
                  {results.map((step, stepIdx) => {

                    // ── HIGHLIGHT LOGIC ──────────────────────────────
                    // Determines WHICH frame cell to color (pink or green).
                    // Only one cell per row is highlighted.
                    let highlightIndex = -1;

                    if (step.fault) {
                      // FAULT: find the frame that was just modified
                      if (stepIdx === 0) {
                        // Very first step: no previous row to compare against.
                        // Find the first frame that's now non-empty.
                        highlightIndex = step.frames.findIndex(f => f !== -1);
                      } else {
                        // Compare this step's frames with the previous step's frames.
                        // The frame index that CHANGED is the one that was evicted/filled.
                        const prevFrames = results[stepIdx - 1].frames;
                        highlightIndex = step.frames.findIndex((f, i) => f !== prevFrames[i]);
                      }
                    } else {
                      // HIT: highlight the frame that already contains this page
                      highlightIndex = step.frames.indexOf(step.page);
                    }

                    return (
                      // hover:bg-[#2A2A40] → subtle row hover effect
                      <tr key={stepIdx} className="hover:bg-[#2A2A40] transition-colors">

                        {/* STEP + PAGE column: e.g. "P1 (7)" */}
                        <td className="p-4 border border-gray-800 font-bold">
                          P{stepIdx + 1} ({step.page})
                        </td>

                        {/* FRAME CELLS — one per memory frame */}
                        {step.frames.map((frame, frameIdx) => {
                          // Is this the frame that was just modified/accessed?
                          const isHighlighted = frameIdx === highlightIndex;

                          // Cell background: pink for fault, green for hit, nothing otherwise
                          const cellBg  = isHighlighted ? (step.fault ? 'bg-primary' : 'bg-green-500') : '';
                          // Text color: white on colored cells, gray on empty cells
                          const textCol = isHighlighted ? 'text-white' : 'text-gray-300';

                          return (
                            <td
                              key={frameIdx}
                              className={`p-4 border border-gray-800 font-bold ${cellBg} ${textCol}`}
                            >
                              {/* Show page number if frame is loaded, empty string if slot is empty (-1) */}
                              {frame !== -1 ? frame : ''}
                            </td>
                          );
                        })}

                        {/* RESULT column: "FAULT" (pink bg) or "HIT" (green bg) */}
                        <td className={`p-4 border border-gray-800 font-bold ${step.fault ? 'bg-primary' : 'bg-green-500'}`}>
                          {step.fault ? 'FAULT' : 'HIT'}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── SUMMARY SECTION ──────────────────────────
                Shows total faults, total hits, and a Pie Chart.
                All values are computed live from the `results` array
                using Array.filter() on the `fault` boolean property.
            ────────────────────────────────────────────── */}
            <div id="summary-section" className="mt-12 bg-cardbg rounded-2xl p-8 border border-gray-800 shadow-xl">
              <h2 className="text-3xl font-bold text-center mb-8">Summary</h2>

              {/* Flex: stat cards on the left, Pie chart on the right */}
              <div className="flex flex-col md:flex-row justify-around items-center gap-8">

                {/* ── STAT CARDS ── */}
                <div className="flex flex-col gap-6 w-full md:w-1/2">

                  {/* FAULTS CARD — border-bottom accent in primary pink */}
                  {/* hover:-translate-y-1 → floats up slightly on hover */}
                  <div className="bg-[#2A2A40] rounded-xl p-6 shadow-lg border-b-4 border-primary hover:-translate-y-1 transition-transform">
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Faults</h3>
                    <p className="text-5xl font-bold text-primary">
                      {/* Count all steps where fault === true */}
                      {results.filter(r => r.fault).length}
                    </p>
                  </div>

                  {/* HITS CARD — border-bottom accent in green */}
                  <div className="bg-[#2A2A40] rounded-xl p-6 shadow-lg border-b-4 border-green-500 hover:-translate-y-1 transition-transform">
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Hits</h3>
                    <p className="text-5xl font-bold text-green-500">
                      {/* Count all steps where fault === false */}
                      {results.filter(r => !r.fault).length}
                    </p>
                  </div>

                </div>

                {/* ── PIE CHART ──────────────────────────────
                    <Pie> from react-chartjs-2 wraps Chart.js.
                    The `data` prop is a Chart.js dataset object.
                    Re-renders automatically when `results` state changes.
                ────────────────────────────────────────────── */}
                <div className="w-full md:w-1/2 flex flex-col items-center">
                  <h3 className="text-gray-300 font-bold mb-4">Hit vs Fault Ratio</h3>

                  {/* Fixed 256×256 container ensures consistent chart sizing */}
                  <div className="w-64 h-64">
                    <Pie
                      data={{
                        labels: ['Faults', 'Hits'], // legend labels

                        datasets: [{
                          data: [
                            results.filter(r => r.fault).length,   // faults count → slice 1
                            results.filter(r => !r.fault).length   // hits count   → slice 2
                          ],
                          backgroundColor: ['#E91E63', '#4CAF50'], // pink for faults, green for hits
                          borderColor:     ['#1E1E2F', '#1E1E2F'], // cardbg color → gap between slices
                          borderWidth: 4, // gap thickness between slices
                        }],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'bottom', // legend below the chart
                            labels: {
                              color: '#e2e8f0', // light gray text (readable on dark bg)
                              font: {
                                family: "'Inter', sans-serif", // match body font
                                weight: 'bold'
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Simulator;
