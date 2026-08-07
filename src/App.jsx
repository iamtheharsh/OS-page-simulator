import React from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Simulator from './pages/Simulator';
import Algorithms from './pages/Algorithms';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-darkbg text-white font-sans">
      <Navbar />
      <main className="pb-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/algorithms" element={<Algorithms />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
