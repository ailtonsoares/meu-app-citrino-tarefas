import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  X,
  Inbox,
  ArrowRight,
  PlusCircle,
  AlertTriangle
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
  { name: 'Domingo', key: 'DOM', icon: '☀️', color: 'from-amber-500/20 to-orange-500/10 text-amber-400' },
  { name: 'Segunda-feira', key: 'SEG', icon: '💻', color: 'from-blue-500/20 to-indigo-500/10 text-blue-400' },
  { name: 'Terça-feira', key: 'TER', icon: '⚡', color: 'from-purple-500/20 to-pink-500/10 text-purple-400' },
  { name: 'Quarta-feira', key: 'QUA', icon: '🎯', color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400' },
  { name: 'Quinta-feira', key: 'QUI', icon: '📚', color: 'from-cyan-500/20 to-blue-500/10 text-cyan-400' },
  { name: 'Sexta-feira', key: 'SEX', icon: '🧉', color: 'from-rose-500/20 to-orange-500/10 text-rose-400' },
  { name: 'Sábado', key: 'SÁB', icon: '🎉', color: 'from-pink-500/20 to-purple-500/10 text-pink-400' }
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
  
  // Drag States for satisfying tactile feel
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverDayIndex, setDragOverDayIndex] = useState<number | null>(null);
  const [isDragOverUnassigned, setIsDragOverUnassigned] = useState(false);

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
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverDayIndex(null);
    setIsDragOverUnassigned(false);
  };

  const handleDropOnDay = (e: React.DragEvent, targetDayIndex: number) => {
    e.preventDefault();
    setDragOverDayIndex(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (!taskId) return;

    const targetDate = weekDaysInfo[targetDayIndex].dateString;
    // Update task's dueDate to target weekday's date
    updateTask(taskId, { dueDate: targetDate });

    // Try setting a default scheduled dueTime if it has none
    const updatedTask = tasks.find(t => t.id === taskId);
    if (updatedTask && !updatedTask.dueTime) {
      updateTask(taskId, { dueTime: '08:00' });
    }
    handleDragEnd();
  };

  const handleDropToUnassigned = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverUnassigned(false);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (taskId) {
      // Remove due date
      updateTask(taskId, { dueDate: '' });
    }
    handleDragEnd();
  };

  return (
    <div id="weekly-planner" className="space-y-6 font-sans">
      
      {/* 1. APPLET HERO HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-xl">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute -left-10 -bottom-20 h-40 w-40 rounded-full bg-rose-500/5 blur-[60px] pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight leading-none uppercase">
                PLANEJADOR SEMANAL
              </h1>
              <p className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase mt-1">
                Sua rotina desenhada com fluidez e minimalismo
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Organize sua rotina de forma simples. Arraste tarefas entre os dias para planejar prazos, horários, e definir lembretes automáticos no seu navegador de maneira 100% tátil.
          </p>
        </div>

        {/* REPOSITORY QUICK CONTROL BAR */}
        <div className="flex items-center bg-slate-950/80 border border-slate-800/80 p-1 rounded-xl text-xs gap-1.5 shrink-0 z-10 w-full md:w-auto backdrop-blur-sm shadow-inner">
          <button
            type="button"
            onClick={() => {
              setRepoFilter('today');
              if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
            }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              repoFilter === 'today'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
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
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              repoFilter === 'week'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
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
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              repoFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
            }`}
          >
            📦 Inbox
          </button>
        </div>
      </div>

      {/* 2. HORIZONTAL WEEKDAYS CARDS DIAL */}
      <div className="bg-slate-950/40 p-1.5 rounded-2xl border border-slate-800/60 flex overflow-x-auto gap-2 scrollbar-none shadow-inner">
        {DAYS_OF_WEEK.map((day, idx) => {
          const isSelected = activeDayIndex === idx;
          const isCurrentToday = currentTodayIndex === idx;
          const dayDate = weekDaysInfo[idx];
          const dayTasks = tasks.filter(t => t.dueDate === dayDate.dateString);
          const taskCount = dayTasks.length;
          const completedCount = dayTasks.filter(t => t.completed).length;
          const isOverThisDay = dragOverDayIndex === idx;

          return (
            <motion.button
              key={day.key}
              onClick={() => setActiveDayIndex(idx)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverDayIndex !== idx) setDragOverDayIndex(idx);
              }}
              onDragLeave={() => {
                if (dragOverDayIndex === idx) setDragOverDayIndex(null);
              }}
              onDrop={(e) => handleDropOnDay(e, idx)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 min-w-[105px] p-3 rounded-xl transition-all duration-200 cursor-pointer relative text-center flex flex-col items-center gap-1.5 border ${
                isSelected 
                  ? 'bg-gradient-to-b from-amber-500 to-amber-600 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/10' 
                  : isOverThisDay
                  ? 'bg-slate-800/80 border-dashed border-amber-500/60 text-amber-400 scale-[1.04]'
                  : isCurrentToday
                  ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-md ring-1 ring-amber-500/20'
                  : 'bg-slate-900/40 border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{day.icon}</span>
                <span className="font-sans text-xs font-extrabold tracking-wider leading-none">{day.name.split('-')[0]}</span>
              </div>
              
              <div className={`font-mono text-[9px] font-bold mt-0.5 leading-none ${
                isSelected ? 'text-slate-900/80' : 'text-slate-500'
              }`}>
                {dayDate.displayLabel}
              </div>

              {/* Counts & Status flags */}
              <div className="flex items-center gap-1 mt-1">
                {isCurrentToday && (
                  <span className={`px-1 rounded text-[8px] font-black uppercase tracking-widest ${
                    isSelected ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/25 text-amber-400 border border-amber-500/20'
                  }`}>
                    Hoje
                  </span>
                )}
                
                {taskCount > 0 && (
                  <span className={`h-4.5 min-w-[18px] px-1 flex items-center justify-center rounded-full text-[9px] font-mono font-black ${
                    isSelected 
                      ? 'bg-slate-950 text-white' 
                      : completedCount === taskCount
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700/80'
                  }`}
                  title={`${completedCount} de ${taskCount} tarefas concluídas`}
                  >
                    {completedCount === taskCount ? '✓' : taskCount}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 3. CORE DESIGN WORKSPACE (GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Focused Day & Interactive Content */}
        <div 
          className="lg:col-span-8 space-y-6"
          onDragOver={(e) => {
            e.preventDefault();
            if (dragOverDayIndex !== activeDayIndex) setDragOverDayIndex(activeDayIndex);
          }}
          onDragLeave={() => {
            if (dragOverDayIndex === activeDayIndex) setDragOverDayIndex(null);
          }}
          onDrop={(e) => handleDropOnDay(e, activeDayIndex)}
        >
          {/* Main Focused Panel */}
          <div className={`rounded-2xl border bg-gradient-to-b from-slate-900 to-slate-950 p-6 space-y-6 relative shadow-lg transition-all duration-300 ${
            dragOverDayIndex === activeDayIndex 
              ? 'border-amber-500/40 shadow-amber-500/5 bg-slate-900/90' 
              : 'border-slate-800'
          }`}>
            
            {/* Upper Info Row */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${DAYS_OF_WEEK[activeDayIndex].color}`}>
                  <span className="text-xl leading-none">{DAYS_OF_WEEK[activeDayIndex].icon}</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                    {DAYS_OF_WEEK[activeDayIndex].name}
                    <span className="text-slate-500 text-xs font-mono font-medium tracking-normal bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80">
                      {weekDaysInfo[activeDayIndex].dateString}
                    </span>
                  </h2>
                  <p className="text-slate-500 text-[10px] font-mono uppercase tracking-wider mt-0.5">
                    Seas do dia • Planeje e execute com serenidade
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Add Form - Designer Style */}
            <form onSubmit={handleAddQuickTask} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3.5 shadow-inner">
              <div className="flex gap-2.5 items-center">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Adicionar nova tarefa para {DAYS_OF_WEEK[activeDayIndex].name.split('-')[0]}
                </span>
                <div className="flex-1 border-t border-slate-800/40" />
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    placeholder="O que você precisa realizar hoje?"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 font-sans text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500/25 transition-all"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Time field styled sleekly */}
                  <div className="flex items-center gap-2 border border-slate-800 bg-slate-900 px-3 py-2 rounded-xl" title="Horário do Prazo">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="time"
                      value={quickTime}
                      onChange={(e) => setQuickTime(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none w-14 border-none p-0 cursor-pointer"
                    />
                  </div>

                  {/* Priority Select */}
                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-350 focus:border-amber-500 focus:outline-none cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <option value="low">Fácil 🍀</option>
                    <option value="medium">Média ⚡</option>
                    <option value="high">Alta 🌟</option>
                  </select>

                  {/* Reminder selects */}
                  <select
                    value={quickReminder}
                    onChange={(e) => setQuickReminder(Number(e.target.value))}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-350 focus:border-amber-500 focus:outline-none cursor-pointer hover:bg-slate-800 transition-colors"
                    title="Alerta Automático"
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
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 hover:scale-[1.04] active:scale-[0.98] text-slate-950 font-black px-4 py-2.5 text-xs transition-all cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-amber-500/10 shrink-0"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>Criar</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Day Task List */}
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto scrollbar-thin pr-1">
              <AnimatePresence initial={false}>
                {activeDayTasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12 border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/30"
                  >
                    <Move className="h-9 w-9 text-slate-600 mx-auto stroke-1 animate-[bounce_2s_infinite] mb-3" />
                    <p className="text-xs font-bold text-slate-300">Nenhum plano para {DAYS_OF_WEEK[activeDayIndex].name.split('-')[0]}</p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto font-mono">
                      Arraste um item do repositório lateral ou digite um novo objetivo para preencher seu dia.
                    </p>
                  </motion.div>
                ) : (
                  activeDayTasks.map((task) => (
                    <motion.div
                      layout
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 rounded-xl border transition-all duration-250 group relative gap-3 sm:gap-4 select-none ${
                        task.completed 
                          ? 'bg-slate-950/40 border-slate-900/80 opacity-[0.45]' 
                          : 'bg-slate-950 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700/80 hover:shadow-md'
                      }`}
                    >
                      {/* Checkbox and Task Details */}
                      <div className="flex gap-3.5 items-start flex-1 min-w-0">
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 relative">
                          <motion.button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskComplete(task.id);
                              setActiveReminderDropdownId(activeReminderDropdownId === task.id ? null : task.id);
                            }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                            className="group/tooltip mt-0.5 text-slate-500 hover:text-amber-400 transition-colors duration-200 cursor-pointer flex-shrink-0 focus:outline-none relative flex items-center justify-center h-5 w-5"
                          >
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 pointer-events-none opacity-0 scale-90 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-150 z-50">
                              <div className="bg-slate-950 text-slate-200 border border-slate-800 text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap leading-none select-none">
                                Concluir Tarefa
                              </div>
                              <div className="w-1.5 h-1.5 bg-slate-950 border-r border-b border-slate-800 rotate-45 mx-auto -mt-1"></div>
                            </div>

                            {/* Unconditional hidden CheckCircle2 to satisfy the .group button:has(svg.CheckCircle2) matcher always */}
                            <CheckCircle2 className="CheckCircle2 h-5 w-5 opacity-0 absolute pointer-events-none" />
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-amber-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-600 hover:text-amber-500" />
                            )}
                          </motion.button>

                          {/* Quick dropdown for local offline notifications */}
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setActiveReminderDropdownId(activeReminderDropdownId === task.id ? null : task.id)}
                              className="flex items-center justify-center gap-1 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-[9px] text-slate-400 font-bold px-1.5 py-0.5 rounded border border-slate-800 hover:border-amber-500/20 transition-all duration-150 cursor-pointer mt-1 whitespace-nowrap min-w-[42px]"
                              title="Configurar Lembrete Rápido"
                            >
                              <span>🔔 {(task.reminderMinutes !== undefined ? task.reminderMinutes : 15) === 0 ? 'Off' : `${task.reminderMinutes !== undefined ? task.reminderMinutes : 15}m`}</span>
                            </button>

                            {activeReminderDropdownId === task.id && (
                              <div className="absolute left-0 mt-1.5 w-36 rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl z-40 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                <p className="px-2 py-1 text-[8px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-900 mb-1 leading-none">
                                  Alerta antes
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
                                      className={`w-full text-left font-bold text-[10px] px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-amber-500 text-slate-950 font-black'
                                          : 'text-slate-400 hover:text-amber-400 hover:bg-slate-900'
                                      }`}
                                    >
                                      {mins === 0 ? '❌ Desativar' : `${mins} min antes`}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Title and Badge Metadata */}
                        <div className="space-y-1.5 min-w-0 pr-2">
                          <span className={`block font-sans text-xs font-bold leading-normal transition-all ${
                            task.completed ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}>
                            {task.title}
                          </span>

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {/* Priority label */}
                            <span className={`rounded-lg px-2 py-0.5 font-sans font-black text-[8px] uppercase tracking-wider ${
                              task.priority === 'high' 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                : task.priority === 'medium'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
                            }`}>
                              {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Fácil'}
                            </span>

                            {/* Scheduled timing badge */}
                            {task.dueTime && (
                              <span className="inline-flex items-center gap-1 font-mono text-[9px] text-slate-300 bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded-lg">
                                <Clock className="h-3 w-3 text-amber-500" />
                                <span>{task.dueTime}</span>
                              </span>
                            )}

                            {/* Alert state badge */}
                            {task.reminderMinutes !== undefined && task.reminderMinutes > 0 ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[8px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg uppercase font-black">
                                Alerta ativo
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Editing Controllers / Actions Row */}
                      <div className="flex items-center justify-end gap-2.5 mt-2.5 pt-2.5 sm:mt-0 sm:pt-0 border-t border-slate-900 sm:border-t-0 self-stretch sm:self-center shrink-0">
                        
                        <div className="flex flex-col gap-1 items-end">
                          <input
                            type="time"
                            value={task.dueTime || '12:00'}
                            onChange={(e) => updateTask(task.id, { dueTime: e.target.value })}
                            className="bg-slate-900 border border-slate-800 text-[9px] text-slate-300 font-bold tracking-wide hover:text-white rounded-lg px-1.5 py-1 focus:outline-none focus:border-amber-500/40 w-14 cursor-pointer"
                            title="Editar horário"
                          />
                          <select
                            value={task.reminderMinutes !== undefined ? task.reminderMinutes : defaultReminderMinutes}
                            onChange={(e) => updateTask(task.id, { reminderMinutes: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-800 text-[8px] text-slate-400 font-bold rounded-lg px-1 py-0.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                            title="Avisar a tempo"
                          >
                            <option value={0}>Sem lembrete</option>
                            <option value={5}>5m antes</option>
                            <option value={15}>15m antes</option>
                            <option value={30}>30m antes</option>
                            <option value={60}>1h antes</option>
                          </select>
                        </div>

                        {/* Remove from schedule button */}
                        <button
                          onClick={() => updateTask(task.id, { dueDate: '' })}
                          title="Remover data e enviar para Inbox"
                          className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                        >
                          <Move className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-500 hover:text-rose-400 hover:border-rose-500/10 transition-colors cursor-pointer"
                          title="Excluir Definitivamente"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* PERSONAL DAILY REFLECTIONS NOTEBOOK */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 space-y-3.5 shadow-xl relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 h-40 w-40 rounded-full bg-blue-500/5 blur-[50px] pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4.5 w-4.5 text-amber-500" />
                <h3 className="font-serif italic text-sm text-slate-100 font-bold">
                  Anotações e Considerações do Dia ({DAYS_OF_WEEK[activeDayIndex].name.split('-')[0]})
                </h3>
              </div>
            </div>
            
            <textarea
              value={notes[activeDayIndex]}
              onChange={(e) => handleNoteChange(activeDayIndex, e.target.value)}
              placeholder={`Use este caderno livre para listar detalhes do dia, rascunhos importantes ou insights...`}
              className="w-full min-h-[140px] rounded-xl border border-slate-800 bg-slate-950/50 p-4 font-sans text-xs text-slate-300 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/10 resize-y leading-relaxed"
            />
            
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
              <span>{notes[activeDayIndex].length} caracteres</span>
              <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                <Check className="h-3.5 w-3.5" /> Salvo localmente
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Centralized Inbox / Repository Side Deck */}
        <div className="lg:col-span-4 space-y-6">
          <div 
            className={`rounded-2xl border bg-slate-900/40 p-5 space-y-4 shadow-lg transition-all duration-300 ${
              isDragOverUnassigned 
                ? 'border-rose-500/40 bg-slate-900/70 shadow-rose-500/5' 
                : 'border-slate-800'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isDragOverUnassigned) setIsDragOverUnassigned(true);
            }}
            onDragLeave={() => {
              if (isDragOverUnassigned) setIsDragOverUnassigned(false);
            }}
            onDrop={handleDropToUnassigned}
          >
            
            {/* Header info for Inbox */}
            <div>
              <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-800/60">
                <h3 className="text-xs font-black text-slate-200 tracking-wider uppercase flex items-center gap-1.5">
                  <Inbox className="h-4 w-4 text-amber-500" />
                  <span>Repositório Deck</span>
                </h3>
                <span className="font-mono text-[9px] font-black px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 uppercase tracking-widest border border-amber-500/10">
                  {repoFilter === 'today' ? 'Hoje' : repoFilter === 'week' ? 'Semana' : 'Inbox'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5 font-sans">
                {repoFilter === 'today' 
                  ? 'Exibindo tarefas agendadas para hoje que ainda restam ser executadas.' 
                  : repoFilter === 'week' 
                  ? 'Tarefas agendadas para esta semana pendentes de finalização.' 
                  : 'Coleção de objetivos gerais sem prazo específico. Arraste-os para agendar em qualquer dia.'}
              </p>
            </div>

            {/* Quick Repository Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-500" />
              </span>
              <input
                type="text"
                value={repoSearchQuery}
                onChange={(e) => setRepoSearchQuery(e.target.value)}
                placeholder="Filtrar tarefas no repositório..."
                className="w-full text-xs pl-9 pr-9 py-2.5 border border-slate-800 bg-slate-950 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 transition-all font-sans"
              />
              {repoSearchQuery && (
                <button
                  type="button"
                  onClick={() => setRepoSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Repository Deck Content */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto scrollbar-thin pr-1">
              <AnimatePresence initial={false}>
                {filteredUnassignedTasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-10 border border-dashed border-slate-800/80 rounded-xl bg-slate-950/20"
                  >
                    <AlertCircle className="h-5 w-5 text-slate-600 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-500 leading-normal max-w-[200px] mx-auto font-sans">
                      {baseRepositoryTasks.length === 0
                        ? `Não há tarefas pendentes com a marca "${repoFilter === 'today' ? 'Hoje' : repoFilter === 'week' ? 'Semana' : 'Inbox'}".`
                        : "Nenhuma tarefa combina com o seu termo de pesquisa."}
                    </p>
                  </motion.div>
                ) : (
                  filteredUnassignedTasks.map((task) => (
                    <motion.div
                      layout
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      whileHover={{ scale: 1.01, x: 2 }}
                      className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing transition-all duration-200 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-sans text-xs font-bold text-slate-250 truncate leading-snug">
                          {task.title}
                        </p>
                        <span className="inline-block mt-0.5 font-sans text-[8px] font-black uppercase tracking-widest text-slate-500">
                          {task.category || 'Inbox'}
                        </span>
                      </div>

                      <button
                        onClick={() => updateTask(task.id, { dueDate: activeDateString, dueTime: '09:00' })}
                        title={`Agendar para ${DAYS_OF_WEEK[activeDayIndex].name.split('-')[0]}`}
                        className="p-1 px-2.5 rounded-lg border border-slate-800 bg-slate-900/80 text-amber-500 hover:text-slate-950 hover:bg-amber-500 transition-colors text-[9px] font-black cursor-pointer uppercase font-sans shrink-0 active:scale-95 transition-all text-center"
                      >
                        Agendar
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
            
            {/* Un-schedule Drag Drop Target Area */}
            <div className={`mt-2 pb-2 pt-3 border-t border-slate-800/80 flex flex-col items-center justify-center p-3 rounded-xl border border-dashed transition-all duration-200 ${
              draggingTaskId 
                ? 'border-rose-500/30 bg-rose-500/5 text-rose-400' 
                : 'border-slate-800/40 text-slate-550'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider font-sans text-center">
                {draggingTaskId ? 'Solte aqui para remover do calendário' : 'Arraste tarefas aqui para remover o prazo'}
              </span>
              <Move className="h-3.5 w-3.5 mt-1.5 animate-pulse" />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
