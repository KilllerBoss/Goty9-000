
import React, { useRef } from 'react';
import { Terminal, Send, Sparkles, Leaf, Lightbulb } from 'lucide-react';

export type TerminalMode = 'CLI' | 'GARDENER' | 'COLLECTOR';

interface AiTerminalProps {
    isShopOpen: boolean;
    aiInput: string;
    setAiInput: (val: string) => void;
    handleAiSubmit: () => void;
    isProcessingAi: boolean;
    mode: TerminalMode;
    setMode: (mode: TerminalMode) => void;
    className?: string; // Allow custom styling/positioning
    lockedMode?: boolean; // Prevent mode switching
    variant?: 'default' | 'paper'; // New visual variant
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
}

export const AiTerminal: React.FC<AiTerminalProps> = ({ 
    isShopOpen, 
    aiInput, 
    setAiInput, 
    handleAiSubmit, 
    isProcessingAi, 
    mode,
    setMode,
    className = '',
    lockedMode = false,
    variant = 'default',
    onSwipeUp,
    onSwipeDown
}) => {
    const touchStartY = useRef<number | null>(null);

    // Only hide if shop is open AND no custom class is provided (default behavior)
    // If custom class provided (e.g. inside Dossier), we control visibility via parent
    if (isShopOpen && !className) return null;

    const toggleMode = () => {
        if (lockedMode) return;
        if (mode === 'CLI') setMode('GARDENER');
        else if (mode === 'GARDENER') setMode('COLLECTOR');
        else setMode('CLI');
    };

    const getModeStyles = () => {
        // PAPER VARIANT (For Secret Dossier)
        if (variant === 'paper') {
            return {
                icon: Lightbulb, // Always collector/insight
                color: 'text-[#4a4a4a]', // Dark Ink
                containerClasses: 'bg-[#e8e2d2] border border-[#b0a896] shadow-md', // Paper-like input
                placeholder: 'Notiz oder leer für Auto-Sort...',
                placeholderColor: 'placeholder-[#4a4a4a]/50',
                inputText: 'text-[#2c2c2c]',
                buttonBg: 'bg-[#4a4a4a] text-[#fdf6e3] hover:bg-[#2c2c2c]'
            };
        }

        // DEFAULT NEON/APP VARIANTS
        switch (mode) {
            case 'GARDENER': return { 
                icon: Leaf, 
                color: 'text-green-500', 
                containerClasses: 'bg-surface/90 backdrop-blur-xl border border-green-500/30 shadow-[0_0_20px_-5px_rgba(34,197,94,0.5)]',
                placeholder: 'Aufräumen & Sortieren...',
                placeholderColor: 'placeholder-secondary',
                inputText: 'text-main',
                buttonBg: 'bg-main text-surface hover:opacity-90'
            };
            case 'COLLECTOR': return { 
                icon: Lightbulb, 
                color: 'text-yellow-500', 
                containerClasses: 'bg-surface/90 backdrop-blur-xl border border-yellow-500/30 shadow-[0_0_20px_-5px_rgba(234,179,8,0.5)]',
                placeholder: 'Infos sammeln & Akte...',
                placeholderColor: 'placeholder-secondary',
                inputText: 'text-main',
                buttonBg: 'bg-main text-surface hover:opacity-90'
            };
            default: return { 
                icon: Terminal, 
                color: 'text-blue-500', 
                containerClasses: 'bg-surface/90 backdrop-blur-xl border border-blue-500/30 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]',
                placeholder: 'Thinking & Planning...',
                placeholderColor: 'placeholder-secondary',
                inputText: 'text-main',
                buttonBg: 'bg-main text-surface hover:opacity-90'
            };
        }
    };

    const style = getModeStyles();
    const Icon = style.icon;

    // Logic: 
    // - GARDENER can always run without input (defaults to cleanup)
    // - COLLECTOR in PAPER mode (Dossier) can run without input (defaults to sort/format active page)
    // - Others need input
    const canSendEmpty = mode === 'GARDENER' || (mode === 'COLLECTOR' && variant === 'paper');
    const isSendDisabled = isProcessingAi || (!canSendEmpty && !aiInput.trim());

    // Determine wrapper classes based on variant
    // Default: Fixed bottom gradient dock
    // Paper: Minimal wrapper, relies on className for positioning (removes the grey gradient bar)
    const wrapperBaseClass = variant === 'paper' 
        ? `pointer-events-none z-50 ${className}` 
        : `fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-background via-background/90 to-transparent pb-6 pt-8 pointer-events-none ${className}`;

    // --- SWIPE LOGIC ---
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartY.current === null) return;
        const endY = e.changedTouches[0].clientY;
        const diff = touchStartY.current - endY;

        if (diff > 40 && onSwipeUp) {
            onSwipeUp(); // Swipe UP
        } else if (diff < -40 && onSwipeDown) {
            onSwipeDown(); // Swipe DOWN
        }
        touchStartY.current = null;
    };

    return (
        <div className={wrapperBaseClass}>
            <div 
                className={`relative w-full max-w-xl mx-auto pointer-events-auto transition-all duration-300`}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                
                <div className={`relative rounded-full flex items-center p-1.5 transition-all duration-500 ${style.containerClasses}`}>
                    {/* Mode Toggle Button */}
                    <button 
                        onClick={toggleMode}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ml-0.5 transition-colors group ${
                            variant === 'paper' 
                            ? 'bg-[#d6cfbd] cursor-default' 
                            : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                        } ${lockedMode ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                        title={`Current Mode: ${mode}`}
                        disabled={lockedMode}
                    >
                        <Icon size={18} className={`${style.color} ${isProcessingAi ? 'animate-pulse' : ''} transition-all duration-300 group-hover:scale-110`} />
                    </button>

                    <input 
                        type="text" 
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isSendDisabled && handleAiSubmit()}
                        placeholder={style.placeholder}
                        className={`flex-1 bg-transparent border-none focus:outline-none px-4 text-sm font-mono ${style.inputText} ${style.placeholderColor}`}
                        disabled={isProcessingAi}
                    />

                    {/* Send Button */}
                    <button 
                        onClick={handleAiSubmit}
                        disabled={isSendDisabled}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${isSendDisabled ? 'bg-gray-300 dark:bg-gray-700 opacity-50 cursor-not-allowed' : style.buttonBg}`}
                    >
                        {isProcessingAi ? (
                            <Sparkles size={18} className="animate-spin text-blue-300" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
