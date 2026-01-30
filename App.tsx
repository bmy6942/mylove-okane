import React from 'react';
import { Calculator } from './components/Calculator';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <Calculator />
      
      <footer className="mt-12 text-center text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Rental Management System. All rights reserved.</p>
        <p className="mt-1 text-xs">依據中華民國稅法計算 (所得稅10% / 二代健保2.11%)</p>
      </footer>
    </div>
  );
};

export default App;