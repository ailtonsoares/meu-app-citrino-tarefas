import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Zap,
  RotateCcw,
  Sun,
  Moon,
  Settings,
  Menu,
  Clock,
  Check,
  Trash2,
  Edit3,
  AlertCircle,
  ArrowRight,
  Droplet,
  BookOpen,
  TrendingUp,
  User,
  X,
  PlusCircle,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';

// Core Type Declarations
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskCategory = 'Trabalho' | 'Estudo' | 'Pessoal' | 'Saúde' | 'Geral';
export type DayOfWeek = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TaskPriority;
  category: TaskCategory;
  dayOfWeek?: DayOfWeek; // For Weekly Planner integration
  subtasks: SubTask[];
  createdAt: string; // ISO format
}

// Initial/Demo tasks to start the user off with a functional preview
const INITIAL_TASKS: Task[] = [
  {
    id: 'demo-1',
    title: 'Compreender sincronização de estados no React',
    description: 'Revisar useEffect e useMemo para evitar re-renders desnecessários.',
    completed: false,
    priority: 'high',
    category: 'Estudo',
    dayOfWeek: 'Segunda',
    subtasks: [
      { id: 'sub-1', title: 'Estudar arrays de dependências', completed: true },
      { id: 'sub-2', title: 'Escrever exemplo prático simples', completed: false }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-2',
    title: 'Organizar repositório local e backups',
    description: 'Fazer o commit inicial do projeto Citrino.',
    completed: true,
    priority: 'medium',
    category: 'Trabalho',
    dayOfWeek: 'Terça',
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-3',
    title: 'Preparar refeição saudável semanal',
    description: 'Planejar cardápio equilibrado focado em macros.',
    completed: false,
    priority: 'low',
    category: 'Saúde',
    dayOfWeek: 'Quarta',
    subtasks: [
      { id: 'sub-3', title: 'Comprar vegetais frescos', completed: false },
      { id: 'sub-4', title: 'Cozinhar porções prontas para 3 dias', completed: false }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-4',
    title: 'Revisar metas da sprint quinzenal',
    description: 'Check-point com a equipe de engenharia Citrino.',
    completed: false,
    priority: 'high',
    category: 'Trabalho',
    dayOfWeek: 'Quinta',
    subtasks: [],
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  // Primary Navigation Tab state
  const [viewMode, setViewMode] = useState<'tarefas' | 'agenda' | 'progresso' | 'configuracoes'>('tarefas');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedAgendaDay, setSelectedAgendaDay] = useState<DayOfWeek>(() => {
    const days: DayOfWeek[] = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const idx = new Date().getDay();
    const name = days[idx];
    return name === 'Domingo' ? 'Domingo' : name; // Fallback or direct map
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('citrino_theme') || 'dark') as 'light' | 'dark';
  });

  // Apply theme class to document root for responsive transition styles
  useEffect(() => {
    localStorage.setItem('citrino_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  // Core Data State
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('citrino_tasks_slate');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading tasks from localStorage', e);
      }
    }
    return INITIAL_TASKS;
  });

  // Gamification (XP / Level) State
  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem('citrino_xp_slate');
    return saved ? parseInt(saved, 10) : 120;
  });

  // Hydration state (water count + timer)
  const [waterCups, setWaterCups] = useState<number>(() => {
    const saved = localStorage.getItem('citrino_water_cups');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lastWaterTimestamp, setLastWaterTimestamp] = useState<string>(() => {
    const saved = localStorage.getItem('citrino_last_water_time');
    return saved || new Date().toISOString();
  });
  const [secondsSinceWater, setSecondsSinceWater] = useState<number>(0);

  // Filtering / Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TaskCategory>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [showCompleted, setShowCompleted] = useState<boolean>(true);

  // Interactive Task Modals & Forms State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  
  // Create / Edit Form Temporary States
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formCategory, setFormCategory] = useState<TaskCategory>('Geral');
  const [formDayOfWeek, setFormDayOfWeek] = useState<DayOfWeek | 'none'>('none');
  const [formSubtasks, setFormSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Save to LocalStorage whenever tasks modify
  useEffect(() => {
    localStorage.setItem('citrino_tasks_slate', JSON.stringify(tasks));
  }, [tasks]);

  // Save XP
  useEffect(() => {
    localStorage.setItem('citrino_xp_slate', xp.toString());
  }, [xp]);

  // Keep track of water hydration time elapsed (calculates 2 hours indicator)
  useEffect(() => {
    localStorage.setItem('citrino_water_cups', waterCups.toString());
    localStorage.setItem('citrino_last_water_time', lastWaterTimestamp);
  }, [waterCups, lastWaterTimestamp]);

  useEffect(() => {
    const calculateElapsed = () => {
      const diffMs = Date.now() - new Date(lastWaterTimestamp).getTime();
      setSecondsSinceWater(Math.floor(diffMs / 1000));
    };
    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [lastWaterTimestamp]);

  // 2-hour hydration rule helper (7200 seconds)
  const isHydrationOverdue = secondsSinceWater >= 7200;

  // Level calculator (100 XP per level)
  const level = Math.floor(xp / 100) + 1;
  const xpInCurrentLevel = xp % 100;

  // Sound effects fallback
  const playSound = (type: 'check' | 'level' | 'click') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'check') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(640, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.18);
      } else if (type === 'level') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.06);
      }
    } catch (e) {
      // AudioContext blocker fallback
    }
  };

  // Toggle tasks completion & handle XP accumulation
  const handleToggleTask = (id: string) => {
    playSound('check');
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        // Adjust XP
        if (nextCompleted) {
          const award = t.priority === 'high' ? 45 : t.priority === 'medium' ? 30 : 20;
          const newTotalXp = xp + award;
          setXp(newTotalXp);
          // Trigger Level UP celebration if crosses boundary
          if (Math.floor(newTotalXp / 100) > Math.floor(xp / 100)) {
            setTimeout(() => {
              playSound('level');
              confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.65 },
                colors: ['#f59e0b', '#06b6d4', '#10b981']
              });
            }, 250);
          } else {
            // Standard mini task celebration
            confetti({
              particleCount: 15,
              spread: 30,
              angle: 90,
              origin: { y: 0.8 },
              colors: ['#f59e0b', '#fbbf24']
            });
          }
        } else {
          // Subtract XP safely
          const penalty = t.priority === 'high' ? 45 : t.priority === 'medium' ? 30 : 20;
          setXp(prev => Math.max(0, prev - penalty));
        }
        return { ...t, completed: nextCompleted };
      }
      return t;
    });
    setTasks(updated);
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    playSound('check');
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextSubs = t.subtasks.map(s => {
          if (s.id === subtaskId) {
            const nextVal = !s.completed;
            if (nextVal) setXp(prev => prev + 5);
            else setXp(prev => Math.max(0, prev - 5));
            return { ...s, completed: nextVal };
          }
          return s;
        });
        return { ...t, subtasks: nextSubs };
      }
      return t;
    });
    setTasks(updated);
  };

  // Water Drink Action
  const handleDrinkWater = () => {
    playSound('check');
    setWaterCups(prev => prev + 1);
    setLastWaterTimestamp(new Date().toISOString());
    confetti({
      particleCount: 25,
      spread: 40,
      colors: ['#22d3ee', '#0ea5e9']
    });
  };

  // Reset Water Cup meter
  const handleResetWater = () => {
    playSound('click');
    setWaterCups(0);
  };

  // Task Creation and Modification Submissions
  const handleOpenCreateModal = (day?: DayOfWeek) => {
    setTaskToEdit(null);
    setFormTitle('');
    setFormDescription('');
    setFormPriority('medium');
    setFormCategory('Geral');
    setFormDayOfWeek(day || 'none');
    setFormSubtasks([]);
    setNewSubtaskTitle('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (t: Task) => {
    setTaskToEdit(t);
    setFormTitle(t.title);
    setFormDescription(t.description || '');
    setFormPriority(t.priority);
    setFormCategory(t.category);
    setFormDayOfWeek(t.dayOfWeek || 'none');
    setFormSubtasks(t.subtasks || []);
    setNewSubtaskTitle('');
    setIsCreateModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (taskToEdit) {
      // Modify existing task
      setTasks(prev => prev.map(t => {
        if (t.id === taskToEdit.id) {
          return {
            ...t,
            title: formTitle.trim(),
            description: formDescription.trim(),
            priority: formPriority,
            category: formCategory,
            dayOfWeek: formDayOfWeek === 'none' ? undefined : formDayOfWeek,
            subtasks: formSubtasks
          };
        }
        return t;
      }));
    } else {
      // Add brand new task
      const newTask: Task = {
        id: 'task-' + Date.now(),
        title: formTitle.trim(),
        description: formDescription.trim(),
        completed: false,
        priority: formPriority,
        category: formCategory,
        dayOfWeek: formDayOfWeek === 'none' ? undefined : formDayOfWeek,
        subtasks: formSubtasks,
        createdAt: new Date().toISOString()
      };
      setTasks(prev => [newTask, ...prev]);
      
      confetti({
        particleCount: 20,
        spread: 30,
        colors: ['#f59e0b']
      });
    }

    setIsCreateModalOpen(false);
    setTaskToEdit(null);
  };

  // Form Subtask handlers
  const handleAddFormSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: SubTask = {
      id: 'sub-' + Date.now(),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setFormSubtasks(prev => [...prev, newSub]);
    setNewSubtaskTitle('');
  };

  const handleRemoveFormSubtask = (id: string) => {
    setFormSubtasks(prev => prev.filter(s => s.id !== id));
  };

  // Delete Task
  const handleDeleteTask = (id: string) => {
    playSound('click');
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Reset demo structure helper
  const handleResetApp = () => {
    if (window.confirm('Tem certeza de que deseja apagar todas as personalizações e tarefas? Isso reiniciará o aplicativo.')) {
      localStorage.clear();
      setTasks(INITIAL_TASKS);
      setXp(120);
      setWaterCups(0);
      setLastWaterTimestamp(new Date().toISOString());
      setViewMode('tarefas');
      confetti({ particleCount: 30 });
    }
  };

  // Switch tabs with a micro-sound feedback
  const handleViewChange = (mode: 'tarefas' | 'agenda' | 'progresso' | 'configuracoes') => {
    playSound('click');
    setViewMode(mode);
    setIsMobileMenuOpen(false);
  };

  // Computed/Filtered tasks list
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesCompleted = showCompleted || !t.completed;
    return matchesSearch && matchesCategory && matchesPriority && matchesCompleted;
  });

  // Calculate generic counts for the sidebar badges
  const activeTasksCount = tasks.filter(t => !t.completed).length;
  const weeklyAgendaCount = tasks.filter(t => t.dayOfWeek && !t.completed).length;

  // Weekly layout mapping
  const DAYS_LIST: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  // Categories helper list for styling
  const getCategoryColor = (cat: TaskCategory) => {
    switch (cat) {
      case 'Trabalho': return 'text-amber-500 bg-amber-550/10 border-amber-500/20';
      case 'Estudo': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'Pessoal': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      case 'Saúde': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-slate-350 bg-slate-800/40 border-slate-700/35';
    }
  };

  return (
    <div id="citrino-applet" className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased md:flex transition-colors duration-200">
      
      {/* 🚀 RESPONSIVE SIDEBAR: VERTICAL FUNCTIONS MENU */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-850 bg-slate-900 hidden md:flex flex-col z-30 select-none transition-colors duration-200">
        {/* Branding Title & Icon */}
        <div className="p-6 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 shadow-md">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h1 className="font-sans text-sm font-black tracking-widest text-[#ffffff] uppercase leading-none">Citrino</h1>
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest leading-none block mt-1">PLANNER INTELIGENTE</span>
            </div>
          </div>

          {/* Theme Selector (Desktop) */}
          <button
            onClick={() => {
              playSound('click');
              setTheme(theme === 'light' ? 'dark' : 'light');
            }}
            className="p-1.5 h-8 w-8 rounded-lg bg-slate-850 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
            title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>
        </div>

        {/* Level & XP micro HUD panel */}
        <div className="p-4 mx-4 my-3 rounded-2xl bg-slate-850 border border-slate-800 flex items-center gap-3.5 transition-colors duration-200">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 font-black border border-amber-500/20 text-sm">
            Lvl {level}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span>Nível Atual</span>
              <span>{xpInCurrentLevel}/100 XP</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300" 
                style={{ width: `${xpInCurrentLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Vertical List Menu */}
        <nav className="flex-1 px-4 py-3 space-y-1">
          <span className="text-[10px] font-black tracking-widest text-[#41537C] uppercase block px-3 mb-2">FUNÇÕES</span>
          {[
            { id: 'tarefas', label: 'Lista de Tarefas', icon: CheckCircle2, badge: activeTasksCount, color: 'text-amber-500' },
            { id: 'agenda', label: 'Agenda Semanal', icon: Calendar, badge: weeklyAgendaCount, color: 'text-cyan-400' },
            { id: 'progresso', label: 'Estatísticas & Nivel', icon: TrendingUp, color: 'text-emerald-400' },
            { id: 'configuracoes', label: 'Configurações', icon: Settings, color: 'text-[#94A3B8]' }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = viewMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-300 group ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25 shadow-md shadow-amber-500/5'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110 ${isActive ? item.color : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${isActive ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-850 text-slate-400 border border-slate-800'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Minimalist Water Reminder integrated into the bottom of sidebar */}
        <div className="p-4 border-t border-slate-850 bg-slate-900/40 transition-colors duration-200">
          <div 
            className={`rounded-2xl p-3.5 border transition-all duration-500 ${
              isHydrationOverdue 
                ? 'border-cyan-500/60 bg-cyan-950/20 shadow-[0_0_12px_rgba(6,182,212,0.15)] animate-[border-pulse-cyan_2s_infinite]' 
                : 'border-slate-800 bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                <Droplet className="h-3 w-3 fill-current animate-bounce" /> Hidratação
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">Há {Math.floor(secondsSinceWater / 60)}m</span>
            </div>
            
            <p className="text-[11px] leading-relaxed text-slate-300 mb-2.5">
              {waterCups >= 8 ? '🎯 Meta diária alcançada! Excelente!' : `Você registrou ${waterCups} de 8 copos hoje.`}
            </p>

            <div className="flex gap-1.5">
              <button
                onClick={handleDrinkWater}
                className="flex-1 py-1.5 px-3 bg-gradient-to-r from-cyan-500 to-sky-400 text-slate-950 font-black text-[10px] rounded-lg tracking-wider uppercase transition-colors hover:brightness-110 cursor-pointer border-0 shadow"
              >
                + Registrar Copo
              </button>
              {waterCups > 0 && (
                <button
                  onClick={handleResetWater}
                  title="Zerar água"
                  className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER TRIGGER */}
      <header className="md:hidden sticky top-0 z-40 border-b border-slate-850 bg-slate-900/90 backdrop-blur-md px-4 py-3 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 shadow">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <div>
            <h1 className="font-sans text-xs font-black tracking-wider text-slate-50 uppercase">Citrino</h1>
            <span className="text-[8px] text-amber-500 font-bold block leading-none">Nível {level} • {xpInCurrentLevel}/100 XP</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Selector (Mobile) */}
          <button
            onClick={() => {
              playSound('click');
              setTheme(theme === 'light' ? 'dark' : 'light');
            }}
            className="p-2 text-slate-400 hover:text-slate-100 bg-slate-850 border border-slate-800 rounded-xl transition-all h-9 w-9 flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer"
            title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-400 hover:text-white bg-slate-850 border border-slate-800 rounded-xl cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* MOBILE NAVIGATION SLIDE DRAWER overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden select-none">
            {/* Backdrop black overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs"
            />

            {/* Sidebar Slide-in */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 shadow">
                      <Zap className="h-4.5 w-4.5 fill-current" />
                    </div>
                    <span className="font-sans text-sm font-black tracking-widest text-slate-100 uppercase">Citrino</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Level Display */}
                <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center gap-3 mb-6">
                  <div className="h-9 w-9 flex shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-550/20 text-xs font-black">
                    Lvl {level}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                      <span>Progresso do Nível</span>
                      <span>{xpInCurrentLevel}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${xpInCurrentLevel}%` }} />
                    </div>
                  </div>
                </div>

                {/* Navigation links */}
                <nav className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-2.5 mb-1.5">FUNÇÕES</span>
                  {[
                    { id: 'tarefas', label: 'Lista de Tarefas', icon: CheckCircle2, badge: activeTasksCount, color: 'text-amber-500' },
                    { id: 'agenda', label: 'Agenda Semanal', icon: Calendar, badge: weeklyAgendaCount, color: 'text-cyan-400' },
                    { id: 'progresso', label: 'Estatísticas & Nivel', icon: TrendingUp, color: 'text-emerald-400' },
                    { id: 'configuracoes', label: 'Configurações', icon: Settings, color: 'text-slate-400' }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = viewMode === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleViewChange(item.id as any)}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                          isActive
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25 shadow'
                            : 'text-slate-400 hover:text-slate-250 hover:bg-slate-850/65'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4.5 w-4.5 ${isActive ? item.color : 'text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-500 text-slate-950">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile bottom panel */}
              <div className="mt-8 pt-4 border-t border-slate-800">
                <div className={`rounded-xl p-3 border ${isHydrationOverdue ? 'border-cyan-500/50 bg-cyan-950/15 animate-pulse' : 'border-slate-800 bg-slate-850'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">💧 Água</span>
                    <span className="text-[9px] text-slate-400">Total: {waterCups} copos</span>
                  </div>
                  <button
                    onClick={() => {
                      handleDrinkWater();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-1.5 bg-cyan-500 text-slate-950 font-black text-[9px] rounded-lg tracking-wider uppercase border-0 cursor-pointer shadow"
                  >
                    Marcar Copo d'Água 💧
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 PRIMARY CANVAS CONTAINER WITH SMOOTH SLIDE-IN TRANSITIONS */}
      <main className="flex-1 flex flex-col md:pl-64 min-w-0 min-h-screen">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 relative max-w-5xl w-full mx-auto">
          
          <AnimatePresence mode="wait">
            
            {/* VIEW MODE 1: TODO LIST VIEW (📋 TAREFAS) */}
            {viewMode === 'tarefas' && (
              <motion.div
                key="tab-tarefas"
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-6"
              >
                {/* Clean, descriptive title block without excessive text */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-850 pb-5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6 text-amber-500 shrink-0" /> Minhas Tarefas
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Gerencie prioridades do seu dia e acumule experiência para avançar de nível.</p>
                  </div>

                  <button
                    onClick={() => handleOpenCreateModal()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-extrabold text-xs px-4.5 py-3 shadow-lg shadow-amber-500/10 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider border-0"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" /> Nova Tarefa
                  </button>
                </div>

                {/* SEARCH & FILTERS BOX: BEAUTIFUL, CLEAN BUTTON ALIGNMENTS */}
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col lg:flex-row gap-3 shadow-xl transition-all duration-200">
                  {/* Search text input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar tarefas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 placeholder:text-slate-500 transition-all"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as any)}
                      className={`rounded-xl border bg-slate-950 px-3 py-2 text-xs font-bold transition-all cursor-pointer focus:outline-none ${
                        categoryFilter !== 'all' ? 'border-amber-500 text-amber-400' : 'border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <option value="all">📁 Categorias</option>
                      <option value="Trabalho">Trabalho</option>
                      <option value="Estudo">Estudo</option>
                      <option value="Pessoal">Pessoal</option>
                      <option value="Saúde">Saúde</option>
                      <option value="Geral">Geral</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value as any)}
                      className={`rounded-xl border bg-slate-950 px-3 py-2 text-xs font-bold transition-all cursor-pointer focus:outline-none ${
                        priorityFilter !== 'all' ? 'border-amber-500 text-amber-400' : 'border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <option value="all">⚡ Prioridade</option>
                      <option value="high">Altíssima</option>
                      <option value="medium">Média</option>
                      <option value="low">Leve</option>
                    </select>

                    {/* Toggle completed visibility */}
                    <button
                      onClick={() => setShowCompleted(prev => !prev)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        showCompleted 
                          ? 'bg-slate-800 text-slate-250 border-slate-700' 
                          : 'bg-slate-950 text-slate-500 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <Filter className="h-3 w-3" />
                      <span>{showCompleted ? 'Ocular Concluídas' : 'Mostrar Concluídas'}</span>
                    </button>
                  </div>
                </div>

                {/* TASK ITEMS LIST CONTAINER */}
                <div className="space-y-3">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl bg-slate-900 border border-dashed border-slate-800">
                      <AlertCircle className="h-8 w-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                      <p className="text-sm font-bold text-slate-400">Nenhuma tarefa encontrada.</p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">Você pode criar uma nova tarefa pelo botão no menu ou topo de página.</p>
                    </div>
                  ) : (
                    filteredTasks.map((task) => {
                      const completedCount = task.subtasks.filter(s => s.completed).length;
                      const hasSubtasks = task.subtasks.length > 0;
                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`group rounded-2xl bg-slate-900 border p-4.5 sm:p-5 shadow-sm transition-all duration-150 ${
                            task.completed 
                              ? 'border-slate-850/60 opacity-60 bg-slate-950' 
                              : 'border-slate-800 hover:border-slate-650 hover:shadow-lg'
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            {/* Complete trigger with CSS matching ID `.group button:has(svg.CheckCircle2)` */}
                            <button
                              onClick={() => handleToggleTask(task.id)}
                              className={`group shrink-0 h-5.5 w-5.5 rounded-lg flex items-center justify-center transition-all duration-200 border cursor-pointer ${
                                task.completed
                                  ? 'bg-amber-500 border-amber-500 text-slate-950'
                                  : 'border-slate-700 bg-slate-950 hover:border-amber-500 hover:bg-amber-500/10'
                              }`}
                            >
                              <CheckCircle2 className={`CheckCircle2 h-4 w-4 transition-transform duration-200 ${
                                task.completed ? 'scale-100' : 'scale-0'
                              }`} />
                            </button>

                            <div className="flex-1 min-w-0">
                              {/* Header info line */}
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">
                                <span className={`px-2 py-0.5 rounded-md border ${getCategoryColor(task.category)}`}>
                                  {task.category}
                                </span>
                                
                                {task.priority === 'high' && (
                                  <span className="text-red-400 bg-red-400/5 px-1.5 py-0.5 rounded border border-red-500/10 font-black">Alta</span>
                                )}
                                {task.priority === 'medium' && (
                                  <span className="text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">Média</span>
                                )}
                                {task.priority === 'low' && (
                                  <span className="text-emerald-400 bg-emerald-400/5 px-1.5 py-0.5 rounded border border-emerald-500/10">Leve</span>
                                )}

                                {task.dayOfWeek && (
                                  <span className="text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20 flex items-center gap-1 font-black">
                                    📅 {task.dayOfWeek}
                                  </span>
                                )}
                              </div>

                              {/* Title / Description */}
                              <h3 
                                onClick={() => handleToggleTask(task.id)}
                                className={`text-sm sm:text-base font-bold select-none cursor-pointer tracking-tight leading-snug break-words ${
                                  task.completed ? 'line-through text-slate-500' : 'text-slate-100 group-hover:text-amber-400 transition-colors'
                                }`}
                              >
                                {task.title}
                              </h3>

                              {task.description && (
                                <p className={`text-xs mt-1 leading-relaxed max-w-3xl ${task.completed ? 'text-slate-650' : 'text-slate-400'}`}>
                                  {task.description}
                                </p>
                              )}

                              {/* Subtasks block */}
                              {hasSubtasks && (
                                <div className="mt-3.5 pt-3.5 border-t border-slate-850 space-y-2">
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                    <span>SUB-TAREFAS ({completedCount}/{task.subtasks.length})</span>
                                    <span>{Math.round((completedCount / task.subtasks.length) * 100)}% concluído</span>
                                  </div>
                                  <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                    <div 
                                      className="h-full bg-cyan-400" 
                                      style={{ width: `${(completedCount / task.subtasks.length) * 100}%` }}
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    {task.subtasks.map((sub) => (
                                      <button
                                        key={sub.id}
                                        onClick={() => handleToggleSubtask(task.id, sub.id)}
                                        className={`flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-705 text-left transition-colors cursor-pointer ${
                                          sub.completed ? 'opacity-65 text-slate-500' : 'text-slate-300'
                                        }`}
                                      >
                                        <div className={`h-4 w-4 shrink-0 rounded flex items-center justify-center border text-[9px] ${
                                          sub.completed ? 'bg-cyan-500 border-cyan-500 text-slate-950 font-black' : 'border-slate-700 bg-slate-950'
                                        }`}>
                                          {sub.completed && <Check className="h-3 w-3 animate-[pulse-scale_0.2s_ease-out]" />}
                                        </div>
                                        <span className={`text-[11px] font-medium break-all leading-tight ${sub.completed ? 'line-through' : ''}`}>
                                          {sub.title}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Item Actions */}
                            <div className="flex items-center shrink-0 gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditModal(task)}
                                title="Editar"
                                className="p-1.5 hover:text-white text-slate-500 hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer border-0 flex items-center justify-center"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                title="Deletar"
                                className="p-1.5 hover:text-red-400 text-slate-500 hover:bg-red-400/15 rounded-lg transition-colors cursor-pointer border-0 flex items-center justify-center"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}

            {/* VIEW MODE 2: WEEK PLANNING (📅 AGENDA) */}
            {viewMode === 'agenda' && (() => {
              const daysOfWeekMap: DayOfWeek[] = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
              const todayDayName = daysOfWeekMap[new Date().getDay()];

              return (
                <motion.div
                  key="tab-agenda"
                  initial={{ opacity: 0, x: 25 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -25 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="space-y-6"
                >
                  {/* Title */}
                  <div className="border-b border-slate-850 pb-5">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                      <Calendar className="h-6 w-6 text-cyan-400 shrink-0" /> Agenda Semanal
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Sua semana em perspectiva de alta performance. Selecione os dias para detalhar metas programadas.</p>
                  </div>

                  {/* HORIZONTAL DAYS ROW WITH DYNAMIC INDICATORS & HIGHLIGHT FOR TODAY */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-855 scrollbar-track-transparent">
                    {DAYS_LIST.map((day) => {
                      const dayTasks = tasks.filter(t => t.dayOfWeek === day);
                      const completedInDayCount = dayTasks.filter(t => t.completed).length;
                      const totalInDayCount = dayTasks.length;
                      
                      const isToday = day === todayDayName;
                      const isSelected = day === selectedAgendaDay;
                      
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setSelectedAgendaDay(day);
                          }}
                          className={`flex-1 min-w-[90px] sm:min-w-[120px] flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-300 relative cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-lg shadow-amber-500/5'
                              : isToday
                                ? 'bg-slate-905 border-amber-500/40 text-amber-500 hover:border-amber-550/60'
                                : 'bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-700 hover:text-slate-100'
                          }`}
                        >
                          {/* Little absolute indicator for "HOJE" */}
                          {isToday && (
                            <span className="absolute -top-1.5 bg-gradient-to-r from-amber-550 to-yellow-450 text-slate-950 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow border border-amber-400/20">
                              hoje
                            </span>
                          )}

                          <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase mb-1.5">{day}</span>
                          
                          {/* Task counter status dot or number */}
                          {totalInDayCount > 0 ? (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                              isSelected 
                                ? 'bg-amber-500 text-slate-950 font-black' 
                                : completedInDayCount === totalInDayCount
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-800 text-slate-300'
                            }`}>
                              {completedInDayCount}/{totalInDayCount}
                            </span>
                          ) : (
                            <span className="text-[8px] opacity-45">—</span>
                          )}

                          {/* Animated Underline for Selected Tab */}
                          {isSelected && (
                            <motion.div
                              layoutId="active-agenda-tab"
                              className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-amber-500"
                              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* EXPANDABLE DAY SECTION WITH SMOOTH SLIDE-FADE IN ANIMATION */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedAgendaDay}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="bg-slate-900 border border-slate-850 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

                      {/* Header with Title and Add to Day Action */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-850 pb-5 mb-5 select-none text-left">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                              📅 {selectedAgendaDay}-feira
                            </h3>
                            {selectedAgendaDay === todayDayName && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-wider">
                                HOJE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">Metas e rotinas agendadas especificamente para este dia.</p>
                        </div>

                        <button
                          onClick={() => handleOpenCreateModal(selectedAgendaDay)}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 border border-amber-550/20 hover:border-amber-500 text-amber-500 font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                        >
                          <Plus className="h-4 w-4 stroke-[3]" /> Agendar Tarefa
                        </button>
                      </div>

                      {/* Task list for selected day */}
                      <div className="space-y-3.5">
                        {tasks.filter(t => t.dayOfWeek === selectedAgendaDay).length === 0 ? (
                          <div className="text-center py-12 border border-dashed border-slate-800 bg-slate-950/20 rounded-2xl">
                             <Droplet className="h-8 w-8 text-cyan-500/30 mx-auto mb-2.5 animate-bounce" />
                             <h4 className="text-xs font-bold text-slate-400">Nenhuma meta programada para {selectedAgendaDay}</h4>
                             <p className="text-[10px] text-slate-500 mt-1 mb-4.5 max-w-xs mx-auto">Mantenha constância equilibrando suas atividades da semana.</p>
                             <button
                               onClick={() => handleOpenCreateModal(selectedAgendaDay)}
                               className="inline-flex items-center gap-1.5 py-2.5 px-4.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[10px] uppercase cursor-pointer border-0 shadow-md transition-all font-sans"
                             >
                               <Plus className="h-4.5 w-4.5 stroke-[3]" /> Agendar Metas
                             </button>
                          </div>
                        ) : (
                          tasks.filter(t => t.dayOfWeek === selectedAgendaDay).map((t) => {
                            const completedCount = t.subtasks?.filter(s => s.completed).length || 0;
                            const hasSubtasks = t.subtasks && t.subtasks.length > 0;
                            return (
                              <motion.div
                                key={t.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-4 rounded-2xl border transition-all duration-200 text-left ${
                                  t.completed 
                                    ? 'bg-slate-955/50 border-slate-850/60 opacity-60' 
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-650'
                                }`}
                              >
                                <div className="flex items-start gap-3.5">
                                  <button
                                    onClick={() => handleToggleTask(t.id)}
                                    className={`h-5.5 w-5.5 shrink-0 rounded-lg flex items-center justify-center border cursor-pointer transition-colors ${
                                      t.completed ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700 bg-slate-950 hover:border-amber-500'
                                    }`}
                                  >
                                    {t.completed && <Check className="h-3.5 w-3.5" />}
                                  </button>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">
                                      <span className={`px-2 py-0.5 rounded border ${getCategoryColor(t.category)}`}>
                                        {t.category}
                                      </span>
                                      {t.priority === 'high' && <span className="text-red-400 bg-red-400/5 px-1.5 py-0.5 rounded border border-red-500/10 font-bold">Alta</span>}
                                      {t.priority === 'medium' && <span className="text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">Média</span>}
                                      {t.priority === 'low' && <span className="text-emerald-400 bg-emerald-400/5 px-1.5 py-0.5 rounded border border-emerald-500/10">Leve</span>}
                                    </div>

                                    <h4 
                                      onClick={() => handleToggleTask(t.id)}
                                      className={`text-sm sm:text-base font-bold select-none cursor-pointer tracking-tight break-words leading-snug ${
                                        t.completed ? 'line-through text-slate-500' : 'text-slate-100 hover:text-amber-400 transition-colors'
                                      }`}
                                    >
                                      {t.title}
                                    </h4>

                                    {t.description && (
                                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{t.description}</p>
                                    )}

                                    {/* Subtasks block */}
                                    {hasSubtasks && (
                                      <div className="mt-3.5 pt-3.5 border-t border-slate-850 space-y-2">
                                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                                          <span>SUB-TAREFAS ({completedCount}/{t.subtasks.length})</span>
                                          <span>{Math.round((completedCount / t.subtasks.length) * 100)}%</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {t.subtasks.map((sub) => (
                                            <button
                                              key={sub.id}
                                              onClick={() => handleToggleSubtask(t.id, sub.id)}
                                              className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-left cursor-pointer hover:border-slate-700"
                                            >
                                              <div className={`h-4 w-4 shrink-0 rounded flex items-center justify-center border text-[9px] ${
                                                sub.completed ? 'bg-cyan-550 border-cyan-550 text-slate-950 font-black' : 'border-slate-700 bg-slate-950'
                                              }`}>
                                                {sub.completed && <Check className="h-3 w-3" />}
                                              </div>
                                              <span className="text-[10px] truncate max-w-[120px]">{sub.title}</span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center shrink-0 gap-1 pl-2">
                                    <button
                                      onClick={() => handleOpenEditModal(t)}
                                      title="Editar"
                                      className="p-2 hover:text-white text-slate-500 hover:bg-slate-800/40 rounded-lg transition-colors border-0 cursor-pointer flex items-center justify-center"
                                    >
                                      <Edit3 className="h-3.8 w-3.8" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(t.id)}
                                      title="Deletar"
                                      className="p-2 hover:text-red-400 text-slate-500 hover:bg-red-400/15 rounded-lg transition-colors border-0 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.8 w-3.8" />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              );
            })()}

            {/* VIEW MODE 3: PROGRESS / LEVEL SYSTEM (📊 PROGRESSO) */}
            {viewMode === 'progresso' && (
              <motion.div
                key="tab-progresso"
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-6"
              >
                {/* Title */}
                <div className="border-b border-[#141C31] pb-5">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                    <TrendingUp className="h-6 w-6 text-emerald-400 shrink-0" /> Progresso & Nivel
                  </h2>
                  <p className="text-xs text-slate-410 mt-1 font-medium">Monitore suas estatísticas gerais de produtividade e mantenha constância de hábitos.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 select-none">
                  {/* Left big card - Overview HUD */}
                  <div className="md:col-span-4 bg-[#0E1528] rounded-2xl border border-[#19274A] p-6 text-center flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
                    
                    <div>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-4">Sua Graduação Citrino</span>
                      <div className="text-4xl font-black font-mono tracking-tighter text-white block mb-1">Level {level}</div>
                      <span className="text-xs font-bold text-slate-350 bg-[#16213D] border border-[#233561] px-3.5 py-1.5 rounded-full inline-block mb-6">
                        Produtor Autônomo
                      </span>
                    </div>

                    <div className="space-y-3.5 pt-6 border-t border-[#182342]">
                      <div className="text-left">
                        <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                          <span>Progresso do Nível</span>
                          <span>{xpInCurrentLevel}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-[#070B14] rounded-full overflow-hidden border border-[#16223F]">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${xpInCurrentLevel}%` }} />
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 text-left leading-relaxed">
                        Complete tarefas, check-lists ou organize sua semana para acumular mais experiência. Nossos algoritmos gamificados de foco auxiliam na neuroplasticidade da produtividade!
                      </p>
                    </div>
                  </div>

                  {/* Right - Stat counters */}
                  <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#0E1528] border border-[#141D32] p-5 rounded-2xl">
                      <span className="text-[10px] font-black text-[#6C85BA] uppercase tracking-widest block mb-1">Metas Totais Cadastradas</span>
                      <div className="text-3xl font-black text-white">{tasks.length}</div>
                      <p className="text-[11px] text-[#415582] mt-2">Histórico completo de toda sua meta local registrada.</p>
                    </div>

                    <div className="bg-[#0E1528] border border-[#141D32] p-5 rounded-2xl">
                      <span className="text-[10px] font-black text-[#50DEAA] uppercase tracking-widest block mb-1">Metas Finalizadas</span>
                      <div className="text-3xl font-black text-emerald-400">{tasks.filter(t => t.completed).length}</div>
                      <p className="text-[11px] text-slate-400 mt-2">Foco e resiliência transformados em objetivos executados.</p>
                    </div>

                    <div className="bg-[#0E1528] border border-[#141D32] p-5 rounded-2xl">
                      <span className="text-[10px] font-black text-[#4CCCE9] uppercase tracking-widest block mb-1">Média de Conclusão</span>
                      <div className="text-3xl font-black text-slate-200">
                        {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">Porcentagem global de produtividade e execução diária.</p>
                    </div>

                    <div className="bg-[#0E1528] border border-[#141D32] p-5 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest block mb-1">Estimador de XP de metas</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                          Próxima meta de alta prioridade concederá <strong className="text-amber-500">+45 XP</strong> caso realizada com sucesso!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inspirational motivational quotes block */}
                <div className="bg-[#121A30]/50 border border-[#1B294C] rounded-2xl p-5 flex items-start gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-lg">
                    💡
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">FRASE DE EFICIÊNCIA DIÁRIA</h4>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      "A simplicidade de planejar o seu dia em pequenas porções evita a ansiedade do acúmulo e pavimenta um caminho de resultados consistentes. Foque nas próximas horas!"
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* VIEW MODE 4: CONFIGURATIONS (⚙️ CONFIGURAÇÕES) */}
            {viewMode === 'configuracoes' && (
              <motion.div
                key="tab-configuracoes"
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-6"
              >
                {/* Title */}
                <div className="border-b border-slate-850 pb-5">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                    <Settings className="h-6 w-6 text-slate-400 shrink-0" /> Configurações do Citrino
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Configure as propriedades do seu workspace local, banco de dados e preferências gerais.</p>
                </div>

                <div className="space-y-4 max-w-2xl select-none">
                  {/* Preferences block */}
                  <div className="bg-slate-900 rounded-2xl border border-slate-850 p-5 space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider pb-2 border-b border-slate-850">Preferências Gerais</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-250 block">Sons de Notificação de Tarefas</span>
                        <span className="text-[10px] text-slate-500 block block">Emite bipes sintéticos de feedback ao cumprir metas.</span>
                      </div>
                      <button 
                        onClick={() => playSound('check')}
                        className="px-3.5 py-2 rounded-xl bg-slate-950 text-xs font-bold text-slate-400 border border-slate-800 hover:text-white transition-colors cursor-pointer"
                      >
                        Testar Áudio 🔊
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-850">
                      <div>
                        <span className="text-xs font-bold text-slate-205 block">Plano de Fundo Dinâmico</span>
                        <span className="text-[10px] text-slate-500 block">Sincronizado automaticamente com o tema noturno do Citrino.</span>
                      </div>
                      <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[9px] font-black tracking-widest text-[#50DEAA] uppercase">
                        ATIVADO
                      </span>
                    </div>
                  </div>

                  {/* Backups & Resets */}
                  <div className="bg-slate-900 rounded-2xl border border-slate-850 p-5 space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider pb-2 border-b border-slate-850">Zona de Perigo & Reinicialização</h3>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Caso o seu navegador esteja desatualizado ou as informações de sincronização entrem em conflito, você poderá apagar as chaves locais para recomeçar o Citrino Planner.
                    </p>

                    <button
                      onClick={handleResetApp}
                      className="px-4 py-2.5 bg-red-400/10 hover:bg-red-400/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-extrabold text-[10px] rounded-xl tracking-wider uppercase transition-all cursor-pointer"
                    >
                      Reiniciar Todo o Projeto ☠️
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </main>

      {/* ========================================================================= */}
      {/* 📋 INLINE TASK CREATION & EDIT OVERLAYS MODALS (INTERACTIVE FORM) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            {/* Backdrop color filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs"
            />

            {/* Modal Dialog Body */}
            <motion.div
              initial={{ scale: 0.94, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 15, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl overflow-hidden z-10"
            >
              {/* Top Row Title */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-850 mb-4 font-sans">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  {taskToEdit ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form Input Container */}
              <form onSubmit={handleSaveTask} className="space-y-4">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome da Tarefa/Meta *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Praticar React ou Lavar louça..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Breve Descrição (Opcional)</label>
                  <textarea
                    placeholder="Detalhes adicionais para orientar sua execução."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full h-16 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Select properties grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categoria</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as TaskCategory)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-slate-300 font-bold focus:outline-none"
                    >
                      <option value="Trabalho">Trabalho</option>
                      <option value="Estudo">Estudo</option>
                      <option value="Pessoal">Pessoal</option>
                      <option value="Saúde">Saúde</option>
                      <option value="Geral">Geral</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prioridade</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-slate-300 font-bold focus:outline-none"
                    >
                      <option value="high">Altíssima (Alto XP)</option>
                      <option value="medium">Média (Médio XP)</option>
                      <option value="low">Leve (Baixo XP)</option>
                    </select>
                  </div>

                  {/* Weekly Scheduling */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dia de Execução</label>
                    <select
                      value={formDayOfWeek}
                      onChange={(e) => setFormDayOfWeek(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-slate-300 font-bold focus:outline-none"
                    >
                      <option value="none">Nenhum (Livre)</option>
                      <option value="Segunda">Segunda-feira</option>
                      <option value="Terça">Terça-feira</option>
                      <option value="Quarta">Quarta-feira</option>
                      <option value="Quinta">Quinta-feira</option>
                      <option value="Sexta">Sexta-feira</option>
                      <option value="Sábado">Sábado</option>
                      <option value="Domingo">Domingo</option>
                    </select>
                  </div>
                </div>

                {/* Subtasks inside Creator overlay */}
                <div className="border-t border-slate-850 pt-3.5 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Checklist de Subtarefas</label>
                  
                  {/* Inline list of newly added subtasks */}
                  {formSubtasks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pb-2">
                      {formSubtasks.map((s, index) => (
                        <div key={s.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-350">
                          <span>{index + 1}. {s.title}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFormSubtask(s.id)}
                            className="text-red-400 hover:text-red-300 p-0 hover:bg-transparent cursor-pointer border-0"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Adder text line */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Adicione um subitem..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFormSubtask();
                        }
                      }}
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-250 placeholder:text-slate-650 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddFormSubtask}
                      className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-slate-100 font-extrabold text-[10px] rounded-xl tracking-wider uppercase border-0 transition-colors cursor-pointer"
                    >
                      Inserir Subitem
                    </button>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="pt-4 border-t border-slate-850 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer border border-slate-800"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-[10px] rounded-xl tracking-wider uppercase transition-colors hover:brightness-110 cursor-pointer border-0 shadow"
                  >
                    Salvar Mudanças ✨
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
