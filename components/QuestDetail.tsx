
import React, { useRef, useEffect, useState } from 'react';
import { Quest, Difficulty, PlayerClass, QuestStatus, QuestTimeConfig, RecurringConfig, QuestNotificationConfig } from '../types';
import { Camera, CalendarDays, Gift, Skull, Check, X, Target, Activity, Shield, Flame, Trash2, CheckCircle2, Plus, Image as ImageIcon, Zap, AlignLeft, Ban, Clock, ArrowRight, Calendar, Hourglass, Timer, Repeat, CalendarX, CheckSquare, Bell } from 'lucide-react';
import { compressImage } from '../utils';
import { calculateQuestRewards } from '../gameUtils';
import { STATUS_CONFIG } from '../constants';
import { PropertyRow } from './SharedUI';

interface QuestDetailViewProps {
    quest: Quest;
    onClose: () => void;
    onComplete: (id: string) => void;
    onFail: (id: string) => void;
    onCancel: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdateQuest?: (id: string, updates: Partial<Quest>) => void;
    assets: { bannerLight: string };
    classes: PlayerClass[];
    isCreating?: boolean;
    onSave?: (quest: Quest) => void;
}

// Helper to format date for input type="datetime-local"
const toInputString = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
};

const fromInputString = (val: string): number | undefined => {
    if (!val) return undefined;
    return new Date(val).getTime();
};

const formatDisplayDate = (timestamp?: number) => {
    if (!timestamp) return '---';
    return new Date(timestamp).toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
    });
};

const WEEKDAYS = [
    { label: 'So', val: 0 }, { label: 'Mo', val: 1 }, { label: 'Di', val: 2 },
    { label: 'Mi', val: 3 }, { label: 'Do', val: 4 }, { label: 'Fr', val: 5 }, { label: 'Sa', val: 6 }
];

export const QuestDetailView: React.FC<QuestDetailViewProps> = ({
    quest,
    onClose,
    onComplete,
    onFail,
    onCancel,
    onDelete,
    onUpdateQuest,
    assets,
    classes,
    isCreating = false,
    onSave
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); 
    const cardImageInputRef = useRef<HTMLInputElement>(null); 
    
    // Checklist State
    const [checklist, setChecklist] = useState<{id: string, text: string, done: boolean}[]>(quest.subtasks || []);
    const [focusSubtaskId, setFocusSubtaskId] = useState<string | null>(null);
    
    // Edit State
    const [editedQuest, setEditedQuest] = useState<Quest>({ ...quest });
    const [statusOpen, setStatusOpen] = useState(false);
    
    // Time & Recurrence & Notification Config State
    const [timeConfig, setTimeConfig] = useState<QuestTimeConfig>(quest.timeConfig || { mode: 'NONE' });
    const [recurringConfig, setRecurringConfig] = useState<RecurringConfig>(quest.recurringConfig || { enabled: false, intervalType: 'DAILY', excludedDays: [] });
    const [notificationConfig, setNotificationConfig] = useState<QuestNotificationConfig>(quest.customNotificationConfig || { enabled: false });

    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    
    // Class Selection State
    const [isClassSelectOpen, setIsClassSelectOpen] = useState(false);

    // Live Timer State
    const [timeRemaining, setTimeRemaining] = useState<string>('');

    // Temporary Modal State
    const [tempTimeConfig, setTempTimeConfig] = useState<QuestTimeConfig>(quest.timeConfig || { mode: 'NONE' });
    const [tempRecurringConfig, setTempRecurringConfig] = useState<RecurringConfig>(quest.recurringConfig || { enabled: false, intervalType: 'DAILY', excludedDays: [] });
    const [tempNotificationConfig, setTempNotificationConfig] = useState<QuestNotificationConfig>(quest.customNotificationConfig || { enabled: false });

    // Sync state
    useEffect(() => {
        setEditedQuest({ ...quest });
        setChecklist(quest.subtasks || []);
        setTimeConfig(quest.timeConfig || { mode: 'NONE' });
        setRecurringConfig(quest.recurringConfig || { enabled: false, intervalType: 'DAILY', excludedDays: [] });
        setNotificationConfig(quest.customNotificationConfig || { enabled: false });
    }, [quest]);

    // Focus Management for Subtasks
    useEffect(() => {
        if (focusSubtaskId) {
            const el = document.getElementById(`subtask-input-${focusSubtaskId}`);
            if (el) {
                el.focus();
                setFocusSubtaskId(null); // Reset focus target
            }
        }
    }, [checklist, focusSubtaskId]);

    // Timer Logic
    useEffect(() => {
        const updateTimer = () => {
            const now = Date.now();
            
            // Paused Logic
            if (quest.status === 'ON_HOLD' && quest.holdStartTime) {
                setTimeRemaining('PAUSIERT');
                return;
            }

            let targetTime: number | undefined;
            let prefix = '';

            if (timeConfig.mode === 'DEADLINE' && timeConfig.dueDate) {
                targetTime = timeConfig.dueDate;
                prefix = 'Fällig in: ';
            } else if (timeConfig.mode === 'SCHEDULED' && timeConfig.startDate) {
                if (now < timeConfig.startDate) {
                    targetTime = timeConfig.startDate;
                    prefix = 'Startet in: ';
                } else {
                    setTimeRemaining('Gestartet');
                    return;
                }
            } else if (timeConfig.mode === 'PERIOD' && timeConfig.dueDate) {
                 if (timeConfig.startDate && now < timeConfig.startDate) {
                     targetTime = timeConfig.startDate;
                     prefix = 'Startet in: ';
                 } else {
                     targetTime = timeConfig.dueDate;
                     prefix = 'Endet in: ';
                 }
            }

            if (!targetTime) {
                setTimeRemaining('');
                return;
            }

            const diff = targetTime - now;
            if (diff < 0) {
                setTimeRemaining(timeConfig.mode === 'DEADLINE' ? 'Überfällig' : 'Abgelaufen');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            let timeStr = `${mins}m`;
            if (hours > 0) timeStr = `${hours}h ${timeStr}`;
            if (days > 0) timeStr = `${days}d ${hours}h`;
            
            setTimeRemaining(prefix + timeStr);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [timeConfig, quest.status, quest.holdStartTime]);

    // Recalculate Rewards
    useEffect(() => {
        const { exp, gold, penalty } = calculateQuestRewards(editedQuest.id, editedQuest.difficulty);
        const newPenaltyStr = penalty.toString();

        if (exp !== editedQuest.expReward || gold !== editedQuest.goldReward || editedQuest.penalty !== newPenaltyStr) {
            setEditedQuest(prev => ({ 
                ...prev, 
                expReward: exp, 
                goldReward: gold,
                penalty: newPenaltyStr 
            }));
        }
    }, [editedQuest.difficulty, editedQuest.id]);

    // Scroll Animation
    useEffect(() => {
        const handleScroll = () => {
            if (!scrollRef.current || !containerRef.current) return;
            const scrollTop = scrollRef.current.scrollTop;
            const progress = Math.min(1, Math.max(0, scrollTop / 192));
            containerRef.current.style.setProperty('--p', progress.toString());
        };
        const el = scrollRef.current;
        el?.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => el?.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleCheckItem = (id: string) => {
        const newChecklist = checklist.map(i => i.id === id ? { ...i, done: !i.done } : i);
        setChecklist(newChecklist);
        
        if (!isCreating && onUpdateQuest) {
            onUpdateQuest(quest.id, { subtasks: newChecklist });
        }

        // AUTO-COMPLETE LOGIC
        // Check if ALL items are now done
        const allDone = newChecklist.every(i => i.done);
        if (allDone && newChecklist.length > 0 && !isCreating) {
            // Small delay for visual satisfaction
            setTimeout(() => {
                onComplete(quest.id);
                onClose();
            }, 600);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                setEditedQuest(prev => ({ ...prev, image: compressed }));
                if (!isCreating && onUpdateQuest) onUpdateQuest(quest.id, { image: compressed });
            } catch(err) { console.error(err); }
        }
    };

    const handleCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                setEditedQuest(prev => ({ ...prev, cardImage: compressed }));
                if (!isCreating && onUpdateQuest) onUpdateQuest(quest.id, { cardImage: compressed });
            } catch(err) { console.error(err); }
        }
    };

    const handleStatusChange = (newStatus: QuestStatus) => {
        setEditedQuest(prev => ({ ...prev, status: newStatus }));
        setStatusOpen(false);
        if (isCreating) return;

        switch (newStatus) {
            case 'DONE': onComplete(quest.id); onClose(); break;
            case 'FAILED': onFail(quest.id); onClose(); break;
            case 'CANCELLED': onCancel(quest.id); onClose(); break;
            default: if (onUpdateQuest) onUpdateQuest(quest.id, { status: newStatus }); break;
        }
    };

    const toggleClassSelection = (classId: string) => {
        const current = editedQuest.relatedClassIds || [];
        let updated: string[];
        if (current.includes(classId)) {
            updated = current.filter(id => id !== classId);
        } else {
            updated = [...current, classId];
        }
        
        setEditedQuest(prev => ({ ...prev, relatedClassIds: updated }));
        if (!isCreating && onUpdateQuest) {
             onUpdateQuest(quest.id, { relatedClassIds: updated });
        }
    };

    const toggleSubClassSelection = (subClassId: string) => {
        const current = editedQuest.relatedSubClassIds || [];
        let updated: string[];
        if (current.includes(subClassId)) {
            updated = current.filter(id => id !== subClassId);
        } else {
            updated = [...current, subClassId];
        }

        setEditedQuest(prev => ({ ...prev, relatedSubClassIds: updated }));
        if (!isCreating && onUpdateQuest) {
             onUpdateQuest(quest.id, { relatedSubClassIds: updated });
        }
    };

    const openTimeModal = () => {
        setTempTimeConfig({ ...timeConfig });
        setIsTimeModalOpen(true);
    };

    const saveTimeConfig = () => {
        let finalConfig = { ...tempTimeConfig };
        if (finalConfig.mode === 'PERIOD' && finalConfig.startDate && finalConfig.duration) {
            finalConfig.dueDate = finalConfig.startDate + (finalConfig.duration * 60 * 1000);
        }
        setTimeConfig(finalConfig);
        setEditedQuest(prev => ({ ...prev, timeConfig: finalConfig, deadline: finalConfig.dueDate }));
        
        if (!isCreating && onUpdateQuest) {
            onUpdateQuest(quest.id, { timeConfig: finalConfig, deadline: finalConfig.dueDate });
        }
        setIsTimeModalOpen(false);
    };

    const openRecurringModal = () => {
        setTempRecurringConfig(recurringConfig || { enabled: false, intervalType: 'DAILY', excludedDays: [] });
        setIsRecurringModalOpen(true);
    };

    const saveRecurringConfig = () => {
        const finalConfig = { ...tempRecurringConfig };
        setRecurringConfig(finalConfig);
        setEditedQuest(prev => ({ ...prev, recurringConfig: finalConfig }));
        if (!isCreating && onUpdateQuest) {
            onUpdateQuest(quest.id, { recurringConfig: finalConfig });
        }
        setIsRecurringModalOpen(false);
    };
    
    const openNotificationModal = () => {
        setTempNotificationConfig(notificationConfig || { enabled: false });
        setIsNotificationModalOpen(true);
    };

    const saveNotificationConfig = () => {
        const finalConfig = { ...tempNotificationConfig };
        setNotificationConfig(finalConfig);
        setEditedQuest(prev => ({ ...prev, customNotificationConfig: finalConfig }));
        if (!isCreating && onUpdateQuest) {
            onUpdateQuest(quest.id, { customNotificationConfig: finalConfig });
        }
        setIsNotificationModalOpen(false);
    };

    const getDisplayTimeText = () => {
        if (timeConfig.mode === 'NONE' || !timeConfig.mode) return 'Nicht festgelegt';
        if (timeConfig.mode === 'DEADLINE' && timeConfig.dueDate) return `bis ${formatDisplayDate(timeConfig.dueDate)}`;
        if (timeConfig.mode === 'SCHEDULED' && timeConfig.startDate) return `ab ${formatDisplayDate(timeConfig.startDate)}`;
        if (timeConfig.mode === 'PERIOD' && timeConfig.startDate && timeConfig.dueDate) {
            return `ab ${formatDisplayDate(timeConfig.startDate)} bis ${formatDisplayDate(timeConfig.dueDate)}`;
        }
        return 'Konfigurieren';
    };

    const getRecurringText = () => {
        if (!recurringConfig?.enabled) return 'Einmalig';
        if (recurringConfig.intervalType === 'DAILY') return 'Täglich';
        if (recurringConfig.intervalType === 'WEEKLY') return 'Wöchentlich';
        if (recurringConfig.intervalType === 'INTERVAL') return `Alle ${recurringConfig.intervalValue || 1} Tage`;
        return 'Wiederholend';
    };

    const handleSave = () => {
        if (onSave) {
            onSave({
                ...editedQuest,
                subtasks: checklist,
                timeConfig: timeConfig,
                recurringConfig: recurringConfig,
                customNotificationConfig: notificationConfig,
                deadline: timeConfig.dueDate
            });
        }
    };

    const currentStatus = STATUS_CONFIG[editedQuest.status || 'IN_PROCESS'];

    const getSelectedClassesText = () => {
        const selectedMain = classes.filter(c => editedQuest.relatedClassIds?.includes(c.id));
        const selectedSubCount = editedQuest.relatedSubClassIds?.length || 0;
        
        if (selectedMain.length === 0 && selectedSubCount === 0) return <span className="text-secondary italic">None</span>;
        
        return (
            <div className="flex flex-wrap gap-1">
                {selectedMain.map(c => (
                     <span key={c.id} className="text-xs bg-blue-500/20 text-blue-500 border border-blue-500/30 px-1.5 py-0.5 rounded font-bold">
                        {c.title}
                     </span>
                ))}
                {selectedSubCount > 0 && (
                    <span className="text-xs bg-purple-500/20 text-purple-500 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold">
                        +{selectedSubCount} Sub
                    </span>
                )}
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className="fixed inset-0 z-[55] bg-background animate-fade-in font-sans text-main flex flex-col"
            style={{ '--p': 0 } as React.CSSProperties}
        >
             {/* --- DYNAMIC HEADER --- */}
             <div 
                className="absolute top-0 left-0 right-0 z-40 overflow-hidden pointer-events-none"
                style={{ height: 'calc(17rem - (12rem * var(--p)))', borderBottom: '1px solid var(--border-color)' }}
            >
                <div 
                    className={`absolute inset-0 bg-cover bg-center ${isCreating ? 'cursor-pointer pointer-events-auto group' : 'cursor-pointer pointer-events-auto group'}`}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ backgroundImage: `url(${editedQuest.image || assets.bannerLight})`, opacity: 'calc(1 - (0.3 * var(--p)))' }}
                >
                     <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                         <div className="flex flex-col items-center text-white"><Camera size={32} className="mb-2" /><span className="text-xs font-bold uppercase tracking-wider">Change Cover</span></div>
                     </div>
                     <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-background via-background/40 to-transparent z-10"></div>
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
                
                <div className="absolute inset-0 bg-background/95 backdrop-blur-sm transition-all" style={{ opacity: 'calc(var(--p))' }}></div>

                <div 
                    className="absolute z-50 pointer-events-auto flex items-center justify-center group cursor-pointer drop-shadow-2xl"
                    onClick={() => cardImageInputRef.current?.click()}
                    style={{
                        width: 'calc(8rem - (5.5rem * var(--p)))',
                        height: 'calc(8rem - (5.5rem * var(--p)))',
                        top: 'calc(3.5rem - (2.25rem * var(--p)))',
                        left: '1.5rem',
                        zIndex: 50
                    }}
                >
                   {editedQuest.cardImage ? (
                        <img src={editedQuest.cardImage} className="w-full h-full object-contain" />
                   ) : (
                        editedQuest.image ? (<img src={editedQuest.image} className="w-full h-full object-contain" />) : (<div className="w-full h-full flex items-center justify-center bg-surface-card rounded-xl border border-border"><Target size={24} className="text-red-500" /></div>)
                   )}
                   <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center rounded-xl"><ImageIcon size={16} className="text-white" /></div>
                   <input type="file" ref={cardImageInputRef} className="hidden" accept="image/*" onChange={handleCardImageUpload} />
                </div>

                <div 
                    className="absolute z-40 flex flex-col justify-center"
                    style={{ top: 'calc(12rem - (10.25rem * var(--p)))', left: 'calc(1.5rem + (3rem * var(--p)))', width: 'calc(100% - 6rem)' }}
                >
                     {isCreating ? (
                        <input type="text" value={editedQuest.title} onChange={(e) => setEditedQuest({...editedQuest, title: e.target.value})} placeholder="Mission Title" className="font-serif font-bold text-main leading-none mb-2 drop-shadow-lg bg-transparent border-none placeholder-white/50 focus:outline-none w-full pointer-events-auto" style={{ fontSize: 'calc(2.125rem - (1rem * var(--p)))' }} />
                     ) : (
                        <h1 className="font-serif font-bold text-main leading-none mb-2 drop-shadow-lg line-clamp-2" style={{ fontSize: 'calc(2.125rem - (1rem * var(--p)))' }}>{editedQuest.title}</h1>
                     )}
                </div>
            </div>

            <div className="absolute right-5 z-[60] flex gap-2" style={{ top: 'calc(1.25rem + (0.625rem * (1 - var(--p))))' }}>
                {!isCreating && (
                    <button onClick={() => { onDelete(quest.id); onClose(); }} className="text-secondary hover:text-red-500 bg-glass p-2 rounded-full backdrop-blur-md border border-border"><Trash2 size={20} /></button>
                )}
                <button onClick={onClose} className="text-secondary hover:text-main bg-glass p-2 rounded-full backdrop-blur-md border border-border"><X size={20} /></button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative w-full scroll-smooth">
                <div className="h-[17rem] w-full shrink-0"></div>

                <div className="pb-[70vh] flex flex-col px-6 relative z-10 pt-4">
                    <div>
                        <div className="space-y-1 pb-6 mb-6">
                            
                            <PropertyRow 
                                icon={AlignLeft} 
                                label="Description" 
                                value={
                                    <textarea
                                        value={editedQuest.description || ''}
                                        onChange={(e) => {
                                            setEditedQuest({...editedQuest, description: e.target.value});
                                            if (!isCreating && onUpdateQuest) onUpdateQuest(quest.id, { description: e.target.value });
                                        }}
                                        placeholder="Add description..."
                                        className="bg-transparent border-none text-sm text-main focus:outline-none w-full resize-none font-sans min-h-[1.5rem] overflow-hidden"
                                        onInput={(e) => {
                                            e.currentTarget.style.height = 'auto';
                                            e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                        }}
                                    />
                                }
                            />
                            
                            <PropertyRow 
                                icon={Activity} 
                                label="Status" 
                                value={
                                    <div className="relative">
                                        <button onClick={() => setStatusOpen(!statusOpen)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${currentStatus.color}`}>
                                            <div className={`w-2 h-2 rounded-full ${currentStatus.dot}`}></div>
                                            {currentStatus.label}
                                        </button>
                                        
                                        {statusOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-slide-up">
                                                {(Object.keys(STATUS_CONFIG) as QuestStatus[]).map(status => (
                                                    <button key={status} onClick={() => handleStatusChange(status)} className="w-full text-left px-4 py-2 hover:bg-highlight text-xs font-medium flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].dot}`}></div>
                                                        {STATUS_CONFIG[status].label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                } 
                            />
                            
                            {/* CLASS MULTI-SELECT ROW */}
                            <div className="relative">
                                <PropertyRow 
                                    icon={Shield} 
                                    label="Classes" 
                                    onClick={() => setIsClassSelectOpen(!isClassSelectOpen)}
                                    value={getSelectedClassesText()}
                                />
                                {isClassSelectOpen && (
                                    <div className="my-2 bg-surface border border-border rounded-xl overflow-hidden animate-slide-up p-2">
                                        {classes.length === 0 ? <p className="text-xs text-secondary p-2">No classes unlocked.</p> : classes.map(cls => (
                                            <div key={cls.id} className="mb-1 last:mb-0">
                                                <div 
                                                    className="flex items-center gap-2 p-2 hover:bg-highlight rounded-lg cursor-pointer"
                                                    onClick={() => toggleClassSelection(cls.id)}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${editedQuest.relatedClassIds?.includes(cls.id) ? 'bg-blue-500 border-blue-500' : 'border-secondary'}`}>
                                                        {editedQuest.relatedClassIds?.includes(cls.id) && <Check size={12} className="text-white" />}
                                                    </div>
                                                    <span className="text-sm font-bold text-main">{cls.title}</span>
                                                </div>
                                                
                                                {/* Subclasses */}
                                                {cls.subClasses && cls.subClasses.length > 0 && (
                                                    <div className="ml-6 border-l border-border pl-2 mt-1 space-y-1">
                                                        {cls.subClasses.map(sub => (
                                                            <div 
                                                                key={sub.id}
                                                                className="flex items-center gap-2 p-1.5 hover:bg-highlight rounded-lg cursor-pointer"
                                                                onClick={() => toggleSubClassSelection(sub.id)}
                                                            >
                                                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${editedQuest.relatedSubClassIds?.includes(sub.id) ? 'bg-purple-500 border-purple-500' : 'border-secondary'}`}>
                                                                    {editedQuest.relatedSubClassIds?.includes(sub.id) && <Check size={10} className="text-white" />}
                                                                </div>
                                                                <span className="text-xs text-secondary">{sub.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <PropertyRow 
                                icon={Flame} 
                                label="Difficulty" 
                                value={
                                    <select value={editedQuest.difficulty} onChange={(e) => { setEditedQuest({...editedQuest, difficulty: e.target.value as Difficulty}); if (!isCreating && onUpdateQuest) onUpdateQuest(quest.id, { difficulty: e.target.value as Difficulty }); }} className="bg-transparent border border-border hover:border-main/50 rounded px-2 py-1 text-xs font-bold text-main focus:outline-none cursor-pointer">
                                        {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                } 
                            />

                            {/* --- TIMEFRAME CONFIGURATION --- */}
                            <PropertyRow 
                                icon={CalendarDays} 
                                label="Zeitraum" 
                                onClick={openTimeModal}
                                value={
                                    <div>
                                        <div className="flex items-center gap-2 text-main group-hover:text-blue-500 transition-colors">
                                           {getDisplayTimeText()}
                                        </div>
                                        {timeRemaining && (
                                            <div className="flex items-center gap-1.5 mt-1 text-xs font-mono font-bold text-secondary">
                                                <Timer size={12} className="animate-pulse" />
                                                {timeRemaining}
                                            </div>
                                        )}
                                    </div>
                                } 
                            />

                            {/* --- RECURRING CONFIGURATION --- */}
                            <PropertyRow 
                                icon={Repeat} 
                                label="Wiederholung" 
                                onClick={openRecurringModal}
                                value={
                                    <div className="flex items-center gap-2 text-main group-hover:text-blue-500 transition-colors">
                                       {getRecurringText()}
                                    </div>
                                } 
                            />
                            
                            {/* --- NOTIFICATION CONFIGURATION --- */}
                            <PropertyRow 
                                icon={Bell} 
                                label="Alarm" 
                                onClick={openNotificationModal}
                                value={
                                    <div className="flex items-center gap-2 text-main group-hover:text-blue-500 transition-colors">
                                       {notificationConfig.enabled 
                                       ? `S:${notificationConfig.startWarningMinutes || 0}m / E:${notificationConfig.endWarningMinutes || 0}m` 
                                       : 'Global'}
                                    </div>
                                } 
                            />
                            
                            <PropertyRow 
                                icon={Zap} label="Experience" 
                                value={<span className="text-blue-600 dark:text-blue-400 font-bold font-mono">{editedQuest.expReward} XP</span>} 
                            />

                            <PropertyRow 
                                icon={Gift} label="Reward" 
                                value={<span className="text-yellow-600 dark:text-yellow-500 font-bold font-mono">{editedQuest.goldReward} G</span>} 
                            />
                            
                            <PropertyRow 
                                icon={Skull} label="Penalty" 
                                value={<span className="text-red-500 font-bold font-mono">{editedQuest.penalty || '0'} P</span>}
                            />
                        </div>

                        <div className="h-px bg-border w-full mb-6"></div>
                    </div>
                    
                    {/* Checklist */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider font-serif">SUBTASKS</h3>
                            <button onClick={() => {
                                    const newItem = { id: Date.now().toString(), text: '', done: false };
                                    const newChecklist = [...checklist, newItem];
                                    setChecklist(newChecklist);
                                    setFocusSubtaskId(newItem.id);
                                    if (!isCreating && onUpdateQuest) onUpdateQuest(quest.id, { subtasks: newChecklist });
                                }} 
                                className="text-xs font-bold text-secondary hover:text-main flex items-center gap-1"><Plus size={12} /> Add</button>
                        </div>
                        <div className="space-y-1">
                            {checklist.map((item, index) => (
                                <div key={item.id} className="group flex items-center gap-3 py-2 cursor-pointer select-none">
                                    <div onClick={() => toggleCheckItem(item.id)} className={`w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0 ${item.done ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-secondary/50 group-hover:border-main'}`}>
                                        {item.done && <Check size={14} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <input 
                                        id={`subtask-input-${item.id}`}
                                        type="text" 
                                        value={item.text} 
                                        onChange={(e) => { const newChecklist = checklist.map(i => i.id === item.id ? {...i, text: e.target.value} : i); setChecklist(newChecklist); if (!isCreating && onUpdateQuest) onUpdateQuest(quest.id, { subtasks: newChecklist }); }} 
                                        onKeyDown={(e) => { 
                                            if (e.key === 'Enter') { 
                                                e.preventDefault(); 
                                                const newItem = { id: Date.now().toString() + Math.random().toString().slice(2,5), text: '', done: false }; 
                                                const newChecklist = [...checklist]; 
                                                newChecklist.splice(index + 1, 0, newItem); 
                                                setChecklist(newChecklist); 
                                                setFocusSubtaskId(newItem.id);
                                                if (!isCreating && onUpdateQuest) onUpdateQuest(quest.id, { subtasks: newChecklist }); 
                                            } 
                                            if (e.key === 'Backspace' && item.text === '' && checklist.length > 0) { 
                                                e.preventDefault(); 
                                                const prevItem = checklist[index - 1];
                                                const newChecklist = checklist.filter(i => i.id !== item.id); 
                                                setChecklist(newChecklist); 
                                                if(prevItem) setFocusSubtaskId(prevItem.id);
                                                if (!isCreating && onUpdateQuest) onUpdateQuest(quest.id, { subtasks: newChecklist }); 
                                            } 
                                        }} 
                                        className={`flex-1 bg-transparent border-none text-sm focus:outline-none w-full transition-colors ${item.done ? 'text-secondary line-through decoration-secondary/50' : 'text-main'}`} 
                                        placeholder="Subtask name..." 
                                    />
                                    <button onClick={() => { const newChecklist = checklist.filter(i => i.id !== item.id); setChecklist(newChecklist); if (!isCreating && onUpdateQuest) onUpdateQuest(quest.id, { subtasks: newChecklist }); }} className="text-secondary hover:text-red-500 px-2 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {isCreating && (
                <div className="w-full p-4 bg-background border-t border-border flex gap-3 z-50 shadow-xl shrink-0">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold bg-highlight text-secondary hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-sans">Cancel</button>
                    <button onClick={handleSave} className="flex-[2] py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 font-sans"><Plus size={18} /> Create Mission</button>
                </div>
            )}

            {/* --- TIME PICKER MODAL --- */}
            {isTimeModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsTimeModalOpen(false)}></div>
                    <div className="bg-surface w-full max-w-sm rounded-2xl p-6 shadow-2xl relative z-10 animate-slide-up border border-border">
                        <h3 className="font-bold text-lg mb-4 text-main font-serif">Zeitplan konfigurieren</h3>
                        
                        {/* Mode Selection */}
                        <div className="grid grid-cols-2 gap-2 mb-6">
                             {['NONE', 'DEADLINE', 'SCHEDULED', 'PERIOD'].map(mode => (
                                 <button
                                    key={mode}
                                    onClick={() => setTempTimeConfig(prev => ({ ...prev, mode: mode as any }))}
                                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                                        tempTimeConfig.mode === mode 
                                        ? 'bg-blue-500 text-white border-blue-600 shadow-md' 
                                        : 'bg-highlight text-secondary border-border hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                                 >
                                     {mode === 'NONE' ? 'Keine' : 
                                      mode === 'DEADLINE' ? 'Deadline' : 
                                      mode === 'SCHEDULED' ? 'Termin' : 'Zeitraum'}
                                 </button>
                             ))}
                        </div>

                        {/* Config Inputs */}
                        {tempTimeConfig.mode !== 'NONE' && (
                            <div className="space-y-4 mb-6 animate-fade-in">
                                {(tempTimeConfig.mode === 'SCHEDULED' || tempTimeConfig.mode === 'PERIOD') && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-secondary">Startdatum</label>
                                        <div className="bg-highlight rounded-xl px-3 py-2 border border-border">
                                            <input 
                                                type="datetime-local"
                                                value={toInputString(tempTimeConfig.startDate)}
                                                onChange={(e) => setTempTimeConfig(prev => ({ ...prev, startDate: fromInputString(e.target.value) }))}
                                                className="w-full bg-transparent border-none text-main text-sm font-mono outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {tempTimeConfig.mode === 'DEADLINE' && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-secondary">Fällig am</label>
                                        <div className="bg-highlight rounded-xl px-3 py-2 border border-border">
                                            <input 
                                                type="datetime-local"
                                                value={toInputString(tempTimeConfig.dueDate)}
                                                onChange={(e) => setTempTimeConfig(prev => ({ ...prev, dueDate: fromInputString(e.target.value) }))}
                                                className="w-full bg-transparent border-none text-main text-sm font-mono outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {tempTimeConfig.mode === 'PERIOD' && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-secondary">Dauer (Minuten)</label>
                                        <div className="bg-highlight rounded-xl px-3 py-2 border border-border flex items-center gap-2">
                                            <Hourglass size={16} className="text-secondary" />
                                            <input 
                                                type="number"
                                                placeholder="z.B. 60"
                                                value={tempTimeConfig.duration || ''}
                                                onChange={(e) => setTempTimeConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                                                className="w-full bg-transparent border-none text-main text-sm font-mono outline-none"
                                            />
                                        </div>
                                        <p className="text-[10px] text-secondary text-right">
                                            {tempTimeConfig.startDate && tempTimeConfig.duration 
                                             ? `Endet: ${formatDisplayDate(tempTimeConfig.startDate + (tempTimeConfig.duration * 60000))}` 
                                             : ''}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsTimeModalOpen(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-secondary bg-highlight hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-sans"
                            >
                                Abbrechen
                            </button>
                            <button 
                                onClick={saveTimeConfig}
                                className="flex-[2] py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors font-sans"
                            >
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- RECURRING MODAL --- */}
             {isRecurringModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsRecurringModalOpen(false)}></div>
                    <div className="bg-surface w-full max-w-sm rounded-2xl p-6 shadow-2xl relative z-10 animate-slide-up border border-border">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg text-main font-serif">Routinen & Wiederholungen</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-secondary">Aktiv</span>
                                <div 
                                    onClick={() => setTempRecurringConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                    className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${tempRecurringConfig.enabled ? 'bg-green-500' : 'bg-highlight border border-border'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${tempRecurringConfig.enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                        </div>

                        {tempRecurringConfig.enabled && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-secondary">Intervall</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['DAILY', 'WEEKLY', 'INTERVAL'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setTempRecurringConfig(prev => ({ ...prev, intervalType: type as any }))}
                                                className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                                                    tempRecurringConfig.intervalType === type 
                                                    ? 'bg-blue-500 text-white border-blue-600' 
                                                    : 'bg-highlight text-secondary border-border'
                                                }`}
                                            >
                                                {type === 'DAILY' ? 'Täglich' : type === 'WEEKLY' ? 'Wöchentlich' : 'Intervall'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {tempRecurringConfig.intervalType === 'INTERVAL' && (
                                     <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-secondary">Alle X Tage</label>
                                        <div className="bg-highlight rounded-xl px-3 py-2 border border-border">
                                            <input 
                                                type="number"
                                                min="2"
                                                value={tempRecurringConfig.intervalValue || 2}
                                                onChange={(e) => setTempRecurringConfig(prev => ({ ...prev, intervalValue: parseInt(e.target.value) || 2 }))}
                                                className="w-full bg-transparent border-none text-main text-sm font-mono outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-secondary flex items-center gap-1">
                                        <CalendarX size={12} /> Tage überspringen (Pause)
                                    </label>
                                    <div className="flex justify-between gap-1">
                                        {WEEKDAYS.map(day => {
                                            const isExcluded = tempRecurringConfig.excludedDays?.includes(day.val);
                                            return (
                                                <button
                                                    key={day.val}
                                                    onClick={() => {
                                                        const current = tempRecurringConfig.excludedDays || [];
                                                        const newExcluded = isExcluded 
                                                            ? current.filter(d => d !== day.val)
                                                            : [...current, day.val];
                                                        setTempRecurringConfig(prev => ({ ...prev, excludedDays: newExcluded }));
                                                    }}
                                                    className={`w-8 h-8 rounded-full text-[10px] font-bold border transition-all flex items-center justify-center ${
                                                        isExcluded 
                                                        ? 'bg-red-500 text-white border-red-600' 
                                                        : 'bg-highlight text-secondary border-border'
                                                    }`}
                                                >
                                                    {day.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 mt-8">
                            <button 
                                onClick={() => setIsRecurringModalOpen(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-secondary bg-highlight hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-sans"
                            >
                                Abbrechen
                            </button>
                            <button 
                                onClick={saveRecurringConfig}
                                className="flex-[2] py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors font-sans"
                            >
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- NOTIFICATION CONFIG MODAL --- */}
            {isNotificationModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNotificationModalOpen(false)}></div>
                    <div className="bg-surface w-full max-w-sm rounded-2xl p-6 shadow-2xl relative z-10 animate-slide-up border border-border">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg text-main font-serif">Mission Alarm</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-secondary">Custom</span>
                                <div 
                                    onClick={() => setTempNotificationConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                    className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${tempNotificationConfig.enabled ? 'bg-green-500' : 'bg-highlight border border-border'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${tempNotificationConfig.enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                        </div>

                        {tempNotificationConfig.enabled && (
                            <div className="space-y-4 animate-fade-in mb-6">
                                <p className="text-[10px] text-secondary italic">Diese Einstellungen überschreiben die globalen Schwierigkeits-Standards.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-secondary mb-1 block">Warn Start (min)</label>
                                        <div className="bg-highlight rounded-xl px-3 py-2 border border-border">
                                            <input 
                                                type="number"
                                                min="0"
                                                value={tempNotificationConfig.startWarningMinutes || 0}
                                                onChange={(e) => setTempNotificationConfig(prev => ({ ...prev, startWarningMinutes: parseInt(e.target.value) || 0 }))}
                                                className="w-full bg-transparent border-none text-main text-sm font-mono outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-secondary mb-1 block">Warn Ende (min)</label>
                                        <div className="bg-highlight rounded-xl px-3 py-2 border border-border">
                                            <input 
                                                type="number"
                                                min="0"
                                                value={tempNotificationConfig.endWarningMinutes || 0}
                                                onChange={(e) => setTempNotificationConfig(prev => ({ ...prev, endWarningMinutes: parseInt(e.target.value) || 0 }))}
                                                className="w-full bg-transparent border-none text-main text-sm font-mono outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsNotificationModalOpen(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-secondary bg-highlight hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-sans"
                            >
                                Abbrechen
                            </button>
                            <button 
                                onClick={saveNotificationConfig}
                                className="flex-[2] py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors font-sans"
                            >
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
