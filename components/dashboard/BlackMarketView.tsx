
import React, { useState } from 'react';
import { Gift, Gavel, Lock, Gem, Skull, Coins, AlertTriangle, Plus, ArrowRight, Trash2, Infinity } from 'lucide-react';
import { ShopItem } from '../../types';
import { SectionHeader } from './BaseUI';
import { getRankTheme } from '../../gameUtils';

interface BlackMarketViewProps {
    shopItems: ShopItem[];
    isVisible: boolean;
    onBuyItem: (id: string) => void;
    onDeleteItem: (id: string) => void;
    onAddItem: (type: 'REWARD' | 'PENALTY') => void;
    currentPenaltyPoints: number; 
}

export const BlackMarketView: React.FC<BlackMarketViewProps> = ({ 
    shopItems, 
    isVisible, 
    onBuyItem, 
    onDeleteItem,
    onAddItem,
    currentPenaltyPoints = 0
}) => {
    const [activeShopTab, setActiveShopTab] = useState<'REWARD' | 'PENALTY'>('REWARD');
    
    const filteredShopItems = shopItems.filter(i => i.type === activeShopTab);
    const hasDebt = currentPenaltyPoints > 0;

    return (
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform will-change-transform ${isVisible ? 'block' : 'hidden'} min-h-[calc(100vh-5rem)]`}>
            
            {/* Market Tabs */}
            <div className="px-4 pt-2 mb-4">
                <div className="bg-highlight p-1 rounded-xl flex gap-1 border border-border">
                    <button 
                        onClick={() => setActiveShopTab('REWARD')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all font-serif uppercase tracking-wide ${activeShopTab === 'REWARD' ? 'bg-surface text-main shadow-sm ring-1 ring-border' : 'text-secondary hover:text-main'}`}
                    >
                        <Gift size={14} className={activeShopTab === 'REWARD' ? 'text-yellow-500' : ''} />
                        Rewards
                        {hasDebt && activeShopTab === 'REWARD' && <Lock size={10} className="text-red-500 ml-1" />}
                    </button>
                    <button 
                        onClick={() => setActiveShopTab('PENALTY')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all font-serif uppercase tracking-wide ${activeShopTab === 'PENALTY' ? 'bg-surface text-main shadow-sm ring-1 ring-border' : 'text-secondary hover:text-main'}`}
                    >
                        <Gavel size={14} className={activeShopTab === 'PENALTY' ? 'text-red-500' : ''} />
                        Penaltys
                        {hasDebt && activeShopTab === 'PENALTY' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 ml-1 animate-pulse"></div>}
                    </button>
                </div>
            </div>

            <div className="px-4 pb-20">
                {hasDebt && activeShopTab === 'REWARD' && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 animate-pulse">
                        <Skull className="text-red-500" size={20} />
                        <div>
                            <h4 className="text-red-500 font-bold text-xs uppercase tracking-wider">Locked</h4>
                            <p className="text-red-400 text-[10px]">Debt: {currentPenaltyPoints} pts</p>
                        </div>
                    </div>
                )}

                <SectionHeader 
                    title={activeShopTab === 'REWARD' ? "Rewards" : "Penaltys"} 
                    icon={activeShopTab === 'REWARD' ? Gem : Skull} 
                    onAdd={() => onAddItem(activeShopTab)} 
                />

                {/* Items Grid/List */}
                <div className={`grid ${activeShopTab === 'REWARD' ? 'grid-cols-2 gap-3' : 'grid-cols-1 gap-3'}`}>
                    {filteredShopItems.length === 0 && (
                        <div className="col-span-full p-8 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-secondary opacity-60">
                             <Lock size={24} className="mb-2" />
                             <p className="text-xs font-medium font-serif">Empty.</p>
                        </div>
                    )}
                    
                    {filteredShopItems.map(item => {
                        const isLocked = hasDebt && item.type === 'REWARD';
                        const theme = getRankTheme(item.rank);
                        const isPenalty = item.type === 'PENALTY';

                        return (
                            <div 
                                key={item.id} 
                                onClick={() => !isLocked && onBuyItem(item.id)}
                                className={`rounded-2xl relative overflow-hidden group transition-all duration-300 ${
                                    isLocked 
                                    ? 'opacity-50 cursor-not-allowed grayscale border border-border bg-surface'
                                    : 'active:scale-[0.98] cursor-pointer'
                                }`}
                                style={!isLocked ? {
                                    border: `1px solid ${theme.dark}`,
                                    boxShadow: `0 0 0 1px ${theme.base}, 0 0 20px ${theme.glow}40`,
                                } : {}}
                            >
                                {item.image ? (
                                    <div 
                                        className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 ${
                                            isPenalty ? 'grayscale contrast-125 brightness-75' : 'brightness-110 saturate-125'
                                        }`}
                                        style={{ backgroundImage: `url(${item.image})` }}
                                    />
                                ) : (
                                    <div className={`absolute inset-0 ${isPenalty ? 'bg-red-950' : 'bg-surface'}`} />
                                )}

                                <div className={`absolute inset-0 transition-opacity ${
                                    item.image 
                                    ? (isPenalty ? 'bg-gradient-to-t from-red-950 via-red-900/80 to-red-600/40' : 'bg-gradient-to-t from-black/90 via-transparent to-transparent')
                                    : 'bg-transparent'
                                }`} />

                                <div className="relative z-10 p-3 h-full flex flex-col">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold font-serif text-sm leading-tight flex-1 pr-1 truncate drop-shadow-md ${item.image ? 'text-white' : (activeShopTab === 'REWARD' ? 'text-main' : 'text-red-500')}`}>
                                            {item.name}
                                        </h4>
                                        
                                        <div className="flex flex-col items-end gap-1">
                                            {activeShopTab === 'REWARD' && (
                                                <span 
                                                    className="text-[9px] font-bold px-1.5 py-0 rounded font-serif shadow-sm border"
                                                    style={{ backgroundColor: theme.base, color: theme.text, borderColor: theme.dark }}
                                                >
                                                    {item.rank}
                                                </span>
                                            )}
                                            <span className={`text-[9px] font-bold px-1 py-0 rounded border flex items-center justify-center min-w-[20px] backdrop-blur-md ${
                                                item.singleUse 
                                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                            }`}>
                                                {item.singleUse ? '1x' : <Infinity size={10} />}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {item.description && (
                                        <p className={`text-[10px] mb-2 leading-tight line-clamp-1 font-sans ${item.image ? 'text-white/80' : 'text-secondary'}`}>
                                            {item.description}
                                        </p>
                                    )}
                                    
                                    <div className="flex items-center justify-between mt-auto pt-1">
                                        <div className={`font-mono font-bold text-xs flex items-center gap-1 drop-shadow-md ${
                                            item.image ? 'text-yellow-400' : (activeShopTab === 'REWARD' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500')
                                        }`}>
                                            {activeShopTab === 'REWARD' ? <Coins size={10} /> : <AlertTriangle size={10} />}
                                            {item.cost}
                                        </div>
                                        <button 
                                            disabled={isLocked}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm ${
                                            isLocked 
                                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                                            : activeShopTab === 'REWARD' 
                                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-black border border-yellow-500/30' 
                                                : 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30'
                                        }`}>
                                            {isLocked ? <Lock size={12} /> : (activeShopTab === 'REWARD' ? <Plus size={14} /> : <ArrowRight size={14} />)}
                                        </button>
                                    </div>

                                    {!isLocked && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                                            className="absolute top-2 right-2 p-1 text-white/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md bg-black/20 rounded-full"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
