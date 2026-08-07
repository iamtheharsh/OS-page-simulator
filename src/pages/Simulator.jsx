import React, { useState, useEffect } from 'react';
import { simulateFIFO, simulateOptimal, simulateLRU, simulateLFU, simulateMFU, parsePages } from '../utils/simulator';

const algorithms = {
  FIFO: { name: 'First-In-First-Out (FIFO)', func: simulateFIFO },
  Optimal: { name: 'Optimal Page Replacement (OPR)', func: simulateOptimal },
  LRU: { name: 'Least Recently Used (LRU)', func: simulateLRU },
  LFU: { name: 'Least Frequently Used (LFU)', func: simulateLFU },
  MFU: { name: 'Most Frequently Used (MFU)', func: simulateMFU },
};

const Simulator = () => {
  const [framesStr, setFramesStr] = useState('4');
  const [pagesStr, setPagesStr] = useState('7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2');
  const [activeAlgo, setActiveAlgo] = useState('FIFO');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const runSimulation = (algoKey = activeAlgo) => {
    setError('');
    const numFrames = parseInt(framesStr, 10);
    if (isNaN(numFrames) || numFrames <= 0) {
      setError('Number of frames must be a positive integer.');
      setResults(null);
      return;
    }

    const pages = parsePages(pagesStr);
    if (pages.length === 0) {
      setError('Please enter a valid page sequence.');
      setResults(null);
      return;
    }

    setActiveAlgo(algoKey);
    const algoFunc = algorithms[algoKey].func;
    const simResults = algoFunc(numFrames, pages);
    setResults(simResults);
  };

  const handleReset = () => {
    setFramesStr('4');
    setPagesStr('');
    setResults(null);
    setError('');
  };

  // Run initial simulation
  useEffect(() => {
    runSimulation('FIFO');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-darkbg text-white font-sans py-12 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Controls Card */}
        <div className="bg-cardbg rounded-2xl p-8 border border-gray-800 shadow-xl">
          <h2 className="text-3xl font-bold text-center mb-8">Simulator</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col">
              <label className="text-sm font-bold text-gray-300 mb-2">Number of Frames</label>
              <input 
                type="number" 
                value={framesStr} 
                onChange={(e) => setFramesStr(e.target.value)}
                className="bg-[#2A2A40] text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:border-primary transition-colors"
                min="1"
              />
            </div>
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-bold text-gray-300 mb-2">Page Sequence (comma/space separated)</label>
              <input 
                type="text" 
                value={pagesStr} 
                onChange={(e) => setPagesStr(e.target.value)}
                className="bg-[#2A2A40] text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2"
              />
            </div>
          </div>

          {error && <p className="text-red-500 mb-4 text-sm font-bold">{error}</p>}

          <div className="flex flex-wrap justify-center gap-4">
            {Object.keys(algorithms).map(algo => (
              <button
                key={algo}
                onClick={() => runSimulation(algo)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  activeAlgo === algo 
                    ? 'bg-primary text-white shadow-[0_0_15px_rgba(233,30,99,0.5)]' 
                    : 'bg-pink-600 text-white hover:bg-primary'
                }`}
              >
                {algo}
              </button>
            ))}
            <button
              onClick={handleReset}
              className="px-6 py-2 rounded-lg font-bold bg-gray-600 text-white hover:bg-gray-500 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-bold text-center mb-8">{algorithms[activeAlgo].name}</h2>
            
            <div className="overflow-x-auto rounded-xl border border-gray-800 shadow-xl">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-[#151520] text-xs font-bold tracking-wider text-gray-400 uppercase">
                    <th className="p-4 border border-gray-800">Page</th>
                    {results.length > 0 && results[0].frames.map((_, i) => (
                      <th key={i} className="p-4 border border-gray-800">Frame {i + 1}</th>
                    ))}
                    <th className="p-4 border border-gray-800">Result</th>
                  </tr>
                </thead>
                <tbody className="bg-cardbg text-sm">
                  {results.map((step, stepIdx) => {
                    // Determine which frame index was modified/hit
                    let highlightIndex = -1;
                    if (step.fault) {
                      if (stepIdx === 0) {
                        highlightIndex = step.frames.findIndex(f => f !== -1);
                      } else {
                        const prevFrames = results[stepIdx - 1].frames;
                        highlightIndex = step.frames.findIndex((f, i) => f !== prevFrames[i]);
                      }
                    } else {
                      highlightIndex = step.frames.indexOf(step.page);
                    }

                    return (
                      <tr key={stepIdx} className="hover:bg-[#2A2A40] transition-colors">
                        <td className="p-4 border border-gray-800 font-bold">
                          P{stepIdx + 1} ({step.page})
                        </td>
                        {step.frames.map((frame, frameIdx) => {
                          const isHighlighted = frameIdx === highlightIndex;
                          const cellBg = isHighlighted ? (step.fault ? 'bg-primary' : 'bg-green-500') : '';
                          const textCol = isHighlighted ? 'text-white' : 'text-gray-300';
                          
                          return (
                            <td 
                              key={frameIdx} 
                              className={`p-4 border border-gray-800 font-bold ${cellBg} ${textCol}`}
                            >
                              {frame !== -1 ? frame : ''}
                            </td>
                          );
                        })}
                        <td className={`p-4 border border-gray-800 font-bold ${step.fault ? 'bg-primary' : 'bg-green-500'}`}>
                          {step.fault ? 'FAULT' : 'HIT'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Summary Placeholder (For Phase 5) */}
            <div id="summary-section" className="mt-12">
               {/* Summary will go here in Phase 5 */}
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
};

export default Simulator;
