import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Trash2, 
  Plus, 
  Clock, 
  StickyNote, 
  Sparkles, 
  Check, 
  Circle, 
  CheckCircle2, 
  AlertCircle,
  Move,
  Search,
  X
} from 'lucide-react';
import { Task, TaskPriority } from '../types';

interface WeeklyPlannerProps {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'pomodoroCount'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  defaultReminderMinutes: number;
}

const DAYS_OF_WEEK = [
  { name: 'Domingo', key: 'DOM', icon: '☀️' },
  { name: 'Segunda-feira', key: 'SEG', icon: '💻' },
  { name: 'Terça-feira', key: 'TER', icon: '⚡' },
  { name: 'Quarta-feira', key: 'QUA', icon: '🎯' },
  { name: 'Quinta-feira', key: 'QUI', icon: '📚' },
  { name: 'Sexta-feira', key: 'SEX', icon: '🧉' },
  { name: 'Sábado', key: 'SÁB', icon: '🎉' }
];

export default function WeeklyPlanner({
  tasks,
  addTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  defaultReminderMinutes
}: WeeklyPlannerProps) {
  // Get date strings for the current week (Sunday to Saturday)
  const getDatesOfCurrentWeek = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const datesList: { dayIndex: number; dateString: string; displayLabel: string }[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      const diff = i - currentDayOfWeek;
      date.setDate(today.getDate() + diff);
      
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;
      
      datesList.push({
        dayIndex: i,
        dateString,
        displayLabel: date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
      });
    }
    return datesList;
  };

  const weekDaysInfo = getDatesOfCurrentWeek();
  const currentTodayIndex = new Date().getDay();

  // Active tab of day (defaults to current today index)
  const [activeDayIndex, setActiveDayIndex] = useState<number>(currentTodayIndex);
  
  // Local notes state for each day of the week
  const [notes, setNotes] = useState<{ [key: number]: string }>(() => {
    const initialNotes: { [key: number]: string } = {};
    for (let i = 0; i < 7; i++) {
      initialNotes[i] = localStorage.getItem(`citrino_weekly_notes_${i}`) || '';
    }
    return initialNotes;
  });

  // Keep notes synchronized with localStorage
  const handleNoteChange = (dayIndex: number, text: string) => {
    setNotes(prev => ({
      ...prev,
      [dayIndex]: text
    }));
    localStorage.setItem(`citrino_weekly_notes_${dayIndex}`, text);
  };

  // Quick task inputs
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTime, setQuickTime] = useState('09:00');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('medium');
  const [quickReminder, setQuickReminder] = useState<number>(15);

  const activeDateString = weekDaysInfo[activeDayIndex].dateString;

  // Filter tasks that belong to the active day
  const activeDayTasks = tasks.filter(task => task.dueDate === activeDateString);

  // Repository filter state: 'pending' (unassigned), 'today' (scheduled for today), 'week' (scheduled for this week)
  const [repoFilter, setRepoFilter] = useState<'pending' | 'today' | 'week'>('pending');

  // Filter tasks that have NO due date, or are pending and not assigned to this week, for the side repository
  const unassignedTasks = tasks.filter(task => !task.completed && (!task.dueDate || !weekDaysInfo.some(d => d.dateString === task.dueDate)));

  // Base list of tasks for the repository based on selected filter
  const baseRepositoryTasks = (() => {
    const todayStr = new Date().toISOString().split('T')[0];
    switch (repoFilter) {
      case 'today':
        return tasks.filter(task => !task.completed && task.dueDate === todayStr);
      case 'week':
        return tasks.filter(task => !task.completed && task.dueDate && weekDaysInfo.some(d => d.dateString === task.dueDate));
      case 'pending':
      default:
        return unassignedTasks;
    }
  })();

  // Repository search state
  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  
  // Track which task's quick reminder dropdown is currently active
  const [activeReminderDropdownId, setActiveReminderDropdownId] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveReminderDropdownId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // Filter repository tasks based on search input
  const filteredUnassignedTasks = baseRepositoryTasks.filter(task => {
    const query = repoSearchQuery.trim().toLowerCase();
    if (!query) return true;
    return task.title.toLowerCase().includes(query) || 
           (task.description && task.description.toLowerCase().includes(query)) ||
           (task.category && task.category.toLowerCase().includes(query));
  });

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    addTask({
      title: quickTitle.trim(),
      description: 'Criada através do planejador semanal',
      completed: false,
      dueDate: activeDateString,
      dueTime: quickTime,
      priority: quickPriority,
      category: 'Semana',
      reminderMinutes: quickReminder,
      recurrence: 'none',
      pomodorosTarget: 1
    });

    setQuickTitle('');
  };

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDropOnDay = (e: React.DragEvent, targetDayIndex: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const targetDate = weekDaysInfo[targetDayIndex].dateString;
    // Update task's dueDate to target weekday's date
    updateTask(taskId, { dueDate: targetDate });

    // Try setting a default scheduled dueTime if it has none
    const updatedTask = tasks.find(t => t.id === taskId);
    if (updatedTask && !updatedTask.dueTime) {
      updateTask(taskId, { dueTime: '08:00' });
    }
  };

  const handleDropToUnassigned = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      // Remove due date
      updateTask(taskId, { dueDate: '' });
    }
  };

  return (
    <div id="weekly-planner" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-500" />
            <h1 className="font-sans text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Planejador Semanal
            </h1>
            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-black text-amber-400 uppercase tracking-widest border border-amber-500/10">
              <Sparkles className="h-2.5 w-2.5 animate-pulse" /> Off-line
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Organize sua rotina arrastando tarefas entre os dias. Planeje prazos e horários para receber alertas nativos diretamente em seu navegador sem precisar de internet.
          </p>
        </div>

        {/* Filtros rápidos do Repositório de Tarefas */}
        <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl text-xs gap-1 shrink-0 z-10 w-full md:w-auto">
          <button
            type="button"
            onClick={() => {
              setRepoFilter('today');
              if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
            }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all cursor-pointer ${
              repoFilter === 'today'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            🗓️ Hoje
          </button>
          <button
            type="button"
            onClick={() => {
              setRepoFilter('week');
              if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
            }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all cursor-pointer ${
              repoFilter === 'week'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            📅 Esta Semana
          </button>
          <button
            type="button"
            onClick={() => {
              setRepoFilter('pending');
              if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
            }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all cursor-pointer ${
              repoFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            📦 Pendentes
          </button>
        </div>
      </div>

      {/* HORIZONTAL WEEKDAYS TABS CONTAINER */}
      <div className="bg-slate-900/60 p-1.5 rounded-2xl border border-slate-850 flex overflow-x-auto gap-1 scrollbar-none">
        {DAYS_OF_WEEK.map((day, idx) => {
          const isSelected = activeDayIndex === idx;
          const isCurrentToday = currentTodayIndex === idx;
          const dayDate = weekDaysInfo[idx];
          const taskCount = tasks.filter(t => t.dueDate === dayDate.dateString).length;

          return (
            <button
              key={day.key}
              onClick={() => setActiveDayIndex(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnDay(e, idx)}
              className={`flex-1 min-w-[90px] p-3 rounded-xl transition-all cursor-pointer relative text-center flex flex-col items-center gap-1.5 border group ${
                isSelected 
                  ? 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/15 scale-[1.02]' 
                  : isCurrentToday
                  ? 'bg-slate-900/40 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-850'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{day.icon}</span>
                <span className="font-sans text-xs font-bold leading-none tracking-wide">{day.name.split('-')[0]}</span>
              </div>
              
              <div className={`font-mono text-[10px] leading-none ${isSelected ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>
                {dayDate.displayLabel}
              </div>

              {/* Status Indicators */}
              <div className="flex items-center gap-1 mt-1">
                {isCurrentToday && (
                  <span className={`px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    isSelected ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    Hoje
                  </span>
                )}
                {taskCount > 0 && (
                  <span className={`h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full text-[9px] font-mono font-bold ${
                    isSelected ? 'bg-slate-950 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {taskCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* CORE WORK AREA: 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left main area: Current day tasks and personal notes */}
        <div 
          className="lg:col-span-8 space-y-6"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDropOnDay(e, activeDayIndex)}
        >
          {/* Daily Active Card Pane */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <div>
                <h2 className="flex items-center gap-2 font-sans font-black text-lg text-white">
                  <span>{DAYS_OF_WEEK[activeDayIndex].icon}</span>
                  {DAYS_OF_WEEK[activeDayIndex].name}
                  <span className="text-slate-500 text-xs font-mono font-normal">
                    ({weekDaysInfo[activeDayIndex].dateString})
                  </span>
                </h2>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Arraste tarefas aqui ou configure horários e lembretes imediatos.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Notificações Locais Ativas</span>
              </div>
            </div>

            {/* Quick-Add tasks panel */}
            <form onSubmit={handleAddQuickTask} className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-850">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Nova tarefa para este dia..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-sans text-xs text-slate-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 border border-slate-800 bg-slate-950 rounded-lg px-2" title="Horário do Prazo">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="time"
                    value={quickTime}
                    onChange={(e) => setQuickTime(e.target.value)}
                    className="bg-transparent text-xs text-slate-300 font-sans focus:outline-none w-14 border-none p-0 cursor-pointer"
                  />
                </div>

                <select
                  value={quickPriority}
                  onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 font-sans text-xs text-slate-300 focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="low">Fácil 🍀</option>
                  <option value="medium">Média ⚡</option>
                  <option value="high">Alta 🌟</option>
                </select>

                <select
                  value={quickReminder}
                  onChange={(e) => setQuickReminder(Number(e.target.value))}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 font-sans text-xs text-slate-300 focus:border-amber-500 focus:outline-none cursor-pointer"
                  title="Lembrete"
                >
                  <option value={0}>Sem Lembrete</option>
                  <option value={5}>5m antes</option>
                  <option value={15}>15m antes</option>
                  <option value={30}>30m antes</option>
                  <option value={60}>1h antes</option>
                </select>

                <button
                  type="submit"
                  disabled={!quickTitle.trim()}
                  className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 text-xs font-black transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* List of active day tasks */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
              {activeDayTasks.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-850/80 rounded-xl bg-slate-950/20">
                  <Move className="h-8 w-8 text-slate-600 mx-auto stroke-1 animate-bounce mb-2" />
                  <p className="text-xs text-slate-400 font-semibold">Nenhuma tarefa para {DAYS_OF_WEEK[activeDayIndex].name}.</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto">
                    Arraste uma tarefa pendente da barra lateral ou crie uma nova tarefa acima para começar o planejamento deste dia!
                  </p>
                </div>
              ) : (
                activeDayTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className={`flex flex-col sm:flex-row items-stretch sm:items-start justify-between p-4 rounded-xl border transition-all duration-200 group relative gap-3 sm:gap-4 ${
                      task.completed 
                        ? 'bg-slate-900/40 border-slate-900/80 opacity-60' 
                        : 'bg-slate-950 hover:bg-slate-900 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex gap-3 items-start flex-1 min-w-0">
                      <div className="flex flex-col items-center gap-1.5 flex-shrink-0 relative">
                        <div className="relative group/tooltip">
                          <motion.button
                            onClick={() => toggleTaskComplete(task.id)}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                            className="mt-0.5 text-slate-500 hover:text-amber-400 transition-colors duration-200 cursor-pointer flex-shrink-0 focus:outline-none"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-amber-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-600 hover:text-amber-500" />
                            )}
                          </motion.button>

                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-slate-950 text-[10px] text-white font-sans font-bold rounded border border-slate-805 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-xl z-20 transition-all scale-95 group-hover/tooltip:scale-100">
                            {task.completed ? 'Desmarcar tarefa' : 'Concluir Tarefa'}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-slate-950"></div>
                          </div>
                        </div>

                        {/* Mini-menu dropdown to change reminder time quickly */}
                        <div className="relative font-sans" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setActiveReminderDropdownId(activeReminderDropdownId === task.id ? null : task.id)}
                            className="flex items-center justify-center gap-1 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-[9px] text-slate-400 font-bold px-1.5 py-0.5 rounded border border-slate-800 hover:border-amber-400 transition-all duration-150 cursor-pointer mt-1 whitespace-nowrap min-w-[36px]"
                            title="Alterar minutos de lembrete"
                          >
                            <span>🔔 {(task.reminderMinutes !== undefined ? task.reminderMinutes : 15) === 0 ? 'Off' : `${task.reminderMinutes !== undefined ? task.reminderMinutes : 15}m`}</span>
                            <span className="text-[7px] text-slate-500 group-hover:text-amber-950">▼</span>
                          </button>

                          {activeReminderDropdownId === task.id && (
                            <div className="absolute left-0 mt-1 w-32 rounded-lg border border-slate-800 bg-slate-950 p-1 shadow-2xl z-30 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-100">
                              <p className="px-2 py-1 text-[8px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-900 mb-1 leading-none">
                                Lembrete antes
                              </p>
                              {[0, 5, 15, 30, 60].map((mins) => {
                                const isSelected = (task.reminderMinutes !== undefined ? task.reminderMinutes : 15) === mins;
                                return (
                                  <button
                                    key={mins}
                                    type="button"
                                    onClick={() => {
                                      updateTask(task.id, { reminderMinutes: mins });
                                      setActiveReminderDropdownId(null);
                                    }}
                                    className={`w-full text-left font-semibold text-[10px] px-2 py-1 rounded-md transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-amber-500 text-slate-950 font-black'
                                        : 'text-slate-400 hover:text-amber-400 hover:bg-slate-900'
                                    }`}
                                  >
                                    {mins === 0 ? '❌ Desativado' : `${mins} min antes`}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 min-w-0 pr-2">
                        <span className={`block font-sans text-xs font-bold leading-normal transition-all ${
                          task.completed ? 'line-through text-slate-500' : 'text-slate-105'
                        }`}>
                          {task.title}
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded px-1.5 py-0.5 font-sans font-bold text-[9px] uppercase tracking-wider ${
                            task.priority === 'high' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' 
                              : task.priority === 'medium'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Fácil'}
                          </span>

                          {task.dueTime && (
                            <span className="inline-flex items-center gap-1 font-mono text-[9px] text-slate-400 bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded">
                              <Clock className="h-2.5 w-2.5 text-amber-500" />
                              {task.dueTime}
                            </span>
                          )}

                          {task.reminderMinutes !== undefined && task.reminderMinutes > 0 ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[8px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-1.5 py-0.5 rounded uppercase font-black" title="Ativo para lembrete offline">
                              🔔 Lembrete: {task.reminderMinutes}m antes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono text-[8px] text-slate-500 bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded">
                              Sem Lembrete
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right area modification controls */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-900/60 sm:border-t-0 sm:pt-0 sm:mt-0 sm:ml-2 justify-end grow-0 self-stretch sm:self-center">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                          {/* Quick change time button */}
                          <input
                            type="time"
                            value={task.dueTime || '12:00'}
                            onChange={(e) => updateTask(task.id, { dueTime: e.target.value })}
                            className="bg-slate-900 border border-slate-850 text-[10px] text-slate-300 hover:text-white rounded px-1.5 py-0.5 focus:outline-none w-14 cursor-pointer"
                            title="Editar horário de entrega"
                          />
                        </div>
                        <select
                          value={task.reminderMinutes !== undefined ? task.reminderMinutes : defaultReminderMinutes}
                          onChange={(e) => updateTask(task.id, { reminderMinutes: Number(e.target.value) })}
                          className="bg-slate-900 border border-slate-850 text-[9px] text-slate-400 rounded px-1 py-0.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                          title="Lembrete antes do horário"
                        >
                          <option value={0}>Sem Lembrete</option>
                          <option value={5}>5m antes</option>
                          <option value={10}>10m antes</option>
                          <option value={15}>15m antes</option>
                          <option value={35}>35m antes</option>
                          <option value={60}>1h antes</option>
                        </select>
                      </div>

                      <button
                        onClick={() => updateTask(task.id, { dueDate: '' })}
                        title="Desagendar da semana"
                        className="p-1.5 rounded-lg border border-slate-850 bg-slate-900 hover:bg-slate-850 text-slate-500 hover:text-amber-500 transition-colors cursor-pointer"
                      >
                        <Move className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 rounded-lg border border-slate-850 bg-slate-900 hover:bg-slate-850 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Deletar tarefa"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* NOTES AND ANNOTATIONS SUB-BOARD */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <StickyNote className="h-4 w-4 text-amber-500" />
              <h3 className="font-sans text-xs font-black text-white uppercase tracking-wider">
                Anotações e Detalhes ({DAYS_OF_WEEK[activeDayIndex].name})
              </h3>
            </div>
            
            <textarea
              value={notes[activeDayIndex]}
              onChange={(e) => handleNoteChange(activeDayIndex, e.target.value)}
              placeholder={`Escreva notas importantes, lembretes rápidos ou ideias para planejar melhor sua ${DAYS_OF_WEEK[activeDayIndex].name}... (Salvo localmente de forma automática)`}
              className="w-full min-h-[120px] rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-sans text-xs text-slate-350 placeholder-slate-650 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/10 resize-y"
            />
            
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Caracteres: {notes[activeDayIndex].length}</span>
              <span className="flex items-center gap-1 text-emerald-500">
                <Check className="h-3 w-3" /> Salvo off-line
              </span>
            </div>
          </div>
        </div>

        {/* Right sidebar: Repository of unassigned pending tasks */}
        <div className="lg:col-span-4 space-y-6">
          <div 
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropToUnassigned}
          >
            <div>
              <h3 className="font-sans text-xs font-black text-white uppercase tracking-wider flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5">📦 Repositório de Tarefas Pendentes</span>
                <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 uppercase tracking-widest border border-amber-500/10">
                  {repoFilter === 'today' ? 'Hoje' : repoFilter === 'week' ? 'Esta Semana' : 'Pendentes'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal mt-1 font-sans">
                {repoFilter === 'today' 
                  ? 'Exibindo tarefas agendadas para hoje que ainda não foram concluídas.' 
                  : repoFilter === 'week' 
                  ? 'Exibindo tarefas agendadas para esta semana que ainda não foram concluídas.' 
                  : 'Todas as tarefas pendentes sem prazo estipulado. Arraste-as para os dias ou clique para agendar.'}
              </p>
            </div>

            {/* Campo de busca do repositório */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-500" />
              </span>
              <input
                type="text"
                value={repoSearchQuery}
                onChange={(e) => setRepoSearchQuery(e.target.value)}
                placeholder="Buscar tarefa no repositório..."
                className="w-full text-xs pl-8.5 pr-8 py-2 border border-slate-800 bg-slate-950 rounded-xl text-slate-250 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-sans"
              />
              {repoSearchQuery && (
                <button
                  type="button"
                  onClick={() => setRepoSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
              {filteredUnassignedTasks.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800/80 rounded-xl bg-slate-900/10">
                  <AlertCircle className="h-5 w-5 text-slate-600 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-550 leading-normal max-w-[200px] mx-auto font-sans">
                    {baseRepositoryTasks.length === 0
                      ? `Nenhuma tarefa pendente com o filtro "${repoFilter === 'today' ? 'Hoje' : repoFilter === 'week' ? 'Esta Semana' : 'Pendentes'}".`
                      : "Nenhuma tarefa encontrada para a busca atual neste repositório."}
                  </p>
                </div>
              ) : (
                filteredUnassignedTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-xs font-bold text-slate-300 truncate leading-snug">
                        {task.title}
                      </p>
                      <span className="inline-block mt-0.5 font-sans text-[8px] font-bold uppercase tracking-wider text-slate-500">
                        {task.category || 'Geral'}
                      </span>
                    </div>

                    <button
                      onClick={() => updateTask(task.id, { dueDate: activeDateString, dueTime: '09:00' })}
                      title={`Agendar para esta ${DAYS_OF_WEEK[activeDayIndex].name}`}
                      className="p-1 px-1.5 rounded-md border border-slate-800 bg-slate-900/70 text-amber-500 hover:text-white hover:bg-amber-500 transition-colors text-[10px] font-black cursor-pointer uppercase font-sans shrink-0"
                    >
                      Agendar
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[10px] text-slate-550 font-mono">
              <span>Arraste itens aqui para desagendar</span>
              <Move className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
