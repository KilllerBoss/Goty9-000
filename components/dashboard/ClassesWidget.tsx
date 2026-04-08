import React, { useState } from 'react';
import { Shield, Search } from 'lucide-react';
import { PlayerClass } from '../../types';
import { SectionHeader } from './BaseUI';
import { ClassCard } from './ClassCard';

interface ClassesWidgetProps {
    classes: PlayerClass[];
    isOpen: boolean;
    onAddClass: () => void;
    onAddSubClass: (classId: string) => void;
    onManageClass: (classId: string) => void;
}

export const ClassesWidget: React.FC<ClassesWidgetProps> = ({ classes, isOpen, onAddClass, onAddSubClass, onManageClass }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);

    const filteredClasses = classes.filter(c => 
        searchQuery ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

    return (
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
            <div className="animate-fade-in border-b border-border pb-4">
                <div className="px-4">
                    <SectionHeader 
                        title="Classes" 
                        icon={Shield} 
                        onAdd={onAddClass} 
                        onSearch={() => { setIsSearchActive(!isSearchActive); setSearchQuery(''); }}
                        isSearchActive={isSearchActive}
                        isOpen={true}
                    >
                        <div className="bg-highlight rounded-xl flex items-center px-3 py-2 border border-border mt-2">
                            <Search size={14} className="text-secondary mr-2" />
                            <input 
                                type="text" 
                                placeholder="Find class..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-main text-xs w-full placeholder-secondary font-sans"
                            />
                        </div>
                    </SectionHeader>
                </div>
            
                <div className="pl-4 flex overflow-x-auto gap-3 pb-2 no-scrollbar snap-x snap-mandatory items-start min-h-[110px]">
                    {filteredClasses.length === 0 ? (
                        <div onClick={onAddClass} className="mr-4 w-full p-6 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-secondary hover:bg-highlight cursor-pointer transition-all h-[100px]">
                            <Shield size={24} className="mb-2 opacity-50"/>
                            <p className="text-sm font-medium font-serif">No Classes Found</p>
                        </div>
                    ) : (
                        filteredClasses.map(cls => (
                            <ClassCard 
                                key={cls.id} 
                                cls={cls} 
                                onAddSubClass={() => onAddSubClass(cls.id)}
                                onManage={() => onManageClass(cls.id)}
                            />
                        ))
                    )}
                    <div className="w-1 shrink-0"></div>
                </div>
            </div>
        </div>
    );
};