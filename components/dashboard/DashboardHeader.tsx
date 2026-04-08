import React from 'react';
import { ShoppingBag, Trophy, Coins, Skull } from 'lucide-react';
import { UserProfile, AppAssets } from '../../types';

interface DashboardHeaderProps {
    isShopOpen: boolean;
    profile: UserProfile;
    assets: AppAssets;
    onToggleShop: () => void;
    onPressStart: () => void;
    onPressEnd: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
    isShopOpen, 
    profile, 
    assets, 
    onToggleShop,
    onPressStart,
    onPressEnd
}) => {
    const hasPenalty = (profile.penaltyPoints || 0) > 0;

    return (
        <>
            <div 
                className="fixed top-0 left-0 right-0 z-50 w-full overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border-b border-white/10 will-change-transform transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]"
                style={{ 
                    height: isShopOpen ? '5rem' : 'calc(11rem - (6.75rem * var(--scroll-p)))',
                }}
            >
                {/* Masked Background Container */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-surface"></div>
                    
                    {/* Dynamic Texture Banner */}
                    <div 
                        className={`absolute inset-0 bg-cover bg-center transition-all duration-500`}
                        style={{ 
                            backgroundImage: `url(${assets.bannerLight})`,
                            opacity: 'calc(1 - var(--scroll-p))' 
                        }}
                    >
                        <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-300 dark:opacity-100 opacity-0" 
                             style={{ backgroundImage: `url(${assets.bannerDark})` }}>
                        </div>
                    </div>
                    
                    <div className={`absolute inset-0 bg-gradient-to-b via-[#471D1E]/50 to-transparent transition-colors duration-500 ${hasPenalty ? 'from-red-900' : 'from-[#471D1E]'}`}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-20"></div>

                <div className="absolute inset-0 w-full h-full pointer-events-none">
                    
                    {/* Interaction Icon */}
                    <div 
                       onPointerDown={onPressStart}
                       onPointerUp={onPressEnd}
                       onPointerLeave={onPressEnd}
                       className={`absolute bg-[#4C1C1C] oled:bg-[#2a0f0f] rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-sm shadow-xl overflow-hidden transition-all duration-500 pointer-events-auto cursor-pointer hover:bg-[#5e2222] z-50 select-none ${isShopOpen ? 'scale-90 border-[#4C1C1C]/50' : ''}`}
                       style={{
                           width: isShopOpen ? '2.5rem' : 'calc(4rem - (1.5rem * var(--scroll-p)))',
                           height: isShopOpen ? '2.5rem' : 'calc(4rem - (1.5rem * var(--scroll-p)))',
                           left: isShopOpen ? '1rem' : 'calc(1.5rem - (0.5rem * var(--scroll-p)))',
                           bottom: isShopOpen ? '1.25rem' : 'calc(0.875rem + (3.625rem * (1 - var(--scroll-p))))',
                           borderRadius: 'calc(0.75rem - (0.125rem * var(--scroll-p)))'
                       }}
                    >
                        {isShopOpen ? (
                            <ShoppingBag className="text-white oled:text-gray-300 animate-pulse" style={{ width: '50%', height: '50%' }} />
                        ) : (
                            <Trophy className="text-white oled:text-gray-300 transition-none" style={{ width: '50%', height: '50%' }} />
                        )}
                    </div>

                    <h1 
                       className={`absolute font-bold text-white tracking-tight whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] origin-bottom-left font-serif ${isShopOpen ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}
                       style={{
                           fontSize: isShopOpen ? '1.25rem' : 'calc(1.25rem + (0.625rem * (1 - var(--scroll-p))))',
                           left: isShopOpen ? '4.2rem' : 'calc(4.2rem - (2.7rem * (1 - var(--scroll-p))))',
                           bottom: isShopOpen ? '1.6rem' : 'calc(1.25rem + (0.55rem * (1 - var(--scroll-p))))'
                       }}
                    >
                        Leveling Impact
                    </h1>

                     <h1 
                       className={`absolute font-bold text-white tracking-tight whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] origin-bottom-left font-serif ${isShopOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                       style={{
                           fontSize: isShopOpen ? '1.25rem' : 'calc(1.25rem + (0.625rem * (1 - var(--scroll-p))))',
                           left: isShopOpen ? '4.2rem' : 'calc(4.2rem - (2.7rem * (1 - var(--scroll-p))))',
                           bottom: isShopOpen ? '1.6rem' : 'calc(1.25rem + (0.55rem * (1 - var(--scroll-p))))'
                       }}
                    >
                        Black Market
                    </h1>
                </div>
            </div>

            {/* Wealth / Debt Display */}
            <div className={`fixed top-2 right-4 z-50 transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${isShopOpen ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0'}`}>
                <div className="flex flex-col items-end">
                    {hasPenalty ? (
                        <>
                            <span className="text-[9px] uppercase text-red-500 font-bold tracking-wider mb-1 font-serif animate-pulse">Outstanding Debt</span>
                            <div className="flex items-center gap-2 bg-red-950/90 border border-red-500/50 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-lg shadow-red-900/50">
                                <Skull className="text-red-500" size={16} />
                                <span className="text-lg font-mono font-bold text-red-500">{profile.penaltyPoints.toLocaleString()}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="text-[9px] uppercase text-yellow-600 dark:text-yellow-500/70 font-bold tracking-wider mb-1 font-serif">Total Wealth</span>
                            <div className="flex items-center gap-2 bg-surface/90 border border-yellow-500/20 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-lg">
                                <Coins className="text-yellow-500" size={16} />
                                <span className="text-lg font-mono font-bold text-yellow-600 dark:text-yellow-400">{profile.gold.toLocaleString()}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};