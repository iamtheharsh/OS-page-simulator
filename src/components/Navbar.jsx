import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="bg-[#2D234A] py-4 px-8 flex justify-between items-center text-white sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
             {/* We will add logo1.png here later */}
             <img src="/images/logo1.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-wide">Page Replacement Algorithms</h1>
        </Link>
      </div>
      <div className="flex gap-6 text-sm font-medium">
        <Link 
          to="/simulator" 
          className={`hover:text-pink-400 transition-colors ${location.pathname === '/simulator' ? 'text-pink-400' : 'text-gray-300'}`}
        >
          Simulator
        </Link>
        <Link 
          to="/algorithms" 
          className={`hover:text-pink-400 transition-colors ${location.pathname === '/algorithms' ? 'text-pink-400' : 'text-gray-300'}`}
        >
          Algorithms
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
