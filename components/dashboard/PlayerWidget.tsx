
import React, { useState } from 'react';
import { UserProfile, AppAssets } from '../../types';
import { getRankTheme } from '../../gameUtils';
import { Target, Calendar, Clock, Lock } from 'lucide-react';

interface PlayerWidgetProps {
    profile: UserProfile;
    assets: AppAssets;
    onEdit: () => void;
    onCardAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PlayerWidget: React.FC<PlayerWidgetProps> = ({ 
    profile, 
    assets, 
    onEdit, 
    onCardAvatarUpload 
}) => {
    const theme = getRankTheme(profile.rank);
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    
    // Avatar Touch State (Front)
    const [avatarTouchStartX, setAvatarTouchStartX] = useState<number | null>(null);
    
    // Back Face Touch State
    const [backTouchStartX, setBackTouchStartX] = useState<number | null>(null);

    // --- FRONT INTERACTION (Avatar Swipe/Click) ---
    const onAvatarTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation();
        setAvatarTouchStartX(e.targetTouches[0].clientX);
    };
  
    const onAvatarTouchEnd = (e: React.TouchEvent) => {
        e.stopPropagation();
        if (avatarTouchStartX === null) return;
        const endX = e.changedTouches[0].clientX;
        const distance = avatarTouchStartX - endX;
        
        // Swipe on Avatar flips card
        if (Math.abs(distance) > 20 || Math.abs(distance) < 5) {
            setIsCardFlipped(true);
        }
        setAvatarTouchStartX(null);
    };

    const handleAvatarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsCardFlipped(true);
    };

    // --- BACK INTERACTION (Swipe to return) ---
    const onBackTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation();
        setBackTouchStartX(e.targetTouches[0].clientX);
    };

    const onBackTouchEnd = (e: React.TouchEvent) => {
        e.stopPropagation();
        if (backTouchStartX === null) return;
        const endX = e.changedTouches[0].clientX;
        const distance = backTouchStartX - endX;

        // Detect horizontal swipe (> 30px) to flip back
        if (Math.abs(distance) > 30) {
            setIsCardFlipped(false);
        }
        setBackTouchStartX(null);
    };

    return (
        <div className="relative w-full h-40 mb-2 perspective-1000 group select-none">
            <div 
                className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isCardFlipped ? '[transform:rotateY(180deg)]' : ''}`}
            >
                {/* --- FRONT FACE --- */}
                <div 
                    className={`absolute inset-0 bg-[#F9F6F0] dark:bg-surface rounded-2xl p-4 overflow-hidden active:scale-[0.98] transition-all [backface-visibility:hidden] ${isCardFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`}
                    style={{ 
                        border: `1px solid ${theme.dark}`,
                        boxShadow: `0 0 0 1px ${theme.base}, 0 0 25px ${theme.glow}40`,
                    }}
                    onClick={onEdit}
                >
                    {/* Background Layer */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center transition-all duration-500 blur-[2px] opacity-25"
                        style={{ backgroundImage: profile.cardBanner ? `url(${profile.cardBanner})` : undefined }}
                    />
                    
                    {profile.banner && <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            
                            {/* Avatar (Trigger for Flip) */}
                            <div className="group w-14 h-14 shrink-0 z-20 cursor-pointer relative"
                                onTouchStart={onAvatarTouchStart}
                                onTouchEnd={onAvatarTouchEnd}
                                onClick={handleAvatarClick}
                            >
                                <div className="w-full h-full rounded-full overflow-hidden border-2 bg-black relative shadow-lg" style={{ borderColor: theme.base }}>
                                    <img src={profile.cardAvatar || profile.avatar || assets.defaultAvatar} alt="Profile" className="w-full h-full object-cover" />
                                    
                                    {/* Hint icon that shows on hover/touch indicating flip */}
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className={`font-bold font-serif text-lg leading-tight mb-1 truncate ${profile.banner ? 'text-white' : 'text-main'}`}>{profile.name}</h2>
                                        <div className="flex items-center gap-2 text-sm text-secondary">
                                            <span className={`font-mono text-xs ${profile.banner ? 'text-white/80' : 'text-main'}`}>Lvl {profile.level}</span>
                                            <span 
                                                className="px-1.5 py-0.5 rounded text-[10px] font-bold border font-serif"
                                                style={{ backgroundColor: theme.base, color: theme.text, borderColor: theme.dark }}
                                            >
                                                {profile.rank}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1 mb-2">
                            <div className={`flex justify-between text-xs font-serif ${profile.banner ? 'text-white/80' : 'text-secondary'}`}>
                                <span>{Math.floor((profile.currentExp / profile.expToNextLevel) * 100)} %</span>
                                <span className="text-yellow-600 dark:text-yellow-500 font-bold">{profile.gold} G</span>
                            </div>
                            <div className="h-1.5 bg-highlight rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full transition-all duration-500 animate-liquid" 
                                    style={{ 
                                        width: `${(profile.currentExp / profile.expToNextLevel) * 100}%`,
                                        background: `linear-gradient(90deg, ${theme.base} 0%, ${theme.glow} 50%, ${theme.base} 100%)`,
                                        backgroundSize: '200% 100%',
                                        boxShadow: `0 0 8px ${theme.base}80`
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- BACK FACE (GOALS) --- */}
                <div 
                    className={`absolute inset-0 bg-[#121212] rounded-2xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] border border-white/10 shadow-2xl flex flex-col ${isCardFlipped ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
                    onTouchStart={onBackTouchStart}
                    onTouchEnd={onBackTouchEnd}
                >
                    {/* Background Texture for Back */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`, backgroundSize: '16px 16px' }}></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none"></div>

                    {/* TOP SECTION: YEAR (50%) */}
                    <div className="flex-[3] border-b border-white/10 p-4 relative flex flex-col items-center justify-center text-center">
                        <div className="absolute top-2 left-3 flex items-center gap-1.5 text-[9px] font-bold text-red-500 uppercase tracking-widest opacity-80">
                            <Target size={9} /> YEAR
                        </div>
                        <h3 className="text-white font-serif font-bold text-lg leading-tight max-w-[95%] line-clamp-2">
                            {profile.mainGoal || "Set Goal"}
                        </h3>
                        {!profile.mainGoal && <Lock size={16} className="text-white/20 mt-2" />}
                    </div>

                    {/* BOTTOM SECTION: SPLIT (50%) - FIXED GRID */}
                    <div className="flex-[3] grid grid-cols-2 h-full">
                        {/* LEFT: MONTH */}
                        <div className="border-r border-white/10 p-3 relative flex flex-col items-center justify-center text-center h-full">
                            <div className="absolute top-2 left-3 text-[8px] font-bold text-blue-400 uppercase tracking-widest opacity-80 flex items-center gap-1">
                                <Calendar size={8} /> MONTH
                            </div>
                            <div className="w-full flex items-center justify-center pt-3 h-full">
                                <div className="text-white/90 font-mono text-sm font-medium line-clamp-2 w-full px-1">
                                    {profile.monthlyIncome || "-"}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: WEEK */}
                        <div className="p-3 relative flex flex-col items-center justify-center text-center h-full">
                            <div className="absolute top-2 left-3 text-[8px] font-bold text-green-400 uppercase tracking-widest opacity-80 flex items-center gap-1">
                                <Clock size={8} /> WEEK
                            </div>
                            <div className="w-full flex items-center justify-center pt-3 h-full">
                                <div className="text-white/90 font-mono text-sm font-medium line-clamp-2 w-full px-1">
                                    {profile.dailyFocus || "-"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
