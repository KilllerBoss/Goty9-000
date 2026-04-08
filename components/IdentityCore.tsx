import React from 'react';
import { UserProfile, FinetuningEntry } from '../types';
import { X, Activity } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface IdentityCoreProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  dataset: FinetuningEntry[];
}

export const IdentityCore: React.FC<IdentityCoreProps> = ({ isOpen, onClose, profile, dataset }) => {
  if (!isOpen) return null;

  const chartData = [
    { subject: 'Disc', A: profile.psychometrics.discipline, fullMark: 100 },
    { subject: 'Clar', A: profile.psychometrics.clarity, fullMark: 100 },
    { subject: 'Res', A: profile.psychometrics.resilience, fullMark: 100 },
  ];

  const DetailItem = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-surface-variant p-4 rounded-3xl flex flex-col gap-1">
      <span className="text-xs text-secondary uppercase tracking-wider font-semibold">{label}</span>
      <span className="text-lg text-white font-medium truncate">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="w-full h-[90vh] bg-surface rounded-t-4xl overflow-hidden flex flex-col shadow-2xl animate-slide-up relative z-10">
        
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
           <div className="w-12 h-1.5 bg-surface-variant rounded-full opacity-50"></div>
        </div>

        <div className="px-6 py-4 flex justify-between items-center">
           <h2 className="text-2xl font-bold text-white">Identity Core</h2>
           <button onClick={onClose} className="p-2 bg-surface-variant rounded-full text-secondary hover:bg-surface-variant/80">
             <X size={20} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-12 space-y-6">
          
          {/* Main Chart */}
          <div className="bg-black rounded-3xl p-6 flex flex-col items-center">
             <h3 className="text-secondary text-sm font-semibold mb-4">Psychometrics</h3>
             <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#999', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Stats"
                    dataKey="A"
                    stroke="#3E91FF"
                    strokeWidth={3}
                    fill="#3E91FF"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <DetailItem label="Current Focus" value={profile.dailyFocus !== '---' ? profile.dailyFocus : "Not Set"} />
             <DetailItem label="Income Goal" value={profile.monthlyIncome} />
             <DetailItem label="Codename" value={profile.name} />
             <DetailItem label="Main Goal" value={profile.mainGoal} />
          </div>

          <div className="bg-surface-variant rounded-3xl p-5">
             <div className="flex items-center gap-3 mb-2">
               <Activity size={20} className="text-primary" />
               <h3 className="font-bold text-white">Physical Stats</h3>
             </div>
             <div className="space-y-3 mt-4">
                {Object.entries(profile.stats).map(([key, val]) => (
                   <div key={key} className="flex justify-between items-center">
                      <span className="capitalize text-secondary text-sm">{key}</span>
                      <div className="flex-1 mx-4 h-2 bg-black/30 rounded-full overflow-hidden">
                         <div className="h-full bg-primary rounded-full" style={{width: `${((val as number) / 100) * 100}%`}}></div>
                      </div>
                      <span className="font-mono text-white text-sm">{val}</span>
                   </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};