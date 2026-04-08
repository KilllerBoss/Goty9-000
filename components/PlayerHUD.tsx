import React from 'react';
import { UserProfile, Rank } from '../types';
import { getColorForRank } from '../gameUtils';
import { Coins, Trophy } from 'lucide-react';

interface PlayerHUDProps {
  profile: UserProfile;
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({ profile }) => {
  const expPercentage = Math.min(100, (profile.currentExp / profile.expToNextLevel) * 100);

  return (
    <div className="pt-8 pb-6 px-6 bg-black flex flex-col gap-4">
      
      {/* Top Row: Name and Rank */}
      <div className="flex justify-between items-start">
        <div>
           <h2 className="text-secondary text-sm font-semibold uppercase tracking-wider mb-1">Character Profile</h2>
           <h1 className="text-4xl font-bold text-white tracking-tight">{profile.name}</h1>
           <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getColorForRank(profile.rank)}`}>
                 Rank {profile.rank}
              </span>
              <span className="text-sm text-secondary font-medium">{profile.title}</span>
           </div>
        </div>
        
        <div className="flex flex-col items-end">
           <div className="flex items-center gap-1.5 bg-surface-variant px-3 py-1.5 rounded-full">
             <Coins size={14} className="text-warning" fill="currentColor" />
             <span className="font-bold text-white text-sm">{profile.gold.toLocaleString()}</span>
           </div>
           <div className="mt-2 text-right">
             <span className="text-3xl font-light text-primary">{profile.level}</span>
             <span className="text-xs text-secondary ml-1 uppercase">LVL</span>
           </div>
        </div>
      </div>

      {/* Progress Bars - One UI Style (Pill shaped, soft) */}
      <div className="flex flex-col gap-3 mt-2">
        {/* EXP Bar */}
        <div className="flex flex-col gap-1">
           <div className="flex justify-between text-xs font-medium text-secondary">
              <span>Experience</span>
              <span>{expPercentage.toFixed(0)}%</span>
           </div>
           <div className="h-3 w-full bg-surface-variant rounded-full overflow-hidden">
             <div 
               className="h-full bg-primary rounded-full transition-all duration-700" 
               style={{ width: `${expPercentage}%` }}
             />
           </div>
        </div>

        {/* HP/MP - Smaller visual priority */}
        <div className="flex gap-3">
           <div className="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden">
             <div className="h-full bg-error w-[80%] rounded-full" />
           </div>
           <div className="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden">
             <div className="h-full bg-blue-400 w-[60%] rounded-full" />
           </div>
        </div>
      </div>

    </div>
  );
};