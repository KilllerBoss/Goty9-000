
import React, { useState, useEffect, useRef } from 'react';
import { Target, Search, Clock, Coins, Flame, Calendar, Flag, Zap, Scroll, ChevronRight, ArrowRight, Skull, ListTodo, Timer, ChevronDown, Check, X } from 'lucide-react';
import { Quest, Difficulty, QuestStatus } from '../../types';
import { SectionHeader, SortPill, DifficultyPill } from './BaseUI';
import { STATUS_CONFIG } from '../../constants';

interface ActiveQuestsWidgetProps {
    quests: Quest[];
    isOpen: boolean;
    onToggle: () => void;
    onAddQuest: () => void;
    onSelectQuest: (quest: Quest) => void;
    onUpdateQuest?: (id: string, updates: Partial<Quest>) => void;
    onComplete?: (id: string) => void;
    onFail?: (id: string) => void;
    onCancel?: (id: string) => void;
}

export const ActiveQuestsWidget: React.FC<ActiveQuestsWidgetProps> = ({ 
    quests, 
    isOpen, 
    onToggle, 
    onAddQuest, 
    onSelectQuest,
    onUpdateQuest,
    onComplete,
    onFail,
    onCancel
}) => {
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState<string>('ALL');
    const [archiveFilter, setArchiveFilter] = useState<'ALL' | 'DONE' | 'FAILED' | 'CANCELLED'>('ALL');
    const [questSort, setQuestSort] = useState<'NONE' | 'DEADLINE' | 'REWARD' | 'DIFFICULTY'>('NONE');
    const [now, setNow] = useState(Date.now());

    // Dropdown state: Stores ID of the quest with open dropdown
    const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);
    
    // Expanded Card State (for swipe subtasks)
    const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);

    // Touch Handling Refs
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    // Update timer every minute for UI
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = () => setOpenStatusDropdownId(null);
        if (openStatusDropdownId) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [openStatusDropdownId]);

    const getDifficultyWeight = (d: Difficulty) => {
        switch(d) {
            case Difficulty.EASY: return 1;
            case Difficulty.NORMAL: return 2;
            case Difficulty.HARD: return 3;
            case Difficulty.EXTREME: return 4;
            case Difficulty.ABSURD: return 5;
            default: return 0;
        }
    };

    const filteredQuests = quests.filter(q => {
        if (filterDifficulty === 'ARCHIVED') {
             if (q.status !== 'ARCHIVED') return false;
             if (archiveFilter === 'ALL') return true;
             if (archiveFilter === 'DONE') return q.isCompleted;
             if (archiveFilter === 'FAILED') return q.failed;
             if (archiveFilter === 'CANCELLED') return q.cancelled;
             return true;
        }
        if (q.status === 'ARCHIVED') return false;
        
        if (isSearchActive && searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterDifficulty !== 'ALL' && q.difficulty !== filterDifficulty) return false;
        return true;
    });

    const sortedQuests = filteredQuests.sort((a, b) => {
        if (a.status === 'HIGH_PRIORITY' && b.status !== 'HIGH_PRIORITY') return -1;
        if (b.status === 'HIGH_PRIORITY' && a.status !== 'HIGH_PRIORITY') return 1;

        if (questSort === 'DEADLINE') return (a.timeConfig?.dueDate ?? Number.MAX_SAFE_INTEGER) - (b.timeConfig?.dueDate ?? Number.MAX_SAFE_INTEGER);
        if (questSort === 'REWARD') return (b.goldReward !== a.goldReward) ? b.goldReward - a.goldReward : b.expReward - a.expReward;
        if (questSort === 'DIFFICULTY') return getDifficultyWeight(b.difficulty) - getDifficultyWeight(a.difficulty);
        return 0;
    });

    const questGroups = [
        { id: 'DAILY', label: 'Daily', icon: Calendar },
        { id: 'WEEKLY', label: 'Weekly', icon: Clock },
        { id: 'MAIN', label: 'Goals', icon: Flag },
        { id: 'SUDDEN', label: 'Sudden', icon: Zap },
    ];

    const ArchiveFilterPill = ({ label, value }: { label: string, value: 'ALL' | 'DONE' | 'FAILED' | 'CANCELLED' }) => (
        <button 
            onClick={() => setArchiveFilter(value)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                archiveFilter === value 
                ? 'bg-secondary text-surface border-secondary' 
                : 'bg-highlight text-secondary border-border'
            }`}
        >
            {label}
        </button>
    );

    const handleStatusChange = (e: React.MouseEvent, questId: string, newStatus: QuestStatus) => {
        e.stopPropagation();
        setOpenStatusDropdownId(null);

        if (newStatus === 'DONE' && onComplete) onComplete(questId);
        else if (newStatus === 'FAILED' && onFail) onFail(questId);
        else if (newStatus === 'CANCELLED' && onCancel) onCancel(questId);
        else if (onUpdateQuest) onUpdateQuest(questId, { status: newStatus });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent, quest: Quest) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        if (quest.status === 'ARCHIVED') { touchStartX.current = null; touchStartY.current = null; return; }

        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;

        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                if (quest.subtasks && quest.subtasks.length > 0) {
                    setExpandedQuestId(prev => prev === quest.id ? null : quest.id);
                } else {
                    if (onComplete && !quest.isCompleted) onComplete(quest.id);
                }
            } else {
                if (expandedQuestId === quest.id) {
                    setExpandedQuestId(null);
                } else {
                    if (onCancel && !quest.cancelled && !quest.isCompleted && !quest.failed) {
                        onCancel(quest.id);
                    }
                }
            }
        }
        touchStartX.current = null;
        touchStartY.current = null;
    };

    const toggleSubtask = (quest: Quest, subtaskId: string) => {
        if (!onUpdateQuest || !quest.subtasks) return;
        const newSubtasks = quest.subtasks.map(t => t.id === subtaskId ? { ...t, done: !t.done } : t);
        onUpdateQuest(quest.id, { subtasks: newSubtasks });
        if (newSubtasks.every(t => t.done) && onComplete) setTimeout(() => onComplete(quest.id), 500);
    };

    const getTimeDisplay = (quest: Quest) => {
        if (!quest.timeConfig) return null;
        
        if (quest.status === 'ON_HOLD') {
             return <div className="flex items-center gap-1 text-[10px] font-mono text-yellow-500 font-bold"><Clock size={10} /> PAUSE</div>;
        }

        if (quest.status === 'NOT_STARTED' && quest.timeConfig.startDate && quest.timeConfig.startDate > now) {
             const diff = quest.timeConfig.startDate - now;
             const hours = Math.floor(diff / (1000 * 60 * 60));
             return <div className="flex items-center gap-1 text-[10px] font-mono text-secondary"><Timer size={10} /> {hours}h</div>;
        }

        if (quest.timeConfig.mode === 'DEADLINE' && quest.timeConfig.dueDate) {
             const diff = quest.timeConfig.dueDate - now;
             if (diff < 0) return <span className="text-red-500 text-[10px] font-bold font-mono">Late</span>;
             
             const days = Math.floor(diff / (1000 * 60 * 60 * 24));
             const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
             
             let timeStr = `${hours}h`;
             if (days > 0) timeStr = `${days}d ${hours}h`;
             const isCritical = diff < 3600000;
             
             return (
                 <div className={`flex items-center gap-1 text-[10px] font-mono ${isCritical ? 'text-red-500 font-bold animate-pulse-fast' : 'text-secondary'}`}>
                     <Clock size={10} />
                     <span>{timeStr}</span>
                 </div>
             );
        }

        if ((quest.timeConfig.mode === 'SCHEDULED' || quest.timeConfig.mode === 'PERIOD') && quest.timeConfig.startDate) {
             const hasStarted = now >= quest.timeConfig.startDate;
             if (!hasStarted) {
                  return <div className="flex items-center gap-1 text-[10px] font-mono text-blue-500"><Calendar size={10} /> {new Date(quest.timeConfig.startDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>;
             } else if (quest.timeConfig.dueDate) {
                 const diff = quest.timeConfig.dueDate - now;
                 if (diff < 0) return <span className="text-red-500 text-[10px] font-bold font-mono">End</span>;
                 const hours = Math.floor(diff / (1000 * 60 * 60));
                 return <div className="flex items-center gap-1 text-[10px] font-mono text-green-500 font-bold"><Timer size={10} /> {hours}h</div>;
             }
        }
        return null;
    };

    return (
        <div className="px-4 pb-12">
            <SectionHeader 
                title="Quests" 
                icon={Target} 
                onAdd={onAddQuest} 
                onSearch={() => { setIsSearchActive(!isSearchActive); setSearchQuery(''); if(!isOpen) onToggle(); }}
                isSearchActive={isSearchActive}
                isOpen={isOpen}
                onToggle={onToggle}
            >
                <div className="space-y-3 mt-2">
                    <div className="bg-highlight rounded-xl flex items-center px-3 py-2 border border-border">
                        <Search size={14} className="text-secondary mr-2" />
                        <input 
                            type="text" 
                            placeholder="Find..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-main text-xs w-full placeholder-secondary font-sans"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <span className="text-[9px] font-bold text-secondary uppercase tracking-wider shrink-0 opacity-70 font-serif">Sort</span>
                            <SortPill label="Time" active={questSort === 'DEADLINE'} onClick={() => setQuestSort(questSort === 'DEADLINE' ? 'NONE' : 'DEADLINE')} icon={Clock} />
                            <SortPill label="Reward" active={questSort === 'REWARD'} onClick={() => setQuestSort(questSort === 'REWARD' ? 'NONE' : 'REWARD')} icon={Coins} />
                            <SortPill label="Diff" active={questSort === 'DIFFICULTY'} onClick={() => setQuestSort(questSort === 'DIFFICULTY' ? 'NONE' : 'DIFFICULTY')} icon={Flame} />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <span className="text-[9px] font-bold text-secondary uppercase tracking-wider shrink-0 opacity-70 font-serif">Filter</span>
                            {['ALL', 'EASY', 'NORMAL', 'HARD', 'EXTREME', 'ABSURD', 'ARCHIVED'].map(diff => (
                                <DifficultyPill key={diff} diff={diff} active={filterDifficulty === diff} onClick={() => setFilterDifficulty(diff)} />
                            ))}
                        </div>
                        
                        {filterDifficulty === 'ARCHIVED' && (
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 animate-slide-up">
                                <span className="text-[9px] font-bold text-secondary uppercase tracking-wider shrink-0 opacity-70 font-serif">Type</span>
                                <ArchiveFilterPill label="All" value="ALL" />
                                <ArchiveFilterPill label="Done" value="DONE" />
                                <ArchiveFilterPill label="Fail" value="FAILED" />
                                <ArchiveFilterPill label="Cancel" value="CANCELLED" />
                            </div>
                        )}
                    </div>
                </div>
            </SectionHeader>
            
            {isOpen && (
                <div className="space-y-4 pb-2">
                    {sortedQuests.length === 0 && (
                        <div onClick={onAddQuest} className="p-4 bg-highlight border border-dashed border-border rounded-xl flex items-center justify-between text-secondary cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                            <div><p className="font-bold text-xs font-serif">Empty.</p></div>
                            <ArrowRight size={16} />
                        </div>
                    )}

                    {sortedQuests.length > 0 && questGroups.map(group => {
                        const groupQuests = sortedQuests.filter(q => (q.type || 'SUDDEN') === group.id);
                        if (groupQuests.length === 0) return null;

                        return (
                            <div key={group.id} className="space-y-2">
                                <div className="flex items-center gap-2 px-1 opacity-70">
                                    <group.icon size={12} className="text-secondary" />
                                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider font-serif">{group.label}</span>
                                    <span className="text-[9px] bg-highlight px-1 rounded text-secondary font-mono">{groupQuests.length}</span>
                                </div>
                                <div>
                                    {groupQuests.map(quest => {
                                        let status = STATUS_CONFIG[quest.status || 'IN_PROCESS'];
                                        let isStrikethrough = false;
                                        // Shorten labels
                                        let statusLabel = status.label === 'In process' ? 'Active' : status.label;
                                        const isExpanded = expandedQuestId === quest.id;
                                        
                                        const timeLeft = quest.timeConfig?.dueDate ? quest.timeConfig.dueDate - now : null;
                                        const isUrgent = timeLeft !== null && timeLeft > 0 && timeLeft < 14400000;
                                        const isCritical = timeLeft !== null && timeLeft > 0 && timeLeft < 3600000;
                                        const isHighPriority = quest.status === 'HIGH_PRIORITY';

                                        if (quest.status === 'ARCHIVED') {
                                            if (quest.isCompleted) { statusLabel = 'Done'; isStrikethrough = true; }
                                            else if (quest.failed) { statusLabel = 'Failed'; isStrikethrough = true; }
                                            else if (quest.cancelled) { statusLabel = 'Cancel'; isStrikethrough = true; }
                                        } else if (quest.status === 'DONE' || quest.status === 'FAILED' || quest.status === 'CANCELLED') {
                                            isStrikethrough = true;
                                        }

                                        return (
                                            <div 
                                                key={quest.id} 
                                                onTouchStart={handleTouchStart}
                                                onTouchEnd={(e) => handleTouchEnd(e, quest)}
                                                onClick={() => onSelectQuest(quest)}
                                                className={`group relative flex flex-col mb-2 rounded-xl transition-all cursor-pointer border ${isHighPriority ? 'shadow-[0_0_15px_rgba(220,38,38,0.3)] border-red-500/50' : 'border-transparent shadow-sm'}`}
                                                style={{ touchAction: 'pan-y' }}
                                            >
                                                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                                                    <div className="absolute inset-0 bg-cover bg-center transition-all duration-500 blur-sm scale-110 opacity-20 dark:opacity-30 group-hover:scale-100 group-hover:opacity-25" style={{ backgroundImage: quest.image ? `url(${quest.image})` : 'none' }} />
                                                    <div className="absolute inset-0 bg-surface/80 dark:bg-[#1E2024]/80 backdrop-blur-[1px]"></div>
                                                    {isCritical && !isStrikethrough && <div className="absolute inset-0 border-2 border-red-500/30 rounded-xl animate-pulse-fast z-10"></div>}
                                                    {isUrgent && !isCritical && !isStrikethrough && <div className="absolute inset-0 border border-red-500/20 rounded-xl animate-pulse-slow z-10"></div>}
                                                </div>

                                                <div className="relative z-20 flex items-center gap-3 p-3">
                                                    <div className="shrink-0 relative w-10 h-10 flex items-center justify-center">
                                                         <div className={`absolute inset-0 opacity-20 rounded-full blur-xl ${quest.difficulty === 'EASY' ? 'bg-green-500' : quest.difficulty === 'NORMAL' ? 'bg-blue-500' : quest.difficulty === 'HARD' ? 'bg-purple-500' : quest.difficulty === 'EXTREME' ? 'bg-red-500' : 'bg-black dark:bg-white'}`}></div>
                                                         <div className={`relative z-10 text-main/80 dark:text-white/80 w-full h-full flex items-center justify-center ${isStrikethrough ? 'opacity-50 grayscale' : ''}`}>
                                                             {quest.cardImage ? <img src={quest.cardImage} className="w-8 h-8 object-contain drop-shadow-sm" /> : <Scroll size={20} strokeWidth={1.5} />}
                                                         </div>
                                                    </div>

                                                    <div className={`flex-1 min-w-0 flex flex-col gap-1 ${isStrikethrough ? 'opacity-50' : ''}`}>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className={`font-serif font-bold text-sm text-main dark:text-white truncate ${isStrikethrough ? 'line-through' : ''}`}>
                                                                {quest.title}
                                                            </h4>
                                                            {isHighPriority && !isStrikethrough && <Flame size={10} className="text-red-500 animate-pulse fill-red-500" />}
                                                        </div>
                                                        {!isStrikethrough && getTimeDisplay(quest)}
                                                        <div className="flex items-center gap-3 text-[10px] font-mono font-medium opacity-80">
                                                            {quest.expReward > 0 && <span className="text-blue-600 dark:text-blue-400">{quest.expReward} XP</span>}
                                                            {quest.goldReward > 0 && <span className="text-yellow-600 dark:text-yellow-400">{quest.goldReward} G</span>}
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 flex flex-col items-end gap-1 relative z-30">
                                                        <div 
                                                            onClick={(e) => { e.stopPropagation(); setOpenStatusDropdownId(openStatusDropdownId === quest.id ? null : quest.id); }}
                                                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${status.color.replace('bg-', 'bg-opacity-20 bg-').replace('text-', 'text-opacity-100 text-')}`}
                                                        >
                                                            {statusLabel}
                                                            {!isStrikethrough && <ChevronDown size={8} />}
                                                        </div>

                                                        {openStatusDropdownId === quest.id && !isStrikethrough && (
                                                            <div className="absolute top-full right-0 mt-1 w-24 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden py-1 animate-slide-up origin-top-right">
                                                                {(Object.keys(STATUS_CONFIG) as QuestStatus[]).map(s => {
                                                                    if (s === 'ARCHIVED') return null;
                                                                    return (
                                                                        <button key={s} onClick={(e) => handleStatusChange(e, quest.id, s)} className="w-full text-left px-2 py-1.5 hover:bg-highlight text-[9px] font-bold flex items-center gap-1">
                                                                            <div className={`w-1 h-1 rounded-full ${STATUS_CONFIG[s].dot}`}></div>
                                                                            {STATUS_CONFIG[s].label}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {isExpanded && quest.subtasks && quest.subtasks.length > 0 && (
                                                    <div className="relative z-20 px-3 pb-3 animate-slide-up bg-black/5 dark:bg-white/5 mx-3 mb-3 rounded-lg border-t border-white/10">
                                                        <h5 className="text-[9px] font-bold text-secondary uppercase tracking-wider py-1.5 font-serif">Subtasks</h5>
                                                        <div className="space-y-1">
                                                            {quest.subtasks.map(task => (
                                                                <div key={task.id} onClick={(e) => { e.stopPropagation(); toggleSubtask(quest, task.id); }} className="flex items-center gap-2 p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer transition-colors">
                                                                    <div className={`w-3 h-3 rounded border flex items-center justify-center transition-all ${task.done ? 'bg-blue-500 border-blue-500' : 'border-secondary/50'}`}>
                                                                        {task.done && <Check size={8} className="text-white" strokeWidth={4} />}
                                                                    </div>
                                                                    <span className={`text-xs truncate ${task.done ? 'text-secondary line-through' : 'text-main'}`}>{task.text}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                                     quest.difficulty === 'EASY' ? 'bg-green-500/50' :
                                                     quest.difficulty === 'NORMAL' ? 'bg-blue-500/50' :
                                                     quest.difficulty === 'HARD' ? 'bg-purple-500/50' :
                                                     quest.difficulty === 'EXTREME' ? 'bg-red-500/50' :
                                                     'bg-black dark:bg-white' 
                                                }`}></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
