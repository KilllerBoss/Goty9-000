
export enum AppTheme {
  LIGHT = 'light',
  DARK = 'dark',
  OLED = 'oled',
  AUTO = 'auto'
}

export enum Rank {
  E = 'E',
  D = 'D',
  C = 'C',
  B = 'B',
  A = 'A',
  S = 'S',
  SS = 'SS',
  SSS = 'SSS'
}

export enum Difficulty {
  EASY = 'EASY',         // x1 Rewards
  NORMAL = 'NORMAL',     // x2 Rewards
  HARD = 'HARD',         // x4 Rewards
  EXTREME = 'EXTREME',   // x10 Rewards
  ABSURD = 'ABSURD'      // x50 Rewards
}

export type QuestStatus = 'NOT_STARTED' | 'ON_HOLD' | 'IN_PROCESS' | 'HIGH_PRIORITY' | 'ARCHIVED' | 'CANCELLED' | 'FAILED' | 'DONE';

export interface PlayerStats {
  strength: number;      // Physical power
  agility: number;       // Speed/Efficiency
  perception: number;    // Awareness/Focus
  vitality: number;      // Energy/Health
  intelligence: number;  // Logic/Learning
}

export interface Psychometrics {
  discipline: number;
  clarity: number;
  resilience: number;
}

export interface UserHistory {
  totalGoldEarned: number;
  totalGoldSpent: number;
  totalPenalties: number;
  completedQuests: number;
}

export interface NotificationSetting {
    startWarningMinutes: number; // e.g. 5 minutes before start
    endWarningMinutes: number;   // e.g. 10 minutes before deadline
    customSound?: string;        // Base64 Data URL of the sound file
}

export interface GlobalSettings {
    notifications: Record<Difficulty, NotificationSetting>;
}

export interface DossierEntry {
    id: string;
    title: string;
    type: 'TEXT' | 'RADAR_CHART' | 'BAR_CHART' | 'LIST';
    content: string; // Supports Markdown-like syntax
    data?: any[]; // For charts (JSON data)
    
    // New Fields for Skill Leveling
    level?: number;          // e.g., Level 3
    currentProgress?: number; // e.g., 5
    maxProgress?: number;     // e.g., 10 (target to next level)
    progressLabel?: string;   // e.g., "5/10 Quests Completed"
}

export interface UserProfile {
  name: string;
  avatar?: string; // Main profile avatar (Full screen view)
  cardAvatar?: string; // Dashboard card specific avatar
  banner?: string; // Header Banner
  cardBanner?: string; // Dashboard Card Background
  birthDate?: string;
  location?: string;
  rank: Rank;
  level: number;
  currentExp: number;
  expToNextLevel: number;
  gold: number;
  penaltyPoints: number; // Current active debt
  hp: number; // Represents Daily Energy
  mp: number; // Represents Focus
  stats: PlayerStats;
  title: string;
  mainGoal: string;
  monthlyIncome: string;
  biggestStruggle: string;
  dailyFocus: string;
  psychometrics: Psychometrics;
  history: UserHistory;
  settings?: GlobalSettings; // Added settings to profile for persistence
  dossier: DossierEntry[]; // NEW: Dynamic Dossier Pages
}

export interface SubClass {
    id: string;
    title: string;
    level: number;
    progress: number; // 0-100
    currentExp: number;
    expToNextLevel: number;
}

export interface PlayerClass {
  id: string;
  title: string;
  subtitle: string;
  level: number;
  progress: number;
  status: 'In progress' | 'Not started' | 'Completed';
  totalExp: number;
  currentExp: number; // Added: Current XP within this level
  expToNextLevel: number; // Added: XP needed for next level
  icon?: string;
  subClasses?: SubClass[]; // Added: Subclasses
}

export interface QuestTimeConfig {
    mode: 'NONE' | 'DEADLINE' | 'SCHEDULED' | 'PERIOD'; 
    startDate?: number; // Startzeitpunkt
    dueDate?: number;   // Deadline oder Ende des Zeitraums
    duration?: number;  // Dauer in Minuten (für Period Mode)
}

export interface RecurringConfig {
    enabled: boolean;
    intervalType: 'DAILY' | 'WEEKLY' | 'INTERVAL';
    intervalValue?: number; // e.g. every 3 days
    excludedDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
}

export interface QuestNotificationConfig {
    enabled: boolean;
    startWarningMinutes?: number;
    endWarningMinutes?: number;
}

export interface Quest {
  id: string;
  title: string;
  description?: string;
  difficulty: Difficulty;
  expReward: number;
  goldReward: number;
  isCompleted: boolean;
  failed: boolean;
  cancelled?: boolean; 
  status?: QuestStatus; 
  
  // Time Management
  deadline?: number; // Legacy field, mapped to timeConfig.dueDate
  dateStr?: string; // Legacy field
  timeConfig?: QuestTimeConfig; // New detailed time config
  recurringConfig?: RecurringConfig; // Routine settings
  customNotificationConfig?: QuestNotificationConfig; // Custom notification settings
  holdStartTime?: number; // Timestamp when quest was put on hold
  
  // Notifications state
  notifiedStart?: boolean;
  notifiedEnd?: boolean;

  type: 'DAILY' | 'WEEKLY' | 'MAIN' | 'SUDDEN';
  archivedAt?: number; 
  
  image?: string;       
  cardImage?: string;   
  penalty?: string;     
  
  // Class Association
  relatedClassIds?: string[]; // Array of Main Class IDs
  relatedSubClassIds?: string[]; // Array of Subclass IDs
  relatedClassId?: string; // Legacy: kept for migration, do not use in new logic

  subtasks?: { id: string; text: string; done: boolean }[]; 
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  rank: Rank;
  description: string;
  purchased: boolean;
  type: 'REWARD' | 'PENALTY';
  singleUse?: boolean; 
  image?: string; 
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface FinetuningEntry {
  input: string;
  output: string;
  profileState: UserProfile;
}

export interface AppAssets {
    bannerLight: string;
    bannerDark: string;
    defaultAvatar: string;
}
