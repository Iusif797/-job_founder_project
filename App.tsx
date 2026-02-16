import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LeadCard } from './components/LeadCard';
import { ProposalModal } from './components/ProposalModal';
import { findLeads } from './services/geminiService';
import { Lead, LoadingState, SearchFilters } from './types';
import { Search, MapPin, Code2, AlertCircle, Loader2, Calendar, Filter, Globe, Star, LayoutGrid, Rocket, X, Menu, SlidersHorizontal, ChevronUp, ChevronDown, Briefcase, Zap } from 'lucide-react';

const App: React.FC = () => {
  // Theme State
  const [darkMode, setDarkMode] = useState(false);

  // Search State
  const [filters, setFilters] = useState<SearchFilters>({
    mode: 'freelance', // Default mode
    keyword: '',
    location: 'Worldwide',
    category: 'All',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Data State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // UI State
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [contactFilter, setContactFilter] = useState<'All' | 'Telegram' | 'WhatsApp' | 'Email' | 'Socials'>('All');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(true); // Open by default for first visit
  
  // Modal State
  const [selectedLeadForProposal, setSelectedLeadForProposal] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Init
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('savedLeads');
    if (saved) {
      try {
        setSavedLeads(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved leads", e);
      }
    }
  }, []);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Actions
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === LoadingState.LOADING) return;
    setActiveTab('search');
    setStatus(LoadingState.LOADING);
    setLeads([]);
    setErrorMsg('');
    setIsMobileFiltersOpen(false); // Collapse filters on mobile after search starts

    try {
      const results = await findLeads(
        filters.mode,
        filters.keyword, 
        filters.location, 
        filters.category,
        filters.startDate,
        filters.endDate
      );
      
      const sortedResults = results.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setLeads(sortedResults);
      setStatus(LoadingState.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(LoadingState.ERROR);
      setErrorMsg('Не удалось найти данные. Попробуйте изменить запрос или даты.');
    }
  };

  const handleToggleSave = (lead: Lead) => {
    let newSaved;
    const exists = savedLeads.find(l => l.id === lead.id);
    
    if (exists) {
      newSaved = savedLeads.filter(l => l.id !== lead.id);
    } else {
      newSaved = [lead, ...savedLeads];
    }
    
    setSavedLeads(newSaved);
    localStorage.setItem('savedLeads', JSON.stringify(newSaved));
  };

  const handleOpenProposal = (lead: Lead) => {
    setSelectedLeadForProposal(lead);
    setIsModalOpen(true);
  };

  // Filtering
  const activeLeads = activeTab === 'search' ? leads : savedLeads;
  
  const filteredLeads = activeLeads.filter(lead => {
    // Platform Filter
    if (platformFilter !== 'All' && !lead.platform.toLowerCase().includes(platformFilter.toLowerCase())) {
      return false;
    }
    // Country Filter
    if (countryFilter !== 'All') {
      if (!lead.country) return false;
      if (!lead.country.toLowerCase().includes(countryFilter.toLowerCase())) return false;
    }
    // Contact Filter
    if (contactFilter === 'Telegram' && !lead.contacts.telegram) return false;
    if (contactFilter === 'WhatsApp' && !lead.contacts.whatsapp) return false;
    if (contactFilter === 'Email' && !lead.contacts.email) return false;
    if (contactFilter === 'Socials' && (!lead.contacts.linkedin && !lead.contacts.facebook && !lead.contacts.instagram && !lead.contacts.vk)) return false;

    return true;
  });

  const uniquePlatforms = Array.from(new Set(activeLeads.map(l => l.platform)));
  const uniqueCountries = Array.from(new Set(activeLeads.filter(l => l.country).map(l => l.country!)));

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 pb-24 md:pb-10 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        
        {/* Mobile Filter Toggle Button */}
        <div className="md:hidden mb-4">
          <button 
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className={`w-full flex items-center justify-between p-4 rounded-xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
          >
             <div className="flex items-center gap-2">
               <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
               <span className="font-bold text-sm">Параметры поиска</span>
             </div>
             {isMobileFiltersOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
        </div>

        {/* Search Section */}
        <div className={`${isMobileFiltersOpen ? 'block' : 'hidden'} md:block animate-in fade-in slide-in-from-top-4 duration-300`}>
          <section className={`rounded-3xl shadow-xl shadow-indigo-500/5 border p-5 sm:p-8 mb-8 transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            
            {/* Mode Switcher */}
            <div className="flex justify-center mb-8">
              <div className={`p-1.5 rounded-2xl flex w-full max-w-md ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <button
                  onClick={() => setFilters({ ...filters, mode: 'freelance' })}
                  className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${filters.mode === 'freelance' ? 'bg-white text-indigo-600 shadow-md dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Фриланс / Заказы
                </button>
                <button
                  onClick={() => setFilters({ ...filters, mode: 'vacancy' })}
                  className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${filters.mode === 'vacancy' ? 'bg-white text-indigo-600 shadow-md dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Работа / Вакансии
                </button>
              </div>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="relative">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {filters.mode === 'freelance' ? 'Ключевые слова' : 'Должность / Позиция'}
                  </label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      required
                      value={filters.keyword}
                      onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                      placeholder={filters.mode === 'freelance' ? "Например: React, Лендинг..." : "Например: Vibe Coder, Frontend..."}
                      className={`pl-11 w-full rounded-2xl border-2 py-3 px-4 text-sm font-medium focus:outline-none focus:ring-0 transition-colors ${darkMode ? 'bg-slate-950 border-slate-700 focus:border-indigo-500 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'}`}
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Регион поиска</label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <select
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value as any })}
                      className={`pl-11 w-full rounded-2xl border-2 py-3 px-4 text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-0 transition-colors ${darkMode ? 'bg-slate-950 border-slate-700 focus:border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'}`}
                    >
                      <option value="Worldwide">Весь мир (Telegram, FB, Upwork)</option>
                      <option value="Israel">Израиль (Facebook, LinkedIn)</option>
                      <option value="Russia">Россия и СНГ (TG, VK, Habr)</option>
                      <option value="Europe">Европа (LinkedIn, Indeed)</option>
                      <option value="USA">США (RemoteOK, Reddit)</option>
                      <option value="Asia">Азия</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Дата от</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className={`pl-11 w-full rounded-2xl border-2 py-3 px-4 text-sm font-medium focus:outline-none focus:ring-0 transition-colors ${darkMode ? 'bg-slate-950 border-slate-700 focus:border-indigo-500 text-white [color-scheme:dark]' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'}`}
                    />
                  </div>
                </div>
                 <div className="relative">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Дата до</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className={`pl-11 w-full rounded-2xl border-2 py-3 px-4 text-sm font-medium focus:outline-none focus:ring-0 transition-colors ${darkMode ? 'bg-slate-950 border-slate-700 focus:border-indigo-500 text-white [color-scheme:dark]' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'}`}
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Категория</label>
                  <div className="relative group">
                    <Code2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value as any })}
                      className={`pl-11 w-full rounded-2xl border-2 py-3 px-4 text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-0 transition-colors ${darkMode ? 'bg-slate-950 border-slate-700 focus:border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'}`}
                    >
                      <option value="All">Все категории</option>
                      <option value="Web">Web Разработка</option>
                      <option value="Mobile">iOS / Android</option>
                      <option value="Design">UI/UX Дизайн</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Centered Button Section */}
              <div className="flex justify-center pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={status === LoadingState.LOADING}
                  className="group relative w-full md:w-2/3 lg:w-1/2 inline-flex justify-center items-center py-4 px-8 border border-transparent shadow-xl shadow-indigo-500/40 text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-size-200 bg-pos-0 hover:bg-pos-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
                  style={{ backgroundSize: '200% 100%' }}
                >
                  {status === LoadingState.LOADING ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6" />
                      <span className="animate-pulse">
                        {filters.mode === 'freelance' ? 'Ищем заказы...' : 'Ищем вакансии...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-6 h-6 mr-3 group-hover:animate-bounce" />
                      {filters.mode === 'freelance' ? 'НАЙТИ ЗАКАЗЫ' : 'НАЙТИ ВАКАНСИИ'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Tabs & Filters (Desktop only tabs) */}
        <div className="mb-6 space-y-4">
          
          {/* Main Tabs - Hidden on Mobile */}
          <div className="hidden md:flex border-b border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab('search')}
              className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'search' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <LayoutGrid className="w-4 h-4 inline-block mr-2" />
              Результаты ({leads.length})
            </button>
            <button 
              onClick={() => setActiveTab('saved')}
              className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'saved' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Star className="w-4 h-4 inline-block mr-2" />
              Избранное ({savedLeads.length})
            </button>
          </div>

          {/* Sub Filters - Always visible but styled better for mobile */}
          <div className={`p-4 rounded-xl border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
             <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {activeTab === 'search' ? 'Найдено' : 'Сохранено'}: {filteredLeads.length}
                </span>
             </div>
             
             <div className="w-full lg:w-auto flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                   <Filter className="w-4 h-4 text-slate-400" />
                   <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Фильтры:</span>
                </div>
                
                <select 
                   value={platformFilter}
                   onChange={(e) => setPlatformFilter(e.target.value)}
                   className={`flex-1 sm:flex-none text-sm rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                >
                   <option value="All">Все платформы</option>
                   {uniquePlatforms.map(p => (
                     <option key={p} value={p}>{p}</option>
                   ))}
                </select>

                <select 
                   value={countryFilter}
                   onChange={(e) => setCountryFilter(e.target.value)}
                   className={`flex-1 sm:flex-none text-sm rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                >
                   <option value="All">Все страны</option>
                   {uniqueCountries.map(c => (
                     <option key={c} value={c}>{c}</option>
                   ))}
                </select>

                <select 
                   value={contactFilter}
                   onChange={(e) => setContactFilter(e.target.value as any)}
                   className={`flex-1 sm:flex-none text-sm rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                >
                   <option value="All">Все контакты</option>
                   <option value="Telegram">Есть Telegram</option>
                   <option value="WhatsApp">Есть WhatsApp</option>
                   <option value="Email">Есть Email</option>
                </select>
             </div>
          </div>
        </div>

        {/* Results Area */}
        <section>
          {status === LoadingState.ERROR && activeTab === 'search' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 flex flex-col items-center text-center text-red-700 dark:text-red-300">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          {status === LoadingState.IDLE && activeTab === 'search' && (
            <div className={`text-center py-20 px-6 rounded-3xl border border-dashed ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${darkMode ? 'bg-slate-800' : 'bg-indigo-50'}`}>
                {filters.mode === 'freelance' ? (
                  <Zap className={`w-10 h-10 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                ) : (
                  <Briefcase className={`w-10 h-10 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                )}
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {filters.mode === 'freelance' ? 'Поиск заказов' : 'Поиск вакансий'}
              </h3>
              <p className={`max-w-md mx-auto leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {filters.mode === 'freelance' 
                  ? 'Мы найдем для вас разовые проекты, фриланс-задачи и срочные заказы.' 
                  : 'Мы найдем долгосрочные контракты, вакансии в штате и предложения с релокацией.'}
              </p>
            </div>
          )}

          {activeTab === 'saved' && savedLeads.length === 0 && (
             <div className={`text-center py-20 px-6 rounded-3xl border border-dashed ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${darkMode ? 'bg-slate-800' : 'bg-indigo-50'}`}>
                <Star className={`w-10 h-10 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Избранное пусто</h3>
              <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                Нажимайте на звездочку в карточке, чтобы сохранить её здесь.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeads.map((lead) => (
              <LeadCard 
                key={lead.id} 
                lead={lead} 
                isSaved={!!savedLeads.find(l => l.id === lead.id)}
                onToggleSave={handleToggleSave}
                onGenerateProposal={handleOpenProposal}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 md:hidden border-t backdrop-blur-lg ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="grid grid-cols-2 h-16">
          <button 
            onClick={() => {
              setActiveTab('search');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'search' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <LayoutGrid className={`w-6 h-6 ${activeTab === 'search' ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium">Поиск</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab('saved');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'saved' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <Star className={`w-6 h-6 ${activeTab === 'saved' ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium">Избранное</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <ProposalModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lead={selectedLeadForProposal}
      />

    </div>
  );
};

export default App;