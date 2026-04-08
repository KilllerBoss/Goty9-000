import React from 'react';
import { Sun, Moon, Smartphone, Monitor } from 'lucide-react';
import { AppTheme } from '../types';

interface ThemeSwitcherProps {
  currentTheme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, setTheme }) => {
  return (
    <div className="flex bg-gray-200 dark:bg-gray-800 rounded-full p-1 shadow-inner relative overflow-hidden">
      <button
        onClick={() => setTheme(AppTheme.LIGHT)}
        className={`p-2 rounded-full transition-all duration-300 ${currentTheme === AppTheme.LIGHT ? 'bg-white text-black shadow-md' : 'text-gray-500'}`}
      >
        <Sun size={18} />
      </button>
      <button
        onClick={() => setTheme(AppTheme.DARK)}
        className={`p-2 rounded-full transition-all duration-300 ${currentTheme === AppTheme.DARK ? 'bg-gray-700 text-white shadow-md' : 'text-gray-500'}`}
      >
        <Moon size={18} />
      </button>
      <button
        onClick={() => setTheme(AppTheme.OLED)}
        className={`p-2 rounded-full transition-all duration-300 ${currentTheme === AppTheme.OLED ? 'bg-black text-white shadow-md border border-gray-800' : 'text-gray-500'}`}
        title="OLED Mode"
      >
        <Smartphone size={18} />
      </button>
      <button
        onClick={() => setTheme(AppTheme.AUTO)}
        className={`p-2 rounded-full transition-all duration-300 ${currentTheme === AppTheme.AUTO ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500'}`}
      >
        <Monitor size={18} />
      </button>
    </div>
  );
};