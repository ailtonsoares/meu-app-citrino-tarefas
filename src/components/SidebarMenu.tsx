import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sun, 
  Moon, 
  Clock, 
  Calendar, 
  BookOpen, 
  CheckSquare, 
  Plus, 
  StickyNote, 
  Save, 
  Trash2, 
  Sparkles, 
  ChevronRight, 
  Briefcase, 
  User, 
  ShoppingCart, 
  GraduationCap, 
  AlarmClock, 
  Check, 
  Search,
  BellRing,
  Inbox,
  Tv
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { TaskPriority } from '../types';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EventItem {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
}

const CATEGORY_ICONS: { [key: string]: any } = {
  'Trabalho': Briefcase,
  'Pessoal': User,
  'Lista de compras': ShoppingCart,
  'Estudos': GraduationCap,
};

export default function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  const {
    tasks,
    addTask,
    theme,
    toggleTheme,
    soundEnabled,
    playFocusSound
  } = useTasks();

  // Local clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hourFormat24, setHourFormat24] = useState<boolean>(() => {
    const saved = localStorage.getItem('citrino_hour_format');
    return saved !== '12';
  });

  // Toggles for different views inside Sidebar
  const [activeSection, setActiveSection] = useState<'none' | 'agenda' | 'novo' | 'anotacoes' | 'eventos'>('none');

  // Notes state
  const [menuNotes, setMenuNotes] = useState(() => {
    return localStorage.getItem('citrino_menu_notes') || '';
  });
  const [notesSaveStatus, setNotesSaveStatus] = useState(false);

  // Events state
  const [events, setEvents] = useState<EventItem[]>(() => {
    const saved = localStorage.getItem('citrino_menu_events');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      { id: '1', date: new Date().toISOString().split('T')[0], description: 'Aniversário da Citrino Tarefas' }
    ];
  });

  // Event creation form
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // New task form state (specific to Sidebar "Novo" button)
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<'Trabalho' | 'Pessoal' | 'Lista de compras' | 'Estudos'>('Trabalho');
  const [taskDeadline, setTaskDeadline] = useState<'hoje' | 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab'>('hoje');
  const [taskReminderMins, setTaskReminderMins] = useState<number>(15);
  const [taskTime, setTaskTime] = useState('09:00');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');

  // Keep clock updated
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleHourFormat = () => {
    const newVal = !hourFormat24;
    setHourFormat24(newVal);
    localStorage.setItem('citrino_hour_format', newVal ? '24' : '12');
    if (soundEnabled && playFocusSound) {
      try { playFocusSound(); } catch (err) {}
    }
  };

  const getLocalDateString = () => {
    return currentTime.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatClockTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    if (hourFormat24) {
      return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
    } else {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // first hour is 12
      return `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    }
  };

  // Safe loading note saver
  const saveMenuNotes = () => {
    localStorage.setItem('citrino_menu_notes', menuNotes);
    setNotesSaveStatus(true);
    if (soundEnabled && playFocusSound) {
      try { playFocusSound(); } catch (err) {}
    }
    setTimeout(() => {
      setNotesSaveStatus(false);
    }, 2500);
  };

  // Safe loading event saver
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventDate || !newEventDesc.trim()) return;

    const added: EventItem = {
      id: Date.now().toString(),
      date: newEventDate,
      description: newEventDesc.trim()
    };

    const updated = [...events, added].sort((a, b) => a.date.localeCompare(b.date));
    setEvents(updated);
    localStorage.setItem('citrino_menu_events', JSON.stringify(updated));

    setNewEventDate('');
    setNewEventDesc('');
    setIsCreatingEvent(false);

    if (soundEnabled && playFocusSound) {
      try { playFocusSound(); } catch (err) {}
    }
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter(ev => ev.id !== id);
    setEvents(updated);
    localStorage.setItem('citrino_menu_events', JSON.stringify(updated));
  };

  // Map day selector to modern date YYYY-MM-DD strings
  const getDatesOfCurrentWeek = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const datesMap: { [key: string]: string } = {};
    
    const dayKeys = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      const diff = i - currentDayOfWeek;
      date.setDate(today.getDate() + diff);
      
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      datesMap[dayKeys[i]] = `${yyyy}-${mm}-${dd}`;
    }
    return datesMap;
  };

  const weekDates = getDatesOfCurrentWeek();

  const handleCreateTaskFromMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    let targetDateStr = '';
    const todayDateStr = new Date().toISOString().split('T')[0];

    if (taskDeadline === 'hoje') {
      targetDateStr = todayDateStr;
    } else {
      targetDateStr = weekDates[taskDeadline] || todayDateStr;
    }

    addTask({
      title: taskTitle.trim(),
      description: `Criada via painel lateral • Categoria: ${taskType}`,
      completed: false,
      dueDate: targetDateStr,
      dueTime: taskTime,
      priority: taskPriority,
      category: taskType,
      reminderMinutes: taskReminderMins,
      recurrence: 'none',
      pomodorosTarget: 1
    });

    setTaskTitle('');
    setTaskDeadline('hoje');
    setTaskReminderMins(15);
    setTaskTime('09:00');
    setTaskPriority('medium');
    setActiveSection('agenda'); // auto transition to agenda view to show tasks!

    if (soundEnabled && playFocusSound) {
      try { playFocusSound(); } catch (err) {}
    }
  };

  // Group weekly tasks for "Agenda" view
  const currentWeekDaysList = (() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const list: { key: string; name: string; dateString: string }[] = [];
    const dayKeys = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      const diff = i - currentDayOfWeek;
      date.setDate(today.getDate() + diff);
      
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      list.push({
        key: dayKeys[i],
        name: dayNames[i],
        dateString: `${yyyy}-${mm}-${dd}`
      });
    }
    return list;
  })();

  const formatEventDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return date.toLocaleDateString('pt-BR', { 
        day: 'numeric', 
        month: 'short'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end font-sans">
          {/* Overlay Backdrop background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          {/* Sliding Sidebar Body Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-sm h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10 overflow-hidden"
            id="sidebar-menu-body"
          >
            {/* 1. Header & Digital Clock Section */}
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-amber-500/5 via-rose-500/5 to-purple-500/5 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-950/50 hover:bg-slate-950 p-2 rounded-xl border border-slate-800 transition-all cursor-pointer"
                title="Fechar Menu"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-black">
                  Menu Lateral Citrino
                </span>
              </div>

              {/* Precise Digital Clock Layout */}
              <div className="py-2.5 px-4 bg-slate-950/60 rounded-xl border border-slate-850 text-center relative group">
                <h3 className="font-mono text-2xl font-black text-amber-500 tracking-wider">
                  {formatClockTime(currentTime)}
                </h3>
                <p className="text-[11px] font-medium text-slate-400 mt-1 capitalize">
                  {getLocalDateString()}
                </p>
                <span className="absolute right-3.5 bottom-1.5 text-[8px] font-mono text-slate-600 font-bold">
                  {hourFormat24 ? 'UTC-3 (24h)' : 'UTC-3 (12h)'}
                </span>
              </div>
            </div>

            {/* 2. Top Fast Toggles & Settings Selector */}
            <div className="p-4 grid grid-cols-2 gap-2 border-b border-slate-850 bg-slate-950/20">
              {/* Light vs Dark Selector */}
              <button
                onClick={toggleTheme}
                type="button"
                className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-350 hover:text-slate-100 transition-all cursor-pointer active:scale-95"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-500 animate-[spin_10s_linear_infinite]" />
                    <span>Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Modo Escuro</span>
                  </>
                )}
              </button>

              {/* Format selector */}
              <button
                onClick={toggleHourFormat}
                type="button"
                className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-350 hover:text-slate-100 transition-all cursor-pointer active:scale-95"
                title="Mudar formato da hora (12h vs 24h)"
              >
                <Clock className="h-3.5 w-3.5 text-rose-500" />
                <span>Formato: {hourFormat24 ? '24h' : '12h'}</span>
              </button>
            </div>

            {/* 3. Core Sidebar Navigation buttons */}
            <div className="p-4 grid grid-cols-4 gap-1.5 border-b border-slate-850 bg-slate-950/40">
              {[
                { id: 'agenda', label: 'Agenda', icon: BookOpen, color: 'text-amber-500 border-amber-500/20' },
                { id: 'novo', label: 'Novo', icon: Plus, color: 'text-emerald-500 border-emerald-500/20' },
                { id: 'anotacoes', label: 'Notas', icon: StickyNote, color: 'text-blue-500 border-blue-500/20' },
                { id: 'eventos', label: 'Eventos', icon: Calendar, color: 'text-purple-500 border-purple-500/20' }
              ].map(sec => {
                const Icon = sec.icon;
                const isSelected = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      if (activeSection === sec.id) {
                        setActiveSection('none');
                      } else {
                        setActiveSection(sec.id as any);
                      }
                      if (soundEnabled && playFocusSound) {
                        try { playFocusSound(); } catch (err) {}
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 cursor-pointer active:scale-95 ${
                      isSelected 
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md' 
                        : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-100 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${isSelected ? 'text-slate-950' : sec.color.split(' ')[0]} mb-1.5`} />
                    <span className="text-[10px] font-black uppercase tracking-wider">{sec.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 4. Interactive Section Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* DEFAULT HOME INFO PANEL IF NONE SELECTED */}
              {activeSection === 'none' && (
                <div className="space-y-4 py-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500/70 border border-amber-500/25 mx-auto mb-3 text-lg">
                    ✨
                  </div>
                  <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">
                    Modo Navegação Inteligente
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-500 max-w-xs mx-auto font-sans">
                    Utilize as abas acima para agendar novas tarefas por categoria, verificar a agenda detalhada da semana de forma rápida, registrar anotações ou programar compromissos futuros.
                  </p>

                  {/* Micro list of today's pending tasks */}
                  <div className="pt-4 mt-4 border-t border-slate-850/60 text-left">
                    <span className="text-[9px] font-black uppercase text-slate-450 tracking-wider block mb-2">
                      Hoje Rápido (Inbox para Hoje):
                    </span>

                    <div className="space-y-1.5">
                      {tasks.filter(t => t.dueDate === new Date().toISOString().split('T')[0]).slice(0, 4).map(item => (
                        <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-950/40 rounded-lg border border-slate-850">
                          <CheckSquare className={`h-3.5 w-3.5 shrink-0 ${item.completed ? 'text-emerald-500' : 'text-slate-600'}`} />
                          <span className={`text-[11px] font-bold truncate ${item.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                            {item.title}
                          </span>
                        </div>
                      ))}
                      {tasks.filter(t => t.dueDate === new Date().toISOString().split('T')[0]).length === 0 && (
                        <p className="text-[10px] text-slate-650 font-mono italic">
                          Tudo limpo por hoje! Aproveite o momento.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* AGENDA SECTION VIEWER */}
              {activeSection === 'agenda' && (
                <div className="space-y-3.5 animate-[fadeIn_0.2s_ease-out]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BookOpen className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-black uppercase text-amber-500 tracking-wider">
                      Resumo da Semana
                    </span>
                  </div>

                  <div className="space-y-3">
                    {currentWeekDaysList.map(wDay => {
                      const dayTasks = tasks.filter(t => t.dueDate === wDay.dateString);
                      return (
                        <div key={wDay.key} className="p-3 rounded-xl border border-slate-850 bg-slate-950/40 space-y-1.5 hover:bg-slate-950/60 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-slate-300 tracking-wide">
                              {wDay.name} ({wDay.dateString.split('-')[2]}/{wDay.dateString.split('-')[1]})
                            </span>
                            <span className="text-[9px] font-mono text-slate-550 font-black uppercase">
                              {dayTasks.length} {dayTasks.length === 1 ? 'tarefa' : 'tarefas'}
                            </span>
                          </div>

                          <div className="space-y-1 pl-1">
                            {dayTasks.map(t => (
                              <div key={t.id} className="flex items-center gap-2 py-1">
                                <div className={`h-1.5 w-1.5 rounded-full ${t.completed ? 'bg-emerald-500/40' : 'bg-amber-500'}`} />
                                <span className={`text-[11px] font-medium truncate flex-1 ${t.completed ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                                  {t.title}
                                </span>
                                {t.dueTime && (
                                  <span className="font-mono text-[8px] text-slate-500 bg-slate-900 border border-slate-850 px-1 rounded-md">
                                    {t.dueTime}
                                  </span>
                                )}
                              </div>
                            ))}
                            {dayTasks.length === 0 && (
                              <span className="text-[10px] text-slate-605 italic block">Livre de compromissos</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NOVO TASK INCLUDER FORM */}
              {activeSection === 'novo' && (
                <form onSubmit={handleCreateTaskFromMenu} className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                  <div className="flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                      Incluir Nova Tarefa
                    </span>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none">
                      O que precisa fazer? (Título)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Revisar relatório financeiro..."
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-200 placeholder-slate-650 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Task Type / Category Selector */}
                  <div className="space-y-1">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none">
                      Tipo / Categoria da Tarefa
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'Trabalho', label: '💼 Trabalho' },
                        { id: 'Pessoal', label: '👤 Pessoal' },
                        { id: 'Lista de compras', label: '🛒 Compras' },
                        { id: 'Estudos', label: '📚 Estudos' }
                      ].map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setTaskType(type.id as any)}
                          className={`px-2 py-2 text-[10px] font-bold rounded-xl border cursor-pointer select-none text-center transition-all ${
                            taskType === type.id
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 font-black'
                              : 'bg-slate-950 text-slate-450 border-slate-850 hover:text-slate-200'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Deadline: Dia atual ou outro dia de semana */}
                  <div className="space-y-1">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none">
                      Prazo / Data
                    </span>
                    <select
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value as any)}
                      className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-350 cursor-pointer focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="hoje">📅 Dia atual (Hoje)</option>
                      <option value="dom">☀️ Domingo</option>
                      <option value="seg">💻 Segunda-feira</option>
                      <option value="ter">⚡ Terça-feira</option>
                      <option value="qua">🎯 Quarta-feira</option>
                      <option value="qui">📚 Quinta-feira</option>
                      <option value="sex">🧉 Sexta-feira</option>
                      <option value="sab">🎉 Sábado</option>
                    </select>
                  </div>

                  {/* Time deadline */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none">
                        Horário (Prazo)
                      </span>
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-2 rounded-xl">
                        <Clock className="w-3.5 h-3.5 text-slate-550 mr-1" />
                        <input
                          type="time"
                          value={taskTime}
                          onChange={(e) => setTaskTime(e.target.value)}
                          className="bg-transparent text-xs text-slate-300 font-bold focus:outline-none w-full border-none p-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none">
                        Prioridade
                      </span>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                        className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-350 cursor-pointer focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="low">🍀 Fácil / Mínima</option>
                        <option value="medium">⚡ Média / Normal</option>
                        <option value="high">🌟 Principal / Alta</option>
                      </select>
                    </div>
                  </div>

                  {/* Notification selection */}
                  <div className="space-y-1">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none">
                      Avisar Lembrete / Notificação
                    </span>
                    <select
                      value={taskReminderMins}
                      onChange={(e) => setTaskReminderMins(Number(e.target.value))}
                      className="w-full text-xs rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-350 cursor-pointer focus:border-emerald-500 focus:outline-none"
                    >
                      <option value={0}>Sem lembrete (Apenas exibir)</option>
                      <option value={5}>5 minutos antes do prazo</option>
                      <option value={15}>15 minutos antes do prazo</option>
                      <option value={30}>30 minutos antes do prazo</option>
                      <option value={60}>1 hora antes do prazo</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-extrabold text-xs text-slate-950 hover:text-white uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all text-center cursor-pointer"
                  >
                    Salvar e Agendar Agenda
                  </button>
                </form>
              )}

              {/* ANOTACOES (NOTES) SAVER WORKSPACE */}
              {activeSection === 'anotacoes' && (
                <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <div className="flex items-center gap-1.5">
                      <StickyNote className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-black uppercase text-blue-400 tracking-wider">
                        Caderno de Anotações
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={saveMenuNotes}
                      className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-blue-500 text-slate-950 hover:bg-blue-450 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                    >
                      <Save className="h-3 w-3 inline" />
                      {notesSaveStatus ? 'Salvo' : 'Salvar'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      placeholder="Rascunhe suas ideias gerais, lista rápida de afazeres, ou recados para o seu eu do futuro... (Salvo em seu navegador)"
                      rows={12}
                      value={menuNotes}
                      onChange={(e) => setMenuNotes(e.target.value)}
                      className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-205 placeholder-slate-650 focus:border-blue-500 focus:outline-none leading-relaxed resize-none"
                    />
                    
                    <div className="flex items-center justify-between text-[9px] text-slate-550 font-mono">
                      <span>{menuNotes.length} caracteres digitados</span>
                      {notesSaveStatus && (
                        <span className="text-blue-400 font-bold flex items-center gap-1">
                          <Check className="h-3 w-3" /> Atualizado com sucesso!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* EVENTOS (EVENTS LISTER AND CREATOR) */}
              {activeSection === 'eventos' && (
                <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-black uppercase text-purple-400 tracking-wider">
                        Próximos Eventos
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingEvent(!isCreatingEvent);
                        if (soundEnabled && playFocusSound) {
                          try { playFocusSound(); } catch (err) {}
                        }
                      }}
                      className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-purple-500/10 hover:bg-purple-500/25 text-purple-400 hover:text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/20 cursor-pointer"
                    >
                      {isCreatingEvent ? 'Ver Lista' : 'Novo'}
                    </button>
                  </div>

                  {isCreatingEvent ? (
                    // FORM TO CREATE EVENT
                    <form onSubmit={handleAddEvent} className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                        Novo Evento / Lembrete de Data
                      </h4>

                      <div className="space-y-1">
                        <label className="block text-[8px] font-mono tracking-widest uppercase text-slate-450 leading-none">
                          Dia / Data do Evento
                        </label>
                        <input
                          type="date"
                          required
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-850 bg-slate-950 p-2 text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8px] font-mono tracking-widest uppercase text-slate-450 leading-none">
                          Descrição / Assunto
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={100}
                          placeholder="Ex: Entrega do portfólio Citrino..."
                          value={newEventDesc}
                          onChange={(e) => setNewEventDesc(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-855 bg-slate-950 p-2 text-slate-300 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        Confirmar Novo Evento
                      </button>
                    </form>
                  ) : (
                    // LIST THE COMPLETED SAVED EVENTS
                    <div className="space-y-2">
                      {events.map((ev) => (
                        <div key={ev.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between gap-3 group transition-colors">
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <span className="text-[9px] font-mono font-extrabold text-purple-400 uppercase tracking-widest bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">
                              📅 {formatEventDate(ev.date)}
                            </span>
                            <p className="text-xs text-slate-300 font-bold leading-normal pt-1.5">
                              {ev.description}
                            </p>
                          </div>

                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                            title="Deletar evento"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {events.length === 0 && (
                        <div className="text-center py-6 border border-dashed border-slate-850 rounded-xl">
                          <p className="text-[10px] text-slate-505 font-mono italic">
                            Nenhum evento registrado. Lembre-se das datas marcantes do seu projeto!
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* 5. Clean Footer Storage Sync feedback */}
            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/40 text-[9px] text-slate-550 font-mono text-center flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500/70" /> MVP v1.0
              </span>
              <span>
                Citrino Smart Workspace
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
