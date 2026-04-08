import React from 'react';
import { Search, Plus, X, ChevronDown } from 'lucide-react';

// --- UI COMPONENTS ---

export const SectionHeader: React.FC<{ 
  title: string; 
  icon: any; 
  onAdd?: (e: React.MouseEvent) => void; 
  onSearch?: () => void;
  isSearchActive?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
}> = ({ 
  title, 
  icon: Icon, 
  onAdd, 
  onSearch, 
  isSearchActive, 
  isOpen, 
  onToggle, 
  children 
}) => (
  <div className="flex flex-col gap-2 py-5">
      <div className="flex items-center justify-between group select-none">
        <div 
            className="flex items-center gap-2 text-main cursor-pointer"
            onClick={onToggle}
        >
          <Icon size={20} className="text-secondary group-hover:text-red-500 transition-colors" />
          <span className="font-serif font-bold text-lg pb-0.5 tracking-wide">{title}</span>
        </div>
        <div className="flex gap-2 text-secondary">
          {onSearch && (
            <button 
                onClick={(e) => { e.stopPropagation(); onSearch(); }}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all border border-transparent ${isSearchActive ? 'bg-surface text-main shadow-sm' : 'bg-highlight hover:bg-black/10 dark:hover:bg-white/10 text-secondary'}`}
            >
                <Search size={14} />
            </button>
          )}
          {onAdd && (
            <button 
                onClick={(e) => { e.stopPropagation(); onAdd(e); }}
                className="flex items-center justify-center w-8 h-8 bg-highlight hover:bg-red-500/20 text-secondary hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-full transition-all"
            >
                <Plus size={16} />
            </button>
          )}
        </div>
      </div>
      {/* Inline Search / Filter Area */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSearchActive && isOpen ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
         {children}
      </div>
  </div>
);

export const DifficultyPill: React.FC<{ diff: string; active?: boolean; onClick: () => void }> = ({ diff, active, onClick }) => {
    let colorClass = "text-secondary bg-highlight border border-border";
    let dotColor = "bg-secondary";

    if (active) {
         if (diff === 'EASY') { colorClass = "text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/50"; dotColor = "bg-green-500"; }
         else if (diff === 'NORMAL') { colorClass = "text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/50"; dotColor = "bg-blue-500"; }
         else if (diff === 'HARD') { colorClass = "text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/50"; dotColor = "bg-purple-500"; }
         else if (diff === 'EXTREME') { colorClass = "text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/50"; dotColor = "bg-red-500"; }
         else if (diff === 'ABSURD') { colorClass = "text-white dark:text-white bg-black dark:bg-black/80 border border-white/20"; dotColor = "bg-white"; }
         else if (diff === 'ARCHIVED') { colorClass = "text-stone-600 dark:text-stone-400 bg-stone-500/10 border border-stone-500/50"; dotColor = "bg-stone-500"; }
         else if (diff === 'ALL') { colorClass = "text-main bg-surface border border-main/20"; dotColor = "bg-main"; }
    }

    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap font-sans ${colorClass}`}
        >
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
            {diff}
        </button>
    )
}

export const SortPill: React.FC<{ label: string; active: boolean; onClick: () => void; icon: any }> = ({ label, active, onClick, icon: Icon }) => {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border font-sans ${active ? 'bg-main text-surface border-main' : 'bg-highlight text-secondary border-border hover:border-secondary/50'}`}
        >
            <Icon size={12} />
            {label}
        </button>
    )
}

// --- HELPER COMPONENTS ---

export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; hideHeader?: boolean; fullScreen?: boolean }> = ({ title, onClose, children, hideHeader, fullScreen }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />
        <div className={`${fullScreen ? 'w-full h-full' : 'w-full max-w-md max-h-[85vh]'} bg-transparent overflow-hidden transform transition-all animate-slide-up relative z-10 flex flex-col items-center justify-center`}>
            {!hideHeader && (
                <div className="w-full p-4 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-xl rounded-t-3xl">
                    <h3 className="font-serif font-bold text-white text-lg tracking-wide">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
            )}
            <div className={`w-full overflow-y-auto ${!hideHeader ? 'bg-surface/95 backdrop-blur-xl p-6 rounded-b-3xl border border-border ring-1 ring-white/10' : ''}`}>
                {children}
            </div>
        </div>
    </div>
);

export const InputField: React.FC<{ 
    label: string; 
    value: string | number; 
    onChange: (val: string) => void; 
    placeholder?: string; 
    type?: string 
}> = ({ label, value, onChange, placeholder, type = "text" }) => (
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

export const SelectField: React.FC<{ 
    label: string; 
    value: string; 
    onChange: (val: string) => void; 
    options: (string | { value: string; label: string })[] 
}> = ({ label, value, onChange, options }) => (
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
                    const lab = typeof opt === 'string' ? opt : opt.label;
                    return <option key={idx} value={val}>{lab}</option>;
                })}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-secondary pointer-events-none" />
        </div>
    </div>
);