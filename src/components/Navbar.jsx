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
      <div className="flex items-center gap-4 text-sm font-bold">
        <Link 
          to="/" 
          className={`hover:text-pink-400 transition-colors flex items-center ${location.pathname === '/' ? 'text-pink-400' : 'text-gray-300'}`}
          title="Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        <Link 
          to="/simulator" 
          className="bg-primary hover:bg-pink-600 text-white py-2 px-6 rounded-md transition-colors duration-200"
        >
          Simulator
        </Link>
        <Link 
          to="/algorithms" 
          className="bg-primary hover:bg-pink-600 text-white py-2 px-6 rounded-md transition-colors duration-200"
        >
          Algorithms
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
