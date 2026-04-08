import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, PlayerClass, ShopItem, Quest, AppAssets } from '../../types';
import { getRankTheme, getExpForLevel } from '../../gameUtils';
import { Edit2, X, Crown, BarChart2, TrendingUp, Target, Gem, Database, Coins, ShoppingBag, Skull, CheckCircle2, Zap, ChevronUp, ChevronDown, Lock } from 'lucide-react';
import { PropertyRow } from '../SharedUI';

// --- HELPER FUNCTIONS FOR CLASS VISUALS ---
const getClassColorInfo = (level: number) => {
    if (level < 100) return { color: '#9ca3af', shadow: 'rgba(156, 163, 175, 0.5)' }; // Grey
    if (level < 300) return { color: '#4ade80', shadow: 'rgba(74, 222, 128, 0.5)' }; // Green
    if (level < 600) return { color: '#60a5fa', shadow: 'rgba(96, 165, 250, 0.5)' }; // Blue
    if (level < 900) return { color: '#c084fc', shadow: 'rgba(192, 132, 252, 0.5)' }; // Purple
    return { color: '#fbbf24', shadow: 'rgba(251, 191, 36, 0.5)' }; // Gold
};

const getSubClassColor = (index: number) => {
    const colors = [
        'bg-red-500', 'bg-blue-500', 'bg-green-500', 
        'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'
    ];
    return colors[index % colors.length];
};

// --- INTERACTIVE CLASS LIST ITEM ---
const ClassListItem: React.FC<{ cls: PlayerClass }> = ({ cls }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const touchStartY = useRef<number | null>(null);
    const visuals = getClassColorInfo(cls.level);

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartY.current === null) return;
        const endY = e.changedTouches[0].clientY;
        const diff = endY - touchStartY.current;

        // Swipe Down -> Expand
        if (diff > 50 && !isExpanded) {
            setIsExpanded(true);
        } 
        // Swipe Up -> Collapse (if expanded)
        else if (diff < -50 && isExpanded) {
            setIsExpanded(false);
        }
        touchStartY.current = null;
    };

    return (
        <div 
            className="flex flex-col gap-2 py-3 border-b border-border last:border-0 transition-all duration-300"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            style={{ touchAction: 'pan-x' }}
        >
            <div className="flex items-center gap-3 text-main group w-full">
                {/* Icon with Level-based Glow */}
                <div 
                    className="w-12 h-12 rounded-xl bg-black/10 overflow-hidden shrink-0 border-2 transition-all duration-300 relative"
                    style={{ 
                        borderColor: visuals.color,
                        boxShadow: `0 0 15px ${visuals.shadow}`
                    }}
                >
                    {cls.icon && (cls.icon.startsWith('data:') || cls.icon.startsWith('http')) ? (
                        <img src={cls.icon} className="w-full h-full object-cover" alt="Icon" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">{cls.icon || '🛡️'}</div>
                    )}
                </div>

                <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold leading-tight truncate font-serif tracking-wide">{cls.title}</span>
                        <span 
                            className="text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ml-2"
                            style={{ 
                                color: visuals.color, 
                                borderColor: visuals.color,
                                backgroundColor: `${visuals.color}15`
                            }}
                        >
                            Lvl {cls.level}
                        </span>
                    </div>

                    {/* Scrolling Subtitle (Marquee) - Only render if subtitle exists */}
                    {cls.subtitle && (
                        <div className="w-full overflow-hidden mb-1.5 relative mask-linear-fade">
                            <div className="flex w-max animate-marquee gap-8">
                                 {/* Duplicate text for seamless loop */}
                                <span className="text-xs text-secondary font-sans whitespace-nowrap">{cls.subtitle}</span>
                                <span className="text-xs text-secondary font-sans whitespace-nowrap" aria-hidden="true">{cls.subtitle}</span>
                            </div>
                             {/* Subtle fade on edges */}
                            <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
                            <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
                        </div>
                    )}
                    
                    {/* Liquid Bar Effect */}
                    <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full rounded-full animate-liquid" 
                            style={{ 
                                width: `${cls.progress}%`,
                                background: 'linear-gradient(90deg, #9ca3af 0%, #4ade80 25%, #60a5fa 50%, #c084fc 75%, #a855f7 100%)',
                                backgroundSize: '200% 100%'
                            }} 
                        />
                    </div>
                </div>
            </div>

            {/* Subclasses Expansion */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out pl-[3.75rem] ${isExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                {(!cls.subClasses || cls.subClasses.length === 0) ? (
                    <p className="text-xs text-secondary italic">Keine Subklassen verfügbar.</p>
                ) : (
                    <div className="space-y-3 pt-1">
                        <div className="text-[9px] font-bold text-secondary uppercase tracking-widest opacity-70 flex items-center gap-2">
                            <ChevronDown size={10} /> Subclasses
                        </div>
                        {cls.subClasses.map((sub, idx) => (
                            <div key={sub.id} className="flex flex-col gap-1">
                                <div className="flex justify-between items-end text-xs text-main">
                                    <span className="font-medium">{sub.title}</span>
                                    <span className="text-[10px] opacity-60 font-mono">Lvl {sub.level}</span>
                                </div>
                                <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${getSubClassColor(idx)}`} 
                                        style={{ width: `${sub.progress}%` }} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Visual Hint for Collapsing */}
                {isExpanded && (
                    <div className="w-full flex justify-center mt-3 opacity-20">
                        <ChevronUp size={12} className="animate-bounce" />
                    </div>
                )}
            </div>
        </div>
    );
};

interface PlayerProfileViewProps { 
    profile: UserProfile; 
    classes: PlayerClass[]; 
    shopItems: ShopItem[]; 
    quests: Quest[]; 
    onClose: () => void; 
    onEdit: () => void;
    assets: AppAssets;
}

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({ 
    profile, 
    classes, 
    shopItems,
    quests,
    onClose, 
    onEdit,
    assets
}) => {
    
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const theme = getRankTheme(profile.rank);

    // Scroll Animation Logic
    useEffect(() => {
        const handleScroll = () => {
            if (!scrollRef.current || !containerRef.current) return;
            const scrollTop = scrollRef.current.scrollTop;
            // Updated divisor: 12rem (difference between 17rem and 5rem) = 192px
            const progress = Math.min(1, Math.max(0, scrollTop / 192));
            containerRef.current.style.setProperty('--p', progress.toString());
        };

        const el = scrollRef.current;
        el?.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => el?.removeEventListener('scroll', handleScroll);
    }, []);

    // Calculated Stats
    const nextLevelPercentage = Math.floor((profile.currentExp / profile.expToNextLevel) * 100);
    const hasPenalty = (profile.penaltyPoints || 0) > 0;
    
    let accumulatedXp = 0;
    for(let i = 1; i < profile.level; i++) {
        accumulatedXp += getExpForLevel(i);
    }
    const totalXP = accumulatedXp + profile.currentExp;
    
    const lifetimeGold = profile.history?.totalGoldEarned || 0;
    const goldSpent = profile.history?.totalGoldSpent || 0;
    const penaltiesUsed = profile.history?.totalPenalties || 0;
    const completedQuestsCount = profile.history?.completedQuests || 0;

    return (
        <div 
            ref={containerRef}
            className="fixed inset-0 z-[55] bg-background animate-fade-in font-sans text-main flex flex-col"
            style={{ '--p': 0 } as React.CSSProperties}
        >
            
            {/* --- DYNAMIC HEADER --- */}
            <div 
                className="absolute top-0 left-0 right-0 z-40 overflow-hidden pointer-events-none"
                style={{ 
                    // INCREASED HEIGHT: Start at 17rem -> End at 5rem (smaller)
                    // Difference is 12rem
                    height: 'calc(17rem - (12rem * var(--p)))', 
                    borderBottom: '1px solid var(--border-color)'
                }}
            >
                {/* Background Banner */}
                <div 
                    className={`absolute inset-0 bg-cover bg-center`}
                    style={{ 
                        backgroundImage: `url(${profile.banner || assets.bannerLight})`,
                        opacity: 'calc(1 - (0.3 * var(--p)))', // Banner stays partially visible (0.7 opacity)
                    }}
                >
                     {/* Gradient Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-t from-background via-background/60 to-transparent z-10"></div>
                </div>
                
                {/* Glass Background overlay for collapsed state - MATCHES BG-BACKGROUND */}
                <div 
                    className="absolute inset-0 bg-background/95 backdrop-blur-sm transition-all"
                    style={{ opacity: 'calc(var(--p))' }}
                ></div>
                
                {/* Avatar */}
                <div 
                    className="absolute z-50 pointer-events-auto cursor-pointer overflow-hidden shadow-2xl"
                    onClick={onEdit}
                    style={{
                        width: 'calc(8rem - (5.5rem * var(--p)))', // 8rem -> 2.5rem
                        height: 'calc(8rem - (5.5rem * var(--p)))',
                        // Center in 5rem header: (5 - 2.5) / 2 = 1.25rem
                        // Start: 3.5rem. Delta: 3.5 - 1.25 = 2.25rem
                        top: 'calc(3.5rem - (2.25rem * var(--p)))',
                        left: '1.5rem',
                        borderRadius: 'calc(0.75rem + (50% * var(--p)))',
                        zIndex: 50
                    }}
                >
                    <img 
                        src={profile.avatar || assets.defaultAvatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ display: 'var(--p) > 0.5 ? "none" : "flex"' }}>
                        <Edit2 size={24} className="text-white"/>
                    </div>
                </div>

                {/* Text Block */}
                <div 
                    className="absolute z-40 flex flex-col justify-center"
                    style={{
                        width: 'calc(100% - 6rem)'
                    }}
                >
                     <h2 
                        className="absolute font-bold text-red-500 uppercase tracking-widest truncate font-serif"
                        style={{ 
                            fontSize: '0.875rem', 
                            // Moved UP slightly to fit well within 17rem height (12.5rem start)
                            top: '12.5rem', 
                            left: '1.5rem',
                            opacity: 'calc(1 - (5 * var(--p)))',
                            pointerEvents: 'none',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}
                     >
                        {profile.title}
                     </h2>

                     <h1 
                        className="absolute font-serif text-main tracking-wide font-medium truncate leading-none"
                        style={{
                            // Transition from 13.5rem (large) to ~1.75rem (collapsed center alignment)
                            // 13.5 - 1.75 = 11.75rem delta
                            top: 'calc(13.5rem - (11.75rem * var(--p)))',
                            left: 'calc(1.5rem + (3.5rem * var(--p)))',
                            fontSize: 'calc(2.5rem - (1.25rem * var(--p)))', // 2.5rem -> 1.25rem
                            lineHeight: '1.1',
                            paddingBottom: '0.2em',
                            textShadow: 'var(--p) < 0.5 ? "0 2px 10px rgba(0,0,0,0.5)" : "none"'
                        }}
                     >
                        {profile.name}
                     </h1>
                </div>

            </div>
            
            <button 
                onClick={onClose} 
                className="absolute right-5 z-[60] text-secondary hover:text-main bg-glass p-2 rounded-full backdrop-blur-md border border-border"
                style={{
                    // Transition to exactly 1.25rem top for centering in 5rem header
                    top: 'calc(1.25rem + (0.625rem * (1 - var(--p))))'
                }}
            >
                <X size={20} />
            </button>

            {/* SCROLL CONTAINER */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto no-scrollbar relative w-full"
            >
                {/* SPACER - Matching new height 17rem */}
                <div className="h-[17rem] w-full shrink-0"></div>

                {/* CONTENT - PADDING ADJUSTED TO 80vh */}
                <div className="pb-[80vh] flex flex-col">
                    
                    <div className="px-6 space-y-1 relative z-10">
                        <PropertyRow 
                            icon={Crown} 
                            label="Rank" 
                            value={
                                 <span style={{ color: theme.base }} className="font-bold drop-shadow-sm">
                                    {profile.rank}
                                 </span>
                            } 
                        />
                        <PropertyRow 
                            icon={BarChart2} 
                            label="Level" 
                            value={`Lvl ${profile.level}`} 
                        />
                        <PropertyRow 
                            icon={TrendingUp} 
                            label="Next Level" 
                            value={`${nextLevelPercentage} %`}
                            progressBarPercentage={nextLevelPercentage}
                            rankTheme={theme}
                        />
                        <PropertyRow 
                            icon={Target} 
                            label="EXP to Level Up" 
                            value={`${profile.currentExp} / ${profile.expToNextLevel}`} 
                        />
                        <PropertyRow 
                            icon={Gem} 
                            label="Aktuelles Gold" 
                            value={
                                hasPenalty ? (
                                    <div className="flex items-center gap-2">
                                        {profile.gold.toLocaleString()}
                                        <Lock size={12} strokeWidth={2.5} />
                                    </div>
                                ) : (
                                    `${profile.gold.toLocaleString()}`
                                )
                            }
                            valueColor={hasPenalty ? "text-red-500 font-mono font-bold" : "text-yellow-600 dark:text-yellow-500 font-mono"}
                        />
                    </div>

                    <div className="px-6 mt-6 relative z-10">
                        <div 
                            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                            className="flex items-center gap-2 cursor-pointer text-secondary hover:text-main py-2 select-none"
                        >
                            {isStatsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            <span className="text-sm font-bold uppercase tracking-wider font-serif">Erweiterte Statistiken</span>
                        </div>
                        
                        <div className={`space-y-1 overflow-hidden transition-all duration-300 ${isStatsExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                            <PropertyRow 
                                icon={Database} 
                                label="Gesamt XP (Lifetime)" 
                                value={totalXP.toLocaleString()} 
                            />
                            <PropertyRow 
                                icon={Coins} 
                                label="Gesamt Gold (Verdient)" 
                                value={lifetimeGold.toLocaleString()} 
                            />
                            <PropertyRow 
                                icon={ShoppingBag} 
                                label="Gold ausgegeben" 
                                value={`-${goldSpent.toLocaleString()}`} 
                                valueColor="text-red-400"
                            />
                            <PropertyRow 
                                icon={Skull} 
                                label="Penalty Wert" 
                                value={`-${penaltiesUsed.toLocaleString()}`}
                                valueColor="text-red-500" 
                            />
                            <PropertyRow 
                                icon={CheckCircle2} 
                                label="Quests Erledigt" 
                                value={completedQuestsCount}
                                valueColor="text-green-500" 
                            />
                        </div>
                    </div>
                    
                    {/* ACTIVE CLASSES - LIST VIEW */}
                    <div className="px-6 mt-8 relative z-10 border-t border-border pt-4">
                        <div className="flex items-center gap-2 text-secondary mb-4 pb-2">
                            <Zap size={18} />
                            <span className="font-bold text-sm uppercase tracking-wider font-serif">Aktive Klassen</span>
                        </div>

                        <div className="pl-0">
                            {classes.length === 0 ? (
                                <span className="text-sm text-secondary italic pl-2">Keine Klassen freigeschaltet.</span>
                            ) : (
                                classes.map(cls => (
                                    <ClassListItem key={cls.id} cls={cls} />
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};