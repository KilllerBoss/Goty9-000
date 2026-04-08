
import React, { useState, useRef } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { PlayerClass } from '../../types';

// --- DYNAMIC BACKGROUND LOGIC ---
export const getDynamicCardStyle = (level: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
        backgroundSize: '400% 400%',
        transition: 'all 0.5s ease',
    };

    // --- TIER 1: 0 - 999 (Static / Subtle Gradients) ---
    if (level < 1000) {
        if (level < 100) { // Grau
            return { 
                ...baseStyle, 
                background: 'linear-gradient(135deg, #27272a 0%, #18181b 100%)', // Zinc 800 -> 900
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' 
            }; 
        }
        if (level < 300) { // Grün
            return { 
                ...baseStyle, 
                background: 'linear-gradient(135deg, #14532d 0%, #052e16 100%)', // Green 900 -> Darker
                boxShadow: 'inset 0 0 0 1px rgba(74, 222, 128, 0.2)' 
            }; 
        }
        if (level < 600) { // Blau
            return { 
                ...baseStyle, 
                background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)', // Blue 900
                boxShadow: 'inset 0 0 0 1px rgba(96, 165, 250, 0.2)' 
            }; 
        }
        if (level < 900) { // Violett
            return { 
                ...baseStyle, 
                background: 'linear-gradient(135deg, #581c87 0%, #2e1065 100%)', // Purple 900
                boxShadow: 'inset 0 0 0 1px rgba(192, 132, 252, 0.2)' 
            }; 
        }
        // 900 - 999: Lila / Gold Übergang
        return { 
            ...baseStyle, 
            background: 'linear-gradient(135deg, #4c0519 0%, #2e1065 100%)', // Rose 950 -> Purple 950
            boxShadow: 'inset 0 0 0 1px rgba(251, 113, 133, 0.2)' 
        }; 
    }

    // --- TIER 2: 1000+ (Liquid Animated Effects) ---
    const animation = 'liquid 15s ease infinite';
    const thousands = Math.floor(level / 1000);

    // 1000 - 1999: Grau Basis + Farbverlauf
    if (thousands === 1) {
        return {
            ...baseStyle,
            background: 'linear-gradient(120deg, #18181b 0%, #27272a 25%, #4ade80 50%, #60a5fa 75%, #18181b 100%)',
            animation,
            boxShadow: '0 0 15px rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.1)'
        };
    }

    // 2000 - 2999: Grün Basis + Farbverlauf
    if (thousands === 2) {
         return {
            ...baseStyle,
            background: 'linear-gradient(120deg, #052e16 0%, #14532d 25%, #22d3ee 50%, #c084fc 75%, #052e16 100%)',
            animation,
            boxShadow: '0 0 15px rgba(74, 222, 128, 0.15), inset 0 0 0 1px rgba(74, 222, 128, 0.3)'
        };
    }

    // 3000+: Blau Basis + Farbverlauf
     if (thousands >= 3) {
         return {
            ...baseStyle,
            background: 'linear-gradient(120deg, #172554 0%, #1e3a8a 25%, #f472b6 50%, #fbbf24 75%, #172554 100%)',
            animation,
            boxShadow: '0 0 20px rgba(96, 165, 250, 0.2), inset 0 0 0 1px rgba(96, 165, 250, 0.4)'
        };
    }

    return baseStyle;
}

// Subclass Colors Cycle
const getSubClassColor = (index: number) => {
    const colors = [
        'bg-red-500', 
        'bg-blue-500', 
        'bg-green-500', 
        'bg-yellow-500', 
        'bg-purple-500', 
        'bg-pink-500'
    ];
    return colors[index % colors.length];
}

export const ClassCard: React.FC<{ 
    cls: PlayerClass; 
    onAddSubClass: () => void; 
    onManage: () => void;
}> = ({ cls, onAddSubClass, onManage }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const touchStartY = useRef<number | null>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isPressing = useRef(false);

    // Touch Handlers for Vertical Swipe
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        
        // Long Press Logic
        isPressing.current = false;
        pressTimer.current = setTimeout(() => {
            isPressing.current = true;
            if (navigator.vibrate) navigator.vibrate(50);
            onManage();
        }, 600);
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        // Clear Long Press
        if (pressTimer.current) clearTimeout(pressTimer.current);
        if (isPressing.current) return;

        if (touchStartY.current === null) return;
        const endY = e.changedTouches[0].clientY;
        const diff = endY - touchStartY.current;

        // Detect Vertical Swipe (Down to expand, Up to collapse)
        if (diff > 50 && !isExpanded) {
            setIsExpanded(true);
        } else if (diff < -50 && isExpanded) {
            setIsExpanded(false);
        }

        touchStartY.current = null;
    };

    const cardStyle = getDynamicCardStyle(cls.level);

    return (
        <div 
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            style={{ 
                ...cardStyle,
                height: isExpanded ? 'auto' : '100px',
                minHeight: '100px',
                touchAction: 'pan-x' 
            }}
            className="snap-center shrink-0 w-72 rounded-2xl p-4 relative flex flex-col gap-4 overflow-hidden shadow-lg transition-all duration-300 group"
        >
             <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 shrink-0 bg-black/20 rounded-xl overflow-hidden border border-white/10 shadow-inner">
                    {cls.icon && (cls.icon.startsWith('data:') || cls.icon.startsWith('http')) ? (
                        <img src={cls.icon} className="w-full h-full object-cover" alt="Class" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-white/80">{cls.icon || '🛡️'}</div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                        <h4 className="font-bold text-white text-sm truncate pr-2 font-serif drop-shadow-md">{cls.title}</h4>
                        <span className="text-[9px] font-bold text-white/90 bg-black/20 px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm">Lvl {cls.level}</span>
                    </div>

                    {/* Marquee Subtitle - Only render if subtitle exists */}
                    {cls.subtitle && (
                        <div className="w-full overflow-hidden mb-2 relative h-4">
                            <div className="flex w-max animate-marquee gap-8">
                                <span className="text-xs text-white/60 font-sans whitespace-nowrap">{cls.subtitle}</span>
                                <span className="text-xs text-white/60 font-sans whitespace-nowrap" aria-hidden="true">{cls.subtitle}</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Main Class Bar - Liquid Rainbow Gradient */}
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm">
                        <div 
                            className="h-full rounded-full animate-liquid" 
                            style={{
                                width: `${cls.progress}%`,
                                background: 'linear-gradient(90deg, #9ca3af 0%, #4ade80 25%, #60a5fa 50%, #c084fc 75%, #a855f7 100%)',
                                backgroundSize: '200% 100%',
                                boxShadow: '0 0 10px rgba(255,255,255,0.3)'
                            }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Toggle Expand Button */}
            <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white/50 hover:text-white transition-colors z-30 backdrop-blur-sm opacity-0 group-hover:opacity-100"
            >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Subclasses View (Visible on Expand) */}
            {isExpanded && (
                <div className="animate-fade-in border-t border-white/10 pt-3 flex flex-col gap-2 relative z-10">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Subclasses</span>
                        <button onClick={(e) => { e.stopPropagation(); onAddSubClass(); }} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-20">
                            <Plus size={12} />
                        </button>
                    </div>
                    
                    <div className="space-y-3 mt-1">
                        {(!cls.subClasses || cls.subClasses.length === 0) && (
                            <p className="text-xs text-white/30 italic">No subclasses acquired.</p>
                        )}
                        {cls.subClasses?.map((sub, index) => (
                            <div key={sub.id} className="flex flex-col gap-1">
                                <div className="flex justify-between items-end text-xs text-white/80">
                                    <span className="font-medium">{sub.title}</span>
                                    <span className="text-[9px] opacity-60 font-mono">Lvl {sub.level}</span>
                                </div>
                                <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${getSubClassColor(index)}`} 
                                        style={{width: `${sub.progress}%`}}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
