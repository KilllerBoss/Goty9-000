import React, { useState, useRef, useEffect } from 'react';
import { chatWithMentor } from '../services/geminiService';
import { ChatMessage, UserProfile } from '../types';
import { Send, Sparkles, MoreVertical } from 'lucide-react';

interface NeuralStreamProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  addToDataset: (input: string, output: string) => void;
  openIdentityCore: () => void;
}

export const NeuralStream: React.FC<NeuralStreamProps> = ({ profile, setProfile, addToDataset, openIdentityCore }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'model',
      text: 'System online. \nWie kann ich dir heute helfen, dein Ziel zu erreichen?',
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
      let dataUpdated = false;

      const toolCalls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall);
      if (toolCalls && toolCalls.length > 0) {
        let updates: Partial<UserProfile> = {};
        toolCalls.forEach(part => {
          const call = part.functionCall;
          if (call && call.name === 'updateProfile') {
            const args = (call as any).args;
            if (args.key && args.value) (updates as any)[args.key] = args.value;
            if (args.psychometricChange) {
               const trait = args.psychometricChange.trait as keyof typeof profile.psychometrics;
               const delta = args.psychometricChange.delta;
               setProfile(prev => ({
                 ...prev,
                 psychometrics: { ...prev.psychometrics, [trait]: Math.min(100, Math.max(0, prev.psychometrics[trait] + delta)) }
               }));
            }
          }
        });
        if (Object.keys(updates).length > 0) {
           setProfile(prev => ({ ...prev, ...updates }));
           dataUpdated = true;
           if (!aiText) aiText = "Profil aktualisiert.";
        }
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, botMsg]);
      addToDataset(userText, aiText);

      if (dataUpdated) {
         // Subtle feedback instead of forcing view change
      }

    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Verbindungsfehler. Bitte erneut versuchen.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black rounded-t-4xl mt-2 border-t border-white/5 relative overflow-hidden">
      
      {/* Header for Chat */}
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-white">CORE Assistant</h3>
            <span className="text-xs text-secondary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
            </span>
          </div>
        </div>
        <button className="p-2 text-secondary"><MoreVertical size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}
          >
            <div 
              className={`max-w-[80%] px-5 py-3.5 rounded-3xl text-[15px] leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-surface-variant text-white rounded-bl-none'
              }`}
            >
              {msg.text.split('\n').map((line, i) => <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>)}
            </div>
            <span className="text-[10px] text-secondary mt-1 px-1">
               {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="self-start bg-surface-variant px-4 py-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
             <div className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce"></div>
             <div className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce delay-100"></div>
             <div className="w-2 h-2 bg-secondary/50 rounded-full animate-bounce delay-200"></div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface pb-safe">
        <div className="flex items-center gap-2 bg-black rounded-full px-2 py-2 border border-white/5 focus-within:border-primary/50 transition-colors">
           <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nachricht eingeben..."
            className="flex-1 bg-transparent text-white placeholder-secondary px-4 py-2 focus:outline-none"
            />
            <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 bg-primary rounded-full text-white disabled:opacity-50 disabled:bg-surface-variant transition-all hover:scale-105"
            >
            <Send size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};