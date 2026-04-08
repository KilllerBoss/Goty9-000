import React from 'react';
import { Activity, X, Zap, Check, AlertTriangle, UserCog, ShieldPlus, ShoppingBag } from 'lucide-react';

interface ActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actions: any[]; // List of function calls
  reasoning?: string;
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({ 
  isOpen, onClose, onConfirm, actions, reasoning 
}) => {
  if (!isOpen) return null;

  const getActionStyle = (name: string) => {
    switch (name) {
      case 'update_user': return { icon: UserCog, color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10', label: 'PROFILE UPDATE' };
      case 'add_quest': return { icon: Zap, color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10', label: 'NEW QUEST' };
      case 'mod_class': return { icon: ShieldPlus, color: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/10', label: 'CLASS MOD' };
      case 'mod_shop': return { icon: ShoppingBag, color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', label: 'MARKET UPDATE' };
      default: return { icon: Activity, color: 'text-white', border: 'border-white/30', bg: 'bg-white/10', label: 'SYSTEM ACTION' };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in" 
        onClick={onClose}
      />

      {/* Main Card */}
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-black/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="relative w-2 h-2">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                    <div className="relative w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                <h3 className="font-mono text-sm font-bold text-red-500 tracking-widest">SYSTEM PROTOCOL</h3>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Reasoning / AI Thought */}
            {reasoning && (
                <div className="bg-white/5 border-l-2 border-white/20 p-3 rounded-r-lg">
                    <p className="text-white/70 font-mono text-xs italic leading-relaxed">
                        "{reasoning}"
                    </p>
                </div>
            )}

            {/* Action Queue */}
            <div className="space-y-2">
                {actions.map((action, idx) => {
                    const style = getActionStyle(action.name);
                    const Icon = style.icon;
                    const args = action.args;

                    return (
                        <div key={idx} className={`p-4 rounded-xl border ${style.border} ${style.bg} flex gap-4 items-start`}>
                            <div className={`mt-0.5 p-2 rounded-lg bg-black/40 ${style.color}`}>
                                <Icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`font-bold text-[10px] tracking-widest mb-1 ${style.color}`}>
                                    {style.label}
                                </div>
                                <div className="space-y-1">
                                    {Object.entries(args).map(([key, val]) => (
                                        <div key={key} className="flex text-xs font-mono">
                                            <span className="text-white/40 w-24 shrink-0 uppercase truncate">{key}</span>
                                            <span className="text-white truncate">
                                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-black/50 flex gap-3">
            <button 
                onClick={onClose}
                className="flex-1 py-3 rounded-lg font-mono font-bold text-xs bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-colors"
            >
                ABORT
            </button>
            <button 
                onClick={onConfirm}
                className="flex-[2] py-3 rounded-lg font-mono font-bold text-xs bg-white text-black hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
                <Check size={16} />
                EXECUTE ALL
            </button>
        </div>

      </div>
    </div>
  );
};