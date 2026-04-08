import { Rank, AppTheme } from './types';

// Constants
export const BASE_EXP = 100;
export const EXP_MULTIPLIER = 1.2;

export const calculateExpForLevel = (level: number) => Math.floor(BASE_EXP * Math.pow(EXP_MULTIPLIER, level - 1));

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

// RPG Color Hierarchy: Grey -> Green -> Blue -> Purple -> Gold
export const getRankTheme = (rank: Rank) => {
  switch (rank) {
    case Rank.E: // 1 Star - Grey
      return { base: "#9ca3af", dark: "#4b5563", glow: "#e5e7eb", text: "#ffffff" };
    case Rank.D: // 2 Star - Green
      return { base: "#4ade80", dark: "#166534", glow: "#bbf7d0", text: "#ffffff" };
    case Rank.C: // 3 Star - Blue
      return { base: "#60a5fa", dark: "#1e40af", glow: "#dbeafe", text: "#ffffff" };
    case Rank.B: // 4 Star - Purple
      return { base: "#c084fc", dark: "#6b21a8", glow: "#f3e8ff", text: "#ffffff" };
    case Rank.A: // 5 Star - Gold
    case Rank.S: 
    case Rank.SS: 
    case Rank.SSS: 
      return { base: "#fbbf24", dark: "#b45309", glow: "#fef3c7", text: "#000000" };
    default: return { base: "#ffffff", dark: "#000000", glow: "#ffffff", text: "#000000" };
  }
};

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Use createObjectURL for better memory management than FileReader
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectUrl;

    img.onload = () => {
      // Release memory immediately
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1024; // Reduced to 1024 to save storage space
      const MAX_HEIGHT = 1024;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          // Use JPEG 0.7 to significantly reduce base64 string size compared to PNG
          resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
          reject(new Error("Canvas context failed"));
      }
    };
    
    img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
    };
  });
};

export const DEFAULT_ASSETS = {
  bannerLight: "https://img.freepik.com/premium-photo/light-red-faded-texture-background-banner-design-ar-52-v-52-job-id-d3b453a4212549bfb9ee4b530bdf3147_941600-57191.jpg",
  bannerDark: "https://static.vecteezy.com/system/resources/previews/004/560/291/non_2x/sale-banner-poster-flyer-design-with-pattern-on-dark-red-pattern-and-grunge-texture-background-free-vector.jpg",
  defaultAvatar: "https://images6.alphacoders.com/134/1346363.png"
};

export const applyTheme = (theme: AppTheme) => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark', 'oled');
  
  let appliedTheme = theme;
  if (theme === AppTheme.AUTO) {
    appliedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? AppTheme.DARK : AppTheme.LIGHT;
  }

  if (appliedTheme === AppTheme.OLED) {
    root.classList.add('dark', 'oled');
  } else {
    root.classList.add(appliedTheme);
  }
};