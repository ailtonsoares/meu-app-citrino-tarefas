import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  X, 
  Sparkles, 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  Smile, 
  Check, 
  BookOpen, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface GratitudeJournalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled?: boolean;
  playFocusSound?: () => void;
}

export interface GratitudeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  reflections: string;
  items: string[]; // up to 3 individual things they are grateful for
  mood: string; // e.g., 'calm' | 'joy' | 'peace' | 'inspired' | 'energy'
  createdAt: string; // ISO String
}

const GRATITUDE_QUOTES = [
  { text: "A gratidão é a memória do coração.", author: "Lao Tsé" },
  { text: "Cultivar um coração grato é abrir as portas para a plenitude da vida.", author: "Sêneca" },
  { text: "Quando agradecemos pelo que temos, o que temos se multiplica.", author: "Autor Desconhecido" },
  { text: "A gratidão não é apenas a maior das virtudes, mas a mãe de todas as outras.", author: "Cícero" },
  { text: "Agradeça pelo pouco e encontrará muito.", author: "Provérbio Hansa" },
  { text: "A pressa nos faz cegos; a gratidão nos devolve a visão.", author: "Alphonse Karr" }
];

const MOODS = [
  { id: 'peace', label: '🌸 Paz', bgColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'joy', label: '☀️ Alegria', bgColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'calm', label: '🍃 Calmaria', bgColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  { id: 'inspired', label: '✨ Inspiração', bgColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'energy', label: '💪🏽 Vitalidade', bgColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
];

export default function GratitudeJournal({ isOpen, onClose, soundEnabled = true, playFocusSound }: GratitudeJournalProps) {
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [reflections, setReflections] = useState('');
  const [item1, setItem1] = useState('');
  const [item2, setItem2] = useState('');
  const [item3, setItem3] = useState('');
  const [selectedMood, setSelectedMood] = useState('peace');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentQuote, setCurrentQuote] = useState({ text: '', author: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Initialize and load entries
  useEffect(() => {
    const saved = localStorage.getItem('citrino_gratitude_journal');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading gratitude journal entries:', err);
      }
    }

    // Set a random gratitude quote
    const randomIdx = Math.floor(Math.random() * GRATITUDE_QUOTES.length);
    setCurrentQuote(GRATITUDE_QUOTES[randomIdx]);
  }, [isOpen]);

  const saveEntriesToLocalStorage = (newEntries: GratitudeEntry[]) => {
    localStorage.setItem('citrino_gratitude_journal', JSON.stringify(newEntries));
    setEntries(newEntries);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflections.trim() && !item1.trim() && !item2.trim() && !item3.trim()) {
      return;
    }

    const todayDate = new Date().toISOString().split('T')[0];
    
    // Check if there is already an entry for today
    const existingIndex = entries.findIndex(entry => entry.date === todayDate);

    const items = [item1.trim(), item2.trim(), item3.trim()].filter(item => item !== '');

    const newEntry: GratitudeEntry = {
      id: existingIndex >= 0 ? entries[existingIndex].id : Date.now().toString(),
      date: todayDate,
      reflections: reflections.trim(),
      items,
      mood: selectedMood,
      createdAt: new Date().toISOString()
    };

    let updatedEntries = [...entries];
    if (existingIndex >= 0) {
      updatedEntries[existingIndex] = newEntry;
    } else {
      updatedEntries = [newEntry, ...updatedEntries];
    }

    saveEntriesToLocalStorage(updatedEntries);
    
    // Play sound if enabled
    if (soundEnabled && playFocusSound) {
      try {
        playFocusSound();
      } catch (err) {
        console.error(err);
      }
    }

    // Reset writing options
    setReflections('');
    setItem1('');
    setItem2('');
    setItem3('');
    setSelectedMood('peace');
    setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza de que deseja excluir este registro de gratidão? Seu histórico de sentimentos ajuda na jornada.')) {
      const filtered = entries.filter(e => e.id !== id);
      saveEntriesToLocalStorage(filtered);
    }
  };

  const prepareEditToday = () => {
    const todayDate = new Date().toISOString().split('T')[0];
    const todayEntry = entries.find(e => e.date === todayDate);
    if (todayEntry) {
      setReflections(todayEntry.reflections);
      setItem1(todayEntry.items[0] || '');
      setItem2(todayEntry.items[1] || '');
      setItem3(todayEntry.items[2] || '');
      setSelectedMood(todayEntry.mood);
    } else {
      setReflections('');
      setItem1('');
      setItem2('');
      setItem3('');
      setSelectedMood('peace');
    }
    setIsAddingNew(true);
  };

  // Filter journal entries based on search matches
  const filteredEntries = entries.filter(entry => {
    const query = searchQuery.toLowerCase();
    return (
      entry.reflections.toLowerCase().includes(query) ||
      entry.items.some(it => it.toLowerCase().includes(query)) ||
      entry.date.includes(query)
    );
  });

  const getLocalDateString = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  const hasWriteToday = entries.some(entry => entry.date === new Date().toISOString().split('T')[0]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-slate-900 border-0 sm:border border-slate-800/80 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans"
            id="gratitude-journal-modal"
          >
            {/* Elegant Header with Serif aesthetic quotes */}
            <div className="p-5 sm:p-6 border-b border-slate-850 bg-gradient-to-r from-amber-500/5 via-rose-500/5 to-purple-500/5 relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-950/50 hover:bg-slate-950 p-2 rounded-full transition-all cursor-pointer border border-slate-800"
                title="Fechar Diário de Gratidão"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
                  <Heart className="h-4 w-4 fill-current animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase text-white tracking-widest leading-none">
                    DIÁRIO DE <span className="text-amber-400">GRATIDÃO</span>
                  </h2>
                  <p className="text-[10px] font-mono font-bold text-slate-500 uppercase mt-0.5">
                    Seu espaço interior de calmaria e consideração
                  </p>
                </div>
              </div>

              {/* Minimalist beautiful quote section */}
              <div className="mt-4 px-3 py-2.5 bg-slate-950/40 rounded-xl border border-slate-850/50">
                <p className="font-serif italic text-xs sm:text-sm text-slate-300 leading-relaxed text-center">
                  "{currentQuote.text}"
                </p>
                <p className="text-[10px] text-right text-slate-500 font-mono mt-1 font-bold">
                  — {currentQuote.author}
                </p>
              </div>
            </div>

            {/* Scrollable Journal area */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {!isAddingNew ? (
                // HISTORY VIEW MODE
                <div className="space-y-4">
                  {/* Action row */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Pesquisar lembranças felizes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-850 bg-slate-950 pl-9 pr-4 py-2 text-xs text-slate-300 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={prepareEditToday}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 hover:text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/10 cursor-pointer active:scale-95 transition-all py-2 whitespace-nowrap"
                    >
                      {hasWriteToday ? (
                        <>
                          <BookOpen className="h-4 w-4" />
                          <span>Atualizar Hoje</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Cultivar Gratidão Hoje</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Empty State */}
                  {filteredEntries.length === 0 && (
                    <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/20">
                      <div className="h-12 w-12 rounded-full bg-slate-950/50 flex items-center justify-center text-slate-750 mx-auto mb-3">
                        <Sparkles className="h-6 w-6 text-slate-600" />
                      </div>
                      <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nenhum registro encontrado</h3>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto font-mono">
                        {searchQuery 
                          ? 'Revise seu termo de pesquisa ou tente palavras mais simples.' 
                          : 'As pequenas vitórias merecem ser salvas. Comece registrando o que te fez sorrir hoje.'
                        }
                      </p>
                    </div>
                  )}

                  {/* List of Entries */}
                  {filteredEntries.map((entry) => {
                    const moodObj = MOODS.find(m => m.id === entry.mood) || MOODS[0];
                    return (
                      <motion.div
                        layout
                        key={entry.id}
                        className="p-4 rounded-xl border border-slate-850 bg-slate-950/30 hover:bg-slate-950/50 hover:border-slate-800 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-[10px] font-mono tracking-wider font-extrabold text-amber-500 flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {getLocalDateString(entry.date)}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${moodObj.bgColor} w-fit`}>
                              {moodObj.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 self-start">
                            {entry.date === new Date().toISOString().split('T')[0] && (
                              <button
                                onClick={prepareEditToday}
                                className="text-[9px] font-bold text-slate-400 hover:text-amber-500 bg-slate-900 px-2 py-1 rounded border border-slate-800 hover:border-amber-500/20 cursor-pointer"
                              >
                                Editar
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                              title="Excluir do diário"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Gratitude items */}
                        {entry.items && entry.items.length > 0 && (
                          <div className="mb-3 space-y-1">
                            <p className="text-[9px] font-black uppercase text-slate-550 tracking-wider leading-none">
                              Pelo que sou grato(a):
                            </p>
                            <div className="space-y-1 mt-1.5 pl-1.5">
                              {entry.items.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                                  <span className="text-amber-500/80 mt-0.5 font-bold">✨</span>
                                  <p className="leading-relaxed font-serif italic text-slate-200">{item}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Detailed text */}
                        {entry.reflections && (
                          <div className="mt-2 pt-2 border-t border-slate-900/40">
                            <p className="text-[9px] font-black uppercase text-slate-550 tracking-wider leading-none mb-1">
                              Reflexões do dia:
                            </p>
                            <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed font-sans pl-1">
                              {entry.reflections}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                // ADDING / EDITING DIARY MODE
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider">
                      Escrever Considerações de Hoje
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-slate-950/50 px-2.5 py-1 rounded-lg border border-slate-800"
                    >
                      <X className="h-3 w-3" /> Cancelar
                    </button>
                  </div>

                  {/* 3 Simple Elements of Gratitude */}
                  <div className="p-4 rounded-xl border border-slate-850 bg-slate-950/40 space-y-3">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-450 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-current" />
                        Três motivos para agradecer hoje
                      </h4>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                        Escreva até 3 detalhes específicos e simples que iluminaram seu dia
                      </p>
                    </div>

                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2 border-b border-slate-900 focus-within:border-amber-500/30 pb-1.5">
                        <span className="text-xs font-bold text-amber-500">1</span>
                        <input
                          type="text"
                          maxLength={120}
                          placeholder="Sou grato(a) por..."
                          value={item1}
                          onChange={(e) => setItem1(e.target.value)}
                          className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none font-serif italic"
                        />
                      </div>

                      <div className="flex items-center gap-2 border-b border-slate-900 focus-within:border-amber-500/30 pb-1.5">
                        <span className="text-xs font-bold text-amber-500">2</span>
                        <input
                          type="text"
                          maxLength={120}
                          placeholder="Também agradeço por..."
                          value={item2}
                          onChange={(e) => setItem2(e.target.value)}
                          className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none font-serif italic"
                        />
                      </div>

                      <div className="flex items-center gap-2 border-b border-slate-900 focus-within:border-amber-500/30 pb-1.5">
                        <span className="text-xs font-bold text-amber-500">3</span>
                        <input
                          type="text"
                          maxLength={120}
                          placeholder="Agradeço também por..."
                          value={item3}
                          onChange={(e) => setItem3(e.target.value)}
                          className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none font-serif italic"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Detailed Considerations text area */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Minhas reflexões e pensamentos (Opcional)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Como você descreveria este momento de consideração? Escrever ajuda a desvendar nossos pensamentos e alinhar o sentimento de tranquilidade..."
                      value={reflections}
                      onChange={(e) => setReflections(e.target.value)}
                      className="w-full rounded-xl border border-slate-850 bg-slate-950 p-3 text-xs text-slate-300 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all font-sans leading-relaxed"
                    />
                  </div>

                  {/* Simple mood selection */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Qual sentimento resume seu estado de espírito hoje?
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {MOODS.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMood(m.id)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border cursor-pointer active:scale-95 transition-all duration-150 ${
                            selectedMood === m.id
                              ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-md'
                              : 'bg-slate-950/50 hover:bg-slate-850 border-slate-850 text-slate-400'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-3 border-t border-slate-900 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl transition-all cursor-pointer"
                    >
                      Voltar ao Histórico
                    </button>
                    <button
                      type="submit"
                      disabled={!reflections.trim() && !item1.trim() && !item2.trim() && !item3.trim()}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 disabled:hover:text-slate-950 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all text-center cursor-pointer"
                    >
                      <Check className="h-4 w-4 stroke-[3]" /> Salvar Registro Grato
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Micro Footer detailing persistent storage indicators */}
            <div className="p-3 bg-slate-950/60 border-t border-slate-850 flex items-center justify-between text-[9px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Smile className="h-3 w-3 text-amber-500/60" /> Cultive a atenção plena no dia a dia.
              </span>
              <span>
                Persistido no Navegador (Offline-ready)
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
