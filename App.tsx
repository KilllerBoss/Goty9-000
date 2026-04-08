
import React, { useState, useEffect } from 'react';
import { INITIAL_PROFILE, MOCK_QUESTS, MOCK_CLASSES, MOCK_SHOP_ITEMS } from './constants';
import { UserProfile, Quest, PlayerClass, ShopItem, Difficulty, Rank, SubClass, DossierEntry } from './types';
import { LevelingDashboard } from './components/LevelingDashboard';
import { getExpForLevel, getRankFromLevel } from './gameUtils';
import { AppTheme } from './types';

const App: React.FC = () => {
  // --- STATE WITH PERSISTENCE INITIALIZATION ---
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('focus_app_profile');
    let p = saved ? JSON.parse(saved) : INITIAL_PROFILE;
    
    // Migration: Ensure history exists for older saves
    if (!p.history) {
      p.history = {
        totalGoldEarned: p.gold, 
        totalGoldSpent: 0,
        totalPenalties: 0,
        completedQuests: 0
      };
    }
    // Migration: Ensure penaltyPoints exists
    if (p.penaltyPoints === undefined) {
        p.penaltyPoints = 0;
    }
    // Migration: Ensure dossier exists
    if (!p.dossier) {
        p.dossier = [];
    }
    return p;
  });

  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem('focus_app_quests');
    let q = saved ? JSON.parse(saved) : MOCK_QUESTS;
    
    const now = Date.now();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

    // Filter out ARCHIVED quests older than 30 days
    q = q.filter((quest: Quest) => {
        if (quest.status === 'ARCHIVED' && quest.archivedAt) {
            return (now - quest.archivedAt) < thirtyDaysInMs;
        }
        return true;
    });

    // Migration: Ensure status, timeConfig and multi-class support exist
    return q.map((quest: any) => {
        const updated = {
            ...quest,
            status: quest.status || (quest.isCompleted ? 'ARCHIVED' : (quest.failed ? 'FAILED' : 'IN_PROCESS')),
            timeConfig: quest.timeConfig || { mode: 'DEADLINE', dueDate: quest.deadline },
            relatedClassIds: quest.relatedClassIds || (quest.relatedClassId ? [quest.relatedClassId] : []),
            relatedSubClassIds: quest.relatedSubClassIds || []
        };
        return updated;
    });
  });

  const [classes, setClasses] = useState<PlayerClass[]>(() => {
    const saved = localStorage.getItem('focus_app_classes');
    const parsed = saved ? JSON.parse(saved) : MOCK_CLASSES;
    // Migration: Add currentExp and expToNextLevel for existing data
    return parsed.map((c: any) => ({
      ...c,
      currentExp: c.currentExp || 0,
      expToNextLevel: c.expToNextLevel || getExpForLevel(c.level || 1),
      subClasses: c.subClasses || []
    }));
  });

  const [shopItems, setShopItems] = useState<ShopItem[]>(() => {
    const saved = localStorage.getItem('focus_app_shop');
    return saved ? JSON.parse(saved) : MOCK_SHOP_ITEMS;
  });

  const [notification, setNotification] = useState<string | null>(null);

  // --- THEME STATE ---
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('focus_app_theme');
    return (saved as AppTheme) || AppTheme.AUTO;
  });

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => { localStorage.setItem('focus_app_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('focus_app_quests', JSON.stringify(quests)); }, [quests]);
  useEffect(() => { localStorage.setItem('focus_app_classes', JSON.stringify(classes)); }, [classes]);
  useEffect(() => { localStorage.setItem('focus_app_shop', JSON.stringify(shopItems)); }, [shopItems]);

  // --- THEME EFFECT ---
  useEffect(() => {
    localStorage.setItem('focus_app_theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'oled');

    let effectiveTheme = theme;
    
    if (theme === AppTheme.AUTO) {
       const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
       effectiveTheme = systemDark ? AppTheme.DARK : AppTheme.LIGHT;
       
       // Listener for system changes
       const listener = (e: MediaQueryListEvent) => {
           root.classList.remove('light', 'dark', 'oled');
           const newTheme = e.matches ? AppTheme.DARK : AppTheme.LIGHT;
           root.classList.add(newTheme);
       };
       const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
       mediaQuery.addEventListener('change', listener);
       
       // Apply initial detected theme
       root.classList.add(effectiveTheme);
       return () => mediaQuery.removeEventListener('change', listener);
    } 

    if (effectiveTheme === AppTheme.OLED) {
        root.classList.add('dark'); 
        root.classList.add('oled');
    } else {
        root.classList.add(effectiveTheme);
    }
  }, [theme]);

  // --- SYSTEM NOTIFICATIONS REQUEST ---
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
  }, []);

  const sendSystemNotification = (title: string, body?: string) => {
      if ("Notification" in window && Notification.permission === "granted") {
          try {
              new Notification(title, { body, icon: '/icon.png' });
          } catch (e) {
              console.log("System notification failed", e);
          }
      }
  };

  // --- LEVELING LOGIC ---
  useEffect(() => {
    if (profile.currentExp >= profile.expToNextLevel) {
      const overflow = profile.currentExp - profile.expToNextLevel;
      const newLevel = profile.level + 1;
      const newRank = getRankFromLevel(newLevel);
      const newExpReq = getExpForLevel(newLevel);

      setProfile(prev => ({
        ...prev,
        level: newLevel,
        rank: newRank,
        currentExp: overflow,
        expToNextLevel: newExpReq,
        stats: {
           ...prev.stats,
           strength: prev.stats.strength + 1,
           intelligence: prev.stats.intelligence + 1,
        }
      }));
      
      sendSystemNotification(`Level Up!`, `You reached Level ${newLevel} and Rank ${newRank}`);
    }
  }, [profile.currentExp, profile.expToNextLevel, profile.level]);

  // --- NOTIFICATION & SOUND LOGIC ---
  const playSound = (soundUrl?: string) => {
      // Create audio element for sound playing
      const audio = new Audio(soundUrl || 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Fallback sound
      audio.play().catch(e => console.log("Audio play blocked", e));
  };

  // --- AUTOMATIC TIME CHECKER ---
  useEffect(() => {
    const checkTimeEvents = () => {
        const now = Date.now();
        setQuests(prevQuests => {
            let updated = false;
            
            // Loop through quests to check notifications and auto-fails
            const newQuests = prevQuests.map(q => {
                // Skip checks for inactive quests
                if (['DONE', 'FAILED', 'ARCHIVED', 'CANCELLED', 'ON_HOLD'].includes(q.status || '')) {
                     return q;
                }

                let qUpdated = false;
                
                // Determine settings to use
                const globalSettings = profile.settings?.notifications?.[q.difficulty];
                let startWarn = globalSettings?.startWarningMinutes;
                let endWarn = globalSettings?.endWarningMinutes;
                let sound = globalSettings?.customSound;

                if (q.customNotificationConfig?.enabled) {
                    startWarn = q.customNotificationConfig.startWarningMinutes;
                    endWarn = q.customNotificationConfig.endWarningMinutes;
                    // Note: Custom sound could be added to quest config later if needed
                }

                // 1. Start Notification
                if (q.timeConfig?.startDate && !q.notifiedStart && startWarn) {
                    const timeToStart = q.timeConfig.startDate - now;
                    const warningMs = startWarn * 60 * 1000;
                    
                    if (timeToStart > 0 && timeToStart <= warningMs) {
                        playSound(sound);
                        const msg = `Mission "${q.title}" starts in ${startWarn}m!`;
                        sendSystemNotification("Mission Starting", msg);
                        q.notifiedStart = true;
                        qUpdated = true;
                    }
                }

                // 2. End Notification
                if (q.timeConfig?.dueDate && !q.notifiedEnd && endWarn) {
                    const timeToEnd = q.timeConfig.dueDate - now;
                    const warningMs = endWarn * 60 * 1000;
                    
                    if (timeToEnd > 0 && timeToEnd <= warningMs) {
                        playSound(sound);
                        const msg = `Mission "${q.title}" ends in ${endWarn}m!`;
                        sendSystemNotification("Mission Ending", msg);
                        q.notifiedEnd = true;
                        qUpdated = true;
                    }
                }

                // 3. Auto-Start (Scheduled Quests)
                if (q.timeConfig?.startDate && q.status === 'NOT_STARTED' && now >= q.timeConfig.startDate) {
                    q.status = 'IN_PROCESS';
                    qUpdated = true;
                }

                // 4. High Priority Promotion
                if ((q.difficulty === 'HARD' || q.difficulty === 'EXTREME' || q.difficulty === 'ABSURD') && 
                    q.status === 'IN_PROCESS' &&
                    q.timeConfig?.startDate && now > q.timeConfig.startDate && q.status !== 'HIGH_PRIORITY'
                ) {
                    q.status = 'HIGH_PRIORITY';
                    qUpdated = true;
                }

                if (qUpdated) updated = true;
                return q;
            });

            return updated ? [...newQuests] : prevQuests;
        });

        // Loop separately to handle side-effects for overdue quests (Auto-Fail)
        quests.forEach(q => {
             if (q.timeConfig?.mode === 'DEADLINE' && q.timeConfig.dueDate && now > q.timeConfig.dueDate) {
                // If deadline passed and not in a terminal state
                if (q.status !== 'DONE' && q.status !== 'FAILED' && q.status !== 'ARCHIVED' && q.status !== 'CANCELLED' && q.status !== 'ON_HOLD') {
                    handleFailQuest(q.id); 
                }
             }
             // Handle Period end same as deadline
             if (q.timeConfig?.mode === 'PERIOD' && q.timeConfig.dueDate && now > q.timeConfig.dueDate) {
                 if (q.status !== 'DONE' && q.status !== 'FAILED' && q.status !== 'ARCHIVED' && q.status !== 'CANCELLED' && q.status !== 'ON_HOLD') {
                    handleFailQuest(q.id); 
                }
             }
        });
    };

    const intervalId = setInterval(checkTimeEvents, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
  }, [quests, profile.settings]); // Add profile.settings as dependency

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- ACTIONS ---

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    // DOSSIER MANAGEMENT INTERCEPTION
    // If we receive a dossier update via the general update, we handle it carefully to avoid overwrites
    if (updates.dossier) {
        // Just set it. The complex logic is in handleUpdateDossier
    }
    setProfile(prev => ({ ...prev, ...updates }));
    triggerNotification("Profile Updated");
  };

  const handleAddQuest = (newQuest: Quest) => {
    setQuests(prev => [newQuest, ...prev]);
    triggerNotification("New Mission Acquired");
  };

  const handleUpdateQuest = (id: string, updates: Partial<Quest>) => {
    setQuests(prev => prev.map(q => {
        if (q.id !== id) return q;

        // HOLD LOGIC INTERCEPTION
        // If transitioning TO 'ON_HOLD'
        if (updates.status === 'ON_HOLD' && q.status !== 'ON_HOLD') {
            return { ...q, ...updates, holdStartTime: Date.now() };
        }
        
        // If transitioning FROM 'ON_HOLD' to something else (e.g. IN_PROCESS)
        if (q.status === 'ON_HOLD' && updates.status && updates.status !== 'ON_HOLD') {
             if (q.holdStartTime && q.timeConfig?.dueDate) {
                 const holdDuration = Date.now() - q.holdStartTime;
                 const newDueDate = q.timeConfig.dueDate + holdDuration;
                 
                 return { 
                     ...q, 
                     ...updates, 
                     holdStartTime: undefined, 
                     timeConfig: {
                         ...q.timeConfig,
                         dueDate: newDueDate
                     },
                     deadline: newDueDate // Keep legacy field synced
                 };
             }
             return { ...q, ...updates, holdStartTime: undefined };
        }

        return { ...q, ...updates };
    }));
  };

  const handleAddClass = (newClass: PlayerClass) => {
    setClasses(prev => [...prev, newClass]);
    triggerNotification("New Class Unlocked");
  };

  const handleAddSubClass = (classId: string, title: string, initialStats?: Partial<SubClass>) => {
      setClasses(prev => prev.map(c => {
          if (c.id !== classId) return c;
          
          const newSub: SubClass = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              title: title,
              level: initialStats?.level || 1,
              progress: initialStats?.progress || 0,
              currentExp: initialStats?.currentExp || 0,
              expToNextLevel: initialStats?.expToNextLevel || getExpForLevel(initialStats?.level || 1)
          };
          return { ...c, subClasses: [...(c.subClasses || []), newSub] };
      }));
      triggerNotification("Subclass Added");
  };

  const handleDeleteClass = (classId: string) => {
      setClasses(prev => prev.filter(c => c.id !== classId));
      triggerNotification("Class Removed");
  };

  const handleDeleteSubClass = (classId: string, subClassId: string) => {
      setClasses(prev => prev.map(c => {
          if (c.id !== classId) return c;
          return { ...c, subClasses: (c.subClasses || []).filter(s => s.id !== subClassId) };
      }));
      triggerNotification("Subclass Removed");
  };

  const handleAddShopItem = (newItem: ShopItem) => {
    setShopItems(prev => [...prev, newItem]);
    triggerNotification("Karma Market Updated");
  };

  const handleCompleteQuest = (id: string) => {
    const quest = quests.find(q => q.id === id);
    if (!quest || quest.isCompleted) return;

    // 1. Update Player Profile
    setProfile(prev => ({
      ...prev,
      currentExp: prev.currentExp + quest.expReward,
      gold: prev.gold + quest.goldReward,
      history: {
        ...prev.history,
        totalGoldEarned: (prev.history?.totalGoldEarned || 0) + quest.goldReward,
        completedQuests: (prev.history?.completedQuests || 0) + 1
      }
    }));

    // 2. Update Linked Classes and Subclasses
    setClasses(prevClasses => prevClasses.map(cls => {
        let needsUpdate = false;
        let newCls = { ...cls };

        // Check if Main Class is linked
        if (quest.relatedClassIds?.includes(cls.id)) {
            needsUpdate = true;
            let newCurrentExp = (newCls.currentExp || 0) + quest.expReward;
            let newTotalExp = (newCls.totalExp || 0) + quest.expReward;
            let newLevel = newCls.level;
            let newExpToNext = newCls.expToNextLevel || getExpForLevel(newLevel); 

            while (newCurrentExp >= newExpToNext) {
                newCurrentExp -= newExpToNext;
                newLevel++;
                newExpToNext = getExpForLevel(newLevel);
                sendSystemNotification(`${newCls.title} Level Up!`, `Reached Level ${newLevel}`);
            }

            const progress = Math.min(100, Math.floor((newCurrentExp / newExpToNext) * 100));
            newCls.level = newLevel;
            newCls.currentExp = newCurrentExp;
            newCls.expToNextLevel = newExpToNext;
            newCls.totalExp = newTotalExp;
            newCls.progress = progress;
        }

        // Check Subclasses
        if (quest.relatedSubClassIds && quest.relatedSubClassIds.length > 0 && newCls.subClasses) {
            newCls.subClasses = newCls.subClasses.map(sub => {
                if (quest.relatedSubClassIds?.includes(sub.id)) {
                    needsUpdate = true;
                    let newSubExp = (sub.currentExp || 0) + quest.expReward;
                    let newSubLevel = sub.level;
                    let newSubExpToNext = sub.expToNextLevel || getExpForLevel(newSubLevel);

                    while (newSubExp >= newSubExpToNext) {
                        newSubExp -= newSubExpToNext;
                        newSubLevel++;
                        newSubExpToNext = getExpForLevel(newSubLevel);
                        sendSystemNotification(`${sub.title} Level Up!`, `Reached Level ${newSubLevel}`);
                    }
                    
                    const subProgress = Math.min(100, Math.floor((newSubExp / newSubExpToNext) * 100));

                    return {
                        ...sub,
                        level: newSubLevel,
                        currentExp: newSubExp,
                        expToNextLevel: newSubExpToNext,
                        progress: subProgress
                    };
                }
                return sub;
            });
        }

        return needsUpdate ? newCls : cls;
    }));

    // 3. Mark as DONE immediately (Visual Feedback)
    setQuests(prev => prev.map(q => q.id === id ? { ...q, isCompleted: true, status: 'DONE' } : q));
    triggerNotification(`+${quest.expReward} EXP | +${quest.goldReward} G`);

    // 4. Handle Recurring / Archive logic
    if (quest.recurringConfig?.enabled) {
        let nextStart: number | undefined = undefined;
        let nextDue: number | undefined = undefined;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (quest.recurringConfig.intervalType === 'DAILY') {
            nextStart = now + oneDay;
        } else if (quest.recurringConfig.intervalType === 'WEEKLY') {
            nextStart = now + (7 * oneDay);
        } else if (quest.recurringConfig.intervalType === 'INTERVAL' && quest.recurringConfig.intervalValue) {
            nextStart = now + (quest.recurringConfig.intervalValue * oneDay);
        }
        
        if (nextStart) {
             let duration = 0;
             if (quest.timeConfig?.startDate && quest.timeConfig?.dueDate) {
                 duration = quest.timeConfig.dueDate - quest.timeConfig.startDate;
             }
             if (duration > 0) nextDue = nextStart + duration;

             const nextDate = new Date(nextStart);
             const day = nextDate.getDay();
             if (quest.recurringConfig.excludedDays?.includes(day)) {
                 nextStart += oneDay;
                 if (nextDue) nextDue += oneDay;
             }
             
             const nextQuest: Quest = {
                 ...quest,
                 id: Date.now().toString(), // New ID
                 status: 'NOT_STARTED',
                 isCompleted: false,
                 failed: false,
                 cancelled: false,
                 subtasks: quest.subtasks?.map(s => ({ ...s, done: false })), // Reset subtasks
                 timeConfig: {
                     ...quest.timeConfig,
                     startDate: nextStart,
                     dueDate: nextDue
                 },
                 deadline: nextDue
             };
             
             setQuests(prev => [nextQuest, ...prev]);
        }
    }

    setTimeout(() => {
        setQuests(prev => prev.map(q => q.id === id ? { ...q, status: 'ARCHIVED', archivedAt: Date.now() } : q));
    }, 3000);
  };

  const handleFailQuest = (id: string) => {
    const quest = quests.find(q => q.id === id);
    if(!quest || quest.failed) return;

    let penaltyAmount = 0;
    if (quest.penalty) {
        penaltyAmount = parseInt(quest.penalty.replace(/\D/g, '')) || 0;
    }
    if (penaltyAmount === 0) {
        penaltyAmount = Math.max(50, Math.floor(quest.goldReward * 0.25));
    }

    setQuests(prev => prev.map(q => q.id === id ? { ...q, failed: true, status: 'FAILED' } : q));
    
    setProfile(prev => ({
        ...prev,
        penaltyPoints: (prev.penaltyPoints || 0) + penaltyAmount
    }));

    sendSystemNotification("Quest Failed", `You failed "${quest.title}". Debt increased.`);

    setTimeout(() => {
        setQuests(prev => prev.map(q => q.id === id ? { ...q, status: 'ARCHIVED', archivedAt: Date.now() } : q));
    }, 3000);
  };

  const handleCancelQuest = (id: string) => {
    const quest = quests.find(q => q.id === id);
    if (!quest) return;

    setQuests(prev => prev.map(q => q.id === id ? { ...q, cancelled: true, status: 'CANCELLED' } : q));
    triggerNotification("Mission Cancelled");

    setTimeout(() => {
        setQuests(prev => prev.map(q => q.id === id ? { ...q, status: 'ARCHIVED', archivedAt: Date.now() } : q));
    }, 3000);
  };

  const handleBuyItem = (id: string) => {
    const item = shopItems.find(i => i.id === id);
    if (!item) return;

    if (item.type === 'REWARD') {
      if ((profile.penaltyPoints || 0) > 0) {
          triggerNotification("ACTION BLOCKED: Clear Penalty Debt first!");
          return;
      }

      if (profile.gold >= item.cost) {
        setProfile(prev => ({ 
            ...prev, 
            gold: prev.gold - item.cost,
            history: {
                ...prev.history,
                totalGoldSpent: (prev.history?.totalGoldSpent || 0) + item.cost
            }
        }));
        triggerNotification(`Purchased: ${item.name}`);
        
        if (item.singleUse) {
            setShopItems(prev => prev.filter(i => i.id !== id));
        }

      } else {
        triggerNotification("Insufficient Gold!");
      }
    } else {
      const currentDebt = profile.penaltyPoints || 0;
      
      if (currentDebt === 0) {
          triggerNotification("You have no sins to atone for.");
          return;
      }

      const reduction = Math.min(currentDebt, item.cost);

      setProfile(prev => ({
          ...prev,
          penaltyPoints: Math.max(0, (prev.penaltyPoints || 0) - item.cost),
          history: {
              ...prev.history,
              totalPenalties: (prev.history?.totalPenalties || 0) + item.cost
          }
      }));
      triggerNotification(`Atonement Accepted. Debt reduced by ${reduction}.`);

      if (item.singleUse) {
          setShopItems(prev => prev.filter(i => i.id !== id));
      }
    }
  };

  const handleDeleteQuest = (id: string) => {
    setQuests(prev => prev.filter(q => q.id !== id));
    triggerNotification("Mission Deleted");
  };

  const handleDeleteItem = (id: string) => {
    setShopItems(prev => prev.filter(i => i.id !== id));
    triggerNotification("Item Removed");
  };

  return (
    <LevelingDashboard
      profile={profile}
      classes={classes}
      shopItems={shopItems}
      quests={quests}
      currentTheme={theme}
      setTheme={setTheme}
      onUpdateProfile={handleUpdateProfile}
      onAddQuest={handleAddQuest}
      onUpdateQuest={handleUpdateQuest}
      onAddClass={handleAddClass}
      onAddSubClass={handleAddSubClass}
      onDeleteClass={handleDeleteClass}
      onDeleteSubClass={handleDeleteSubClass}
      onAddShopItem={handleAddShopItem}
      onCompleteQuest={handleCompleteQuest}
      onFailQuest={handleFailQuest}
      onCancelQuest={handleCancelQuest}
      onBuyItem={handleBuyItem}
      onDeleteQuest={handleDeleteQuest}
      onDeleteItem={handleDeleteItem}
    />
  );
};

export default App;
