import React from 'react';
import { Rank, Difficulty } from '../types';
import { Check, ChevronRight, X } from 'lucide-react';

export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose} />
    <div className="bg-surface/95 backdrop-blur-xl w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transform transition-all animate-slide-up relative z-10 border border-border ring-1 ring-white/10">
      <div className="p-4 border-b border-border flex justify-between items-center bg-highlight/50">
        <h3 className="font-serif font-bold text-main text-lg tracking-wide">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-secondary hover:text-main transition-colors">
          <X size={20} />
        </button>
      </div>
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

export const InputField: React.FC<{ label: string; value: string | number; onChange: (val: string) => void; placeholder?: string; type?: string }> = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2 font-serif">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-highlight border border-border rounded-xl px-4 py-3 text-main placeholder-secondary/50 focus:outline-none focus:border-main/50 transition-colors font-sans"
    />
  </div>
);

export const SelectField: React.FC<{ label: string; value: string; onChange: (val: string) => void; options: (string | { value: string; label: string })[] }> = ({ label, value, onChange, options }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2 font-serif">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-highlight border border-border rounded-xl px-4 py-3 text-main appearance-none focus:outline-none focus:border-main/50 transition-colors font-sans"
      >
        {options.map((opt, idx) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lbl = typeof opt === 'string' ? opt : opt.label;
          return <option key={idx} value={val}>{lbl}</option>;
        })}
      </select>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-secondary pointer-events-none">
        <ChevronRight size={16} className="rotate-90" />
      </div>
    </div>
  </div>
);

export const StatRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  progressBarPercentage?: number;
  rankTheme?: { base: string; glow: string };
  onClick?: () => void;
}> = ({ icon: Icon, label, value, valueColor = "text-main", progressBarPercentage, rankTheme, onClick }) => (
  <div className={`flex items-center py-2 min-h-[40px] ${onClick ? "cursor-pointer hover:bg-highlight rounded-lg px-2 -mx-2 transition-colors" : ""}`} onClick={onClick}>
    <div className="flex items-center w-[140px] shrink-0 text-secondary">
      <div className="flex items-center justify-center w-6 h-6 mr-2 opacity-70">
        <Icon size={16} />
      </div>
      <span className="text-sm font-medium font-serif">{label}</span>
    </div>
    <div className={`flex-1 flex items-center gap-4 ${valueColor}`}>
      <span className="text-sm font-medium font-sans">{value}</span>
      {progressBarPercentage !== undefined && (
        <div className="flex-1 h-1.5 bg-highlight rounded-full overflow-hidden max-w-[120px]">
          <div
            className="h-full rounded-full animate-liquid"
            style={{
              width: `${progressBarPercentage}%`,
              background: rankTheme
                ? `linear-gradient(90deg, ${rankTheme.base} 0%, ${rankTheme.glow} 50%, ${rankTheme.base} 100%)`
                : "#8b5cf6",
              backgroundSize: "200% 100%",
              boxShadow: rankTheme ? `0 0 10px ${rankTheme.base}80` : "none"
            }}
          />
        </div>
      )}
    </div>
  </div>
);

export const PropertyRow: React.FC<{ 
    icon: any; 
    label: string; 
    value: React.ReactNode; 
    valueColor?: string;
    progressBarPercentage?: number;
    rankTheme?: { base: string; glow: string };
    onClick?: () => void;
}> = ({ 
    icon: Icon, 
    label, 
    value, 
    valueColor = "text-main", 
    progressBarPercentage,
    rankTheme,
    onClick
}) => (
    <div className={`flex items-start py-2 min-h-[40px] ${onClick ? 'cursor-pointer hover:bg-highlight rounded-lg px-2 -mx-2 transition-colors' : ''}`} onClick={onClick}>
        <div className="flex items-center w-[140px] shrink-0 text-secondary pt-1">
            <div className="flex items-center justify-center w-6 h-6 mr-2 opacity-70">
                <Icon size={16} />
            </div>
            <span className="text-sm font-medium font-serif">{label}</span>
        </div>
        <div className={`flex-1 flex flex-col justify-center min-h-[24px] ${valueColor}`}>
            <span className="text-sm font-medium font-sans w-full leading-tight">{value}</span>
            {progressBarPercentage !== undefined && (
                 <div className="flex-1 h-1.5 bg-highlight rounded-full overflow-hidden max-w-[120px] mt-1">
                     <div 
                        className="h-full rounded-full animate-liquid" 
                         style={{
                            width: `${progressBarPercentage}%`,
                            background: rankTheme
                                ? `linear-gradient(90deg, ${rankTheme.base} 0%, ${rankTheme.glow} 50%, ${rankTheme.base} 100%)`
                                : "#3b82f6", // Default blue if no theme provided
                            backgroundSize: "200% 100%",
                            boxShadow: rankTheme ? `0 0 10px ${rankTheme.base}80` : "none"
                        }}
                     />
                 </div>
            )}
        </div>
    </div>
);

export const FilterPill: React.FC<{ diff: string; active: boolean; onClick: () => void }> = ({ diff, active, onClick }) => {
  let className = "text-secondary bg-highlight border border-border";
  let dotClass = "bg-secondary";

  if (active) {
    if (diff === Difficulty.EASY) {
      className = "text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/50";
      dotClass = "bg-green-500";
    } else if (diff === Difficulty.NORMAL) {
      className = "text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/50";
      dotClass = "bg-blue-500";
    } else if (diff === Difficulty.HARD) {
      className = "text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/50";
      dotClass = "bg-purple-500";
    } else if (diff === Difficulty.EXTREME) {
      className = "text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/50";
      dotClass = "bg-red-500";
    } else if (diff === "ALL") {
      className = "text-main bg-surface border border-main/20";
      dotClass = "bg-main";
    }
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap font-sans ${className}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {diff}
    </button>
  );
};