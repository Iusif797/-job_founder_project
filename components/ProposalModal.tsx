import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, ChevronDown } from 'lucide-react';
import { Lead } from '../types';
import { generateCoverLetter } from '../services/geminiService';

interface ProposalModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({ lead, isOpen, onClose }) => {
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [skills, setSkills] = useState('Web Development, React, Modern UI/UX');

  if (!isOpen || !lead) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const text = await generateCoverLetter(lead, skills);
      setGeneratedText(text);
    } catch (e) {
      setGeneratedText("Could not generate text. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Ассистент отклика</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="mb-5 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/30">
             <label className="block text-xs font-bold uppercase tracking-wide text-indigo-500 mb-1">Клиент / Проект</label>
             <p className="text-sm font-semibold text-slate-900 dark:text-white">{lead.title}</p>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Ваши навыки (для контекста)</label>
            <div className="relative">
              <input 
                type="text" 
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full text-sm p-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-0 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="relative">
            <div className="flex justify-between items-end mb-2">
               <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Черновик сообщения</label>
               {generatedText && (
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    {copied ? 'Скопировано' : 'Копировать'}
                  </button>
               )}
            </div>
            
            <textarea
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
              placeholder="Нажмите 'Сгенерировать', чтобы ИИ написал сопроводительное письмо..."
              className="w-full h-48 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm leading-relaxed focus:border-indigo-500 focus:ring-0 outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Отмена
          </button>
          <button 
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70 active:scale-95"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Думаю...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {generatedText ? 'Переписать' : 'Сгенерировать'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};