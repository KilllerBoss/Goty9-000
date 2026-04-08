
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, PlayerClass, ShopItem, Quest, Difficulty, Rank, AppTheme, AppAssets, QuestStatus, SubClass, DossierEntry } from '../types';
import { getExpForLevel, calculateItemCost } from '../gameUtils';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { QuestDetailView } from './QuestDetail';
import { compressImage, DEFAULT_ASSETS as UTILS_DEFAULT_ASSETS } from '../utils';
import { processSystemCommand } from '../services/geminiService';

// Import New Sub-Components
import { Modal, InputField, SelectField } from './SharedUI'; 
import { HunterLicenseEdit } from './dashboard/HunterLicenseEdit';
import { PlayerProfileView } from './dashboard/PlayerProfileView';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { PlayerWidget } from './dashboard/PlayerWidget';
import { ClassesWidget } from './dashboard/ClassesWidget';
import { ActiveQuestsWidget } from './dashboard/ActiveQuestsWidget';
import { BlackMarketView } from './dashboard/BlackMarketView';
import { AiTerminal, TerminalMode } from './dashboard/AiTerminal';
import { SettingsModal } from './dashboard/SettingsModal';

interface LevelingDashboardProps {
  profile: UserProfile;
  classes: PlayerClass[];
  shopItems: ShopItem[];
  quests: Quest[];
  currentTheme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onAddQuest: (quest: Quest) => void;
  onUpdateQuest: (id: string, updates: Partial<Quest>) => void;
  onAddClass: (cls: PlayerClass) => void;
  onAddSubClass: (classId: string, title: string) => void;
  onDeleteClass: (classId: string) => void;
  onDeleteSubClass: (classId: string, subClassId: string) => void;
  onAddShopItem: (item: ShopItem) => void;
  onCompleteQuest: (id: string) => void;
  onFailQuest: (id: string) => void;
  onCancelQuest: (id: string) => void;
  onBuyItem: (id: string) => void;
  onDeleteQuest: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

export const LevelingDashboard: React.FC<LevelingDashboardProps> = ({ 
    profile, classes, shopItems, quests, currentTheme, setTheme,
    onUpdateProfile, onAddQuest, onUpdateQuest, onAddClass, onAddSubClass, onDeleteClass, onDeleteSubClass, onAddShopItem, 
    onCompleteQuest, onFailQuest, onCancelQuest, onBuyItem, onDeleteQuest, onDeleteItem 
}) => {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [layoutShopOpen, setLayoutShopOpen] = useState(false);
  
  // Section Visibility State
  const [sections, setSections] = useState({ classes: false, quests: true });
  
  // Settings & Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [activeModal, setActiveModal] = useState<'NONE' | 'PROFILE_VIEW' | 'PROFILE_EDIT' | 'QUEST_CREATE' | 'QUEST_VIEW' | 'CLASS' | 'SUBCLASS_CREATE' | 'CLASS_MANAGE' | 'ITEM'>('NONE');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  
  // AI Terminal State
  const [aiInput, setAiInput] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [aiMode, setAiMode] = useState<TerminalMode>('CLI');

  // Class Management State
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newSubClassTitle, setNewSubClassTitle] = useState('');

  // Form State
  const [newQuest, setNewQuest] = useState({ title: '', desc: '', diff: Difficulty.EASY, type: 'DAILY', rewardExp: '50', rewardGold: '20', image: '', penalty: '', relatedClassId: '' });
  const [newClass, setNewClass] = useState({ title: '', subtitle: '', icon: '' });
  const [newItem, setNewItem] = useState({ name: '', cost: '0', type: 'REWARD', rank: Rank.E, singleUse: false, image: '' });
  const [editProfile, setEditProfile] = useState<UserProfile>(profile);

  const classImageInputRef = useRef<HTMLInputElement>(null);
  const itemImageInputRef = useRef<HTMLInputElement>(null);

  // Sync editProfile with profile when it changes
  useEffect(() => {
     setEditProfile(profile);
  }, [profile]);

  // ASSETS STATE
  const [assets, setAssets] = useState<AppAssets>(() => {
      const saved = localStorage.getItem('focus_app_assets');
      return saved ? JSON.parse(saved) : UTILS_DEFAULT_ASSETS;
  });

  useEffect(() => {
      try {
        localStorage.setItem('focus_app_assets', JSON.stringify(assets));
      } catch (e) {
        console.error("Storage limit reached", e);
      }
  }, [assets]);

  const handleAssetChange = (key: keyof AppAssets, value: string) => {
      setAssets(prev => ({ ...prev, [key]: value }));
  };

  const handleAssetUpload = async (key: keyof AppAssets, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const compressed = await compressImage(file);
            handleAssetChange(key, compressed);
        } catch (err) {
            console.error("Compression failed", err);
        }
    }
  };

  // --- AI LOGIC: SEPARATE ROLES ---
  const handleAiSubmit = async () => {
      if (isProcessingAi) return;
      
      // Collector logic allow empty input for auto-update
      // Now also allows it if we are in PROFILE_EDIT (Documents View)
      if (aiMode !== 'GARDENER' && aiMode !== 'COLLECTOR' && !aiInput.trim()) return;

      setIsProcessingAi(true);

      // Determine default inputs for empty states
      let effectiveInput = aiInput;
      if (!aiInput.trim()) {
          if (aiMode === 'GARDENER') {
              effectiveInput = "Scanne alle Quests. Entferne Duplikate. Korrigiere Zeiten wenn nötig.";
          } else if (aiMode === 'COLLECTOR') {
              if (activeModal === 'PROFILE_EDIT') {
                  // Special logic for Document View (Paper Terminal)
                  effectiveInput = `
                  MAINTENANCE:
                  Scan DOSSIER. If unstructured -> Format to Bullet Points.
                  Sort chronologically.
                  Keep it extremely brief.
                  If okay -> Do nothing.
                  `;
              } else {
                  // General Collector Scan
                  effectiveInput = "ANALYSE: Update Charts & Levels based on stats. Keep titles short.";
              }
          }
      }

      const locationStr = profile.location ? `LOC: ${profile.location}` : "";

      // --- CALCULATE AGGREGATE QUEST STATISTICS ---
      // This allows the Collector to build real graphs/levels
      const questStats = {
          totalCompleted: quests.filter(q => q.status === 'ARCHIVED' && q.isCompleted).length,
          totalFailed: quests.filter(q => q.status === 'ARCHIVED' && q.failed).length,
          byDifficulty: {} as Record<string, number>,
          byClass: {} as Record<string, number>
      };

      quests.forEach(q => {
          if (q.status === 'ARCHIVED' && q.isCompleted) {
              // Difficulty Stats
              questStats.byDifficulty[q.difficulty] = (questStats.byDifficulty[q.difficulty] || 0) + 1;
              
              // Class Stats (Use Class Titles for AI readability)
              if (q.relatedClassIds) {
                  q.relatedClassIds.forEach(cId => {
                      const cls = classes.find(c => c.id === cId);
                      if (cls) {
                          questStats.byClass[cls.title] = (questStats.byClass[cls.title] || 0) + 1;
                      }
                  });
              }
          }
      });

      // 1. CLI MODE (The Executor)
      const cliPrompt = `
      ROLE: 'CLI'.
      MISSION: Execute commands. Create New.
      
      PERMISSIONS: 'create_quest', 'create_class', 'create_subclass', 'create_black_market_item'.
      FORBIDDEN: 'update_quest'.
      ${locationStr}
      
      STYLE: Terminal. Ultra-short. No fluff.
      `;

      // 2. GARDENER MODE (The Organizer)
      const gardenerPrompt = `
      ROLE: 'GARDENER'.
      MISSION: Maintenance. Clean up. Merge duplicates. Fix times.
      
      PERMISSIONS: 'update_quest', 'delete_element', 'restructure_classes'.
      WARNING: Do NOT create new quests unless specifically asked to 'add'. 
      USE 'update_quest' to change times or details of existing items.
      USE 'delete_element' to remove duplicates.
      
      STYLE: Silent. Minimal.
      `;

      // 3. COLLECTOR MODE (The Biographer & Analyst)
      const collectorPrompt = `
      ROLE: 'COLLECTOR'.
      MISSION: Update 'Secret Dossier' based on 'QUEST_STATS'.
      
      PERMISSIONS: 'update_hunter_license', 'manage_dossier_entry'.
      NO CREATION of quests/classes.
      
      STYLE: Brief notes. Bullet points. NO PROSE. Short titles.
      `;

      let activeSystemPrompt = cliPrompt;
      if (aiMode === 'GARDENER') activeSystemPrompt = gardenerPrompt;
      if (aiMode === 'COLLECTOR') activeSystemPrompt = collectorPrompt;

      // Dossier Context: Full Content if in Edit Mode (to allow sorting/fixing), otherwise just index
      const dossierContext = activeModal === 'PROFILE_EDIT'
          ? `FULL DOSSIER CONTENT:\n${JSON.stringify(profile.dossier, null, 2)}`
          : `DOSSIER INDEX: [${profile.dossier && profile.dossier.length > 0 ? profile.dossier.map(d => `"${d.title}"`).join(', ') : "EMPTY"}]`;

      // Context Assembly
      const context = `
      STATS:
      ${JSON.stringify(questStats, null, 2)}
      
      CLASSES:
      ${JSON.stringify(classes.map(c => ({ id: c.id, title: c.title })), null, 2)}
      
      QUESTS (ID is crucial for updates):
      ${JSON.stringify(quests.filter(q => q.status !== 'ARCHIVED').slice(0, 25).map(q => ({ 
          id: q.id, 
          title: q.title, 
          status: q.status, 
          time_mode: q.timeConfig?.mode,
          start: q.timeConfig?.startDate ? new Date(q.timeConfig.startDate).toLocaleString() : null,
          due: q.timeConfig?.dueDate ? new Date(q.timeConfig.dueDate).toLocaleString() : null 
      })), null, 2)}
      
      PROFILE:
      Name: ${profile.name}
      Goal: ${profile.mainGoal}
      
      ${dossierContext}
      `;

      try {
          const response = await processSystemCommand(effectiveInput, context, activeSystemPrompt);
          
          const toolCalls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall);
          const textResponse = response.text;

          if (toolCalls && toolCalls.length > 0) {
              const actions = toolCalls.map(tc => tc.functionCall);
              executeActions(actions);
          } else {
              if (textResponse) console.log("AI Response:", textResponse);
          }
      } catch (e) {
          console.error("AI Error", e);
      } finally {
          setIsProcessingAi(false);
          setAiInput('');
      }
  };

  // HELPER: Parse Date string from AI
  const parseAiDate = (dateStr: string): number | undefined => {
    if (!dateStr) return undefined;
    
    // Check if it matches HH:MM pattern (today)
    const timeMatch = dateStr.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
        const now = new Date();
        now.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
        return now.getTime();
    }

    // Standard timestamp parsing
    let ts = Date.parse(dateStr);
    if (!isNaN(ts)) return ts;
    
    return undefined;
  };

  const executeActions = (actions: any[]) => {
      // 1. Separate Class creation to handle parents first
      const classActions = actions.filter(a => a.name === 'create_class');
      const otherActions = actions.filter(a => a.name !== 'create_class');

      // Temporary store for newly created class IDs to link subclasses immediately
      const tempClassMap: Record<string, string> = {}; // Name -> ID

      // Execute Main Classes first
      classActions.forEach(action => {
          const args = action.args;
          const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          
          if (args.title) tempClassMap[args.title.toLowerCase()] = newId;

          onAddClass({
              id: newId,
              title: args.title || 'New Class',
              subtitle: args.subtitle || '',
              level: 1, progress: 0, status: 'In progress', totalExp: 0, currentExp: 0,
              expToNextLevel: getExpForLevel(1), 
              icon: args.icon_image,
              subClasses: []
          });
      });

      // Execute Rest
      otherActions.forEach(action => {
          const args = action.args;
          
          if (action.name === 'update_hunter_license') {
             const updates: Partial<UserProfile> = {};
             if (args.codename) updates.name = args.codename;
             if (args.realname_title) updates.title = args.realname_title;
             if (args.dob) updates.birthDate = args.dob;
             if (args.location) updates.location = args.location;
             if (args.annual_goal) updates.mainGoal = args.annual_goal;
             if (args.monthly_goal) updates.monthlyIncome = args.monthly_goal;
             if (args.weekly_goal) updates.dailyFocus = args.weekly_goal;
             onUpdateProfile(updates);
          }

          if (action.name === 'manage_dossier_entry') {
              const currentDossier = profile.dossier || [];
              const entryIndex = currentDossier.findIndex(d => d.title.toLowerCase() === args.title.toLowerCase());
              
              const newEntry: DossierEntry = {
                  id: entryIndex >= 0 ? currentDossier[entryIndex].id : Date.now().toString(),
                  title: args.title,
                  type: args.type as any,
                  content: args.content,
                  data: args.chart_data,
                  // New Leveling Fields
                  level: args.level,
                  currentProgress: args.current_progress,
                  maxProgress: args.max_progress,
                  progressLabel: args.progress_label
              };

              let updatedDossier;
              if (entryIndex >= 0) {
                  // Update existing
                  updatedDossier = [...currentDossier];
                  updatedDossier[entryIndex] = newEntry;
              } else {
                  // Add new
                  updatedDossier = [...currentDossier, newEntry];
              }
              onUpdateProfile({ dossier: updatedDossier });
          }

          // --- UPDATE QUEST LOGIC ---
          if (action.name === 'update_quest') {
              const qId = args.identifier;
              let targetQuest = quests.find(q => q.id === qId);
              
              // Fallback: Try exact title match if ID not found
              if (!targetQuest) {
                  targetQuest = quests.find(q => q.title.toLowerCase() === qId.toLowerCase());
              }

              if (targetQuest) {
                  const updates: Partial<Quest> = {};
                  const timeModeMap: Record<string, any> = { "Keine": 'NONE', "Deadline": 'DEADLINE', "Termin": 'SCHEDULED', "Zeitraum": 'PERIOD' };
                  const intervalMap: Record<string, any> = { "Täglich": 'DAILY', "Wöchentlich": 'WEEKLY', "Intervall": 'INTERVAL' };
                  
                  if (args.title) updates.title = args.title;
                  if (args.description) updates.description = args.description;
                  if (args.difficulty) updates.difficulty = args.difficulty;
                  if (args.status) {
                      const statusMap: Record<string, QuestStatus> = {
                          "Not started": 'NOT_STARTED', "On hold": 'ON_HOLD', "In process": 'IN_PROCESS',
                          "High priority": 'HIGH_PRIORITY', "Archived": 'ARCHIVED', "Cancelled": 'CANCELLED',
                          "Failed": 'FAILED', "Done": 'DONE'
                      };
                      updates.status = statusMap[args.status];
                  }

                  // Time Config Update
                  if (args.time_mode || args.start_date || args.due_date || args.duration_minutes) {
                      const currentTC = targetQuest.timeConfig || { mode: 'NONE' };
                      updates.timeConfig = {
                          mode: args.time_mode ? timeModeMap[args.time_mode] : currentTC.mode,
                          startDate: args.start_date ? parseAiDate(args.start_date) : currentTC.startDate,
                          dueDate: args.due_date ? parseAiDate(args.due_date) : currentTC.dueDate,
                          duration: args.duration_minutes || currentTC.duration
                      };
                      // Legacy sync
                      updates.deadline = updates.timeConfig.dueDate;
                  }

                  // Recurrence Update
                  if (args.recurrence_active !== undefined) {
                      const currentRC = targetQuest.recurringConfig || { enabled: false, intervalType: 'DAILY' };
                      updates.recurringConfig = {
                          ...currentRC,
                          enabled: args.recurrence_active,
                          intervalType: args.recurrence_interval ? intervalMap[args.recurrence_interval] : currentRC.intervalType
                      };
                  }

                  onUpdateQuest(targetQuest.id, updates);
              }
          }

          // --- DELETE LOGIC ---
          if (action.name === 'delete_element') {
              const type = args.type;
              const id = args.identifier;
              
              if (type === 'QUEST') {
                  const q = quests.find(q => q.id === id || q.title.toLowerCase() === id.toLowerCase());
                  if (q) onDeleteQuest(q.id);
              } else if (type === 'CLASS') {
                  const c = classes.find(c => c.id === id || c.title.toLowerCase() === id.toLowerCase());
                  if (c) onDeleteClass(c.id);
              } else if (type === 'SUBCLASS' && args.parent_id) {
                  const parent = classes.find(c => c.id === args.parent_id);
                  if (parent) {
                      const sub = parent.subClasses?.find(s => s.id === id || s.title.toLowerCase() === id.toLowerCase());
                      if (sub) onDeleteSubClass(parent.id, sub.id);
                  }
              }
          }

          if (action.name === 'create_quest') {
              const statusMap: Record<string, QuestStatus> = {
                  "Not started": 'NOT_STARTED', "On hold": 'ON_HOLD', "In process": 'IN_PROCESS',
                  "High priority": 'HIGH_PRIORITY', "Archived": 'ARCHIVED', "Cancelled": 'CANCELLED',
                  "Failed": 'FAILED', "Done": 'DONE'
              };
              
              const timeModeMap: Record<string, any> = {
                  "Keine": 'NONE', "Deadline": 'DEADLINE', "Termin": 'SCHEDULED', "Zeitraum": 'PERIOD'
              };

              const intervalMap: Record<string, any> = {
                  "Täglich": 'DAILY', "Wöchentlich": 'WEEKLY', "Intervall": 'INTERVAL'
              };
              
              const skipMap: Record<string, number> = {
                  "So": 0, "Mo": 1, "Di": 2, "Mi": 3, "Do": 4, "Fr": 5, "Sa": 6
              };

              // Map classes
              const relatedClassIds: string[] = [];
              if (args.main_classes) {
                  args.main_classes.forEach((name: string) => {
                      // Check existing classes
                      const found = classes.find(c => c.title.toLowerCase() === name.toLowerCase());
                      if (found) {
                          relatedClassIds.push(found.id);
                      } else {
                          // Check just-created classes
                          const tempId = tempClassMap[name.toLowerCase()];
                          if (tempId) relatedClassIds.push(tempId);
                      }
                  });
              }

              // Map subclasses (needs ID lookups)
              const relatedSubClassIds: string[] = [];
              if (args.sub_classes) {
                  args.sub_classes.forEach((name: string) => {
                      // Search all classes for this subclass
                      classes.forEach(c => {
                          const sub = c.subClasses?.find(s => s.title.toLowerCase() === name.toLowerCase());
                          if (sub) relatedSubClassIds.push(sub.id);
                      });
                  });
              }

              const newQ: Quest = {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  title: args.title || 'New Quest',
                  description: args.description || '',
                  difficulty: (args.difficulty as Difficulty) || Difficulty.NORMAL,
                  type: (args.quest_type as any) || 'SUDDEN',
                  status: statusMap[args.status] || 'NOT_STARTED',
                  
                  isCompleted: statusMap[args.status] === 'DONE',
                  failed: statusMap[args.status] === 'FAILED',
                  expReward: 50, // Defaults, will be recalculated
                  goldReward: 20,
                  
                  // Subtasks
                  subtasks: args.subtasks?.map((t: string) => ({ id: Math.random().toString(36), text: t, done: false })),

                  // Time Config
                  timeConfig: {
                      mode: timeModeMap[args.time_mode] || 'NONE',
                      startDate: parseAiDate(args.start_date),
                      dueDate: parseAiDate(args.due_date),
                      duration: args.duration_minutes
                  },
                  deadline: parseAiDate(args.due_date), // Legacy sync

                  // Recurrence
                  recurringConfig: {
                      enabled: args.recurrence_active || false,
                      intervalType: intervalMap[args.recurrence_interval] || 'DAILY',
                      intervalValue: args.interval_days,
                      excludedDays: args.skip_days?.map((d: string) => skipMap[d])
                  },

                  // Custom Alarm
                  customNotificationConfig: {
                      enabled: args.alarm_active || false,
                      startWarningMinutes: args.warn_start_min,
                      endWarningMinutes: args.warn_end_min
                  },

                  relatedClassIds,
                  relatedSubClassIds
              };

              onAddQuest(newQ);
          }

          if (action.name === 'create_subclass') {
              let parentId = args.parent_class_id;
              
              // 1. Check if it's an existing ID
              let parent = classes.find(c => c.id === parentId);
              
              // 2. If not found by ID, check by Name in existing classes
              if (!parent && parentId) {
                  parent = classes.find(c => c.title.toLowerCase() === parentId.toLowerCase());
              }

              // 3. If still not found, check if it was JUST created in this batch
              if (!parent && parentId) {
                  const justCreatedId = tempClassMap[parentId.toLowerCase()];
                  if (justCreatedId) {
                       onAddSubClass(justCreatedId, args.title || 'New Sub');
                       return;
                  }
              }
              
              if (parent) {
                  onAddSubClass(parent.id, args.title || 'New Sub');
              } else {
                  console.warn("Parent class not found for subclass:", args.title);
              }
          }

          if (action.name === 'restructure_classes') {
              const newParentName = args.new_parent_class_name;
              
              let parentClass = classes.find(c => c.title.toLowerCase() === newParentName.toLowerCase());
              
              if (!parentClass) {
                  // Create new Parent
                  const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                  const newParent: PlayerClass = {
                      id: newId,
                      title: newParentName,
                      subtitle: 'Container',
                      level: 1, progress: 0, status: 'In progress', totalExp: 0, currentExp: 0,
                      expToNextLevel: getExpForLevel(1),
                      subClasses: []
                  };
                  onAddClass(newParent);
              }
          }

          if (action.name === 'create_black_market_item') {
               const cost = calculateItemCost(args.rank as Rank, args.item_type === 'Penalty' ? 'PENALTY' : 'REWARD', args.name);
               onAddShopItem({
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  name: args.name,
                  type: args.item_type === 'Penalty' ? 'PENALTY' : 'REWARD',
                  cost: cost,
                  rank: args.rank as Rank,
                  description: 'AI Generated',
                  purchased: false,
                  singleUse: args.frequency === 'Once'
              });
          }
      });
  };
  
  // Long Press Logic
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  // Touch Handling for Layout
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handlePressStart = () => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        setShowSettings(true);
        if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (!isLongPress.current) {
        setIsShopOpen(!isShopOpen);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
        if (!containerRef.current) return;
        const scrollTop = containerRef.current.scrollTop;
        const progress = Math.min(1, Math.max(0, scrollTop / 20));
        containerRef.current.style.setProperty('--scroll-p', progress.toString());
    };
    const ref = containerRef.current;
    ref?.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => ref?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isShopOpen) {
        if (containerRef.current) containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
        const timer = setTimeout(() => setLayoutShopOpen(true), 550);
        return () => clearTimeout(timer);
    } else {
        setLayoutShopOpen(false);
    }
  }, [isShopOpen]);

  // Touch handlers for Player Widget swipe interaction
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientY);
  const onTouchEnd = () => {
    if (!touchStart) return;
    if (touchEnd === null) {
        setActiveModal('PROFILE_VIEW');
        setTouchStart(null);
        return;
    }
    const distance = touchStart - touchEnd;
    if (distance > 50) setSections(prev => ({ ...prev, classes: false }));
    else if (distance < -50) setSections(prev => ({ ...prev, classes: true }));
    else if (Math.abs(distance) < 10) setActiveModal('PROFILE_VIEW');
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Helper Handlers
  const saveNewQuest = (q: Quest) => {
      onAddQuest({ 
          ...q, 
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9), 
          isCompleted: false, 
          failed: false 
      });
      setActiveModal('NONE');
  };

  const submitClass = () => {
      onAddClass({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: newClass.title, subtitle: newClass.subtitle,
          level: 1, progress: 0, status: 'In progress', totalExp: 0, currentExp: 0,
          expToNextLevel: getExpForLevel(1), icon: newClass.icon, subClasses: []
      });
      setActiveModal('NONE');
      setNewClass({ title: '', subtitle: '', icon: '' });
  };

  const submitSubClass = () => {
      if (selectedClassId && newSubClassTitle) {
          onAddSubClass(selectedClassId, newSubClassTitle);
          setNewSubClassTitle('');
          setActiveModal('NONE');
      }
  };

  const submitItem = () => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const calculatedCost = calculateItemCost(newItem.rank as Rank, newItem.type as any, id);

      onAddShopItem({
          id: id, 
          name: newItem.name, 
          cost: calculatedCost,
          rank: newItem.rank as Rank, 
          description: '',
          purchased: false,
          type: newItem.type as 'REWARD' | 'PENALTY',
          singleUse: newItem.singleUse,
          image: newItem.image
      });
      setActiveModal('NONE');
      setNewItem({ name: '', cost: '0', type: 'REWARD', rank: Rank.E, singleUse: false, image: '' });
  };

  const submitProfile = () => {
      onUpdateProfile(editProfile);
      setActiveModal('PROFILE_VIEW');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const compressed = await compressImage(file);
              setEditProfile(prev => ({ ...prev, avatar: compressed }));
          } catch(err) { console.error(err); }
      }
  };
  
  const handleEditCardAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const compressed = await compressImage(file);
            setEditProfile(prev => ({ ...prev, cardAvatar: compressed }));
        } catch(err) { console.error(err); }
    }
  };

  const handleCardAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const compressed = await compressImage(file);
            onUpdateProfile({ cardAvatar: compressed });
        } catch(err) { console.error(err); }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const compressed = await compressImage(file);
            setEditProfile(prev => ({ ...prev, banner: compressed }));
        } catch(err) { console.error(err); }
    }
  };

  const handleCardBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const compressed = await compressImage(file);
            setEditProfile(prev => ({ ...prev, cardBanner: compressed }));
        } catch(err) { console.error(err); }
    }
  };

  const handleClassImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const compressed = await compressImage(file);
            setNewClass(prev => ({ ...prev, icon: compressed }));
        } catch(err) { console.error(err); }
    }
  };

  const handleItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const compressed = await compressImage(file);
            setNewItem(prev => ({ ...prev, image: compressed }));
        } catch(err) { console.error(err); }
    }
  };

  // Class Manager Handler
  const openClassManager = (classId: string) => {
      setSelectedClassId(classId);
      setActiveModal('CLASS_MANAGE');
  }

  const openSubClassCreator = (classId: string) => {
      setSelectedClassId(classId);
      setActiveModal('SUBCLASS_CREATE');
  }

  const selectedClassForManage = classes.find(c => c.id === selectedClassId);

  return (
    <div 
        ref={containerRef}
        className="bg-background h-full text-main font-sans overflow-y-auto no-scrollbar relative perspective-1000 transition-colors duration-300"
        style={{ '--scroll-p': '0' } as React.CSSProperties}
    >
      
      <DashboardHeader 
         isShopOpen={isShopOpen} 
         profile={profile} 
         assets={assets} 
         onToggleShop={() => setIsShopOpen(!isShopOpen)}
         onPressStart={handlePressStart}
         onPressEnd={handlePressEnd}
      />

      <div className="relative min-h-screen">
        <div className={`w-full pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${isShopOpen ? 'h-20' : 'h-52'}`} />

        {/* --- MAIN DASHBOARD VIEW --- */}
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform will-change-transform ${isShopOpen ? 'translate-y-[120vh] opacity-0 blur-md pointer-events-none' : 'translate-y-0 opacity-100 blur-0 pointer-events-auto'} ${layoutShopOpen ? 'hidden' : 'block'}`}>
            <div className="min-h-[calc(100vh+6rem)]">
                
                {/* PLAYER WIDGET (Swipe Area) */}
                <div 
                    className="px-4 pb-2 transition-transform select-none touch-none"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <PlayerWidget 
                        profile={profile} 
                        assets={assets} 
                        onEdit={() => {
                            setEditProfile(profile);
                            setActiveModal('PROFILE_VIEW');
                        }}
                        onCardAvatarUpload={handleCardAvatarUpload}
                    />
                </div>

                {/* CLASSES WIDGET */}
                <ClassesWidget 
                    classes={classes} 
                    isOpen={sections.classes} 
                    onAddClass={() => setActiveModal('CLASS')} 
                    onAddSubClass={openSubClassCreator}
                    onManageClass={openClassManager}
                />

                {/* ACTIVE QUESTS WIDGET */}
                <ActiveQuestsWidget 
                    quests={quests} 
                    isOpen={sections.quests} 
                    onToggle={() => setSections(prev => ({ ...prev, quests: !prev.quests }))}
                    onAddQuest={() => {
                        setSelectedQuest({
                            id: 'new', title: '', difficulty: Difficulty.EASY, type: 'DAILY',
                            goldReward: 20, expReward: 50, isCompleted: false, failed: false, status: 'NOT_STARTED'
                        });
                        setActiveModal('QUEST_CREATE');
                    }}
                    onSelectQuest={(quest) => { setSelectedQuest(quest); setActiveModal('QUEST_VIEW'); }}
                    onUpdateQuest={onUpdateQuest}
                    onComplete={onCompleteQuest}
                    onFail={onFailQuest}
                    onCancel={onCancelQuest}
                />
            </div>
        </div>

        {/* --- BLACK MARKET SHOP VIEW --- */}
        <BlackMarketView 
            shopItems={shopItems} 
            isVisible={layoutShopOpen} 
            onBuyItem={onBuyItem} 
            onDeleteItem={onDeleteItem}
            onAddItem={(type) => { 
                setNewItem(prev => ({ ...prev, type: type })); 
                setActiveModal('ITEM'); 
            }}
            currentPenaltyPoints={profile.penaltyPoints || 0}
        />

        {/* --- SYSTEM TERMINAL --- */}
        <AiTerminal 
            isShopOpen={isShopOpen}
            aiInput={aiInput}
            setAiInput={setAiInput}
            handleAiSubmit={handleAiSubmit}
            isProcessingAi={isProcessingAi}
            mode={aiMode}
            setMode={setAiMode}
        />

      </div>

      {/* --- MODALS --- */}
      
      {activeModal === 'PROFILE_VIEW' && (
          <PlayerProfileView 
            profile={profile} classes={classes} shopItems={shopItems} quests={quests}
            onClose={() => setActiveModal('NONE')}
            assets={assets}
            onEdit={() => { 
                setEditProfile(profile);
                setActiveModal('PROFILE_EDIT');
            }}
          />
      )}

      {activeModal === 'QUEST_VIEW' && selectedQuest && (
          <QuestDetailView 
             quest={selectedQuest} onClose={() => setActiveModal('NONE')}
             onComplete={onCompleteQuest} onFail={onFailQuest} onDelete={onDeleteQuest} onCancel={onCancelQuest}
             onUpdateQuest={onUpdateQuest} assets={assets} classes={classes}
          />
      )}

      {activeModal === 'QUEST_CREATE' && selectedQuest && (
          <QuestDetailView 
             quest={selectedQuest} onClose={() => setActiveModal('NONE')}
             onComplete={onCompleteQuest} onFail={onFailQuest} onDelete={onDeleteQuest} onCancel={onCancelQuest}
             assets={assets} classes={classes} isCreating={true} onSave={saveNewQuest}
          />
      )}

      {/* Settings Modal */}
      {showSettings && (
          <SettingsModal 
            onClose={() => setShowSettings(false)}
            currentTheme={currentTheme}
            setTheme={setTheme}
            profile={profile}
            assets={assets}
            onUpdateProfile={onUpdateProfile}
            onAssetChange={handleAssetChange}
            onAssetUpload={handleAssetUpload}
          />
      )}

      {activeModal === 'PROFILE_EDIT' && (
        <HunterLicenseEdit 
            editProfile={editProfile} 
            setEditProfile={setEditProfile} 
            onSave={submitProfile}
            onAvatarUpload={handleAvatarUpload} 
            onBannerUpload={handleBannerUpload}
            onCardBannerUpload={handleCardBannerUpload} 
            onCardAvatarUpload={handleEditCardAvatarUpload}
            assets={assets}
            // Pass AI props down
            aiInput={aiInput}
            setAiInput={setAiInput}
            handleAiSubmit={handleAiSubmit}
            isProcessingAi={isProcessingAi}
            aiMode={aiMode}
            setAiMode={setAiMode}
        />
      )}

      {activeModal === 'CLASS' && (
          <Modal title="Add Class" onClose={() => setActiveModal('NONE')}>
              <InputField label="Name" value={newClass.title} onChange={(v: string) => setNewClass({...newClass, title: v})} />
              <InputField label="Sub" value={newClass.subtitle} onChange={(v: string) => setNewClass({...newClass, subtitle: v})} />
              <div className="mb-4">
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2 font-serif">Img</label>
                <div onClick={() => classImageInputRef.current?.click()} className="h-32 w-full bg-highlight border border-border border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all overflow-hidden relative group">
                    {newClass.icon ? <img src={newClass.icon} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-secondary group-hover:text-main"><ImageIcon size={32} className="mb-2" /><span className="text-xs font-bold font-serif">Select</span></div>}
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={24} /></div>
                </div>
                <input ref={classImageInputRef} type="file" className="hidden" accept="image/*" onChange={handleClassImageUpload} />
              </div>
              <button onClick={submitClass} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl mt-4 font-sans">Unlock</button>
          </Modal>
      )}

      {activeModal === 'SUBCLASS_CREATE' && (
          <Modal title="Add Sub" onClose={() => setActiveModal('NONE')}>
              <InputField label="Name" value={newSubClassTitle} onChange={setNewSubClassTitle} placeholder="e.g. Pyromancer" />
              <button onClick={submitSubClass} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mt-4 font-sans">Unlock</button>
          </Modal>
      )}

      {activeModal === 'CLASS_MANAGE' && selectedClassForManage && (
          <Modal title={`Manage ${selectedClassForManage.title}`} onClose={() => setActiveModal('NONE')}>
              <div className="space-y-4">
                  <div className="p-4 bg-highlight rounded-xl border border-border">
                      <div className="flex justify-between items-center">
                          <div>
                              <h4 className="font-bold text-main">{selectedClassForManage.title}</h4>
                              <p className="text-xs text-secondary">Main Class • Lvl {selectedClassForManage.level}</p>
                          </div>
                          <button 
                            onClick={() => { onDeleteClass(selectedClassForManage.id); setActiveModal('NONE'); }} 
                            className="text-red-500 bg-red-500/10 p-2 rounded-full hover:bg-red-500/20"
                          >
                              <Trash2 size={18} />
                          </button>
                      </div>
                  </div>

                  {selectedClassForManage.subClasses && selectedClassForManage.subClasses.length > 0 && (
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-secondary uppercase tracking-wider">Subclasses</label>
                          {selectedClassForManage.subClasses.map(sub => (
                              <div key={sub.id} className="p-3 bg-highlight/50 rounded-lg flex justify-between items-center border border-border">
                                  <div>
                                      <h5 className="font-medium text-sm text-main">{sub.title}</h5>
                                      <p className="text-[10px] text-secondary">Lvl {sub.level}</p>
                                  </div>
                                  <button 
                                    onClick={() => onDeleteSubClass(selectedClassForManage.id, sub.id)}
                                    className="text-secondary hover:text-red-500 p-1.5"
                                  >
                                      <Trash2 size={14} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </Modal>
      )}

      {activeModal === 'ITEM' && (
          <Modal title={newItem.type === 'REWARD' ? "Add Reward" : "Add Penalty"} onClose={() => setActiveModal('NONE')}>
              <InputField label="Name" value={newItem.name} onChange={(v: string) => setNewItem({...newItem, name: v})} />
              
              <div className="grid grid-cols-2 gap-4">
                 <SelectField 
                    label="Freq" 
                    value={newItem.singleUse ? 'ONCE' : 'MAIN'} 
                    onChange={(v: string) => setNewItem({...newItem, singleUse: v === 'ONCE'})} 
                    options={[
                        { value: 'MAIN', label: 'Multi' }, 
                        { value: 'ONCE', label: 'Once' }
                    ]} 
                 />
                 <SelectField label="Rank" value={newItem.rank} onChange={(v: string) => setNewItem({...newItem, rank: v as Rank})} options={[Rank.E, Rank.D, Rank.C, Rank.B, Rank.A, Rank.S, Rank.SS, Rank.SSS]} />
              </div>

              {/* Item Image Upload */}
              <div className="mb-4 mt-2">
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2 font-serif">Img (Opt)</label>
                <div onClick={() => itemImageInputRef.current?.click()} className="h-24 w-full bg-highlight border border-border border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all overflow-hidden relative group">
                    {newItem.image ? <img src={newItem.image} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-secondary group-hover:text-main"><ImageIcon size={24} className="mb-1" /><span className="text-[10px] font-bold font-serif">Select</span></div>}
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={24} /></div>
                </div>
                <input ref={itemImageInputRef} type="file" className="hidden" accept="image/*" onChange={handleItemImageUpload} />
              </div>

              {/* Cost Preview */}
              <div className="bg-highlight rounded-xl p-4 flex flex-col items-center justify-center border border-border mt-2">
                 <div className="flex items-center gap-2 text-xl font-mono font-bold justify-center">
                    <span>
                        {calculateItemCost(newItem.rank as Rank, newItem.type as any, newItem.name || 'preview').toLocaleString()} 
                        {newItem.type === 'REWARD' ? ' G' : ' pts'}
                    </span>
                 </div>
              </div>

              <button onClick={submitItem} className={`w-full font-bold py-3 rounded-xl mt-4 text-white font-sans ${newItem.type === 'REWARD' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  Add
              </button>
          </Modal>
      )}
    </div>
  );
};
