import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';

export const LetterTimeCapsule: React.FC = () => {
  const [isSealed, setIsSealed] = useState(false);
  const [content, setContent] = useState('');

  if (isSealed) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8 animate-fade-in">
        <div className="relative">
          <div className="w-48 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-2xl flex items-center justify-center border-t-8 border-gray-300 dark:border-gray-600 transform rotate-[-2deg]">
            <Lock size={48} className="opacity-50" />
          </div>
          <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
            DO NOT OPEN
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">Versiegelt bis 28.12.2026</h2>
          <p className="opacity-60 max-w-sm mx-auto">
            "Während du steigst, vergisst du, woher du kommst."<br/>
            Dieser Brief wird dich daran erinnern. Arbeite hart, damit du stolz sein kannst, wenn du ihn öffnest.
          </p>
        </div>
        <div className="p-4 bg-yellow-100/10 border border-yellow-500/30 rounded-xl text-yellow-600 dark:text-yellow-400 text-sm">
          Status: Gespeichert & Verschlüsselt
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pb-24 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="text-blue-500" />
          Brief an Dein Zukunfts-Ich
        </h2>
        <p className="text-sm opacity-70">
          Schreibe an dich selbst am 28. Dezember 2026. Wo willst du stehen? Was sind deine aktuellen Struggles? Sei brutal ehrlich.
        </p>
      </div>

      <div className="flex-1 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full bg-[#fffdf0] dark:bg-[#1c1c1c] text-slate-800 dark:text-gray-200 p-8 rounded-xl shadow-inner text-lg leading-loose resize-none focus:outline-none font-serif"
          style={{ 
            backgroundImage: 'linear-gradient(transparent, transparent 31px, rgba(0,0,0,0.1) 31px)', 
            backgroundSize: '100% 32px',
            lineHeight: '32px'
          }}
          placeholder="Liebes Zukunfts-Ich..."
        />
      </div>

      <button
        onClick={() => setIsSealed(true)}
        disabled={content.length < 50}
        className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold tracking-widest uppercase shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Brief Versiegeln
      </button>
    </div>
  );
};