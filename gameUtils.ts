import { Difficulty, Rank, Quest } from './types';

export const LEVEL_EXP_BASE = 100;
export const LEVEL_EXP_MULTIPLIER = 1.2; 

export const getExpForLevel = (level: number): number => {
  return Math.floor(LEVEL_EXP_BASE * Math.pow(LEVEL_EXP_MULTIPLIER, level - 1));
};

export const getRankFromLevel = (level: number): Rank => {
  if (level < 10) return Rank.E;
  if (level < 20) return Rank.D;
  if (level < 40) return Rank.C;
  if (level < 60) return Rank.B;
  if (level < 80) return Rank.A;
  if (level < 90) return Rank.S;
  if (level < 100) return Rank.SS;
  return Rank.SSS;
};

export const getSeedFromId = (id: string | undefined | null) => {
  if (!id) return 0;
  
  // Hash-Funktion: Wandelt jeden String (auch Buchstaben) in eine einzigartige Zahl um
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Erzwingt 32-bit Integer
  }
  
  return Math.abs(hash);
};

export const calculateItemCost = (rank: Rank, type: 'REWARD' | 'PENALTY', seedId: string): number => {
  const seed = getSeedFromId(seedId);
  let base = 0;
  let variance = 0;

  switch (rank) {
    case Rank.E: 
      base = 150; 
      variance = 50; 
      break; 
    case Rank.D: 
      base = 350; 
      variance = 150; 
      break; 
    case Rank.C: 
      base = 667; 
      variance = 99; // 667 - 765
      break;
    case Rank.B: 
      base = 5689; 
      variance = 999; // 5689 - 6688
      break;
    case Rank.A: 
      base = 38155; 
      variance = 9999; // 38155 - 48154
      break;
    case Rank.S: 
      base = 157119; 
      variance = 49999; // 157119 - 207118
      break;
    case Rank.SS:
    case Rank.SSS: 
      base = 374779; 
      variance = 99999; // 374779 - 474778
      break;
  }

  const goldValue = base + (seed % (variance + 1));
  
  // Penalty items cost 75% of the calculated gold value
  return type === 'PENALTY' ? Math.floor(goldValue * 0.75) : goldValue;
};

export const calculateQuestRewards = (questId: string, difficulty: Difficulty) => {
  // Use the new hash function to create a deterministic seed from the full ID string
  const seed = getSeedFromId(questId);
  let exp = 0;
  let gold = 0;

  switch (difficulty) {
    case Difficulty.EASY:
      exp = (seed % 50) + 50; // 50-99 XP
      gold = (seed % 100) + 100; // 100-199 G
      break;
    case Difficulty.NORMAL:
      exp = (seed % 100) + 200; // 200-299 XP
      gold = (seed % 200) + 400; // 400-599 G
      break;
    case Difficulty.HARD:
      exp = (seed % 300) + 800; // 800-1099 XP
      gold = (seed % 1000) + 1500; // 1500-2499 G
      break;
    case Difficulty.EXTREME:
      exp = (seed % 1000) + 3000; // 3000-3999 XP
      gold = (seed % 5000) + 5000; // 5000-9999 G
      break;
    case Difficulty.ABSURD:
      exp = (seed % 5000) + 10000; // 10000-14999 XP
      gold = (seed % 20000) + 20000; // 20000-39999 G
      break;
  }

  // Penalty Logic: 0.9x of Gold Reward
  const penalty = Math.floor(gold * 0.9);

  return { exp, gold, penalty };
};

// Returns the full theme object for the UI
export const getRankTheme = (rank: Rank) => {
  switch (rank) {
    case Rank.E: // Bronze/Common
      return {
        base: '#a1a1aa',   // Zinc 400
        dark: '#52525b',   // Zinc 600
        glow: '#e4e4e7',   // Zinc 200 (Pastel)
        text: '#ffffff'
      };
    case Rank.D: // Silver/Uncommon (Greenish/Teal tone in some games, or Bronze -> Silver)
      return {
        base: '#cd7f32',   // Bronze
        dark: '#78350f',   // Amber 900
        glow: '#fdba74',   // Orange 300
        text: '#ffffff'
      };
    case Rank.C: // Gold/Rare (Silver actually)
      return {
        base: '#94a3b8',   // Slate 400 (Silver)
        dark: '#475569',   // Slate 600
        glow: '#cbd5e1',   // Slate 300
        text: '#ffffff'
      };
    case Rank.B: // Platinum/Epic (Gold)
      return {
        base: '#facc15',   // Yellow 400
        dark: '#854d0e',   // Yellow 800
        glow: '#fef08a',   // Yellow 200
        text: '#000000'    // Black text for readability
      };
    case Rank.A: // Diamond/Legendary (Cyan/Diamond)
      return {
        base: '#22d3ee',   // Cyan 400
        dark: '#0e7490',   // Cyan 700
        glow: '#a5f3fc',   // Cyan 200
        text: '#000000'
      };
    case Rank.S: // Heroic (Purple)
      return {
        base: '#c084fc',   // Purple 400
        dark: '#7e22ce',   // Purple 700
        glow: '#e9d5ff',   // Purple 200
        text: '#ffffff'
      };
    case Rank.SS: // Master (Red)
      return {
        base: '#f87171',   // Red 400
        dark: '#b91c1c',   // Red 700
        glow: '#fecaca',   // Red 200
        text: '#ffffff'
      };
    case Rank.SSS: // Grandmaster (Radiant/Prismatic Gold)
      return {
        base: '#fbbf24',   // Amber 400
        dark: '#b45309',   // Amber 700
        glow: '#fffbeb',   // Amber 50 (Very light pastel)
        text: '#000000'    // Black text mandatory
      };
    default:
      return { base: '#ffffff', dark: '#000000', glow: '#ffffff', text: '#000000' };
  }
};

// Legacy support if needed, just returns base
export const getRankHex = (rank: Rank): string => {
  return getRankTheme(rank).base;
};

export const getColorForRank = (rank: Rank): string => {
  // We handle specific styles in the component now via style={{}}
  return ''; 
};

export const getColorForDifficulty = (diff: Difficulty): string => {
   switch (diff) {
    case Difficulty.EASY: return 'border-l-4 border-l-green-500';
    case Difficulty.NORMAL: return 'border-l-4 border-l-blue-500';
    case Difficulty.HARD: return 'border-l-4 border-l-purple-500';
    case Difficulty.EXTREME: return 'border-l-4 border-l-red-500';
    case Difficulty.ABSURD: return 'border-l-4 border-l-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
  }
}