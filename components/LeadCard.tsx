import React, { useState } from 'react';
import { Lead } from '../types';
import { Calendar, Mail, ExternalLink, User, Send, MessageCircle, ChevronDown, ChevronUp, Linkedin, Facebook, Instagram, Star, Sparkles } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  isSaved: boolean;
  onToggleSave: (lead: Lead) => void;
  onGenerateProposal: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, isSaved, onToggleSave, onGenerateProposal }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const proposalText = encodeURIComponent(`Здравствуйте! Меня заинтересовал ваш проект "${lead.title}".`);

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.contacts.email) {
      window.location.href = `mailto:${lead.contacts.email}?subject=Предложение по разработке: ${lead.title}&body=${proposalText}`;
    }
  };

  const getTelegramUrl = (tg: string) => {
    const cleanTg = tg.replace('https://t.me/', '').replace('@', '');
    return `https://t.me/${cleanTg}`;
  };

  const getWhatsappUrl = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${proposalText}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 dark:border-slate-700 transition-all duration-300 overflow-hidden flex flex-col h-full group relative">
      {/* Country Badge */}
      {lead.country && (
        <div className="absolute top-0 right-0 bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 shadow-sm">
          {lead.country}
        </div>
      )}

      <div className="p-5 sm:p-6 flex-1 relative">
        <div className="flex justify-between items-start mb-4 pr-12">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2">
                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-indigo-500/10 dark:text-indigo-300 border border-slate-200 dark:border-indigo-500/20">
                   {lead.platform}
                 </span>
               </div>
               
               {/* Save Button */}
               <button 
                  onClick={() => onToggleSave(lead)}
                  className={`p-2 rounded-full transition-colors ${isSaved ? 'text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10' : 'text-slate-400 hover:text-yellow-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  title={isSaved ? "Убрать из избранного" : "Сохранить"}
               >
                 <Star className={`w-5 h-5 ${isSaved ? 'fill-yellow-400' : ''}`} />
               </button>
            </div>
            
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {lead.title}
            </h3>
            
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 gap-3 mb-3">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-md border border-slate-100 dark:border-transparent">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-medium">{lead.date}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className={`text-slate-600 dark:text-slate-300 text-sm leading-relaxed transition-all duration-200 ${isExpanded ? '' : 'line-clamp-3'}`}>
            {lead.description}
          </p>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 inline-flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 focus:outline-none uppercase tracking-wide py-1"
          >
            {isExpanded ? (
              <>Свернуть <ChevronUp className="w-3 h-3 ml-1" /></>
            ) : (
              <>Раскрыть <ChevronDown className="w-3 h-3 ml-1" /></>
            )}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {lead.tags.map((tag, idx) => (
            <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/40 px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
        {/* Contact Info Row */}
        {lead.contacts.contactName && (
           <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
            <User className="w-4 h-4 mr-2 text-indigo-500" />
            <span className="font-bold">{lead.contacts.contactName}</span>
          </div>
        )}

        {/* AI Action Button */}
        <button
          onClick={() => onGenerateProposal(lead)}
          className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Сгенерировать отклик
        </button>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2">
           {lead.contacts.telegram && (
            <a 
              href={getTelegramUrl(lead.contacts.telegram)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-2.5 bg-[#24A1DE] hover:bg-[#24A1DE]/90 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Telegram
            </a>
          )}
          
          {lead.contacts.whatsapp && (
             <a 
              href={getWhatsappUrl(lead.contacts.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-2.5 bg-[#25D366] hover:bg-[#25D366]/90 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
              WhatsApp
            </a>
          )}

          {lead.contacts.email && (
            <button 
              onClick={handleEmailClick}
              className="flex items-center justify-center px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-all"
            >
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              Email
            </button>
          )}

          {/* Socials fallback logic to not crowd the UI */}
          {!lead.contacts.telegram && !lead.contacts.whatsapp && lead.contacts.linkedin && (
             <a 
              href={lead.contacts.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-2.5 bg-[#0077b5] hover:bg-[#0077b5]/90 text-white text-xs font-bold rounded-lg transition-all"
            >
              <Linkedin className="w-3.5 h-3.5 mr-1.5" />
              LinkedIn
            </a>
          )}
        </div>
        
        {/* Footer Link */}
        <div className="pt-2">
             <a 
              href={lead.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 text-xs font-bold transition-colors py-1"
            >
              Открыть источник <ExternalLink className="w-3 h-3 ml-1" />
            </a>
        </div>
      </div>
    </div>
  );
};