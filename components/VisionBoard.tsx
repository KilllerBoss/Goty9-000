import React, { useState, useEffect } from 'react';
import { Target, Eye, Ban } from 'lucide-react';

export const VisionBoard: React.FC = () => {
  const [showGreenDot, setShowGreenDot] = useState(false);

  // Simple "Green Dot" focus simulation
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (showGreenDot) {
      timeout = setTimeout(() => setShowGreenDot(false), 5000);
    }
    return () => clearTimeout(timeout);
  }, [showGreenDot]);

  if (showGreenDot) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black flex items-center justify-center cursor-pointer"
        onClick={() => setShowGreenDot(false)}
      >
        <div className="relative w-full h-full">
           {/* Distractions (Yellow dots) */}
           <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-yellow-500 rounded-full animate-pulse opacity-20"></div>
           <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-yellow-500 rounded-full animate-pulse opacity-20 delay-100"></div>
           <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-yellow-500 rounded-full animate-pulse opacity-20 delay-200"></div>
           
           {/* The Focus (Green Dot) */}
           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
             <div className="w-8 h-8 bg-green-500 rounded-full shadow-[0_0_50px_rgba(34,197,94,0.8)] animate-pulse"></div>
             <p className="mt-8 text-white font-mono text-sm tracking-[0.5em] uppercase opacity-0 animate-fade-in delay-1000">Laser Focus</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-800 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <Target className="absolute -right-6 -bottom-6 text-white opacity-10" size={150} />
        <h2 className="text-3xl font-bold mb-4">Dein "One Focus"</h2>
        <p className="text-emerald-100 mb-6 max-w-md">
          "Eine Person, die versucht zwei Hasen zu fangen, wird niemals einen Hasen fangen."
        </p>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <input 
            type="text" 
            placeholder="Was ist dein EINZIGES Hauptziel für 2026?"
            className="w-full bg-transparent text-white placeholder-emerald-200/50 text-xl font-bold outline-none border-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => setShowGreenDot(true)}
          className="bg-gray-900 dark:bg-white text-white dark:text-black p-6 rounded-3xl flex flex-col items-center justify-center gap-4 hover:scale-[1.02] transition-transform shadow-lg"
        >
          <Eye size={32} />
          <span className="font-bold">Fokus-Übung starten</span>
          <span className="text-xs opacity-60">"Der grüne Punkt"</span>
        </button>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
           <div className="flex items-center gap-2 mb-4 text-red-500">
              <Ban size={20} />
              <h3 className="font-bold">Eliminierungs-Liste</h3>
           </div>
           <p className="text-xs opacity-60 mb-4">Was musst du 2026 NICHT mehr tun?</p>
           <ul className="space-y-3">
             {['Netflix bingen', 'Aufschieben', 'Negative Menschen'].map(item => (
               <li key={item} className="flex items-center gap-3 text-sm opacity-80 decoration-slate-400 line-through decoration-2">
                 <div className="w-2 h-2 bg-red-500 rounded-full" />
                 {item}
               </li>
             ))}
             <li className="text-blue-500 text-sm font-semibold cursor-pointer">+ Hinzufügen</li>
           </ul>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold mb-4">Identitätsshifting</h3>
        <p className="text-sm opacity-70 mb-4">
          Wer willst du Ende 2026 sein? (Charakter, Finanzen, Beziehungen)
        </p>
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-500">Monatliches Einkommen</label>
                <input type="text" placeholder="z.B. 10.000 €" className="w-full bg-transparent mt-2 font-bold text-lg outline-none" />
            </div>
            <div className="bg-white dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-500">Charaktereigenschaft #1</label>
                <input type="text" placeholder="z.B. Unerschütterliche Disziplin" className="w-full bg-transparent mt-2 font-bold text-lg outline-none" />
            </div>
        </div>
      </div>
    </div>
  );
};