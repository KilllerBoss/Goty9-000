
import React, { useRef, useState, useEffect } from 'react';
import { Camera, Crown, Check, X, ChevronLeft, ChevronRight, PieChart, Activity, AlertTriangle, Target, Users, BookOpen, Loader2 } from 'lucide-react';
import { Modal } from './BaseUI';
import { AppAssets, DossierEntry } from '../../types';
import { AiTerminal, TerminalMode } from './AiTerminal';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { generateProfilingQuestion } from '../../services/geminiService';

interface HunterLicenseEditProps {
    editProfile: any;
    setEditProfile: any;
    onSave: () => void;
    onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCardBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCardAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    assets: AppAssets;
    
    // AI Props
    aiInput?: string;
    setAiInput?: (val: string) => void;
    handleAiSubmit?: () => void;
    isProcessingAi?: boolean;
    aiMode?: TerminalMode;
    setAiMode?: (mode: TerminalMode) => void;
}

// Helper to paginate text respecting newlines and words
const paginateText = (text: string, maxCharsPerPage: number = 850): string[] => {
    if (!text) return [];
    if (text.length <= maxCharsPerPage) return [text];

    const pages: string[] = [];
    const paragraphs = text.split('\n');
    let currentPage = '';

    paragraphs.forEach(paragraph => {
        // If paragraph itself is too big, split by words
        if ((currentPage.length + paragraph.length) > maxCharsPerPage) {
            // If current page has content, push it first
            if (currentPage.length > 0) {
                pages.push(currentPage);
                currentPage = '';
            }
            
            // Check if paragraph fits on a new empty page
            if (paragraph.length <= maxCharsPerPage) {
                currentPage += paragraph + '\n';
            } else {
                // Hard split by words
                const words = paragraph.split(' ');
                words.forEach(word => {
                    if ((currentPage.length + word.length) > maxCharsPerPage) {
                        pages.push(currentPage);
                        currentPage = '';
                    }
                    currentPage += word + ' ';
                });
                currentPage += '\n';
            }
        } else {
            currentPage += paragraph + '\n';
        }
    });

    if (currentPage.trim().length > 0) {
        pages.push(currentPage);
    }

    return pages;
};

export const HunterLicenseEdit: React.FC<HunterLicenseEditProps> = ({ 
    editProfile, setEditProfile, onSave, onAvatarUpload, onBannerUpload, onCardBannerUpload, onCardAvatarUpload, assets,
    aiInput, setAiInput, handleAiSubmit, isProcessingAi, aiMode, setAiMode
}) => {
    
    // Banner Input Refs
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const cardBannerInputRef = useRef<HTMLInputElement>(null);

    // Automatic Date Formatting Logic
    const handleDateChange = (val: string) => {
        let v = val.replace(/\D/g, '');
        if (v.length > 8) v = v.slice(0, 8);
        if (v.length > 4) {
            v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
        } else if (v.length > 2) {
            v = `${v.slice(0, 2)}/${v.slice(2)}`;
        }
        setEditProfile({...editProfile, birthDate: v});
    };

    // Card Flip Logic (License Card)
    const [isFlipped, setIsFlipped] = useState(false);
    const touchStartY = useRef<number | null>(null);

    // Secret Dossier State
    const [showSecretDossier, setShowSecretDossier] = useState(false);
    
    // Profiling Question State (Floating Text)
    const [profilingQuestion, setProfilingQuestion] = useState<string | null>(null);
    const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);

    // --- 3D BOOK STATE ---
    // A stack of sheets. `flippedIndex` indicates how many sheets have been flipped to the left.
    const [flippedCount, setFlippedCount] = useState(0); 
    const bookTouchStartX = useRef<number | null>(null);

    // Dynamic Pages State (Calculated on render, but we need mapping for AI)
    // We calculate this later in render, but we need a ref or state to look up current entry for AI
    const pageEntryMappingRef = useRef<(DossierEntry | null)[]>([]);

    // Effect: Switch to COLLECTOR mode when Dossier is open
    useEffect(() => {
        if (showSecretDossier && setAiMode) {
            setAiMode('COLLECTOR');
        }
    }, [showSecretDossier, setAiMode]);

    // License Card Touch Handlers
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartY.current === null) return;
        const endY = e.changedTouches[0].clientY;
        const diff = touchStartY.current - endY;
        
        if (Math.abs(diff) > 40) { 
            setIsFlipped(!isFlipped);
        }
        touchStartY.current = null;
    };

    // --- CONTENT RENDERERS ---

    const renderCover = () => (
        <div className="h-full w-full flex flex-col justify-between p-8 bg-[#2c2c2c] text-[#fdf6e3] relative overflow-hidden border-r-4 border-[#1a1a1a]">
             {/* Texture Overlay */}
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(https://www.transparenttextures.com/patterns/leather.png)` }}></div>
             <div className="absolute inset-0 border-4 border-[#4a4a4a] m-4 pointer-events-none"></div>
             
             <div className="mt-12 text-center relative z-10">
                 <div className="w-24 h-24 mx-auto mb-6 opacity-80 border-4 border-[#fdf6e3] rounded-full flex items-center justify-center">
                     <Crown size={48} />
                 </div>
                 <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">Secret<br/>Dossier</h1>
                 <p className="text-xs tracking-[0.4em] font-mono text-[#fdf6e3]/60">CLASSIFIED // EYES ONLY</p>
             </div>

             <div className="text-center relative z-10 opacity-50 font-mono text-[10px]">
                 PROPERTY OF HUNTER ASSOCIATION<br/>
                 ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
             </div>
        </div>
    );

    const renderIdentityPage = () => (
        <div className="h-full w-full p-8 font-serif text-[#3d3d3d] flex flex-col relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                <div className="w-32 h-32 border-4 border-red-900 rounded-full flex items-center justify-center">
                    <span className="text-xl font-black text-red-900 -rotate-12 uppercase border-2 border-red-900 p-1">Top Secret</span>
                </div>
            </div>

            <h2 className="text-2xl font-black uppercase tracking-tighter border-b-2 border-[#2c2c2c] pb-4 mb-6">Subject Identity</h2>
            
            <div className="flex gap-4 mb-6">
                <div className="w-20 h-24 bg-black/10 border border-[#2c2c2c] shrink-0 overflow-hidden grayscale">
                    {editProfile.avatar ? <img src={editProfile.avatar} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="space-y-2 flex-1">
                    <div>
                        <span className="text-[10px] uppercase tracking-widest block opacity-60">Codename</span>
                        <span className="font-bold text-lg">{editProfile.name || "UNKNOWN"}</span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase tracking-widest block opacity-60">Real Identity</span>
                        <span className="font-mono text-xs">{editProfile.title || "REDACTED"}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-[#f0eadd] p-3 border-l-2 border-[#2c2c2c]">
                    <span className="text-[10px] uppercase tracking-widest block opacity-60 mb-1">Primary Objective</span>
                    <p className="italic font-medium leading-tight">"{editProfile.mainGoal || "No objective set."}"</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-[10px] uppercase tracking-widest block opacity-60">Current Focus</span>
                        <span className="font-bold border-b border-[#2c2c2c]/20 block pb-1">{editProfile.dailyFocus || "---"}</span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase tracking-widest block opacity-60">Income Target</span>
                        <span className="font-bold border-b border-[#2c2c2c]/20 block pb-1">{editProfile.monthlyIncome || "---"}</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-auto text-center pt-8 opacity-40">
                <p className="text-[8px] font-mono">CONFIDENTIALITY NOTICE: This document contains sensitive psychological profile data.</p>
            </div>
        </div>
    );

    // Adjusted to accept pagination props
    const renderDynamicEntry = (entry: DossierEntry, partIndex: number = 1, totalParts: number = 1, textContentOverride?: string) => (
        <div className="h-full w-full p-8 font-serif text-[#3d3d3d] flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-[#2c2c2c]/20 pb-2">
                {entry.type === 'RADAR_CHART' && <Activity size={16} />}
                {entry.type === 'BAR_CHART' && <Target size={16} />}
                {entry.type === 'TEXT' && <BookOpen size={16} />}
                {entry.type === 'LIST' && <Users size={16} />}
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#2c2c2c]">{entry.title}</h2>
            </div>

            {/* LEVEL HEADER - Only on First Page */}
            {partIndex === 1 && entry.level && (
                <div className="mb-6 bg-[#f0eadd] p-3 rounded border border-[#d6d0c4] flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-70">Current Level</span>
                        <span className="text-xl font-black">{entry.level}</span>
                    </div>
                    {entry.maxProgress && (
                        <div className="w-full h-2 bg-[#d6d0c4] rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-[#2c2c2c] rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, ((entry.currentProgress || 0) / entry.maxProgress) * 100)}%` }}
                            ></div>
                        </div>
                    )}
                    {entry.progressLabel && (
                        <span className="text-[10px] font-mono opacity-60 text-right">{entry.progressLabel}</span>
                    )}
                </div>
            )}

            {/* Visuals - Only on First Page if present */}
            {partIndex === 1 && entry.type === 'RADAR_CHART' && entry.data && (
                <div className="h-48 w-full -ml-4 shrink-0 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={entry.data}>
                            <PolarGrid stroke="#b0a896" />
                            <PolarAngleAxis dataKey="label" tick={{ fill: '#4a4a4a', fontSize: 10, fontWeight: 'bold', fontFamily: 'serif' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Subject" dataKey="value" stroke="#3d3d3d" strokeWidth={2} fill="#2c2c2c" fillOpacity={0.2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {partIndex === 1 && entry.type === 'BAR_CHART' && entry.data && (
                <div className="h-48 w-full bg-white/50 border border-[#d6d0c4] rounded p-2 shrink-0 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={entry.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#d6d0c4" vertical={false} />
                            <XAxis dataKey="label" tick={{fontSize: 10, fill: '#4a4a4a'}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fontSize: 10, fill: '#4a4a4a'}} />
                            <Tooltip contentStyle={{backgroundColor: '#fdf6e3', borderColor: '#2c2c2c', color: '#2c2c2c'}} />
                            <Bar dataKey="value" fill="#3d3d3d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Text Content - Render specific chunk */}
            <div className="flex-1 overflow-hidden relative">
                {(textContentOverride || entry.content).split('\n').map((line, i) => {
                    if (line.startsWith('## ')) return <h3 key={i} className="font-bold uppercase tracking-widest text-xs mb-2 mt-4 text-[#2c2c2c]">{line.replace('## ', '')}</h3>;
                    if (line.startsWith('* ')) return <li key={i} className="list-disc ml-4 text-sm font-serif opacity-90">{line.replace('* ', '')}</li>;
                    if (line.startsWith('- ')) return <li key={i} className="list-disc ml-4 text-sm font-serif opacity-90">{line.replace('- ', '')}</li>;
                    return <p key={i} className="mb-2 text-sm font-serif leading-relaxed opacity-90">{line}</p>;
                })}
            </div>

            {/* Pagination Footer */}
            {totalParts > 1 && (
                <div className="mt-auto pt-4 flex justify-center items-center border-t border-[#2c2c2c]/10">
                    <span className="text-[10px] font-mono text-[#2c2c2c]/60">
                        Seite {partIndex} von {totalParts}
                    </span>
                </div>
            )}
        </div>
    );

    const renderBackCover = () => (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-[#2c2c2c] text-[#fdf6e3]/30 relative overflow-hidden border-l-4 border-[#1a1a1a]">
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(https://www.transparenttextures.com/patterns/leather.png)` }}></div>
             <Crown size={64} className="mb-4" />
             <p className="text-[10px] tracking-[0.5em] font-mono uppercase">End of Record</p>
        </div>
    );

    // --- PAGE ASSEMBLY & MAPPING ---
    const buildPages = () => {
        const pages: { render: () => React.ReactElement, entry: DossierEntry | null }[] = [];
        
        // 1. Cover
        pages.push({ render: renderCover, entry: null });
        
        // 2. Identity
        pages.push({ render: renderIdentityPage, entry: null });

        // 3. Dynamic Entries with Pagination
        if (editProfile.dossier) {
            editProfile.dossier.forEach((entry: DossierEntry) => {
                if (entry.type === 'TEXT') {
                    // Split text into multiple pages
                    const chunks = paginateText(entry.content);
                    chunks.forEach((chunk, idx) => {
                        pages.push({
                            render: () => renderDynamicEntry(entry, idx + 1, chunks.length, chunk),
                            entry: entry
                        });
                    });
                } else {
                    // Charts usually fit on one page
                    pages.push({
                        render: () => renderDynamicEntry(entry, 1, 1),
                        entry: entry
                    });
                }
            });
        }

        // 4. Back Cover
        pages.push({ render: renderBackCover, entry: null });

        return pages;
    };

    // Calculate pages once when dossier changes or renders
    const pageData = buildPages();
    const pagesContent = pageData.map(p => p.render);
    pageEntryMappingRef.current = pageData.map(p => p.entry); // Update ref for AI

    // --- BOOK TOUCH HANDLERS (SWIPE TO TURN) ---
    const onBookTouchStart = (e: React.TouchEvent) => {
        bookTouchStartX.current = e.touches[0].clientX;
    };

    const onBookTouchEnd = (e: React.TouchEvent) => {
        if (bookTouchStartX.current === null) return;
        const endX = e.changedTouches[0].clientX;
        const diff = bookTouchStartX.current - endX; // Positive = Swipe Left (Next), Negative = Swipe Right (Prev)

        const threshold = 50;
        const totalSheets = pagesContent.length;

        if (diff > threshold) {
            // Next Page
            if (flippedCount < totalSheets - 1) {
                setFlippedCount(prev => prev + 1);
            }
        } else if (diff < -threshold) {
            // Prev Page
            if (flippedCount > 0) {
                setFlippedCount(prev => prev - 1);
            }
        }
        bookTouchStartX.current = null;
    };

    // --- PROFILING QUESTION LOGIC ---
    const handleSwipeUpTerminal = async () => {
        if (isLoadingQuestion) return;
        setIsLoadingQuestion(true);
        try {
            // Determine active entry based on flippedCount from the Mapping Ref
            let activeEntry: DossierEntry | null = null;
            
            // Safety check for index bounds
            if (flippedCount < pageEntryMappingRef.current.length) {
                activeEntry = pageEntryMappingRef.current[flippedCount];
            }

            const question = await generateProfilingQuestion(editProfile, activeEntry);
            setProfilingQuestion(question);
        } catch (e) {
            console.error("Failed to generate question", e);
        } finally {
            setIsLoadingQuestion(false);
        }
    };

    const handleSwipeDownTerminal = () => {
        setProfilingQuestion(null);
    };

    if (showSecretDossier) {
        return (
             <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center overflow-hidden">
                 
                 {/* Close Button */}
                 <button onClick={() => setShowSecretDossier(false)} className="absolute top-4 right-4 text-white/50 hover:text-white z-50 p-2">
                     <X size={24} />
                 </button>

                 {/* 3D BOOK SCENE */}
                 <div 
                    className="book-scene relative w-full max-w-md aspect-[3/4] md:aspect-[4/3] max-h-[85vh]"
                    onTouchStart={onBookTouchStart}
                    onTouchEnd={onBookTouchEnd}
                 >
                    {/* Render Pages in Reverse Order for Z-Indexing */}
                    {pagesContent.map((RenderContent, index) => {
                        // Z-Index Logic:
                        // If not flipped (on right): higher index = lower z-index (stacking down)
                        // If flipped (on left): higher index = higher z-index (stacking up)
                        const isFlipped = index < flippedCount;
                        
                        // Calculate z-index to ensure correct stacking order
                        let zIndex = 0;
                        if (isFlipped) {
                            zIndex = index; // 0, 1, 2... (Left stack builds up)
                        } else {
                            zIndex = pagesContent.length - index; // N, N-1... (Right stack builds down)
                        }

                        return (
                            <div 
                                key={index}
                                className={`book-page ${isFlipped ? 'flipped' : ''}`}
                                style={{ zIndex }}
                            >
                                {/* FRONT OF THE SHEET */}
                                <div className="page-face page-front shadow-lg">
                                    <RenderContent />
                                    {/* Page Number */}
                                    <div className="absolute bottom-3 right-4 text-[8px] font-mono opacity-40 text-[#2c2c2c]">
                                        {index === 0 ? '' : index === pagesContent.length - 1 ? '' : `p.${index}`}
                                    </div>
                                    {/* Paper Texture Overlay for Grain */}
                                    <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-multiply" style={{ backgroundImage: `url(https://www.transparenttextures.com/patterns/aged-paper.png)` }}></div>
                                </div>

                                {/* BACK OF THE SHEET */}
                                <div className="page-face page-back shadow-lg flex items-center justify-center bg-[#f4ecd8]">
                                    <div className="opacity-10 grayscale">
                                        <Crown size={48} />
                                    </div>
                                    {/* Paper Texture Overlay */}
                                    <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-multiply" style={{ backgroundImage: `url(https://www.transparenttextures.com/patterns/aged-paper.png)` }}></div>
                                </div>
                            </div>
                        );
                    })}
                 </div>

                 {/* Navigation Hints */}
                 <div className="absolute bottom-24 md:bottom-10 left-0 right-0 flex justify-center gap-8 pointer-events-none text-white/30 text-xs font-mono">
                     <div className={`transition-opacity ${flippedCount > 0 ? 'opacity-100' : 'opacity-0'}`}>&lt; SWIPE BACK</div>
                     <div className={`transition-opacity ${flippedCount < pagesContent.length - 1 ? 'opacity-100' : 'opacity-0'}`}>SWIPE NEXT &gt;</div>
                 </div>

                 {/* Floating Question Bubble */}
                 {(profilingQuestion || isLoadingQuestion) && (
                     <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[90] animate-slide-up">
                         <div className="bg-[#2c2c2c] text-[#fdf6e3] p-4 rounded-xl shadow-2xl border border-[#4a4a4a] relative">
                             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#2c2c2c] rotate-45 border-b border-r border-[#4a4a4a]"></div>
                             
                             {isLoadingQuestion ? (
                                 <div className="flex items-center justify-center gap-2 text-sm font-mono opacity-70">
                                     <Loader2 className="animate-spin" size={16} />
                                     <span>Analysiere Akte...</span>
                                 </div>
                             ) : (
                                 <div className="text-center font-serif italic text-sm leading-relaxed">
                                     "{profilingQuestion}"
                                 </div>
                             )}
                         </div>
                     </div>
                 )}

                 {/* AI Terminal for Collector Mode inside Dossier - Uses 'paper' variant */}
                 {setAiInput && handleAiSubmit && setAiMode && (
                     <AiTerminal 
                        isShopOpen={false} 
                        aiInput={aiInput || ''}
                        setAiInput={setAiInput}
                        handleAiSubmit={handleAiSubmit}
                        isProcessingAi={isProcessingAi || false}
                        mode={aiMode || 'COLLECTOR'}
                        setMode={setAiMode}
                        className="z-[80] fixed bottom-6 w-[90%] max-w-md left-1/2 -translate-x-1/2 bg-transparent" // Transparent bg for container to let modal show
                        lockedMode={true} 
                        variant="paper"
                        onSwipeUp={handleSwipeUpTerminal}
                        onSwipeDown={handleSwipeDownTerminal}
                     />
                 )}
             </div>
        );
    }

    return (
        <Modal title="Hunter License" onClose={onSave} hideHeader={true}>
             {/* ... existing card flip code ... */}
             <div className="relative w-full max-w-sm mx-auto perspective-1000 group">
                
                {/* 3D Card Container */}
                <div 
                    className="relative w-full aspect-[1.586] transition-transform duration-700 [transform-style:preserve-3d]"
                    style={{ transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)' }}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                >
                    
                    {/* --- FRONT FACE --- */}
                    <div 
                        className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-white/20 [backface-visibility:hidden] cursor-pointer ${isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`}
                        style={{
                            backgroundImage: `url(${editProfile.banner || assets.bannerLight})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            zIndex: isFlipped ? 0 : 10
                        }}
                        onClick={(e) => {
                            if (isFlipped) return;
                            // Check if clicking on interactive elements
                            const target = e.target as HTMLElement;
                            if (target.tagName === 'INPUT' || target.closest('label') || target.tagName === 'BUTTON' || target.closest('.header-trigger')) {
                                return;
                            }
                            bannerInputRef.current?.click();
                        }}
                    >
                         {/* Hidden Header Banner Input */}
                         <input 
                            type="file" 
                            ref={bannerInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={onBannerUpload} 
                        />

                        {/* Glass Overlay */}
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/60"></div>

                        {/* Content Grid */}
                        <div className="absolute inset-0 p-5 flex flex-col z-20 font-sans text-white pointer-events-none">
                            
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4 pointer-events-auto">
                                <div 
                                    className="header-trigger cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); setShowSecretDossier(true); }}
                                    title="View Classified Dossier"
                                >
                                    <h1 className="font-serif font-black text-2xl tracking-tighter leading-none text-white drop-shadow-md">HUNTER</h1>
                                    <p className="text-[8px] uppercase tracking-[0.3em] font-bold opacity-80">License Card</p>
                                </div>
                                <label className="w-8 h-8 border-2 border-white/50 rounded-full flex items-center justify-center opacity-80 hover:opacity-100 hover:bg-white/10 transition-all cursor-pointer z-30 overflow-hidden bg-black/20">
                                    {editProfile.cardAvatar ? (
                                        <img src={editProfile.cardAvatar} className="w-full h-full object-cover" alt="Card Avatar" />
                                    ) : (
                                        <Crown size={14} className="text-white" />
                                    )}
                                    <input type="file" className="hidden" accept="image/*" onChange={onCardAvatarUpload} />
                                </label>
                            </div>

                            <div className="flex gap-4 items-center flex-1 pointer-events-auto">
                                {/* Avatar Section */}
                                <div className="relative group/avatar">
                                    <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg bg-black/50">
                                        <img 
                                            src={editProfile.avatar || assets.defaultAvatar} 
                                            className="w-full h-full object-cover" 
                                            alt="Avatar" 
                                        />
                                    </div>
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer rounded-xl">
                                        <Camera size={20} className="text-white" />
                                        <input type="file" className="hidden" accept="image/*" onChange={onAvatarUpload} />
                                    </label>
                                </div>

                                {/* Text Details Section (Inline Editing) */}
                                <div className="flex-1 space-y-2">
                                    {/* Name Input */}
                                    <div className="relative border-b border-white/30 pb-1">
                                        <input 
                                            type="text" 
                                            value={editProfile.name} 
                                            onChange={(e) => setEditProfile({...editProfile, name: e.target.value})}
                                            className="bg-transparent border-none w-full text-lg font-bold text-white placeholder-white/50 focus:outline-none p-0 drop-shadow-sm font-serif uppercase tracking-wide"
                                            placeholder="CODENAME"
                                        />
                                        <span className="absolute -bottom-2 right-0 text-[6px] uppercase tracking-widest opacity-60">Codename</span>
                                    </div>

                                    {/* Title Input -> Renamed to Realname */}
                                    <div className="relative border-b border-white/30 pb-1">
                                        <input 
                                            type="text" 
                                            value={editProfile.title} 
                                            onChange={(e) => setEditProfile({...editProfile, title: e.target.value})}
                                            className="bg-transparent border-none w-full text-xs font-medium text-white placeholder-white/50 focus:outline-none p-0 drop-shadow-sm uppercase"
                                            placeholder="REAL NAME"
                                        />
                                        <span className="absolute -bottom-2 right-0 text-[6px] uppercase tracking-widest opacity-60">Realname</span>
                                    </div>

                                    {/* Meta Data Grid */}
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div>
                                            <label className="text-[6px] uppercase tracking-wider opacity-60 block">DOB (DD/MM/YYYY)</label>
                                            <input 
                                                type="text" 
                                                value={editProfile.birthDate} 
                                                onChange={(e) => handleDateChange(e.target.value)}
                                                className="bg-transparent border-none w-full text-[10px] font-mono font-bold text-white focus:outline-none p-0"
                                                placeholder="DD/MM/YYYY"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[6px] uppercase tracking-wider opacity-60 block">Location</label>
                                            <input 
                                                type="text" 
                                                value={editProfile.location} 
                                                onChange={(e) => setEditProfile({...editProfile, location: e.target.value})}
                                                className="bg-transparent border-none w-full text-[10px] font-mono font-bold text-white focus:outline-none p-0 truncate"
                                                placeholder="CITY"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ID Number Footer */}
                            <div className="mt-auto pt-2 flex justify-between items-end border-t border-white/10 pointer-events-auto">
                                <span className="font-mono text-[8px] opacity-60 tracking-widest">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                                <span className="font-mono text-[8px] opacity-60 tracking-widest">RANK: {editProfile.rank || 'E'}</span>
                            </div>

                        </div>
                    </div>

                    {/* --- BACK FACE --- */}
                    <div 
                        className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-[#121212] [backface-visibility:hidden] flex flex-col cursor-pointer ${isFlipped ? 'pointer-events-auto' : 'pointer-events-none'}`}
                        style={{ 
                            transform: 'rotateX(180deg)',
                            backgroundImage: editProfile.cardBanner ? `url(${editProfile.cardBanner})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            zIndex: isFlipped ? 10 : 0
                        }}
                        onClick={(e) => {
                            if (!isFlipped) return;
                            e.stopPropagation();
                            cardBannerInputRef.current?.click();
                        }}
                    >
                         {/* Hidden Card Banner Input */}
                         <input 
                            type="file" 
                            ref={cardBannerInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={onCardBannerUpload} 
                        />

                         {/* Overlay if banner exists to keep text readable */}
                         {editProfile.cardBanner && <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>}

                         {/* Magnetic Strip */}
                         <div className="w-full h-12 bg-black mt-8 border-y border-white/5 relative z-10 pointer-events-none"></div>
                         
                         <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 relative z-10 pointer-events-none">
                            <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center">
                               <Crown size={24} className="text-white/20" />
                            </div>
                            
                            <div className="space-y-2 max-w-[80%]">
                                <h3 className="text-white text-[10px] font-serif uppercase tracking-[0.2em] font-bold">Hunter Association</h3>
                                <p className="text-[8px] text-justify text-white/40 font-mono leading-tight">
                                    This card is the property of the Hunter Association. It is issued to the licensee named on the face. If found, please return to any Hunter Association branch.
                                </p>
                            </div>
                         </div>
                    </div>

                </div>

                {/* Close/Save Button outside */}
                <div className="mt-6 flex justify-center">
                    <button 
                        onClick={onSave}
                        className="bg-white text-black px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <Check size={18} />
                        Save Identity
                    </button>
                </div>
             </div>
        </Modal>
    );
}
