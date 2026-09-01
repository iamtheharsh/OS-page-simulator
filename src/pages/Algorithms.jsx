// ============================================================
// Algorithms.jsx — EDUCATIONAL REFERENCE PAGE
// ============================================================
// This page explains the theory behind each algorithm in a
// tabbed UI. Clicking a tab updates the displayed content
// without navigating to a new page — all handled with useState.
//
// Data Architecture:
//   All content lives in the `algoData` object at the top.
//   The component itself is generic — it just reads from algoData
//   based on which tab is active. Adding a new algorithm is as
//   simple as adding a new key to algoData.
// ============================================================

import React, { useState } from 'react';

// ────────────────────────────────────────────────────────────
// DATA LAYER — Algorithm Descriptions
// ────────────────────────────────────────────────────────────
// This object is the single source of truth for all content
// displayed on this page. Each key corresponds to one tab.
// Structure per algorithm:
//   name       → full display name shown as the heading
//   desc       → paragraph description of how the algorithm works
//   strengths  → array of bullet points (rendered in green card)
//   weaknesses → array of bullet points (rendered in red card)
//   image      → path to the flow diagram in /public/images/
// ────────────────────────────────────────────────────────────
const algoData = {
  FIFO: {
    name: 'FIFO (First-In-First-Out)',
    desc: "FIFO is the simplest page replacement algorithm. It treats the set of memory frames like a queue: the oldest loaded page (the one that entered memory first) is the first to be replaced when a new page needs to be loaded. This mirrors a line of people waiting: the first person in is the first person out.",
    strengths: [
      "Extremely easy to implement and understand.",
      "Requires minimal bookkeeping (just maintain a simple queue of pages).",
      "Provides a good starting point for comparing with more advanced algorithms."
    ],
    weaknesses: [
      "Often performs poorly in practice because it does not consider actual usage patterns.",
      "Suffers from Belady's Anomaly: adding more memory frames can paradoxically lead to more page faults.",
      "Does not exploit temporal or spatial locality of reference."
    ],
    image: '/images/fifo.jpg'
  },

  Optimal: {
    name: 'Optimal Page Replacement (OPR)',
    desc: "The Optimal Page Replacement algorithm replaces the page that will not be used for the longest period of time in the future. It is theoretical and cannot be implemented in a real OS because it requires future knowledge of memory references.",
    strengths: [
      "Provides the absolute lowest possible page fault rate.",
      "Does not suffer from Belady's Anomaly.",
      "Serves as a perfect benchmark to evaluate the performance of other practical algorithms."
    ],
    weaknesses: [
      "Impossible to implement in real operating systems as it requires predicting the future.",
      "Requires two passes over the reference string in simulation."
    ],
    image: '/images/OPR.jpg'
  },

  LRU: {
    name: 'LRU (Least Recently Used)',
    desc: "LRU replaces the page that has not been used for the longest period of time. It assumes that pages heavily used in the past few instructions are likely to be used heavily again in the next few instructions. It is an excellent approximation of the Optimal algorithm.",
    strengths: [
      "Often performs very well and is widely used in practice.",
      "Does not suffer from Belady's Anomaly.",
      "Takes advantage of the temporal locality of reference (recent past predicts near future)."
    ],
    weaknesses: [
      "Can be complex and expensive to implement efficiently.",
      "Requires hardware assistance (like reference bits or special counters) to keep track of usage.",
      "High overhead if software has to update a data structure on every memory reference."
    ],
    image: '/images/LRU.jpg'
  },

  LFU: {
    name: 'LFU (Least Frequently Used)',
    desc: "LFU replaces the page with the smallest count of references. The rationale is that an actively used page should have a large reference count. If multiple pages have the same lowest count, a secondary criteria (like FIFO or LRU) is often used to break the tie.",
    strengths: [
      "Can be effective in scenarios where some pages are constantly accessed while others are rarely touched.",
      "Takes frequency of use into account, not just recency."
    ],
    weaknesses: [
      "A page used heavily initially but never again will have a high count and remain in memory, wasting space.",
      "Requires maintaining a counter for every page, adding memory and processing overhead.",
      "Not typically used in standard OS environments."
    ],
    image: '/images/LFU.jpg'
  },

  MFU: {
    name: 'MFU (Most Frequently Used)',
    desc: "MFU is based on the argument that the page with the smallest count was probably just brought in and has yet to be used. Therefore, it replaces the page with the highest frequency count, assuming it has completed its useful work.",
    strengths: [
      "Attempts to keep newer pages in memory, giving them a chance to be used.",
      "A contrarian approach that might work in very specific, uncommon workload patterns."
    ],
    weaknesses: [
      "Generally performs poorly in typical programs.",
      "Suffers from the same high overhead of maintaining counters as LFU.",
      "Often counter-intuitive and rarely implemented in practice."
    ],
    image: '/images/MFU.jpg'
  }
};

// ────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────
const Algorithms = () => {
  // The tab labels — must match keys in algoData exactly
  const tabs = ['FIFO', 'Optimal', 'LRU', 'LFU', 'MFU'];

  // activeTab holds which tab is currently selected.
  // Defaults to 'FIFO' so the page has content on first load.
  const [activeTab, setActiveTab] = useState('FIFO');

  // Derive the current content object from the active tab.
  // When activeTab changes, `data` automatically gets the new values.
  const data = algoData[activeTab];

  return (
    <div className="min-h-screen bg-darkbg text-white font-sans py-12 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Page title */}
        <h1 className="text-4xl font-bold text-center mb-10">Page Replacement Techniques</h1>

        {/* ── TAB BAR ──
            A horizontal row of buttons, one per algorithm.
            The active tab gets:
              - text-primary (pink text)
              - border-b-2 border-primary (pink underline)
            Inactive tabs get:
              - text-gray-400 (dimmed)
              - border-b-2 border-transparent (invisible underline — keeps layout stable)
              - hover states to indicate interactivity
        */}
        <div className="flex justify-center mb-8 border-b border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)} // update state → triggers re-render
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-400 hover:text-gray-300 hover:border-gray-500 border-b-2 border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── CONTENT CARD ──
            This entire block is driven by `data` (= algoData[activeTab]).
            React re-renders this section automatically when activeTab changes.
        */}
        <div className="bg-cardbg rounded-2xl p-8 border border-gray-800 shadow-xl">

          {/* Algorithm full name — e.g. "LRU (Least Recently Used)" */}
          <h2 className="text-2xl font-bold mb-4">{data.name}</h2>

          {/* Description paragraph */}
          <p className="text-gray-300 leading-relaxed mb-8">{data.desc}</p>

          {/* ── STRENGTHS & WEAKNESSES GRID ──
              Two-column grid on medium+ screens, single column on mobile.
              Strengths: green-tinted card | Weaknesses: red-tinted card
          */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

            {/* STRENGTHS card — green border + very faint green background */}
            <div className="border border-green-800/50 bg-green-900/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-green-400 mb-3">Strengths</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 text-sm leading-relaxed">
                {/* Map each strength string to a <li> bullet point */}
                {data.strengths.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>

            {/* WEAKNESSES card — red border + very faint red background */}
            <div className="border border-red-800/50 bg-red-900/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-400 mb-3">Weaknesses</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 text-sm leading-relaxed">
                {/* Map each weakness string to a <li> bullet point */}
                {data.weaknesses.map((weak, i) => (
                  <li key={i}>{weak}</li>
                ))}
              </ul>
            </div>

          </div>

          {/* ── ALGORITHM FLOW DIAGRAM IMAGE ──
              White background card to ensure diagrams (which have
              transparent/white backgrounds) are readable against the dark UI.
              Image path comes from algoData[activeTab].image.
          */}
          <div className="flex justify-center bg-white rounded-xl p-4 overflow-hidden mt-8 max-w-3xl mx-auto">
            <img
              src={data.image}
              alt={`${activeTab} flow diagram`}
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Algorithms;
