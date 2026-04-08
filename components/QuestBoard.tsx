import React from 'react';
import { Quest, Difficulty } from '../types';
import { getColorForDifficulty } from '../gameUtils';
import { Check, X, Clock, Calendar } from 'lucide-react';

interface QuestBoardProps {
  quests: Quest[];
  onComplete: (id: string) => void;
  onFail: (id: string) => void;
}

export const QuestBoard: React.FC<QuestBoardProps> = ({ quests, onComplete, onFail }) => {
  const activeQuests = quests.filter(q => !q.isCompleted && !q.failed);

  return (
    <div className="flex flex-col h-full bg-black rounded-t-4xl overflow-hidden mt-2 border-t border-white/5">
      <div className="p-6 pb-24 space-y-4 overflow-y-auto">
        
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">Active Missions</h2>
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
            {activeQuests.length} Pending
          </span>
        </div>

        {activeQuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
             <Check size={48} className="text-secondary mb-4" />
             <p className="text-secondary font-medium">All clear for now</p>
          </div>
        ) : (
          activeQuests.map(quest => (
            <div 
                key={quest.id} 
                className={`bg-surface p-5 rounded-3xl relative overflow-hidden transition-transform active:scale-[0.98] ${getColorForDifficulty(quest.difficulty)}`}
            >
              <div className="flex justify-between items-start mb-3">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                            {quest.type}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-variant text-white`}>
                           {quest.difficulty}
                        </span>
                    </div>
                    <h3 className="font-bold text-xl text-white leading-tight">{quest.title}</h3>
                 </div>
              </div>

              {quest.description && (
                  <p className="text-secondary text-sm mb-5 leading-relaxed">{quest.description}</p>
              )}

              <div className="flex items-center justify-between mt-2">
                 <div className="flex flex-col">
                    <span className="text-xs text-secondary">Reward</span>
                    <div className="flex gap-3 text-sm font-semibold">
                        <span className="text-primary">{quest.expReward} XP</span>
                        <span className="text-warning">{quest.goldReward} G</span>
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
                    <button 
                        onClick={() => onFail(quest.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-variant text-secondary hover:bg-error/20 hover:text-error transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <button 
                        onClick={() => onComplete(quest.id)}
                        className="h-10 px-6 rounded-full bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/30 active:opacity-80 transition-all flex items-center gap-2"
                    >
                        <Check size={16} strokeWidth={3} />
                        Done
                    </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};