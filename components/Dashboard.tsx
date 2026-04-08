import React from 'react';
import { UserProfile, FinetuningEntry } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Download, Database, ShieldAlert, Cpu } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
  dataset: FinetuningEntry[];
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, dataset }) => {
  
  const chartData = [
    { name: 'Disziplin', value: profile.psychometrics.discipline, color: '#ef4444' },
    { name: 'Klarheit', value: profile.psychometrics.clarity, color: '#3b82f6' },
    { name: 'Resilienz', value: profile.psychometrics.resilience, color: '#10b981' },
  ];

  const handleDownloadDataset = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataset, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "focus_2026_finetuning_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const DataField = ({ label, value, placeholder }: { label: string, value: string, placeholder: string }) => (
    <div className="bg-white/5 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-widest opacity-50 mb-1">{label}</p>
      {value && value !== '---' ? (
        <p className="font-bold text-lg md:text-xl truncate text-blue-600 dark:text-blue-400">{value}</p>
      ) : (
        <p className="font-mono text-gray-400 text-lg flex items-center gap-2 animate-pulse">
          ---
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter">MISSION CONTROL</h1>
          <p className="text-xs font-mono text-green-500 flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            SYSTEM ONLINE
          </p>
        </div>
        <div className="text-right">
           <div className="text-xs opacity-50">DATA POINTS</div>
           <div className="text-2xl font-mono font-bold">{dataset.length}</div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Cpu size={80} />
          </div>
          <p className="text-xs font-mono opacity-60 mb-2">CURRENT FOCUS OBJECTIVE</p>
          <h2 className="text-2xl md:text-3xl font-bold max-w-[80%] leading-tight">
            {profile.dailyFocus !== '---' ? profile.dailyFocus : "DATA MISSING"}
          </h2>
          {profile.dailyFocus === '---' && (
            <p className="text-red-400 text-xs mt-2 font-mono flex items-center gap-1">
              <ShieldAlert size={12} />
              WARNUNG: Zielparameter nicht definiert. Neural Link nutzen.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DataField label="Codename" value={profile.name} placeholder="---" />
          <DataField label="Primärziel 2026" value={profile.mainGoal} placeholder="---" />
          <DataField label="Monatsumsatz" value={profile.monthlyIncome} placeholder="---" />
          <DataField label="Größtes Hindernis" value={profile.biggestStruggle} placeholder="---" />
        </div>
      </div>

      {/* Psychometrics Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <Database size={18} className="text-blue-500" />
          Psychometrische Analyse
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="name" type="category" width={80} tick={{fill: '#888', fontSize: 12}} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '8px' }} />
              <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-center opacity-50 mt-4 max-w-sm mx-auto">
          Werte sind unkalibriert. Interagiere mit CORE, um das Profil zu schärfen.
        </p>
      </div>

      {/* Dataset Actions */}
      <div className="bg-gray-100 dark:bg-gray-800/30 p-4 rounded-2xl flex items-center justify-between border border-gray-200 dark:border-gray-700">
        <div>
          <h4 className="font-bold text-sm">Finetuning Dataset</h4>
          <p className="text-xs opacity-60">Exportiere deine Daten für Training.</p>
        </div>
        <button 
          onClick={handleDownloadDataset}
          className="bg-black dark:bg-white text-white dark:text-black p-3 rounded-xl hover:scale-105 transition-transform"
        >
          <Download size={20} />
        </button>
      </div>
    </div>
  );
};