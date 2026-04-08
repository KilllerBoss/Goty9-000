
import { Rank, Difficulty, UserProfile, PlayerClass, ShopItem, QuestStatus } from './types';

export const SYSTEM_INSTRUCTION = `
Du bist das "SYSTEM" (Hunter OS v2.2). 
Deine Funktion: Verwaltung der Realität des Users als RPG.

// --- BREVITY PROTOCOL (HIGHEST PRIORITY) ---
1. FASSE DICH KURZ. Keine Romane.
2. NAMEN: Extrem kurz (Max 1-3 Wörter).
3. DOKUMENTE: Nur Stichpunkte oder extrem knappe Zusammenfassungen. Nur das Wesentliche.
4. TEXT: Telegramm-Stil. Effizient.

// --- KERN-DIREKTIVE: DOSSIER MANAGEMENT ---
Du führst eine "SECRET DOSSIER" Akte.
Wenn der User über ein neues Thema spricht (z.B. "Arbeit", "Beziehung"), erstelle/update eine Seite.

AKTEN-TYPEN:
- 'TEXT': Knappe Logs, Bullet Points. KEIN Fließtext.
- 'RADAR_CHART': Skill-Analysen.
- 'BAR_CHART': Fortschritts-Tracking.

// --- OPERATIVE DIREKTIVEN ---
1. TONALITÄT:
   - Kalt, effizient, autoritär (CLI).
   - Analytisch, präzise (COLLECTOR).
   
2. KLASSEN/QUESTS:
   - Titel müssen kurz sein ("Training" statt "Tägliches Fitness Training").
   - Beschreibungen weglassen wenn möglich.

// --- OUTPUT FORMAT ---
[SYSTEM] > [Short Msg]
`;

export const REFLECTION_QUESTIONS = [
  "Was ist deine größte Angst, die dich zurückhält?",
  "Wenn du heute sterben würdest, was würdest du bereuen?",
  "Wofür verschwendest du am meisten Energie?",
  "Was würdest du tun, wenn du wüsstest, dass du nicht scheitern kannst?",
  "Wer musst du werden, um deine Ziele zu erreichen?"
];

export const STATUS_CONFIG: Record<QuestStatus, { label: string, color: string, dot: string }> = {
  'NOT_STARTED': { label: 'Not started', color: 'bg-gray-200 dark:bg-gray-800 text-gray-500', dot: 'bg-gray-400' },
  'ON_HOLD': { label: 'On hold', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-500' },
  'IN_PROCESS': { label: 'In process', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  'HIGH_PRIORITY': { label: 'High priority', color: 'bg-red-500/10 text-red-600 dark:text-red-400 shadow-[0_0_10px_rgba(220,38,38,0.2)]', dot: 'bg-red-500 animate-pulse' },
  'ARCHIVED': { label: 'Archived', color: 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400', dot: 'bg-stone-500' },
  'CANCELLED': { label: 'Cancelled', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400', dot: 'bg-pink-500' },
  'FAILED': { label: 'Failed', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' },
  'DONE': { label: 'Done', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400', dot: 'bg-green-500' }
};

export const INITIAL_PROFILE: UserProfile = {
  name: 'Unknown',
  avatar: 'https://images6.alphacoders.com/134/1346363.png',
  cardAvatar: 'https://images6.alphacoders.com/134/1346363.png',
  banner: '',
  cardBanner: '',
  birthDate: '',
  location: '',
  rank: Rank.E,
  level: 1,
  currentExp: 0,
  expToNextLevel: 100,
  gold: 0,
  penaltyPoints: 0,
  hp: 100,
  mp: 100,
  title: 'Novice',
  stats: {
    strength: 1,
    agility: 1,
    vitality: 1,
    perception: 1,
    intelligence: 1
  },
  mainGoal: '',
  monthlyIncome: '',
  biggestStruggle: '',
  dailyFocus: '',
  psychometrics: {
    discipline: 0,
    clarity: 0,
    resilience: 0
  },
  history: {
    totalGoldEarned: 0,
    totalGoldSpent: 0,
    totalPenalties: 0,
    completedQuests: 0
  },
  dossier: [] // Starts empty, populated by AI
};

export const MOCK_CLASSES: PlayerClass[] = [];

export const MOCK_SHOP_ITEMS: ShopItem[] = [];

export const MOCK_QUESTS = [];
