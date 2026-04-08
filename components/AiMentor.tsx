import React, { useState, useRef, useEffect } from 'react';
import { chatWithMentor } from '../services/geminiService';
import { ChatMessage, UserProfile } from '../types';
import { Send, Cpu, Bot, Loader2, Sparkles } from 'lucide-react';

interface AiMentorProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  addToDataset: (input: string, output: string) => void;
}

export const AiMentor: React.FC<AiMentorProps> = ({ profile, setProfile, addToDataset }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'model',
      text: 'SYSTEM INIT... Datenbank leer. \nIdentifiziere dich. Name und Primärziel für 2026 erforderlich.',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      
      const response = await chatWithMentor(history, userText, profile);
      
      let aiText = response.text || "";
      
      // Handle Tool Calls (Function Calling)
      const toolCalls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall);
      
      if (toolCalls && toolCalls.length > 0) {
        let updates: Partial<UserProfile> = {};
        
        toolCalls.forEach(part => {
          const call = part.functionCall;
          if (call && call.name === 'updateProfile') {
            const args = (call as any).args;
            if (args.key && args.value) {
               // Fixed: Type 'any' is not assignable to type 'never'
               (updates as any)[args.key] = args.value;
            }
            if (args.psychometricChange) {
               const trait = args.psychometricChange.trait as keyof typeof profile.psychometrics;
               const delta = args.psychometricChange.delta;
               setProfile(prev => ({
                 ...prev,
                 psychometrics: {
                   ...prev.psychometrics,
                   [trait]: Math.min(100, Math.max(0, prev.psychometrics[trait] + delta))
                 }
               }));
            }
          }
        });

        // Apply profile updates
        if (Object.keys(updates).length > 0) {
           setProfile(prev => ({ ...prev, ...updates }));
           // Feedback to AI implies data was saved
           if (!aiText) aiText = "Daten wurden im Kernspeicher aktualisiert.";
        }
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiText || "Empfange Daten...",
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, botMsg]);
      addToDataset(userText, aiText);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Verbindungsfehler zum Mainframe. Prüfe Netzwerk.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex-1 overflow-y-auto space-y-6 p-2 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              msg.role === 'user' 
                ? 'bg-blue-600 shadow-blue-500/20' 
                : 'bg-black border border-gray-800 dark:border-gray-700 shadow-purple-500/10'
            }`}>
              {msg.role === 'user' ? <Cpu size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
            </div>
            
            <div className="flex flex-col gap-1 max-w-[85%]">
                <span className={`text-[10px] uppercase font-mono tracking-wider opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.role === 'user' ? 'Operator' : 'CORE AI'}
                </span>
                <div
                className={`p-5 rounded-2xl text-sm leading-relaxed shadow-sm backdrop-blur-md ${
                    msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-200 dark:border-gray-700'
                }`}
                >
                {msg.text}
                </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-blue-500 text-xs font-mono animate-pulse p-4">
            <Sparkles size={14} />
            <span>ANALYZING INPUT PATTERNS...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
        <div className="relative flex bg-white dark:bg-gray-900 rounded-full p-2 items-center border border-gray-200 dark:border-gray-700 shadow-2xl">
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type command..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white px-6 py-3 focus:outline-none text-base placeholder-gray-400 font-medium"
            />
            <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-black dark:bg-white text-white dark:text-black p-4 rounded-full hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
        </div>
      </div>
    </div>
  );
};