// ============================================================
// Home.jsx — LANDING PAGE
// ============================================================
// This is a purely PRESENTATIONAL component — it has no state
// and no side effects. It just renders static JSX.
//
// Structure:
//   Section 1: Hero (headline + description + CTA button + image)
//   Section 2: 4 info cards (Page, Frame, Paging, Page Fault)
//   Section 3: 5 algorithm showcase cards + "Learn More" button
// ============================================================

import React from 'react';

// Link → SPA-friendly navigation (no page reload)
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    // Full-screen dark background with white text
    <div className="min-h-screen bg-darkbg text-white font-sans">

      {/* ════════════════════════════════════════════════════
          SECTION 1 — HERO
          Two-column layout on large screens (flex-row),
          stacks vertically on small screens (flex-col by default).
          ════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-8 py-20 flex flex-col lg:flex-row items-center gap-12">

        {/* LEFT: Text content */}
        <div className="flex-1 space-y-8">
          {/* Main headline — largest text on the page */}
          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Visualize Page Replacement Algorithms
          </h1>

          {/* Short intro paragraph */}
          <p className="text-gray-300 text-lg leading-relaxed">
            An interactive simulator designed to help you understand how different OS paging algorithms work. See FIFO, Optimal, LRU, and more in action, step by step.
          </p>

          {/* Longer description paragraph */}
          <p className="text-gray-400 leading-relaxed">
            When a page fault occurs, the required page has to be brought from the secondary memory. If all the frames of main memory are already occupied, then a page has to be replaced. The page replacement algorithm decides which memory page is to be replaced.
          </p>

          {/* CTA (Call-To-Action) button → navigates to /simulator */}
          <div>
            <Link to="/simulator" className="inline-block bg-primary hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-md transition-colors duration-200">
              Go to Simulator &rarr; {/* &rarr; renders as → */}
            </Link>
          </div>
        </div>

        {/* RIGHT: Hero image inside a styled container */}
        {/* The dashed border + dark bg creates a "frame" effect around the screenshot */}
        <div className="flex-1 w-full max-w-lg border-2 border-gray-700 border-dashed rounded-xl p-2 bg-[#1A1A1A]">
          <img
            src="/images/pageReplacement1.png"
            alt="Memory Paging Diagram"
            className="w-full h-auto rounded-lg shadow-2xl"
          />
        </div>

      </section>

      {/* ════════════════════════════════════════════════════
          SECTION 2 — INFO CARDS
          4 cards explaining core OS memory concepts.
          Data is stored as an inline array of objects and
          rendered with .map() — clean and DRY (Don't Repeat Yourself).
          Uses a CSS Grid: 1 col on mobile, 2 on md, 4 on lg.
          ════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'What is a Page?',      desc: "The logical address space of a process is divided into fixed-size blocks called pages. It's the fundamental unit of virtual memory." },
          { title: 'What is a Frame?',     desc: "Physical memory (RAM) is divided into fixed-size blocks called frames. Each frame is designed to hold one page of data." },
          { title: 'What is Paging?',      desc: "A memory management technique that allows a process's physical address space to be non-contiguous, solving fragmentation issues." },
          { title: 'What is a Page Fault?',desc: "An interrupt that occurs when a program tries to access a page that is not currently in physical memory, requiring the OS to load it." },
        ].map((card, i) => (
          // Each card: dark background, rounded, subtle border
          // hover:border-gray-600 → border brightens slightly on hover for feedback
          <div key={i} className="bg-cardbg p-6 rounded-xl border border-gray-800 hover:border-gray-600 transition-colors">
            <h3 className="text-xl font-bold mb-3">{card.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </section>

      {/* ════════════════════════════════════════════════════
          SECTION 3 — ALGORITHM SHOWCASE CARDS
          5 cards, one per algorithm, displayed as a flex wrap row.
          Clicking "Learn More" navigates to /algorithms.
          hover:scale-105 gives a subtle zoom effect on hover.
          ════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-8 py-24">
        <h2 className="text-4xl font-bold text-center mb-16">The Page Replacement Algorithms</h2>

        {/* Flex wrap so cards flow into multiple rows on small screens */}
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { acr: 'FIFO', name: 'First In First Out'        },
            { acr: 'OPR',  name: 'Optimal Page Replacement'  },
            { acr: 'LRU',  name: 'Least Recently Used'       },
            { acr: 'LFU',  name: 'Least Frequently Used'     },
            { acr: 'MFU',  name: 'Most Frequently Used'      },
          ].map((algo, i) => (
            <div
              key={i}
              // hover:scale-105 + transition-transform → smooth zoom on hover
              className="bg-[#151520] w-64 p-8 rounded-2xl flex flex-col items-center justify-center shadow-lg border border-[#1A1A2E] hover:scale-105 transition-transform duration-300"
            >
              {/* Algorithm acronym — large, purple, eye-catching */}
              <span className="text-5xl font-black text-[#8B7FE8] tracking-widest mb-2">
                {algo.acr}
              </span>
              {/* Full algorithm name in small gray text below */}
              <span className="text-gray-500 text-sm text-center font-medium">
                {algo.name}
              </span>
            </div>
          ))}
        </div>

        {/* "Learn More" CTA → navigates to /algorithms page */}
        <div className="flex justify-center mt-12">
          <Link to="/algorithms" className="inline-block bg-primary hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-md transition-colors duration-200">
            Learn More &rarr;
          </Link>
        </div>

      </section>

    </div>
  );
};

export default Home;
