import React, { useState } from 'react';
import { REFLECTION_QUESTIONS } from '../constants';
import { ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react';

export const ReflectionModule: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(REFLECTION_QUESTIONS.length).fill(''));
  const [isCompleted, setIsCompleted] = useState(false);

  const handleNext = () => {
    if (activeStep < REFLECTION_QUESTIONS.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setIsCompleted(false);
  };

  const handleInput = (text: string) => {
    const newAnswers = [...answers];
    newAnswers[activeStep] = text;
    setAnswers(newAnswers);
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in p-6">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
          <CheckCircle2 size={40} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold">Reflexion Abgeschlossen</h2>
        <p className="opacity-70 max-w-xs">
          Du hast den ersten Schritt getan. Du hast Verantwortung übernommen. Jetzt nutze diese Erkenntnisse für deine Vision.
        </p>
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-800 rounded-full font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          <RotateCcw size={18} />
          Nochmal überarbeiten
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Radikale Ehrlichkeit</h2>
        <span className="text-sm font-mono opacity-50">{activeStep + 1} / {REFLECTION_QUESTIONS.length}</span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
        <div 
          className="bg-blue-600 h-full transition-all duration-500 ease-out"
          style={{ width: `${((activeStep + 1) / REFLECTION_QUESTIONS.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-8">
        <h3 className="text-3xl font-bold leading-tight">
          {REFLECTION_QUESTIONS[activeStep]}
        </h3>
        <textarea
          value={answers[activeStep]}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Sei ehrlich zu dir selbst..."
          className="w-full h-64 bg-white dark:bg-gray-800/50 rounded-3xl p-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-700 resize-none transition-all shadow-sm"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={answers[activeStep].length < 3}
          className="group flex items-center gap-2 bg-blue-600 text-white pl-6 pr-4 py-4 rounded-full font-bold shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
        >
          {activeStep === REFLECTION_QUESTIONS.length - 1 ? 'Abschließen' : 'Weiter'}
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};