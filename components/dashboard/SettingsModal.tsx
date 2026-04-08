import React, { useState } from 'react';
import { Settings, Bell, ChevronLeft, ImageIcon, Volume2, Upload, Link } from 'lucide-react';
import { Modal } from '../SharedUI';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { AppTheme, AppAssets, Difficulty, UserProfile, NotificationSetting } from '../../types';

interface SettingsModalProps {
    onClose: () => void;
    currentTheme: AppTheme;
    setTheme: (theme: AppTheme) => void;
    profile: UserProfile;
    assets: AppAssets;
    onUpdateProfile: (updates: Partial<UserProfile>) => void;
    onAssetChange: (key: keyof AppAssets, value: string) => void;
    onAssetUpload: (key: keyof AppAssets, e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    onClose, 
    currentTheme, 
    setTheme, 
    profile, 
    assets,
    onUpdateProfile,
    onAssetChange,
    onAssetUpload
}) => {
    const [settingsView, setSettingsView] = useState<'MAIN' | 'ASSETS' | 'NOTIFICATIONS'>('MAIN');

    const handleNotificationSettingChange = (diff: Difficulty, field: keyof NotificationSetting, value: any) => {
        const currentSettings = profile.settings?.notifications || {} as any;
        const currentDiffSettings = currentSettings[diff] || { startWarningMinutes: 0, endWarningMinutes: 0 };
        
        const newSettings = {
            ...currentSettings,
            [diff]: {
                ...currentDiffSettings,
                [field]: value
            }
        };

        onUpdateProfile({
            settings: {
                ...profile.settings,
                notifications: newSettings
            }
        });
    };

    const handleSoundUpload = async (diff: Difficulty, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                if (evt.target?.result) {
                    handleNotificationSettingChange(diff, 'customSound', evt.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Modal title={settingsView === 'MAIN' ? "System Configuration" : (settingsView === 'ASSETS' ? "Asset Management" : "Notifications")} onClose={onClose}>
            {settingsView === 'MAIN' ? (
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2 font-serif">Display Theme</h4>
                        <ThemeSwitcher currentTheme={currentTheme} setTheme={setTheme} />
                    </div>
                    <div className="p-4 bg-highlight rounded-xl border border-border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setSettingsView('NOTIFICATIONS')}>
                        <div className="flex items-center justify-between text-main font-bold mb-1 font-serif">
                            <div className="flex items-center gap-2"><Bell size={18} /><span>Notification Config</span></div>
                            <ChevronLeft size={16} className="rotate-180 text-secondary" />
                        </div>
                        <p className="text-xs text-secondary font-sans">Set timers and sounds per difficulty</p>
                    </div>
                    <div className="p-4 bg-highlight rounded-xl border border-border">
                        <div className="flex items-center gap-2 text-main font-bold mb-1 font-serif">
                            <Settings size={18} /><span>App Info</span>
                        </div>
                        <p className="text-xs text-secondary font-sans">Version 2.5.0 (Core)</p>
                    </div>
                    <div className="flex justify-end pt-2">
                            <button onClick={() => setSettingsView('ASSETS')} className="text-[10px] text-secondary/50 font-mono hover:text-secondary uppercase tracking-widest transition-colors flex items-center gap-1">
                            <ImageIcon size={10} />Assets
                            </button>
                    </div>
                </div>
            ) : settingsView === 'ASSETS' ? (
                <div className="space-y-6 animate-slide-up">
                    <button onClick={() => setSettingsView('MAIN')} className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-main mb-2 font-serif">
                        <ChevronLeft size={14} /> Back
                    </button>
                    
                    {/* Asset Inputs */}
                    {['bannerLight', 'bannerDark', 'defaultAvatar'].map((key) => (
                        <div key={key} className="space-y-2">
                            <label className="text-xs font-bold text-secondary uppercase tracking-wider block font-serif">{key.replace(/([A-Z])/g, ' $1')}</label>
                            <div className="w-full h-24 rounded-lg overflow-hidden border border-border bg-highlight relative group">
                                <img src={assets[key as keyof AppAssets]} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <label className="cursor-pointer bg-white text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                                        <Upload size={12} /> Change
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => onAssetUpload(key as keyof AppAssets, e)} />
                                    </label>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-highlight rounded-lg px-2 py-1">
                                <Link size={12} className="text-secondary" />
                                <input type="text" value={assets[key as keyof AppAssets]} onChange={(e) => onAssetChange(key as keyof AppAssets, e.target.value)}
                                className="flex-1 bg-transparent border-none text-[10px] font-mono text-secondary focus:outline-none focus:text-main"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // NOTIFICATION SETTINGS VIEW
                <div className="space-y-6 animate-slide-up">
                    <button onClick={() => setSettingsView('MAIN')} className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-main mb-2 font-serif">
                        <ChevronLeft size={14} /> Back
                    </button>

                    {Object.values(Difficulty).map(diff => {
                        const config = profile.settings?.notifications?.[diff] || { startWarningMinutes: 0, endWarningMinutes: 0 };
                        return (
                            <div key={diff} className="p-4 bg-highlight rounded-xl border border-border">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2 font-serif">
                                    <div className={`w-2 h-2 rounded-full ${diff === 'EASY' ? 'bg-green-500' : diff === 'NORMAL' ? 'bg-blue-500' : diff === 'HARD' ? 'bg-purple-500' : diff === 'EXTREME' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                    {diff} Priority
                                </h4>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="text-[10px] uppercase text-secondary font-bold block mb-1">Warn Start (min)</label>
                                        <input 
                                        type="number" 
                                        value={config.startWarningMinutes || ''} 
                                        placeholder="0"
                                        onChange={(e) => handleNotificationSettingChange(diff, 'startWarningMinutes', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                        className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase text-secondary font-bold block mb-1">Warn End (min)</label>
                                        <input 
                                        type="number" 
                                        value={config.endWarningMinutes || ''} 
                                        placeholder="0"
                                        onChange={(e) => handleNotificationSettingChange(diff, 'endWarningMinutes', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                        className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-sm font-mono"
                                        />
                                    </div>
                                </div>
                                <label className="flex items-center justify-between cursor-pointer bg-surface p-2 rounded-lg border border-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-2 text-xs font-bold text-secondary">
                                        <Volume2 size={14} />
                                        {config.customSound ? "Custom Sound Set" : "Default Sound"}
                                    </div>
                                    <input type="file" className="hidden" accept="audio/*" onChange={(e) => handleSoundUpload(diff, e)} />
                                    <div className="text-[10px] bg-highlight px-2 py-1 rounded border border-border text-secondary">Upload</div>
                                </label>
                            </div>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
};