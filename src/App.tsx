import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
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
  ChevronLeft,
  ChevronRight,
  Filter,
  Cake,
  Brain,
  Wind,
  Bell,
  Play,
  Pause,
  Activity,
  LayoutDashboard,
  BarChart3,
  AlertTriangle,
  Inbox,
  Volume2,
  Trophy,
  Target
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
  dueDate?: string; // Format: YYYY-MM-DD
  completedAt?: string; // Format: YYYY-MM-DD
  reminder?: boolean; // Active reminder for today/general
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
    dueDate: '2026-06-02',
    reminder: true,
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
    completedAt: '2026-05-29',
    priority: 'medium',
    category: 'Trabalho',
    dayOfWeek: 'Terça',
    dueDate: '2026-05-29',
    reminder: false,
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
    dueDate: new Date().toISOString().split('T')[0], // Today automatically!
    reminder: true,
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
    dueDate: '2026-06-05',
    reminder: true,
    subtasks: [],
    createdAt: new Date().toISOString()
  }
];

export interface Birthday {
  id: string;
  name: string;
  date: string; // Format: YYYY-MM-DD
  reminder1Day: boolean;
  reminder2Days: boolean;
  reminder3Days: boolean;
}

export const getBirthdayStatus = (dateStr: string, r1: boolean, r2: boolean, r3: boolean) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length < 3) return null;
  const bMonth = Number(parts[1]);
  const bDay = Number(parts[2]);
  
  const today = new Date();
  const currentYear = today.getFullYear();
  
  const bTodayY = new Date(currentYear, bMonth - 1, bDay);
  bTodayY.setHours(0, 0, 0, 0);
  
  const todayClear = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  todayClear.setHours(0, 0, 0, 0);
  
  let diffTime = bTodayY.getTime() - todayClear.getTime();
  let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    const bNextY = new Date(currentYear + 1, bMonth - 1, bDay);
    bNextY.setHours(0, 0, 0, 0);
    const diffTimeNext = bNextY.getTime() - todayClear.getTime();
    diffDays = Math.ceil(diffTimeNext / (1000 * 60 * 60 * 24));
  }
  
  const reminders: string[] = [];
  if (diffDays === 0) {
    reminders.push("Hoje - Lembrete automático de 5 horas antes ativo!");
  } else if (diffDays === 1 && r1) {
    reminders.push("Amanhã (1 dia antes) - Lembrete ativo!");
  } else if (diffDays === 2 && r2) {
    reminders.push("Em 2 dias - Lembrete ativo!");
  } else if (diffDays === 3 && r3) {
    reminders.push("Em 3 dias - Lembrete ativo!");
  }
  
  return {
    daysRemaining: diffDays,
    activeReminders: reminders,
    isToday: diffDays === 0,
    isTomorrow: diffDays === 1,
    isSoon: diffDays > 0 && diffDays <= 7
  };
};

export const getDaysRemainingForTask = (dueDateStr: string): number => {
  if (!dueDateStr) return 0;
  const parts = dueDateStr.split('-');
  if (parts.length < 3) return 0;
  const taskYear = Number(parts[0]);
  const taskMonth = Number(parts[1]);
  const taskDay = Number(parts[2]);
  
  const taskDate = new Date(taskYear, taskMonth - 1, taskDay);
  taskDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  const todayClear = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  todayClear.setHours(0, 0, 0, 0);
  
  const diffTime = taskDate.getTime() - todayClear.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function App() {
  // Primary Navigation Tab state
  const [viewMode, setViewMode] = useState<'dashboard' | 'tarefas' | 'agenda' | 'progresso' | 'configuracoes' | 'foco'>('tarefas');
  const [agendaSubTab, setAgendaSubTab] = useState<'weekly' | 'birthdays'>('weekly');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('citrino_desktop_sidebar_open');
    return saved === null ? true : saved === 'true';
  });
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);
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

  // Sound Preferences State
  const [isTaskBeepEnabled, setIsTaskBeepEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('citrino_sound_tasks');
    return saved === null ? true : saved === 'true';
  });
  const [isLevelUpChimeEnabled, setIsLevelUpChimeEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('citrino_sound_levelup');
    return saved === null ? true : saved === 'true';
  });

  // Daily Goal Configuration Tiers
  const GOAL_TIERS = [
    { target: 1, xpReward: 15, label: "Foco Leve", badge: "Bronze" },
    { target: 3, xpReward: 40, label: "Produtivo", badge: "Prata" },
    { target: 5, xpReward: 80, label: "Focado", badge: "Ouro" },
    { target: 8, xpReward: 150, label: "Alta Performance", badge: "Platina" }
  ];

  // Daily Goal State
  const [dailyGoalTarget, setDailyGoalTarget] = useState<number>(() => {
    const saved = localStorage.getItem('citrino_daily_goal_target');
    return saved ? parseInt(saved, 10) : 3;
  });
  const [dailyGoalClaimedDate, setDailyGoalClaimedDate] = useState<string>(() => {
    const saved = localStorage.getItem('citrino_daily_goal_claimed_date');
    return saved || '';
  });

  // Daily Goal notification reminder time state
  const [dailyGoalReminderTime, setDailyGoalReminderTime] = useState<string>(() => {
    return localStorage.getItem('citrino_daily_goal_reminder_time') || '09:00';
  });
  const [dailyGoalReminderEnabled, setDailyGoalReminderEnabled] = useState<boolean>(() => {
    return localStorage.getItem('citrino_daily_goal_reminder_enabled') === 'true';
  });
  const [lastNotifiedDate, setLastNotifiedDate] = useState<string>(() => {
    return localStorage.getItem('citrino_last_notified_date') || '';
  });
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const [isReminderConfigOpen, setIsReminderConfigOpen] = useState(false);
  const [isMobileReminderConfigOpen, setIsMobileReminderConfigOpen] = useState(false);

  // Local task reminder states (Offline-ready, checks every 15 seconds)
  const [isLocalTaskReminderModalOpen, setIsLocalTaskReminderModalOpen] = useState(false);
  const [localTaskReminderTime, setLocalTaskReminderTime] = useState<string>(() => {
    return localStorage.getItem('citrino_local_task_reminder_time') || '10:00';
  });
  const [localTaskReminderEnabled, setLocalTaskReminderEnabled] = useState<boolean>(() => {
    return localStorage.getItem('citrino_local_task_reminder_enabled') === 'true';
  });
  const [lastNotifiedLocalTasksDate, setLastNotifiedLocalTasksDate] = useState<string>(() => {
    return localStorage.getItem('citrino_last_notified_local_tasks_date') || '';
  });

  // Level Up Celebrations & Particles
  const [levelUpParticles, setLevelUpParticles] = useState<{
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    rotation: number;
    delay: number;
    duration: number;
  }[]>([]);
  const [isLevelUpPulse, setIsLevelUpPulse] = useState(false);
  const prevLevelRef = React.useRef<number>(1);
  const isLevelLevelMounted = React.useRef<boolean>(false);

  // Filtering / Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [reminderSearchQuery, setReminderSearchQuery] = useState('');
  const [reminderDateFilter, setReminderDateFilter] = useState('');
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
  const [formDueDate, setFormDueDate] = useState<string>('');
  const [formReminder, setFormReminder] = useState<boolean>(false);
  const [formSubtasks, setFormSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Birthdays State
  const [birthdays, setBirthdays] = useState<Birthday[]>(() => {
    const saved = localStorage.getItem('citrino_birthdays_slate');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 'bd-1', name: 'Gabriel Cruz', date: '1988-05-29', reminder1Day: true, reminder2Days: false, reminder3Days: false },
      { id: 'bd-2', name: 'Ana Silva', date: '1995-05-30', reminder1Day: true, reminder2Days: true, reminder3Days: false },
      { id: 'bd-3', name: 'Lucas Souza', date: '1990-06-01', reminder1Day: true, reminder2Days: false, reminder3Days: true }
    ];
  });

  const [isCreateBirthdayOpen, setIsCreateBirthdayOpen] = useState(false);
  const [formBirthdayName, setFormBirthdayName] = useState('');
  const [formBirthdayDate, setFormBirthdayDate] = useState('');
  const [formBirthday1Day, setFormBirthday1Day] = useState(true);
  const [formBirthday2Days, setFormBirthday2Days] = useState(false);
  const [formBirthday3Days, setFormBirthday3Days] = useState(false);

  // Focus & Breathing States
  const [breathingMode, setBreathingMode] = useState<'foco' | 'ansiedade' | 'nervosismo' | 'tdah'>('foco');
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold-in' | 'exhale' | 'hold-out'>('inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Save to LocalStorage whenever tasks modify
  useEffect(() => {
    localStorage.setItem('citrino_tasks_slate', JSON.stringify(tasks));
  }, [tasks]);

  // Save birthdays
  useEffect(() => {
    localStorage.setItem('citrino_birthdays_slate', JSON.stringify(birthdays));
  }, [birthdays]);

  // Save XP
  useEffect(() => {
    localStorage.setItem('citrino_xp_slate', xp.toString());
  }, [xp]);

  // Save Sound Preferences
  useEffect(() => {
    localStorage.setItem('citrino_sound_tasks', String(isTaskBeepEnabled));
  }, [isTaskBeepEnabled]);

  useEffect(() => {
    localStorage.setItem('citrino_sound_levelup', String(isLevelUpChimeEnabled));
  }, [isLevelUpChimeEnabled]);

  useEffect(() => {
    localStorage.setItem('citrino_daily_goal_target', dailyGoalTarget.toString());
  }, [dailyGoalTarget]);

  useEffect(() => {
    localStorage.setItem('citrino_daily_goal_claimed_date', dailyGoalClaimedDate);
  }, [dailyGoalClaimedDate]);

  useEffect(() => {
    localStorage.setItem('citrino_daily_goal_reminder_time', dailyGoalReminderTime);
  }, [dailyGoalReminderTime]);

  useEffect(() => {
    localStorage.setItem('citrino_daily_goal_reminder_enabled', String(dailyGoalReminderEnabled));
  }, [dailyGoalReminderEnabled]);

  // Sync notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermissionStatus(Notification.permission);
    }
  }, []);

  // Daily task reminder interval
  useEffect(() => {
    if (!dailyGoalReminderEnabled) return;

    const checkAndNotify = () => {
      if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
        return;
      }

      const now = new Date();
      // Format "HH:MM" in 24h
      const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayDateStr = now.toISOString().split('T')[0];

      if (currentHourMin === dailyGoalReminderTime && lastNotifiedDate !== todayDateStr) {
        const pendingCount = tasks.filter(t => !t.completed).length;

        new Notification('Meta Diária Citrino 🎯', {
          body: `É hora de verificar suas tarefas! Você tem ${pendingCount} pendentes. Mantenha o foco hoje!`,
          tag: 'citrino-daily-reminder',
        });

        localStorage.setItem('citrino_last_notified_date', todayDateStr);
        setLastNotifiedDate(todayDateStr);
      }
    };

    checkAndNotify();
    const interval = setInterval(checkAndNotify, 20 * 1000); // Check every 20 seconds
    return () => clearInterval(interval);
  }, [dailyGoalReminderEnabled, dailyGoalReminderTime, lastNotifiedDate, tasks]);

  // Save local task reminder settings
  useEffect(() => {
    localStorage.setItem('citrino_local_task_reminder_time', localTaskReminderTime);
  }, [localTaskReminderTime]);

  useEffect(() => {
    localStorage.setItem('citrino_local_task_reminder_enabled', String(localTaskReminderEnabled));
  }, [localTaskReminderEnabled]);

  // Local offline-ready task reminder checker
  useEffect(() => {
    if (!localTaskReminderEnabled) return;

    const checkAndNotifyLocalTasks = () => {
      if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
        return;
      }

      const now = new Date();
      // Format "HH:MM" 24h
      const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayDateStr = `${year}-${month}-${day}`;

      if (currentHourMin === localTaskReminderTime && lastNotifiedLocalTasksDate !== todayDateStr) {
        // Find tasks scheduled specifically for today that are not completed
        const todaysTasks = tasks.filter(t => !t.completed && t.dueDate === todayDateStr);
        
        if (todaysTasks.length > 0) {
          const taskTitles = todaysTasks.map(t => `• ${t.title}`).join('\n');
          new Notification('📅 Tarefas Pendentes de Hoje! 🎯', {
            body: `Você tem ${todaysTasks.length} tarefa(s) agendada(s) para hoje:\n${taskTitles}`,
            tag: 'citrino-local-tasks-reminder',
            requireInteraction: true
          });
        } else {
          new Notification('Sem Tarefas Pendentes! ✨', {
            body: 'Excelente! Você não possui tarefas pendentes agendadas para hoje. Excelente dia!',
            tag: 'citrino-local-tasks-reminder'
          });
        }

        localStorage.setItem('citrino_last_notified_local_tasks_date', todayDateStr);
        setLastNotifiedLocalTasksDate(todayDateStr);
      }
    };

    checkAndNotifyLocalTasks();
    const interval = setInterval(checkAndNotifyLocalTasks, 15 * 1000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [localTaskReminderEnabled, localTaskReminderTime, lastNotifiedLocalTasksDate, tasks]);

  useEffect(() => {
    localStorage.setItem('citrino_desktop_sidebar_open', String(isDesktopSidebarOpen));
  }, [isDesktopSidebarOpen]);

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

  // Breathing simulation cycle timer
  useEffect(() => {
    let interval: any = null;
    if (isBreathingRunning) {
      interval = setInterval(() => {
        setPhaseSecondsLeft((prev) => {
          if (prev <= 1) {
            let nextPhase: 'inhale' | 'hold-in' | 'exhale' | 'hold-out' = 'inhale';
            let nextSecs = 4;
            
            if (breathingMode === 'foco') {
              setBreathingPhase((curr) => {
                if (curr === 'inhale') { nextPhase = 'hold-in'; nextSecs = 4; }
                else if (curr === 'hold-in') { nextPhase = 'exhale'; nextSecs = 4; }
                else if (curr === 'exhale') { nextPhase = 'hold-out'; nextSecs = 4; }
                else { nextPhase = 'inhale'; nextSecs = 4; setCompletedCycles(c => c + 1); }
                return nextPhase;
              });
            } else if (breathingMode === 'ansiedade') {
              setBreathingPhase((curr) => {
                if (curr === 'inhale') { nextPhase = 'hold-in'; nextSecs = 7; }
                else if (curr === 'hold-in') { nextPhase = 'exhale'; nextSecs = 8; }
                else { nextPhase = 'inhale'; nextSecs = 4; setCompletedCycles(c => c + 1); }
                return nextPhase;
              });
            } else if (breathingMode === 'nervosismo') {
              setBreathingPhase((curr) => {
                if (curr === 'inhale') { nextPhase = 'exhale'; nextSecs = 5; }
                else { nextPhase = 'inhale'; nextSecs = 5; setCompletedCycles(c => c + 1); }
                return nextPhase;
              });
            } else if (breathingMode === 'tdah') {
              setBreathingPhase((curr) => {
                if (curr === 'inhale') { nextPhase = 'hold-in'; nextSecs = 1; }
                else if (curr === 'hold-in') { nextPhase = 'exhale'; nextSecs = 5; }
                else { nextPhase = 'inhale'; nextSecs = 2; setCompletedCycles(c => c + 1); }
                return nextPhase;
              });
            }
            try { playSound('click'); } catch (err) {}
            setPhaseSecondsLeft(nextSecs);
            return nextSecs;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathingPhase('inhale');
      if (breathingMode === 'foco') setPhaseSecondsLeft(4);
      else if (breathingMode === 'ansiedade') setPhaseSecondsLeft(4);
      else if (breathingMode === 'nervosismo') setPhaseSecondsLeft(5);
      else if (breathingMode === 'tdah') setPhaseSecondsLeft(2);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBreathingRunning, breathingMode]);

  // 2-hour hydration rule helper (7200 seconds)
  const isHydrationOverdue = secondsSinceWater >= 7200;

  // Level calculator (100 XP per level)
  const level = Math.floor(xp / 100) + 1;
  const xpInCurrentLevel = xp % 100;

  // Track Level-Up and Trigger Custom Celebrations on Sidebar Panel
  useEffect(() => {
    if (!isLevelLevelMounted.current) {
      isLevelLevelMounted.current = true;
      prevLevelRef.current = level;
      return;
    }

    if (level > prevLevelRef.current) {
      setIsLevelUpPulse(true);

      const colors = ['#f59e0b', '#fbbf24', '#f43f5e', '#38bdf8', '#10b981', '#a855f7'];
      const newParticles = Array.from({ length: 32 }).map((_, i) => {
        // Distribute angles evenly with some variations
        const angle = (i / 32) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
        const speed = 50 + Math.random() * 110;
        const x = Math.cos(angle) * speed;
        const y = Math.sin(angle) * speed - 15; // Upward bias

        return {
          id: Date.now() + i,
          x,
          y,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 5 + Math.random() * 9,
          rotation: Math.random() * 360,
          delay: Math.random() * 0.2,
          duration: 0.9 + Math.random() * 0.8
        };
      });
      setLevelUpParticles(newParticles);

      const pulseTimer = setTimeout(() => {
        setIsLevelUpPulse(false);
      }, 3000);

      const clearTimer = setTimeout(() => {
        setLevelUpParticles([]);
      }, 2500);

      prevLevelRef.current = level;

      return () => {
        clearTimeout(pulseTimer);
        clearTimeout(clearTimer);
      };
    } else {
      prevLevelRef.current = level;
    }
  }, [level]);

  // Sound effects fallback
  const playSound = (type: 'check' | 'level' | 'click') => {
    if (type === 'check' && !isTaskBeepEnabled) return;
    if (type === 'level' && !isLevelUpChimeEnabled) return;
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
        const completedAt = nextCompleted ? new Date().toISOString().split('T')[0] : undefined;
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
        return { ...t, completed: nextCompleted, completedAt };
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

  // Claim Daily Goal Reward
  const handleClaimDailyGoalReward = () => {
    const tier = GOAL_TIERS.find(t => t.target === dailyGoalTarget);
    if (!tier) return;
    if (tasksCompletedTodayCount < dailyGoalTarget) return;
    if (dailyGoalClaimedDate === todayStr) return;

    const award = tier.xpReward;
    const newTotalXp = xp + award;
    setXp(newTotalXp);
    setDailyGoalClaimedDate(todayStr);

    // Audio effects
    playSound('check');
    
    // Check level up boundary crossing and play level-up sound if so
    if (Math.floor(newTotalXp / 100) > Math.floor(xp / 100)) {
      setTimeout(() => {
        playSound('level');
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.65 },
          colors: ['#f59e0b', '#06b6d4', '#10b981']
        });
      }, 250);
    } else {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#f59e0b', '#10b981']
      });
    }
  };

  // Request Notification Permissions helper
  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const handleToggleDailyGoalReminder = async () => {
    playSound('click');
    
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (!dailyGoalReminderEnabled) {
      const granted = await requestNotificationPermission();
      setNotificationPermissionStatus(Notification.permission);
      if (granted) {
        setDailyGoalReminderEnabled(true);
        try {
          new Notification('Notificações Ativadas! 🎯', {
            body: `Você receberá um lembrete diário às ${dailyGoalReminderTime} para verificar suas tarefas.`,
          });
        } catch (e) {
          console.error(e);
        }
      } else {
        setDailyGoalReminderEnabled(false);
      }
    } else {
      setDailyGoalReminderEnabled(false);
    }
  };

  const handleTestNotification = () => {
    playSound('click');
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }
    const triggerTest = () => {
      try {
        new Notification('Teste de Notificação Citrino 🎯', {
          body: 'Funcionando com sucesso! Seus lembretes diários estão configurados para as ' + dailyGoalReminderTime + '.',
        });
      } catch (e) {
        console.error(e);
      }
    };

    if (Notification.permission === 'granted') {
      triggerTest();
    } else {
      requestNotificationPermission().then(granted => {
        setNotificationPermissionStatus(Notification.permission);
        if (granted) {
          triggerTest();
        }
      });
    }
  };

  // Task Creation and Modification Submissions
  const handleOpenCreateModal = (day?: DayOfWeek) => {
    setTaskToEdit(null);
    setFormTitle('');
    setFormDescription('');
    setFormPriority('medium');
    setFormCategory('Geral');
    setFormDayOfWeek(day || 'none');
    setFormDueDate('');
    setFormReminder(false);
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
    setFormDueDate(t.dueDate || '');
    setFormReminder(t.reminder || false);
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
            dueDate: formDueDate ? formDueDate : undefined,
            reminder: formReminder,
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
        dueDate: formDueDate ? formDueDate : undefined,
        reminder: formReminder,
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
  const handleViewChange = (mode: 'dashboard' | 'tarefas' | 'agenda' | 'aniversarios' | 'foco' | 'progresso' | 'configuracoes') => {
    playSound('click');
    if (mode === 'aniversarios') {
      setViewMode('agenda');
      setAgendaSubTab('birthdays');
    } else {
      if (mode === 'agenda') {
        setAgendaSubTab('weekly');
      }
      setViewMode(mode);
    }
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
  const upcomingBirthdaysCount = birthdays.filter(bd => {
    const status = getBirthdayStatus(bd.date, bd.reminder1Day, bd.reminder2Days, bd.reminder3Days);
    return status?.isToday || status?.isTomorrow;
  }).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();
  const overdueOrTodayTasksCount = tasks.filter(t => !t.completed && t.dueDate && t.dueDate <= todayStr).length;
  const reminderTasks = tasks.filter(t => !t.completed && t.reminder);
  const filteredReminderTasks = reminderTasks.filter(t => {
    if (reminderSearchQuery) {
      const q = reminderSearchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t.description || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    if (reminderDateFilter) {
      if (t.dueDate !== reminderDateFilter) {
        return false;
      }
    }
    return true;
  });

  const tasksCompletedTodayCount = tasks.filter(t => t.completed && t.completedAt === todayStr).length;
  const hasUrgentTasksToday = tasks.some(t => !t.completed && t.priority === 'high' && t.dueDate === todayStr);

  // Dashboard view calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Subtask calculations
  const totalSubtasks = tasks.reduce((sum, t) => sum + (t.subtasks || []).length, 0);
  const completedSubtasks = tasks.reduce((sum, t) => sum + (t.subtasks || []).filter(s => s.completed).length, 0);
  const subtasksPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Category statistics helper
  const categoriesList: TaskCategory[] = ['Trabalho', 'Estudo', 'Pessoal', 'Saúde', 'Geral'];
  const categoryStats = categoriesList.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat);
    const catTotal = catTasks.length;
    const catCompleted = catTasks.filter(t => t.completed).length;
    const catPending = catTotal - catCompleted;
    const catPct = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0;
    return { category: cat, total: catTotal, completed: catCompleted, pending: catPending, pct: catPct };
  });

  // Priority statistics helper
  const prioritiesList: { priority: TaskPriority; label: string; color: string; bg: string }[] = [
    { priority: 'high', label: 'Altíssima', color: 'text-red-400 border-red-500/10', bg: 'bg-red-500/5' },
    { priority: 'medium', label: 'Média', color: 'text-amber-400 border-amber-500/10', bg: 'bg-amber-500/5' },
    { priority: 'low', label: 'Leve', color: 'text-emerald-400 border-emerald-550/10', bg: 'bg-emerald-550/5' }
  ];
  const priorityStats = prioritiesList.map(item => {
    const priTasks = tasks.filter(t => t.priority === item.priority);
    const priTotal = priTasks.length;
    const priCompleted = priTasks.filter(t => t.completed).length;
    const priPending = priTotal - priCompleted;
    return { ...item, total: priTotal, completed: priCompleted, pending: priPending };
  });

  // Deadlines tasks list
  const deadlineTasks = tasks
    .filter(t => t.dueDate)
    .map(t => {
      const daysLeft = getDaysRemainingForTask(t.dueDate!);
      return { ...t, daysLeft };
    })
    .sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return a.daysLeft - b.daysLeft;
    });

  // Generate last 7 days completion metrics for the bar chart
  const last7DaysChartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i)); // Go from 6 days ago up to today (i = 0 to 6)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayNumeric = String(d.getDate()).padStart(2, '0');
    const isoDateStr = `${year}-${month}-${dayNumeric}`; // "YYYY-MM-DD"
    
    // Day of the week display label (Portuguese)
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weekdayLabel = weekdays[d.getDay()];
    const displayLabel = `${weekdayLabel} (${dayNumeric}/${month})`;
    
    // Count how many tasks are completed on that day
    const completedCount = tasks.filter(t => t.completed && t.completedAt === isoDateStr).length;
    
    return {
      name: displayLabel,
      "Concluídas": completedCount,
      dateStr: isoDateStr
    };
  });

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
      <motion.aside 
        initial={false}
        animate={{ 
          x: isDesktopSidebarOpen ? 0 : -270,
          opacity: isDesktopSidebarOpen ? 1 : 0.08
        }}
        transition={{ 
          type: 'spring', 
          damping: 25, 
          stiffness: 110, 
          mass: 0.9,
          opacity: { duration: 0.35, ease: 'easeInOut' }
        }}
        className={`fixed inset-y-0 left-0 w-64 border-r border-slate-850 bg-slate-900 hidden md:flex flex-col z-30 select-none transition-colors duration-200 ${isDesktopSidebarOpen ? '' : 'pointer-events-none'}`}
      >
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

          {/* Theme & Collapse Actions (Desktop) */}
          <div className="flex items-center gap-1.5">
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

            <button
              onClick={() => {
                playSound('click');
                setIsDesktopSidebarOpen(false);
              }}
              className="p-1.5 h-8 w-8 rounded-lg bg-slate-850 border border-slate-800 text-slate-400 hover:text-red-400 transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
              title="Recolher Menu"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Level & XP micro HUD panel with Custom Particles and Level Up Animation */}
        <motion.div 
          animate={isLevelUpPulse ? {
            borderColor: [
              'rgba(30, 41, 59, 1)', 
              'rgba(245, 158, 11, 1)', 
              'rgba(168, 85, 247, 1)', 
              'rgba(30, 41, 59, 1)'
            ],
            boxShadow: [
              '0 0 0px rgba(0, 0, 0, 0)',
              '0 0 20px rgba(245, 158, 11, 0.45)',
              '0 0 24px rgba(168, 85, 247, 0.35)',
              '0 0 0px rgba(0, 0, 0, 0)'
            ],
            scale: [1, 1.05, 0.98, 1.01, 1]
          } : {}}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
          className="relative overflow-visible p-4 mx-4 my-3 rounded-2xl bg-slate-850/90 border border-slate-800 flex items-center gap-3.5 transition-colors duration-200"
        >
          {/* Level Up Flash effect in background */}
          <AnimatePresence>
            {isLevelUpPulse && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.25, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-500/10 to-transparent pointer-events-none z-0"
              />
            )}
          </AnimatePresence>

          {/* Level Up Particles container */}
          <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
            <AnimatePresence>
              {levelUpParticles.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.2, rotate: 0 }}
                  animate={{
                    x: particle.x,
                    y: particle.y,
                    opacity: [1, 1, 0.9, 0],
                    scale: [0.3, 1, 1.2, 0],
                    rotate: particle.rotation
                  }}
                  transition={{
                    duration: particle.duration,
                    delay: particle.delay,
                    ease: 'easeOut'
                  }}
                  className="absolute"
                  style={{
                    left: '36px', // centered approximately around Lvl badge (padding 1rem (16px) + half of w-10 (20px))
                    top: '36px',  // centered approximately around Lvl badge (padding 1rem (16px) + half of h-10 (20px))
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    backgroundColor: particle.color,
                    borderRadius: particle.size % 2 === 0 ? '50%' : '20%', // Mixture of sparks and circular stars
                    boxShadow: `0 0 10px ${particle.color}, 0 0 4px #ffffff`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))}
            </AnimatePresence>
          </div>

          <motion.div 
            animate={isLevelUpPulse ? {
              scale: [1, 1.35, 0.95, 1.15, 1],
              rotate: [0, 10, -10, 5, 0],
              backgroundColor: ['rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.3)', 'rgba(168, 85, 247, 0.3)', 'rgba(245, 158, 11, 0.1)']
            } : {}}
            transition={{ duration: 1.5, type: 'spring', stiffness: 220, damping: 15 }}
            className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 font-black border border-amber-500/20 text-sm shadow-inner"
          >
            Lvl {level}
          </motion.div>

          <div className="relative z-10 flex-1 min-w-0">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span className={isLevelUpPulse ? 'text-amber-400 font-extrabold animate-pulse' : ''}>
                {isLevelUpPulse ? '✨ NOVO NÍVEL! ✨' : 'Nível Atual'}
              </span>
              <span className="font-mono">{xpInCurrentLevel}/100 XP</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <motion.div 
                animate={isLevelUpPulse ? {
                  backgroundColor: ['#f59e0b', '#a855f7', '#f59e0b']
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-305" 
                style={{ width: `${xpInCurrentLevel}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Dynamic Vertical List Menu */}
        <nav className="flex-1 px-4 py-3 space-y-1">
          <span className="text-[10px] font-black tracking-widest text-[#41537C] uppercase block px-3 mb-2">FUNÇÕES</span>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: overdueOrTodayTasksCount, color: 'text-indigo-400' },
            { id: 'tarefas', label: 'Lista de Tarefas', icon: CheckCircle2, badge: activeTasksCount, color: 'text-amber-500' },
            { id: 'agenda', label: 'Agenda Semanal', icon: Calendar, badge: weeklyAgendaCount, color: 'text-cyan-400' },
            { id: 'aniversarios', label: 'Aniversários', icon: Cake, badge: upcomingBirthdaysCount, color: 'text-pink-400' },
            { id: 'foco', label: 'Pomodoro & Foco', icon: Brain, color: 'text-orange-400' },
            { id: 'progresso', label: 'Estatísticas & Nivel', icon: TrendingUp, color: 'text-emerald-400' },
            { id: 'configuracoes', label: 'Configurações', icon: Settings, color: 'text-[#94A3B8]' }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = item.id === 'aniversarios'
              ? (viewMode === 'agenda' && agendaSubTab === 'birthdays')
              : item.id === 'agenda'
                ? (viewMode === 'agenda' && agendaSubTab === 'weekly')
                : viewMode === item.id;
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
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-850 text-slate-405 border border-slate-800'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Notificações Pendentes (Lembretes ativos hoje) */}
        <div className="border-t border-slate-850 py-1.5 px-2">
          <motion.div
            whileHover={{ 
              scale: 1.025,
              y: -1,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 25px rgba(245, 158, 11, 0.12), 0 0 10px rgba(245, 158, 11, 0.05)"
            }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className="px-2.5 py-2 rounded-xl transition-all duration-300 hover:bg-amber-500/[0.03] border border-transparent hover:border-amber-500/20 bg-slate-900/10 relative overflow-hidden group cursor-default"
          >
            {/* Gentle Ambient glow effect background */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/[0.015] to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-2 px-1 relative z-10">
              <span className="text-[10px] font-black tracking-widest text-[#41537C] uppercase flex items-center gap-1.5">
                <motion.span
                  animate={hasUrgentTasksToday ? {
                    scale: [1, 1.25, 1],
                    opacity: [1, 0.7, 1],
                    filter: [
                      "drop-shadow(0 0 0px rgba(245, 158, 11, 0))",
                      "drop-shadow(0 0 5px rgba(245, 158, 11, 0.85))",
                      "drop-shadow(0 0 0px rgba(245, 158, 11, 0))"
                    ]
                  } : {}}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="inline-flex items-center justify-center shrink-0"
                >
                  <Bell className={`h-3 w-3 text-amber-500 ${hasUrgentTasksToday ? '' : 'animate-[swing_2s_infinite]'}`} />
                </motion.span>
                <span>NOTIFICAÇÕES ({reminderTasks.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setIsLocalTaskReminderModalOpen(true)}
                title="Configuração Rápida de Lembretes Offline"
                className="p-1 rounded-md text-slate-500 hover:text-amber-500 hover:bg-slate-800/40 transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5 shrink-0" />
                {localTaskReminderEnabled && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            </div>

            {/* Compact Search Bar for Reminders */}
            <div className="relative mb-1.5 px-0.5">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-555" />
              <input
                type="text"
                placeholder="Filtrar lembretes..."
                value={reminderSearchQuery}
                onChange={(e) => setReminderSearchQuery(e.target.value)}
                className="w-full pl-7 pr-6 py-1 text-[11px] font-medium rounded-lg border border-slate-800 bg-slate-950/70 text-slate-300 placeholder-slate-550 focus:outline-none focus:border-amber-500/50"
              />
              {reminderSearchQuery && (
                <button
                  onClick={() => setReminderSearchQuery('')}
                  title="Limpar filtro"
                  className="absolute right-2 px-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Date Picker for Reminders */}
            <div className="space-y-1.5 mb-2.5 px-0.5">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">
                Filtrar por data específica
              </span>
              <div className="relative flex gap-1.5 items-center">
                <div className={`relative flex-1 rounded-lg border transition-all duration-300 ${
                  reminderDateFilter 
                    ? 'border-amber-500/40 bg-amber-500/[0.02] shadow-[0_0_12px_rgba(245,158,11,0.04)]' 
                    : 'border-slate-800 bg-slate-950/70'
                }`}>
                  <Calendar className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none transition-colors ${
                    reminderDateFilter ? 'text-amber-500' : 'text-slate-500'
                  }`} />
                  <input
                    type="date"
                    value={reminderDateFilter}
                    onChange={(e) => setReminderDateFilter(e.target.value)}
                    className="w-full pl-7 pr-7 py-1 text-[10px] bg-transparent font-semibold text-slate-200 focus:outline-none focus:ring-0 [color-scheme:dark] cursor-pointer"
                  />
                  {reminderDateFilter && (
                    <button
                      type="button"
                      onClick={() => setReminderDateFilter('')}
                      title="Limpar data (Ver todos)"
                      className="absolute right-2 px-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Date Presets */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setReminderDateFilter('')}
                  className={`flex-1 py-0.5 px-1 rounded text-[9px] font-extrabold tracking-wider uppercase transition-all cursor-pointer border ${
                    !reminderDateFilter
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-slate-950/30 text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-850/40'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setReminderDateFilter(todayStr)}
                  className={`flex-1 py-0.5 px-1 rounded text-[9px] font-extrabold tracking-wider uppercase transition-all cursor-pointer border ${
                    reminderDateFilter === todayStr
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-slate-950/30 text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-850/40'
                  }`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setReminderDateFilter(tomorrowStr)}
                  className={`flex-1 py-0.5 px-1 rounded text-[9px] font-extrabold tracking-wider uppercase transition-all cursor-pointer border ${
                    reminderDateFilter === tomorrowStr
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-slate-950/30 text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-850/40'
                  }`}
                >
                  Amanhã
                </button>
              </div>
            </div>

            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
              <AnimatePresence initial={false}>
                {filteredReminderTasks.length > 0 ? (
                  filteredReminderTasks.map(t => (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: "auto", scale: 1 }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.85, 
                        y: -10,
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        borderColor: "rgba(16, 185, 129, 0.3)"
                      }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="p-2 rounded-xl bg-slate-850/50 border border-slate-800 flex items-center justify-between gap-2 text-left group overflow-hidden"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-slate-200 truncate" title={t.title}>
                          {t.title}
                        </p>
                        {t.dueDate && (
                          <span className="text-[9px] font-bold text-amber-500/80 leading-none">
                            📅 {t.dueDate === todayStr ? 'Hoje' : t.dueDate}
                          </span>
                        )}
                      </div>
                      <motion.button
                        onClick={() => handleToggleTask(t.id)}
                        title="Concluir tarefa"
                        className="h-5 w-5 shrink-0 rounded bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-100 cursor-pointer"
                        whileHover={{ 
                          scale: 1.15,
                          backgroundColor: "rgba(245, 158, 11, 0.2)",
                          borderColor: "#f59e0b"
                        }}
                        whileTap={{ 
                          scale: [1, 1.45, 1.1],
                          backgroundColor: "#10b981",
                          borderColor: "#10b981",
                          color: "#ffffff"
                        }}
                        transition={{ duration: 0.25 }}
                      >
                        <Check className="h-3 w-3" />
                      </motion.button>
                    </motion.div>
                  ))
                ) : (
                  <motion.p
                    key="empty-rems"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-slate-500 text-center py-2.5 italic font-sans leading-tight"
                  >
                    Nenhum lembrete encontrado.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Setup Status for Local Offline Alert */}
            <div className="mt-2.5 pt-2 border-t border-slate-850/60 flex items-center justify-between px-0.5 text-[9px] relative z-10">
              <div className="flex items-center gap-1.5 text-slate-400">
                <div className={`h-1.5 w-1.5 rounded-full ${localTaskReminderEnabled ? 'bg-emerald-500 animate-pulse animate-duration-1000' : 'bg-slate-600'}`} />
                <span className="font-semibold tracking-wide">
                  {localTaskReminderEnabled 
                    ? `Alerta: ${localTaskReminderTime} (s/ rede)` 
                    : "Alertas locais desligados"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLocalTaskReminderModalOpen(true)}
                className="text-amber-500 hover:text-amber-400 font-black flex items-center gap-0.5 cursor-pointer hover:underline uppercase tracking-wider text-[8px]"
              >
                {localTaskReminderEnabled ? "Ajustar" : "Configurar"}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Meta Diária (Daily Goal Progress with Reward Selector) */}
        <div className="px-4 py-3 border-t border-slate-850 bg-slate-900/10">
          <div 
            className="relative overflow-hidden rounded-2xl p-3.5 border transition-all duration-500 bg-slate-900/80"
            style={{
              borderColor: `rgba(245, 158, 11, ${0.15 + Math.min(1, tasksCompletedTodayCount / dailyGoalTarget) * 0.4})`,
              boxShadow: tasksCompletedTodayCount >= dailyGoalTarget 
                ? '0 0 16px rgba(245, 158, 11, 0.22)' 
                : `0 0 10px rgba(245, 158, 11, ${0.03 + Math.min(1, tasksCompletedTodayCount / dailyGoalTarget) * 0.12})`
            }}
          >
            {/* Ambient Animated Glow Backing */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-80 mix-blend-screen overflow-hidden"
              style={{
                background: `radial-gradient(circle at 50% 50%, rgba(245, 158, 11, ${0.03 + Math.min(1, tasksCompletedTodayCount / dailyGoalTarget) * 0.26}) 0%, transparent 72%)`
              }}
            >
              <div 
                className="absolute inset-[-40%] rounded-full opacity-35 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-yellow-600/5 to-transparent animate-[spin_12s_linear_infinite]"
                style={{
                  transform: `scale(${1 + Math.min(1, tasksCompletedTodayCount / dailyGoalTarget) * 0.45})`
                }}
              />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Meta Diária
                </span>
                <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                  {tasksCompletedTodayCount}/{dailyGoalTarget} {tasksCompletedTodayCount === 1 ? 'concluída' : 'concluídas'}
                </span>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-300 mb-2.5">
                Escolha sua meta visual de XP para hoje:
              </p>

              {/* Reward / XP Selection Chips */}
              <div className="grid grid-cols-4 gap-1 mb-3.5">
                {GOAL_TIERS.map(tier => {
                  const isSelected = dailyGoalTarget === tier.target;
                  return (
                    <button
                      key={tier.target}
                      type="button"
                      disabled={dailyGoalClaimedDate === todayStr}
                      onClick={() => {
                        playSound('click');
                        setDailyGoalTarget(tier.target);
                      }}
                      title={`Meta: Completar ${tier.target} ${tier.target === 1 ? 'tarefa' : 'tarefas'} hoje`}
                      className={`flex flex-col items-center py-1.5 px-0.5 rounded-lg border text-center transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/60 text-amber-400 shadow-sm shadow-amber-500/5'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-850/50 hover:text-slate-300'
                      } ${dailyGoalClaimedDate === todayStr ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="text-[8px] font-bold tracking-wider leading-none">{tier.target} {tier.target === 1 ? 'Tar' : 'Tars'}</span>
                      <span className="text-[9px] font-mono font-black mt-0.5">+{tier.xpReward} XP</span>
                    </button>
                  );
                })}
              </div>

              {/* Goal Progress bar */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Progresso</span>
                  <span>{Math.min(100, Math.round((tasksCompletedTodayCount / dailyGoalTarget) * 100))}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-550"
                    style={{ width: `${Math.min(100, Math.round((tasksCompletedTodayCount / dailyGoalTarget) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Action button */}
              {dailyGoalClaimedDate === todayStr ? (
                <div className="py-1.5 px-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] rounded-lg tracking-wider uppercase text-center flex items-center justify-center gap-1.5">
                  <Trophy className="h-3 w-3" /> Concluído hoje! 🎉
                </div>
              ) : tasksCompletedTodayCount >= dailyGoalTarget ? (
                <button
                  type="button"
                  onClick={handleClaimDailyGoalReward}
                  className="w-full py-1.5 px-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] rounded-lg tracking-wider uppercase transition-all hover:brightness-110 cursor-pointer border-0 shadow flex items-center justify-center gap-1 animate-pulse"
                >
                  <Trophy className="h-3 w-3 fill-current" /> Resgatar Recompensa (+{GOAL_TIERS.find(t => t.target === dailyGoalTarget)?.xpReward} XP)
                </button>
              ) : (
                <div className="py-1.5 px-3 bg-slate-950 text-slate-400 border border-slate-800 font-bold text-[10px] rounded-lg tracking-wider uppercase text-center">
                  Faltam {dailyGoalTarget - tasksCompletedTodayCount} {dailyGoalTarget - tasksCompletedTodayCount === 1 ? 'tarefa' : 'tarefas'}
                </div>
              )}

              {/* Lembrete diário config trigger */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setIsReminderConfigOpen(!isReminderConfigOpen);
                  }}
                  className="text-[10px] font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Bell className={`h-3 w-3 ${dailyGoalReminderEnabled ? 'text-amber-400 animate-[pulse_1.5s_infinite]' : ''}`} />
                  {dailyGoalReminderEnabled ? `Lembrete às ${dailyGoalReminderTime}` : 'Configurar Lembrete'}
                </button>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${dailyGoalReminderEnabled ? 'bg-emerald-500' : 'bg-slate-705'}`} />
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">
                    {dailyGoalReminderEnabled ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              {/* Collapsible Config area */}
              <AnimatePresence>
                {isReminderConfigOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-2 pt-2 border-t border-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400">Horário:</span>
                      <input 
                        type="time" 
                        value={dailyGoalReminderTime}
                        onChange={(e) => {
                          setDailyGoalReminderTime(e.target.value);
                        }}
                        className="p-1 h-6 text-[10px] font-mono font-bold bg-slate-950 text-slate-200 border border-slate-800 rounded outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={handleToggleDailyGoalReminder}
                        className={`py-1 px-1.5 text-[9px] font-black rounded tracking-wider uppercase transition-colors cursor-pointer text-center ${
                          dailyGoalReminderEnabled 
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20' 
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20'
                        }`}
                      >
                        {dailyGoalReminderEnabled ? 'Desativar' : 'Ativar'}
                      </button>

                      <button
                        type="button"
                        onClick={handleTestNotification}
                        className="py-1 px-1.5 text-[9px] font-bold bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 rounded transition-colors cursor-pointer text-center"
                      >
                        Testar
                      </button>
                    </div>

                    {notificationPermissionStatus === 'denied' && (
                      <p className="text-[8px] leading-tight text-red-400 font-medium bg-red-500/5 border border-red-500/10 px-1.5 py-1 rounded">
                        ⚠️ Notificações bloqueadas. Habilite nas configurações do navegador para funcionar.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

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
      </motion.aside>

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
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: overdueOrTodayTasksCount, color: 'text-indigo-400' },
                    { id: 'tarefas', label: 'Lista de Tarefas', icon: CheckCircle2, badge: activeTasksCount, color: 'text-amber-500' },
                    { id: 'agenda', label: 'Agenda Semanal', icon: Calendar, badge: weeklyAgendaCount, color: 'text-cyan-400' },
                    { id: 'aniversarios', label: 'Aniversários', icon: Cake, badge: upcomingBirthdaysCount, color: 'text-pink-400' },
                    { id: 'foco', label: 'Pomodoro & Foco', icon: Brain, color: 'text-orange-400' },
                    { id: 'progresso', label: 'Estatísticas & Nivel', icon: TrendingUp, color: 'text-emerald-400' },
                    { id: 'configuracoes', label: 'Configurações', icon: Settings, color: 'text-slate-400' }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === 'aniversarios'
                      ? (viewMode === 'agenda' && agendaSubTab === 'birthdays')
                      : item.id === 'agenda'
                        ? (viewMode === 'agenda' && agendaSubTab === 'weekly')
                        : viewMode === item.id;
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

                {/* Mobile Notificações Pendentes */}
                <div className="border-t border-slate-800 mt-3 pt-2">
                  <motion.div
                    whileHover={{ 
                      scale: 1.025,
                      y: -1,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 25px rgba(245, 158, 11, 0.12), 0 0 10px rgba(245, 158, 11, 0.05)"
                    }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    className="px-2.5 py-2.5 rounded-xl transition-all duration-300 hover:bg-amber-500/[0.03] border border-transparent hover:border-amber-500/20 bg-slate-900/10 relative overflow-hidden group cursor-default"
                  >
                    {/* Gentle Ambient glow effect background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/[0.015] to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-2 px-1 relative z-10">
                      <span className="text-[9px] font-black tracking-widest text-[#41537C] uppercase flex items-center gap-1.5">
                        <motion.span
                          animate={hasUrgentTasksToday ? {
                            scale: [1, 1.25, 1],
                            opacity: [1, 0.7, 1],
                            filter: [
                              "drop-shadow(0 0 0px rgba(245, 158, 11, 0))",
                              "drop-shadow(0 0 5px rgba(245, 158, 11, 0.85))",
                              "drop-shadow(0 0 0px rgba(245, 158, 11, 0))"
                            ]
                          } : {}}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="inline-flex items-center justify-center shrink-0"
                        >
                          <Bell className={`h-3 w-3 text-amber-500 ${hasUrgentTasksToday ? '' : 'animate-[swing_2s_infinite]'}`} />
                        </motion.span>
                        <span>NOTIFICAÇÕES ({reminderTasks.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsLocalTaskReminderModalOpen(true)}
                        title="Configuração Rápida de Lembretes Offline"
                        className="p-1 rounded-md text-slate-500 hover:text-amber-500 hover:bg-slate-800/40 transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                      >
                        <Settings className="h-3.5 w-3.5 shrink-0" />
                        {localTaskReminderEnabled && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </button>
                    </div>

                    {/* Compact Search Bar for Mobile Reminders */}
                    <div className="relative mb-1.5 px-0.5">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-555" />
                      <input
                        type="text"
                        placeholder="Filtrar lembretes..."
                        value={reminderSearchQuery}
                        onChange={(e) => setReminderSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-6 py-1 text-[11px] font-medium rounded-lg border border-slate-800 bg-slate-950/70 text-slate-300 placeholder-slate-550 focus:outline-none focus:border-amber-500/50"
                      />
                      {reminderSearchQuery && (
                        <button
                          onClick={() => setReminderSearchQuery('')}
                          title="Limpar filtro"
                          className="absolute right-2 px-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Date Picker for Mobile Reminders */}
                    <div className="space-y-1.5 mb-2.5 px-0.5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">
                        Filtrar por data específica
                      </span>
                      <div className="relative flex gap-1.5 items-center">
                        <div className={`relative flex-1 rounded-lg border transition-all duration-300 ${
                          reminderDateFilter 
                            ? 'border-amber-500/40 bg-amber-500/[0.02] shadow-[0_0_12px_rgba(245,158,11,0.04)]' 
                            : 'border-slate-800 bg-slate-950/70'
                        }`}>
                          <Calendar className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none transition-colors ${
                            reminderDateFilter ? 'text-amber-500' : 'text-slate-500'
                          }`} />
                          <input
                            type="date"
                            value={reminderDateFilter}
                            onChange={(e) => setReminderDateFilter(e.target.value)}
                            className="w-full pl-7 pr-7 py-1 text-[10px] bg-transparent font-semibold text-slate-200 focus:outline-none focus:ring-0 [color-scheme:dark] cursor-pointer"
                          />
                          {reminderDateFilter && (
                            <button
                              type="button"
                              onClick={() => setReminderDateFilter('')}
                              title="Limpar data (Ver todos)"
                              className="absolute right-2 px-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Quick Date Presets */}
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setReminderDateFilter('')}
                          className={`flex-1 py-0.5 px-1 rounded text-[9px] font-extrabold tracking-wider uppercase transition-all cursor-pointer border ${
                            !reminderDateFilter
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : 'bg-slate-950/30 text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-850/40'
                          }`}
                        >
                          Todas
                        </button>
                        <button
                          type="button"
                          onClick={() => setReminderDateFilter(todayStr)}
                          className={`flex-1 py-0.5 px-1 rounded text-[9px] font-extrabold tracking-wider uppercase transition-all cursor-pointer border ${
                            reminderDateFilter === todayStr
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : 'bg-slate-950/30 text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-850/40'
                          }`}
                        >
                          Hoje
                        </button>
                        <button
                          type="button"
                          onClick={() => setReminderDateFilter(tomorrowStr)}
                          className={`flex-1 py-0.5 px-1 rounded text-[9px] font-extrabold tracking-wider uppercase transition-all cursor-pointer border ${
                            reminderDateFilter === tomorrowStr
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : 'bg-slate-950/30 text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-850/40'
                          }`}
                        >
                          Amanhã
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                      <AnimatePresence initial={false}>
                        {filteredReminderTasks.length > 0 ? (
                          filteredReminderTasks.map(t => (
                            <motion.div
                              key={t.id}
                              layout
                              initial={{ opacity: 0, height: 0, scale: 0.95 }}
                              animate={{ opacity: 1, height: "auto", scale: 1 }}
                              exit={{ 
                                opacity: 0, 
                                scale: 0.85, 
                                y: -10,
                                backgroundColor: "rgba(16, 185, 129, 0.15)",
                                borderColor: "rgba(16, 185, 129, 0.3)"
                              }}
                              transition={{ duration: 0.28, ease: "easeInOut" }}
                              className="p-2 rounded-xl bg-slate-850/50 border border-slate-800 flex items-center justify-between gap-2 text-left overflow-hidden"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-slate-200 truncate">
                                  {t.title}
                                </p>
                                {t.dueDate && (
                                  <span className="text-[8px] font-bold text-amber-500/80">
                                    📅 {t.dueDate === todayStr ? 'Hoje' : t.dueDate}
                                  </span>
                                )}
                              </div>
                              <motion.button
                                onClick={() => {
                                  handleToggleTask(t.id);
                                }}
                                title="Concluir tarefa"
                                className="h-5 w-5 shrink-0 rounded bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-100 cursor-pointer"
                                whileHover={{ 
                                  scale: 1.15,
                                  backgroundColor: "rgba(245, 158, 11, 0.2)",
                                  borderColor: "#f59e0b"
                                }}
                                whileTap={{ 
                                  scale: [1, 1.45, 1.1],
                                  backgroundColor: "#10b981",
                                  borderColor: "#10b981",
                                  color: "#ffffff"
                                }}
                                transition={{ duration: 0.25 }}
                              >
                                <Check className="h-3 w-3" />
                              </motion.button>
                            </motion.div>
                          ))
                        ) : (
                          <motion.p
                            key="empty-rems-mobile"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] text-slate-500 text-center py-2.5 italic font-sans leading-tight"
                          >
                            Nenhum lembrete encontrado.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Quick Setup Status for Local Offline Alert */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between px-0.5 text-[9px] relative z-10">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <div className={`h-1.5 w-1.5 rounded-full ${localTaskReminderEnabled ? 'bg-emerald-500 animate-pulse animate-duration-1000' : 'bg-slate-600'}`} />
                        <span className="font-semibold tracking-wide">
                          {localTaskReminderEnabled 
                            ? `Alerta: ${localTaskReminderTime} (s/ rede)` 
                            : "Alertas locais desligados"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsLocalTaskReminderModalOpen(true)}
                        className="text-amber-500 hover:text-amber-400 font-black flex items-center gap-0.5 cursor-pointer hover:underline uppercase tracking-wider text-[8px]"
                      >
                        {localTaskReminderEnabled ? "Ajustar" : "Configurar"}
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Mobile bottom panel */}
              <div className="mt-8 pt-4 border-t border-slate-800 space-y-3">
                {/* Meta Diária (Mobile) */}
                <div 
                  className="relative overflow-hidden rounded-xl p-3 border transition-all duration-300 bg-slate-850/90"
                  style={{
                    borderColor: `rgba(245, 158, 11, ${0.12 + Math.min(1, tasksCompletedTodayCount / dailyGoalTarget) * 0.35})`,
                    boxShadow: tasksCompletedTodayCount >= dailyGoalTarget 
                      ? '0 0 12px rgba(245, 158, 11, 0.18)' 
                      : `0 0 8px rgba(245, 158, 11, ${0.02 + Math.min(1, tasksCompletedTodayCount / dailyGoalTarget) * 0.08})`
                  }}
                >
                  {/* Ambient Animated Glow Backing */}
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-70 mix-blend-screen overflow-hidden"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, rgba(245, 158, 11, ${0.02 + Math.min(1, tasksCompletedTodayCount / dailyGoalTarget) * 0.2}) 0%, transparent 75%)`
                    }}
                  >
                    <div 
                      className="absolute inset-[-40%] rounded-full opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-yellow-600/5 to-transparent animate-[spin_12s_linear_infinite]"
                      style={{
                        transform: `scale(${1 + Math.min(1, tasksCompletedTodayCount / dailyGoalTarget) * 0.4})`
                      }}
                    />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                        <Target className="h-3 w-3" /> Meta Diária
                      </span>
                      <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1 rounded border border-amber-500/10">
                        {tasksCompletedTodayCount}/{dailyGoalTarget}
                      </span>
                    </div>

                    {/* Reward chips */}
                    <div className="grid grid-cols-4 gap-1 mb-2">
                      {GOAL_TIERS.map(tier => {
                        const isSelected = dailyGoalTarget === tier.target;
                        return (
                          <button
                            key={tier.target}
                            type="button"
                            disabled={dailyGoalClaimedDate === todayStr}
                            onClick={() => {
                              playSound('click');
                              setDailyGoalTarget(tier.target);
                            }}
                            className={`flex flex-col items-center py-1 rounded text-center transition-all border ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                                : 'bg-slate-950/40 border-slate-800 text-slate-400'
                            } ${dailyGoalClaimedDate === todayStr ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span className="text-[7px] font-bold leading-none">{tier.target}T</span>
                            <span className="text-[8px] font-mono font-black mt-0.5">+{tier.xpReward}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mb-2">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round((tasksCompletedTodayCount / dailyGoalTarget) * 100))}%` }}
                      />
                    </div>

                    {/* Button */}
                    {dailyGoalClaimedDate === todayStr ? (
                      <div className="py-1 text-center bg-emerald-500/10 text-emerald-400 font-bold text-[8px] rounded border border-emerald-500/15">
                        Meta de Hoje Pronta! 🎉
                      </div>
                    ) : tasksCompletedTodayCount >= dailyGoalTarget ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleClaimDailyGoalReward();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full py-1 bg-amber-500 text-slate-950 font-black text-[8px] rounded tracking-wider uppercase border-0 cursor-pointer shadow hover:brightness-110 active:scale-95 transition-all text-center"
                      >
                        Resgatar (+{GOAL_TIERS.find(t => t.target === dailyGoalTarget)?.xpReward} XP)
                      </button>
                    ) : (
                      <div className="py-1 text-center bg-slate-950 text-slate-500 font-bold text-[8px] rounded border border-slate-900">
                        Mais {dailyGoalTarget - tasksCompletedTodayCount} {dailyGoalTarget - tasksCompletedTodayCount === 1 ? 'tarefa' : 'tarefas'}
                      </div>
                    )}

                    {/* Lembrete diário config trigger (Mobile) */}
                    <div className="mt-3.5 pt-2 border-t border-slate-800/40 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click');
                          setIsMobileReminderConfigOpen(!isMobileReminderConfigOpen);
                        }}
                        className="text-[9px] font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Bell className={`h-2.5 w-2.5 ${dailyGoalReminderEnabled ? 'text-amber-400 animate-[pulse_1.5s_infinite]' : ''}`} />
                        {dailyGoalReminderEnabled ? `Lembrete: ${dailyGoalReminderTime}` : 'Configurar Horário'}
                      </button>
                      <div className="flex items-center gap-1">
                        <span className={`h-1 w-1 rounded-full ${dailyGoalReminderEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                        <span className="text-[7px] font-black uppercase text-slate-500 tracking-wider">
                          {dailyGoalReminderEnabled ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Config area (Mobile) */}
                    <AnimatePresence>
                      {isMobileReminderConfigOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden mt-1.5 pt-1.5 border-t border-slate-800/30 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold text-slate-400">Horário:</span>
                            <input 
                              type="time" 
                              value={dailyGoalReminderTime}
                              onChange={(e) => {
                                setDailyGoalReminderTime(e.target.value);
                              }}
                              className="p-0.5 h-5 text-[9px] font-mono font-bold bg-slate-950 text-slate-200 border border-slate-800 rounded outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-1">
                            <button
                              type="button"
                              onClick={handleToggleDailyGoalReminder}
                              className={`py-0.5 px-1 text-[8px] font-black rounded tracking-wider uppercase transition-colors cursor-pointer text-center ${
                                dailyGoalReminderEnabled 
                                  ? 'bg-red-500/10 text-red-500 border border-red-500/15' 
                                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/15'
                              }`}
                            >
                              {dailyGoalReminderEnabled ? 'Desativar' : 'Ativar'}
                            </button>

                            <button
                              type="button"
                              onClick={handleTestNotification}
                              className="py-0.5 px-1 text-[8px] font-bold bg-slate-950 text-slate-400 border border-slate-800 rounded transition-colors cursor-pointer text-center"
                            >
                              Testar
                            </button>
                          </div>

                          {notificationPermissionStatus === 'denied' && (
                            <p className="text-[7px] leading-tight text-red-400 font-medium bg-red-500/5 px-1 py-0.5 rounded">
                              ⚠️ Permissão bloqueada no navegador.
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

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

      {/* 🚀 FLOAT SIDEBAR OPEN PULL TRIGGER */}
      <AnimatePresence>
        {!isDesktopSidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            whileHover={{ x: 4, scale: 1.05 }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={() => {
              playSound('click');
              setIsDesktopSidebarOpen(true);
            }}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 hidden md:flex h-12 w-6 items-center justify-center rounded-r-xl bg-gradient-to-br from-amber-600 to-yellow-400 text-slate-950 shadow-[0_4px_12px_rgba(245,158,11,0.2)] cursor-pointer"
            title="Abrir Menu Lateral"
          >
            <ChevronRight className="h-4 w-4 stroke-[3px]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 🚀 PRIMARY CANVAS CONTAINER WITH SMOOTH SLIDE-IN TRANSITIONS */}
      <motion.main 
        initial={false}
        animate={{ 
          paddingLeft: (isLargeScreen && isDesktopSidebarOpen) ? '16rem' : '0rem'
        }}
        transition={{ 
          type: 'spring', 
          damping: 25, 
          stiffness: 110, 
          mass: 0.9 
        }}
        className="flex-1 flex flex-col min-w-0 min-h-screen"
      >
        <div className="flex-1 p-4 sm:p-6 lg:p-8 relative max-w-5xl w-full mx-auto">
          
          <AnimatePresence mode="wait">
            
            {/* VIEW MODE: DASHBOARD GENERAL (📊 DASHBOARD) */}
            {viewMode === 'dashboard' && (
              <motion.div
                key="tab-dashboard"
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-6 select-none"
              >
                {/* Title and Top Hero Greeting */}
                <div className="border-b border-slate-850 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="text-left">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                      <LayoutDashboard className="h-6 w-6 text-indigo-400 shrink-0" /> Visão Geral do Painel
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 font-medium select-none text-left font-sans">Acompanhe seu desempenho em tempo real, gerencie prazos iminentes e analise suas estatísticas de foco e rotina de metas.</p>
                  </div>
                  
                  {/* Performance Motivational Badge */}
                  <div className="bg-[#101726] border border-[#1e2a47]/60 rounded-2xl px-4 py-2.5 flex items-center gap-3 shrink-0 self-start md:self-auto shadow-sm">
                    <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-550/20 text-indigo-400 font-bold flex items-center justify-center text-lg shadow-inner">
                      🎯
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase block leading-none mb-1">Status de Hoje</span>
                      <span className="text-xs font-black text-indigo-100 font-sans">
                        {completionPercentage === 100 
                          ? 'Dizimou todas as metas! 🏆' 
                          : completionPercentage >= 70 
                            ? 'Ritmo extraordinário! ⚡' 
                            : completionPercentage >= 30 
                              ? 'Seguindo firme no plano! 📈' 
                              : totalTasks === 0 
                                ? 'Cadastre tarefas e avance! 📑' 
                                : 'Hora de dar o primeiro passo! 🚀'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Stats Row: Grid 12 Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
                  
                  {/* Left Big Box: Interactive Circular Completion Rate */}
                  <div className="lg:col-span-12 xl:col-span-5 bg-[#0A1021] border border-[#19274A]/80 rounded-3xl p-6 flex flex-col justify-between min-h-[340px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-indigo-550/5 blur-3xl pointer-events-none" />
                    
                    <div className="text-left">
                      <span className="text-[9px] font-black tracking-widest text-[#5679AF] uppercase bg-[#142344] border border-[#1E3465] px-3 py-1.5 rounded-full inline-block mb-3">
                        Taxa de Conclusão Geral
                      </span>
                    </div>

                    {/* Circular Progress Gauge */}
                    <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-4">
                      <div className="relative h-32 w-32 flex items-center justify-center shrink-0">
                        {/* SVG Gauge Background & Colored Fill */}
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="52"
                            className="stroke-slate-805"
                            strokeWidth="10"
                            fill="transparent"
                          />
                          <motion.circle
                            cx="64"
                            cy="64"
                            r="52"
                            className="stroke-indigo-550"
                            strokeWidth="10"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 52}
                            initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - completionPercentage / 100) }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-white leading-none font-mono">{completionPercentage}%</span>
                          <span className="text-[9px] font-black uppercase text-[#5679AF] tracking-wider mt-1 font-sans">Concluído</span>
                        </div>
                      </div>

                      {/* Brief Ledger list */}
                      <div className="space-y-3 flex-1 w-full sm:w-auto">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-550" />
                            <span className="text-[10px] sm:text-xs font-bold text-slate-350">Meta Ativa</span>
                          </div>
                          <span className="text-xs sm:text-sm font-black text-white font-mono">{pendingTasks}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-450" />
                            <span className="text-[10px] sm:text-xs font-bold text-slate-350">Finalizadas</span>
                          </div>
                          <span className="text-xs sm:text-sm font-black text-white font-mono">{completedTasks}</span>
                        </div>
                        {totalSubtasks > 0 && (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-cyan-400" />
                              <span className="text-[10px] sm:text-xs font-bold text-slate-350">Subtarefas</span>
                            </div>
                            <span className="text-xs sm:text-sm font-black text-white font-mono">{completedSubtasks}/{totalSubtasks}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal()}
                      className="w-full py-3 bg-gradient-to-r from-indigo-550 to-indigo-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 border-0 cursor-pointer font-sans"
                    >
                      <Plus className="h-4 w-4 stroke-[3px]" /> Criar Nova Meta
                    </button>
                  </div>

                  {/* Right: Stat details columns */}
                  <div className="lg:col-span-12 xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* Categories Performance Card */}
                    <div className="bg-slate-905/40 border border-slate-850/80 rounded-3xl p-5 flex flex-col justify-between text-left">
                      <div className="mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">Produção por Categoria</span>
                      </div>
                      
                      <div className="space-y-3.5 flex-1 flex flex-col justify-center">
                        {categoryStats.map(cat => {
                          const catColorClass = cat.category === 'Trabalho' ? 'bg-amber-500' : cat.category === 'Estudo' ? 'bg-cyan-400' : cat.category === 'Pessoal' ? 'bg-indigo-400' : cat.category === 'Saúde' ? 'bg-emerald-405' : 'bg-slate-400';
                          return (
                            <div key={cat.category} className="space-y-1 select-none">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                <span className="font-sans leading-none">{cat.category}</span>
                                <span className="font-mono leading-none">{cat.completed}/{cat.total} ({cat.pct}%)</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${cat.pct}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className={`h-full ${catColorClass} rounded-full`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Hierarchy Priority and Routine Status Card */}
                    <div className="bg-slate-905/40 border border-slate-850/80 rounded-3xl p-5 flex flex-col justify-between text-left">
                      <div className="mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">Foco por Nível de Prioridade</span>
                      </div>

                      <div className="space-y-3 flex-1 flex flex-col justify-center">
                        {priorityStats.map(prio => (
                          <div key={prio.priority} className={`flex items-center justify-between p-2.5 rounded-2xl border ${prio.color} ${prio.bg}`}>
                            <div className="text-left font-sans">
                              <span className="text-xs font-black block leading-none mb-0.5">{prio.label}</span>
                              <span className="text-[9px] font-medium text-slate-400">XP ativo na conclusão</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-white block font-mono">{prio.pending} pendentes</span>
                              <span className="text-[9px] font-semibold text-slate-500 block leading-none mt-0.5">{prio.completed} concluídas</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Warnings / Fast reminders if high pending critical items */}
                      {priorityStats.find(p => p.priority === 'high' && p.pending > 0) ? (
                        <div className="mt-3 px-3 py-2 bg-red-950/15 border border-red-500/20 rounded-xl flex items-center gap-1.5 text-left text-[9px] font-bold text-red-400">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 animate-pulse text-red-500" /> Atenção: Metas críticas pendentes!
                        </div>
                      ) : (
                        <div className="mt-3 px-3 py-2 bg-emerald-950/15 border border-emerald-500/20 rounded-xl flex items-center gap-1.5 text-left text-[9px] font-bold text-emerald-400">
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> Metas críticas sob controle! Bom trabalho.
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Weekly Completion Bar Chart Card */}
                <div className="bg-[#0A1021] border border-[#19274A]/80 rounded-3xl p-6 text-left relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="text-left">
                      <span className="text-[9px] font-black tracking-widest text-[#5679AF] uppercase bg-[#142344] border border-[#1E3465] px-3 py-1.5 rounded-full inline-block mb-1.5">
                        DESEMPENHO SEMANAL
                      </span>
                      <h3 className="text-sm sm:text-base font-black tracking-tight text-white font-sans">
                        Metas Concluídas nos Últimos 7 Dias
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                        Seu progresso diário de produtividade e foco acumulado.
                      </p>
                    </div>

                    {/* Quick Stats Summary for Chart */}
                    <div className="flex gap-4 self-start sm:self-auto bg-slate-950/60 border border-slate-900 rounded-2xl px-4 py-2.5">
                      <div className="text-left font-sans">
                        <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider leading-none mb-1">Média Diária</span>
                        <span className="text-xs font-mono font-black text-amber-550">
                          {(last7DaysChartData.reduce((acc, item) => acc + item["Concluídas"], 0) / 7).toFixed(1)} <span className="text-[9px] font-bold text-slate-500">metas</span>
                        </span>
                      </div>
                      <div className="w-[1px] bg-slate-900" />
                      <div className="text-left font-sans">
                        <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider leading-none mb-1">Total Concluídos</span>
                        <span className="text-xs font-mono font-black text-indigo-400">
                          {last7DaysChartData.reduce((acc, item) => acc + item["Concluídas"], 0)} <span className="text-[9px] font-bold text-slate-500">metas</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* The actual Recharts BarChart container */}
                  <div className="h-64 sm:h-72 w-full mt-4 pr-2 select-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={last7DaysChartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#d97706" stopOpacity={0.4} />
                          </linearGradient>
                          <linearGradient id="hoverBarGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.25} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#64748b" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                          dy={10}
                          fontFamily="Inter"
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                          allowDecimals={false}
                          dx={-5}
                          fontFamily="JetBrains Mono"
                        />
                        <Tooltip
                          cursor={{ fill: '#1e293b', opacity: 0.15 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-[#0b1329] border border-[#1e2e5c] p-3 rounded-xl shadow-lg font-sans text-left min-w-[120px]">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide leading-none mb-1.5">
                                    {payload[0].payload.name}
                                  </p>
                                  <p className="text-xs font-black text-white flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    Concluídas: <span className="font-mono text-amber-400 text-sm">{payload[0].value}</span>
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="Concluídas" 
                          radius={[6, 6, 0, 0]} 
                          maxBarSize={44}
                        >
                          {last7DaysChartData.map((entry, index) => {
                            const isToday = entry.dateStr === todayStr;
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={isToday ? "url(#hoverBarGradient)" : "url(#barGradient)"}
                                stroke={isToday ? "#fbbf24" : "rgba(245,158,11,0.2)"}
                                strokeWidth={isToday ? 1.5 : 0}
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Interactive Upcoming Deadlines Section */}
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-[#5C79AC] uppercase tracking-widest block">Próximos Prazos / Entregas de Metas</span>
                    {deadlineTasks.length > 0 && (
                      <span className="text-[9px] font-mono text-slate-500">Mapeamento dinâmico por proximidade</span>
                    )}
                  </div>

                  {deadlineTasks.length === 0 ? (
                    <div className="bg-[#0A1021]/30 border border-[#141E3A] rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[160px]">
                      <Inbox className="h-10 w-10 text-slate-600 mb-2.5" />
                      <h4 className="text-xs font-black text-slate-350 uppercase tracking-wider font-sans">Nenhum prazo cadastrado</h4>
                      <p className="text-[10px] text-slate-550 mt-1 max-w-sm leading-relaxed text-center font-sans">Prazos de entrega induzem o cérebro à ativação motora positiva. Personalize ou edite uma de suas metas e defina um prazo!</p>
                      <button
                        onClick={() => handleOpenCreateModal()}
                        className="mt-4 px-4 py-2 hover:brightness-105 bg-indigo-500/15 border border-indigo-505/20 hover:border-indigo-400/40 text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer font-sans"
                      >
                        Agendar Prazo Inicial
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deadlineTasks.map(task => {
                        const isOverdue = task.daysLeft < 0 && !task.completed;
                        const isDueToday = task.daysLeft === 0 && !task.completed;
                        const isDueTomorrow = task.daysLeft === 1 && !task.completed;
                        const isDueSoon = task.daysLeft > 1 && task.daysLeft <= 7 && !task.completed;

                        // Styling wrapper based on state
                        const cardStyle = task.completed
                          ? 'bg-slate-905/10 border-slate-850/50 opacity-60'
                          : isOverdue
                            ? 'bg-red-950/10 border-red-500/25 shadow-lg shadow-red-950/2'
                            : isDueToday
                              ? 'bg-amber-955/10 border-amber-500/35 shadow-lg shadow-amber-950/2 animate-[border-pulse-amber_3s_infinite]'
                              : isDueTomorrow
                                ? 'bg-cyan-950/15 border-cyan-400/25'
                                : 'bg-slate-905 border-slate-850/80';

                        // Urgency Tag label & style
                        let badgeLabel = '';
                        let badgeStyle = '';
                        if (task.completed) {
                          badgeLabel = 'Concluído';
                          badgeStyle = 'bg-slate-800 text-slate-400 border-slate-750';
                        } else if (isOverdue) {
                          badgeLabel = `Atrasado há ${Math.abs(task.daysLeft)} ${Math.abs(task.daysLeft) === 1 ? 'dia' : 'dias'}`;
                          badgeStyle = 'bg-red-500/10 text-red-400 border-red-500/20';
                        } else if (isDueToday) {
                          badgeLabel = 'Prazo Hoje ⭕';
                          badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                        } else if (isDueTomorrow) {
                          badgeLabel = 'Prazo Amanhã 🌬️';
                          badgeStyle = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                        } else if (isDueSoon) {
                          badgeLabel = `Em ${task.daysLeft} dias`;
                          badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                        } else {
                          badgeLabel = `Em ${task.daysLeft} dias`;
                          badgeStyle = 'bg-slate-900 border-slate-800 text-slate-400';
                        }

                        return (
                          <motion.div
                            key={task.id}
                            className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${cardStyle}`}
                          >
                            <div className="space-y-2.5 text-left">
                              {/* Header tags */}
                              <div className="flex items-center justify-between gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border font-sans ${badgeStyle}`}>
                                  {badgeLabel}
                                </span>
                                
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-sans ${
                                  task.category === 'Trabalho' ? 'text-amber-500 bg-amber-500/10' : task.category === 'Estudo' ? 'text-cyan-400 bg-cyan-400/10' : task.category === 'Pessoal' ? 'text-indigo-400 bg-indigo-500/10' : task.category === 'Saúde' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 bg-slate-800'
                                }`}>
                                  {task.category}
                                </span>
                              </div>

                              {/* Title with checkbox */}
                              <div className="flex items-start gap-2.5 pt-1 text-left">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(task.id)}
                                  className={`h-4.5 w-4.5 shrink-0 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                    task.completed 
                                      ? 'bg-amber-500 border-amber-500 text-slate-950' 
                                      : 'border-slate-800 hover:border-amber-500/50 bg-slate-950/20'
                                  }`}
                                >
                                  {task.completed && <Check className="h-3 w-3 stroke-[3px]" />}
                                </button>
                                <div className="min-w-0 flex-1 text-left">
                                  <div className="flex items-start gap-1.5">
                                    {!task.completed && (
                                      <motion.span
                                        animate={task.priority === 'high' ? { scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] } : {}}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                        className={`inline-flex items-center justify-center shrink-0 rounded-full p-0.5 mt-0.5 border ${
                                          task.priority === 'high'
                                            ? 'text-red-500 bg-red-500/10 border-red-500/20'
                                            : task.priority === 'medium'
                                              ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                                              : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                                        }`}
                                        title={task.priority === 'high' ? 'Alta Prioridade' : task.priority === 'medium' ? 'Prioridade Média' : 'Prioridade Leve'}
                                      >
                                        {task.priority === 'high' && <AlertTriangle className="h-3 w-3 fill-red-500/20" />}
                                        {task.priority === 'medium' && <Zap className="h-3 w-3 fill-amber-500/15" />}
                                        {task.priority === 'low' && <CheckCircle2 className="h-3 w-3" />}
                                      </motion.span>
                                    )}
                                    <h4 className={`text-xs font-black leading-tight break-words font-sans flex-1 ${
                                      task.completed 
                                        ? 'text-slate-500 line-through font-bold' 
                                        : task.priority === 'high'
                                          ? 'text-red-400 font-black'
                                          : task.priority === 'medium'
                                            ? 'text-amber-400 font-extrabold'
                                            : 'text-emerald-400 font-bold'
                                    }`}>
                                      {task.title}
                                    </h4>
                                  </div>
                                  {task.description && (
                                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed text-left font-sans">
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Card Footer controls */}
                            <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center bg-slate-900/5">
                              <span className="text-[9px] font-mono text-slate-500">
                                Data: {task.dueDate!.split('-').reverse().slice(0, 2).join('/') /* format as DD/MM */}
                              </span>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOpenEditModal(task)}
                                  className="text-[9px] font-black text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer hover:scale-105 transition-all font-sans"
                                >
                                  Editar
                                </button>
                                <span className="text-slate-800 text-[10px]">•</span>
                                <button
                                  onClick={() => {
                                    playSound('click');
                                    setViewMode('tarefas');
                                  }}
                                  className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer hover:scale-105 transition-all font-sans"
                                >
                                  Ver na Lista <ArrowRight className="h-2.5 w-2.5 stroke-[2.5px]" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Additional Performance Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  {/* Hydration Widget Card */}
                  <div className="bg-[#121A30]/40 border border-[#19274A]/80 rounded-3xl p-5 flex items-center justify-between text-left shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-lg shrink-0">
                        🥤
                      </div>
                      <div className="space-y-0.5 text-left">
                        <h4 className="text-[10px] font-black text-[#567BAD] uppercase tracking-wider font-sans">Meta de Hidratação Diária</h4>
                        <p className="text-xs font-black text-white font-sans">{waterCups} de 8 copos consumidos</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed text-left font-sans">Apoia a cognição e o foco ativo.</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleDrinkWater}
                      className="px-3.5 py-2 bg-indigo-500/15 border border-indigo-500/20 hover:bg-cyan-500 hover:text-slate-950 text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all h-9 cursor-pointer shadow-md font-sans shrink-0 ml-2"
                    >
                      + Registrar Copo
                    </button>
                  </div>

                  {/* Focus & Breathing Quick Card */}
                  <div className="bg-[#121A30]/40 border border-[#19274A]/80 rounded-3xl p-5 flex items-center justify-between text-left shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 text-lg shrink-0">
                        🧠
                      </div>
                      <div className="space-y-0.5 text-left">
                        <h4 className="text-[10px] font-black text-[#567BAD] uppercase tracking-wider font-sans">Rotina Pomodoro & Foco</h4>
                        <p className="text-xs font-black text-white font-sans">{completedCycles} sessões completadas</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed text-left font-sans">Técnicas de foco e controle relaxante.</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        playSound('click');
                        setViewMode('foco');
                      }}
                      className="px-3.5 py-2 bg-indigo-500/15 border border-indigo-500/20 hover:bg-orange-400 hover:text-slate-950 text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all h-9 cursor-pointer shadow-md font-sans shrink-0 ml-2"
                    >
                      Iniciar Foco
                    </button>
                  </div>
                </div>

              </motion.div>
            )}

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
                              <div className="flex items-start gap-2">
                                {!task.completed && (
                                  <motion.span
                                    animate={task.priority === 'high' ? { scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] } : {}}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    className={`inline-flex items-center justify-center shrink-0 rounded-full p-1 mt-0.5 border ${
                                      task.priority === 'high'
                                        ? 'text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]'
                                        : task.priority === 'medium'
                                          ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                                          : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                                    }`}
                                    title={task.priority === 'high' ? 'Alta Prioridade' : task.priority === 'medium' ? 'Prioridade Média' : 'Prioridade Leve'}
                                  >
                                    {task.priority === 'high' && <AlertTriangle className="h-4 w-4 fill-red-500/20" />}
                                    {task.priority === 'medium' && <Zap className="h-4 w-4 fill-amber-500/15" />}
                                    {task.priority === 'low' && <CheckCircle2 className="h-4 w-4" />}
                                  </motion.span>
                                )}
                                <h3 
                                  onClick={() => handleToggleTask(task.id)}
                                  className={`text-sm sm:text-base font-bold select-none cursor-pointer tracking-tight leading-snug break-words flex-1 transition-colors ${
                                    task.completed 
                                      ? 'line-through text-slate-500' 
                                      : task.priority === 'high'
                                        ? 'text-red-400 font-black group-hover:text-red-300'
                                        : task.priority === 'medium'
                                          ? 'text-amber-400 font-extrabold group-hover:text-amber-300'
                                          : 'text-emerald-400 font-bold group-hover:text-emerald-350'
                                  }`}
                                >
                                  {task.title}
                                </h3>
                              </div>

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
                  {/* Title with Sub-menu toggles */}
                  <div className="border-b border-slate-850 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                        <Calendar className="h-6 w-6 text-cyan-400 shrink-0" /> {agendaSubTab === 'weekly' ? 'Agenda Semanal' : 'Aniversários de Contatos'}
                      </h2>
                      <p className="text-xs text-slate-405 mt-1 font-medium">
                        {agendaSubTab === 'weekly' 
                          ? 'Sua semana em perspectiva de alta performance. Selecione os dias para detalhar metas programadas.' 
                          : 'Gerenciamento de lembretes de aniversários. Cadastre datas e configure canais de alerta.'}
                      </p>
                    </div>
                    
                    {/* Sub-tab Toggle inside Agenda */}
                    <div className="flex gap-1.5 p-1 bg-slate-950 border border-slate-850 rounded-xl max-w-sm shrink-0">
                      <button
                        type="button"
                        onClick={() => { playSound('click'); setAgendaSubTab('weekly'); }}
                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                          agendaSubTab === 'weekly'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                        }`}
                      >
                        Agenda
                      </button>
                      <button
                        type="button"
                        onClick={() => { playSound('click'); setAgendaSubTab('birthdays'); }}
                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                          agendaSubTab === 'birthdays'
                            ? 'bg-pink-500/15 text-pink-400 border border-pink-500/20 font-black'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                        }`}
                      >
                        Aniversários
                      </button>
                    </div>
                  </div>

                  {agendaSubTab === 'weekly' ? (
                    <>
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
                </>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  {/* Active alerts notifications banner for today */}
                  {(() => {
                    const activeAlerts = birthdays.flatMap(bd => {
                      const status = getBirthdayStatus(bd.date, bd.reminder1Day, bd.reminder2Days, bd.reminder3Days);
                      if (!status) return [];
                      return status.activeReminders.map(rem => ({
                        id: `${bd.id}-${rem}`,
                        name: bd.name,
                        msg: rem,
                        daysRemaining: status.daysRemaining,
                        isToday: status.isToday
                      }));
                    });

                    if (activeAlerts.length === 0) return null;

                    return (
                      <div className="bg-[#1A0D1B] border border-pink-500/20 rounded-2xl p-4 space-y-2.5">
                        <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest flex items-center gap-2">
                          <Bell className="h-4.5 w-4.5 text-pink-400 animate-swing animate-[bounce_2s_infinite]" /> Lembretes de Aniversário Ativos Hoje
                        </span>
                        <div className="space-y-2">
                          {activeAlerts.map(alert => (
                            <div 
                              key={alert.id}
                              className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                                alert.isToday 
                                  ? 'bg-pink-500/10 border-pink-500/30 text-pink-300' 
                                  : 'bg-slate-900/60 border-slate-800 text-slate-350'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-sm">🎉</span>
                                <div className="text-left font-sans">
                                  <strong className="text-white font-black">{alert.name}</strong>: {alert.msg}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                                alert.isToday ? 'bg-pink-550 text-slate-950 bg-pink-400' : 'bg-slate-800 text-slate-405'
                              }`}>
                                {alert.isToday ? 'Hoje' : 'Alerta'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Create form drawer */}
                  <AnimatePresence>
                    {isCreateBirthdayOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="bg-slate-900 border border-pink-500/15 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Cake className="h-4.5 w-4.5 text-pink-400" /> Adicionar Aniversariante
                          </h3>
                          <button 
                            type="button"
                            onClick={() => { playSound('click'); setIsCreateBirthdayOpen(false); }}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border-0 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (!formBirthdayName.trim() || !formBirthdayDate) return;
                          const newBd: Birthday = {
                            id: 'bd-' + Date.now(),
                            name: formBirthdayName.trim(),
                            date: formBirthdayDate,
                            reminder1Day: formBirthday1Day,
                            reminder2Days: formBirthday2Days,
                            reminder3Days: formBirthday3Days
                          };
                          setBirthdays(prev => [newBd, ...prev]);
                          setFormBirthdayName('');
                          setFormBirthdayDate('');
                          setFormBirthday1Day(true);
                          setFormBirthday2Days(false);
                          setFormBirthday3Days(false);
                          setIsCreateBirthdayOpen(false);
                          playSound('check');
                          confetti({
                            particleCount: 30,
                            spread: 40,
                            colors: ['#ec4899', '#f43f5e']
                          });
                        }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nome do Aniversariante</label>
                            <input 
                              type="text"
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-pink-500/40 transition-colors"
                              placeholder="Ex: João Silva"
                              required
                              value={formBirthdayName}
                              onChange={(e) => setFormBirthdayName(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Data de Nascimento</label>
                            <input 
                              type="date"
                              className="w-full bg-slate-955 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-pink-500/40 transition-colors"
                              required
                              value={formBirthdayDate}
                              onChange={(e) => setFormBirthdayDate(e.target.value)}
                            />
                          </div>

                          <div className="md:col-span-2 space-y-2 select-none text-left pt-2 border-t border-slate-850">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Programar Alertas de Lembrete</label>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* 5 horas obrigatório */}
                              <div className="flex items-center gap-3 p-3 bg-slate-955 border border-slate-850 rounded-xl opacity-80">
                                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                                <div>
                                  <span className="text-xs font-bold text-slate-200 block">5 Horas Antes (Fixo)</span>
                                  <span className="text-[9px] text-[#4F6C9F] block">Obrigatório e automático.</span>
                                </div>
                              </div>

                              {/* 1 dia antes */}
                              <label className="flex items-center gap-3 p-3 bg-slate-955 border border-slate-850 hover:border-pink-550/20 rounded-xl transition-all cursor-pointer">
                                <input 
                                  type="checkbox"
                                  className="h-4 w-4 rounded bg-slate-900 border-slate-750 text-pink-500 focus:ring-0 cursor-pointer"
                                  checked={formBirthday1Day}
                                  onChange={(e) => setFormBirthday1Day(e.target.checked)}
                                />
                                <div>
                                  <span className="text-xs font-bold text-slate-100 block">1 Dia Antes</span>
                                  <span className="text-[9px] text-slate-500 block">Alerta de véspera.</span>
                                </div>
                              </label>

                              {/* 2 dias antes */}
                              <label className="flex items-center gap-3 p-3 bg-slate-955 border border-slate-855 hover:border-pink-550/20 rounded-xl transition-all cursor-pointer">
                                <input 
                                  type="checkbox"
                                  className="h-4 w-4 rounded bg-slate-900 border-slate-755 text-pink-500 focus:ring-0 cursor-pointer"
                                  checked={formBirthday2Days}
                                  onChange={(e) => setFormBirthday2Days(e.target.checked)}
                                />
                                <div>
                                  <span className="text-xs font-bold text-slate-100 block">2 Dias Antes</span>
                                  <span className="text-[9px] text-slate-500 block">Organizar detalhes extras.</span>
                                </div>
                              </label>

                              {/* 3 dias antes */}
                              <label className="flex items-center gap-3 p-3 bg-slate-955 border border-slate-855 hover:border-pink-550/20 rounded-xl transition-all cursor-pointer">
                                <input 
                                  type="checkbox"
                                  className="h-4 w-4 rounded bg-slate-900 border-slate-755 text-pink-500 focus:ring-0 cursor-pointer"
                                  checked={formBirthday3Days}
                                  onChange={(e) => setFormBirthday3Days(e.target.checked)}
                                />
                                <div>
                                  <span className="text-xs font-bold text-slate-100 block">3 Dias Antes</span>
                                  <span className="text-[9px] text-slate-500 block">Tempo para compras e logística.</span>
                                </div>
                              </label>
                            </div>
                          </div>

                          <div className="md:col-span-2 pt-4 flex gap-3 justify-end">
                            <button 
                              type="button"
                              onClick={() => { playSound('click'); setIsCreateBirthdayOpen(false); }}
                              className="px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-705 font-bold text-xs text-slate-400 hover:text-white transition-all cursor-pointer bg-transparent"
                            >
                              Cancelar
                            </button>
                            <button 
                              type="submit"
                              className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg border-0"
                            >
                              Confirmar Lembrete
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Grid list of birthdays */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#6882AF] uppercase tracking-widest">Contatos Cadastrados ({birthdays.length})</span>
                    
                    {!isCreateBirthdayOpen && (
                      <button 
                        onClick={() => { playSound('click'); setIsCreateBirthdayOpen(true); }}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-pink-550/10 hover:bg-pink-500 hover:text-slate-955 border border-pink-550/20 hover:border-pink-500 text-pink-400 font-extrabold text-[10px] tracking-wider uppercase transition-all duration-350 cursor-pointer"
                      >
                        <Plus className="h-4 w-4 stroke-[3]" /> Novo Lembrete
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {birthdays.length === 0 ? (
                      <div className="col-span-1 sm:col-span-2 md:col-span-3 text-center py-16 border border-dashed border-slate-800 bg-slate-955/20 rounded-2xl">
                        <Cake className="h-10 w-10 text-pink-500/20 mx-auto mb-3 animate-pulse" />
                        <h4 className="text-xs font-bold text-slate-405">Nenhum aniversário cadastrado</h4>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">Adicione aniversários para visualizar os alertas integrados de contatos.</p>
                      </div>
                    ) : (
                      birthdays.map((bd) => {
                        const status = getBirthdayStatus(bd.date, bd.reminder1Day, bd.reminder2Days, bd.reminder3Days);
                        const isToday = status?.isToday;
                        const isTomorrow = status?.isTomorrow;
                        
                        // Format birth date
                        const parts = bd.date.split('-');
                        let formattedDate = bd.date;
                        if (parts.length >= 3) {
                          const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                          formattedDate = `${parts[2]} de ${months[Number(parts[1]) - 1]}`;
                        }

                        return (
                          <motion.div
                            key={bd.id}
                            className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 ${
                              isToday 
                                ? 'bg-gradient-to-br from-[#250E26] to-[#0D1526] border-pink-500 shadow-xl shadow-pink-550/5' 
                                : isTomorrow
                                  ? 'bg-slate-900 border-pink-505/40'
                                  : 'bg-slate-900 border-slate-850 hover:border-slate-700'
                            }`}
                          >
                            <div className="space-y-3.5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-sm font-black text-white leading-tight">{bd.name}</h4>
                                  <span className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                                    <Cake className="h-3.5 w-3.5 text-pink-400" /> {formattedDate}
                                  </span>
                                </div>
                                {isToday && (
                                  <span className="text-xs shrink-0 select-none">🎉</span>
                                )}
                              </div>

                              <div>
                                {isToday ? (
                                  <span className="text-[10px] py-1 px-2.5 rounded-lg bg-pink-500 text-slate-950 font-black tracking-wide uppercase inline-flex items-center gap-1.5 shadow">
                                    🔥 Hoje! Parabéns
                                  </span>
                                ) : isTomorrow ? (
                                  <span className="text-[10px] py-1 px-2 rounded-lg bg-pink-500/10 border border-pink-505/20 text-pink-400 font-bold tracking-wide uppercase inline-block">
                                    Amanhã
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    Faltam <strong className="text-pink-400 font-black">{status?.daysRemaining}</strong> dias
                                  </span>
                                )}
                              </div>

                              {/* Indicators */}
                              <div className="pt-3 border-t border-slate-850">
                                <span className="text-[8px] font-black tracking-widest text-[#516C9F] uppercase block mb-1.5">Alertas Programados</span>
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-450 font-bold">
                                    5h Fixo
                                  </span>
                                  {bd.reminder1Day && (
                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold">
                                      1 Dia
                                    </span>
                                  )}
                                  {bd.reminder2Days && (
                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold">
                                      2 Dias
                                    </span>
                                  )}
                                  {bd.reminder3Days && (
                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold">
                                      3 Dias
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-850/40 flex justify-end">
                              <button 
                                onClick={() => {
                                  playSound('click');
                                  setBirthdays(prev => prev.filter(b => b.id !== bd.id));
                                }}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer border-0 flex items-center justify-center navigation-test-btn"
                                title="Deletar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </motion.div>
              );
            })()}

            {/* VIEW MODE 5: FOCUS & BREATHING TECHNIQUES (🧠 FOCO) */}
            {viewMode === 'foco' && (
              <motion.div
                key="tab-foco"
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-6 select-none"
              >
                {/* Title */}
                <div className="border-b border-slate-850 pb-5">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                    <Brain className="h-6 w-6 text-orange-400 shrink-0" /> Foco Respiratório & Pomodoro
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-medium select-none text-left">Técnicas clínicas de respiração e ancoragem mental baseadas na neurociência para controle de ansiedade, TDAH e estresse.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 select-none">
                  
                  {/* Left Column: Interactive Breathing Core */}
                  <div className="md:col-span-5 bg-[#0A1021] border border-[#19274A]/80 rounded-3xl p-6 flex flex-col items-center justify-between min-h-[460px] text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
                    
                    {/* Mode Header Indicator */}
                    <div className="w-full">
                      <span className="text-[9px] font-black tracking-widest text-[#5679AF] uppercase bg-[#142344] border border-[#1E3465] px-3 py-1.5 rounded-full inline-block mb-3">
                        {breathingMode === 'foco' && 'Foco Intenso (Box Breathing)'}
                        {breathingMode === 'ansiedade' && 'Alívio Ansiedade (Técnica 4-7-8)'}
                        {breathingMode === 'nervosismo' && 'Equilíbrio Nervoso (Respiração Coerente)'}
                        {breathingMode === 'tdah' && 'Ancoragem TDAH (Physiological Sigh)'}
                      </span>
                    </div>

                    {/* Animated lungs orb */}
                    <div className="flex items-center justify-center my-8 relative h-60 w-60">
                      {/* Interactive dynamic background waves */}
                      <AnimatePresence>
                        {isBreathingRunning && (
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ 
                              scale: breathingPhase === 'inhale' ? 1.4 : breathingPhase === 'hold-in' ? 1.4 : 1.0,
                              opacity: breathingPhase === 'inhale' ? 0.35 : breathingPhase === 'hold-in' ? 0.45 : 0.15
                            }}
                            className={`absolute inset-0 rounded-full blur-2xl pointer-events-none transition-all duration-1000 ${
                              breathingMode === 'ansiedade' ? 'bg-cyan-500/25' : 'bg-orange-500/25'
                            }`}
                          />
                        )}
                      </AnimatePresence>

                      {/* Visual Core Ball */}
                      <motion.div 
                        animate={{ 
                          scale: breathingPhase === 'inhale' ? 1.3 : breathingPhase === 'hold-in' ? 1.3 : breathingPhase === 'exhale' ? 1.0 : 1.0
                        }}
                        transition={{ 
                          duration: breathingPhase === 'hold-in' || breathingPhase === 'hold-out' ? 0.5 : phaseSecondsLeft === 0 ? 0.4 : 1.1,
                          ease: 'easeInOut' 
                        }}
                        className={`h-40 w-40 rounded-full flex flex-col items-center justify-center border-4 relative shadow-2xl transition-colors duration-1000 ${
                          breathingPhase === 'inhale' 
                            ? 'bg-orange-500/10 border-orange-400 shadow-orange-500/10' 
                            : breathingPhase === 'hold-in'
                              ? 'bg-cyan-500/15 border-cyan-400 shadow-cyan-500/15'
                              : 'bg-slate-950/80 border-slate-700 shadow-transparent'
                        }`}
                      >
                        {/* Countdown digits */}
                        <div className="text-3xl font-black font-mono tracking-tighter text-white">
                          {phaseSecondsLeft}s
                        </div>
                        
                        {/* Phase label text inside the orb */}
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#A2BDFF] mt-1.5">
                          {breathingPhase === 'inhale' && 'Inspire... 💨'}
                          {breathingPhase === 'hold-in' && 'Segure ⭕'}
                          {breathingPhase === 'exhale' && 'Expire... 🌬️'}
                          {breathingPhase === 'hold-out' && 'Prenda Vazio ⏳'}
                        </div>
                      </motion.div>
                    </div>

                    {/* Quick status information */}
                    <div className="space-y-4 w-full">
                      <div className="flex justify-around items-center text-xs py-2 px-3 border border-[#141F3D]/60 bg-[#070D1C]/80 rounded-2xl">
                        <div className="text-left md:text-center">
                          <span className="text-[9px] font-black text-slate-500 block uppercase tracking-wider">Ciclos Completos</span>
                          <span className="text-sm font-black text-white">{completedCycles}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-850" />
                        <div className="text-left md:text-center">
                          <span className="text-[9px] font-black text-slate-500 block uppercase tracking-wider">Ritmo da Onda</span>
                          <span className="text-xs font-bold text-orange-400">
                            {breathingMode === 'foco' && '4s - 4s - 4s - 4s'}
                            {breathingMode === 'ansiedade' && '4s - 7s - 8s'}
                            {breathingMode === 'nervosismo' && '5s - 5s'}
                            {breathingMode === 'tdah' && '2s - 1s - 5s'}
                          </span>
                        </div>
                      </div>

                      {/* Control Activation buttons */}
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setIsBreathingRunning(!isBreathingRunning);
                          }}
                          className={`flex-1 py-3 px-5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-0 cursor-pointer shadow-md transition-all duration-300 ${
                            isBreathingRunning 
                              ? 'bg-red-500/10 hover:bg-red-520 text-red-400 hover:text-white hover:bg-red-550 border border-red-550/20' 
                              : 'bg-orange-500 hover:bg-orange-400 text-slate-950 font-black'
                          }`}
                        >
                          {isBreathingRunning ? (
                            <>
                              <Pause className="h-4 w-4 shrink-0 fill-current" /> Pausar Exercício
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 shrink-0 fill-current" /> Iniciar Exercício
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setIsBreathingRunning(false);
                            setCompletedCycles(0);
                            setBreathingPhase('inhale');
                            if (breathingMode === 'foco') setPhaseSecondsLeft(4);
                            else if (breathingMode === 'ansiedade') setPhaseSecondsLeft(4);
                            else if (breathingMode === 'nervosismo') setPhaseSecondsLeft(5);
                            else if (breathingMode === 'tdah') setPhaseSecondsLeft(2);
                          }}
                          className="p-3 border border-slate-800 hover:border-slate-705 bg-slate-950 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
                          title="Voltar ao início"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Techniques detailed cards selector */}
                  <div className="md:col-span-7 space-y-4">
                    <span className="text-[10px] font-black text-[#5C79AC] uppercase tracking-widest block text-left">Escolha sua Ancoragem Mental</span>
                    
                    <div className="grid grid-cols-1 gap-3.5">
                      {/* Technique 1: Foco */}
                      <div 
                        onClick={() => {
                          if (isBreathingRunning) return;
                          playSound('click');
                          setBreathingMode('foco');
                          setBreathingPhase('inhale');
                          setPhaseSecondsLeft(4);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all duration-300 ${isBreathingRunning ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'} ${
                          breathingMode === 'foco' 
                            ? 'bg-[#151D33] border-orange-500/60 shadow-lg shadow-orange-500/5' 
                            : 'bg-slate-900 border-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            breathingMode === 'foco' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-slate-950 text-slate-500 border-slate-800'
                          }`}>
                            <Zap className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">Foco Intenso (Box Breathing)</h4>
                              <span className="px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-[8px] font-black text-orange-400">TDAH / ATENÇÃO</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                              Técnica de Respiração Quadrada (4-4-4-4). Utilizada por fuzileiros navais (Navy SEALs) para clareza mental extrema e foco tático sob pressão neuroanalógica. Combate a dispersão.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Technique 2: Ansiedade */}
                      <div 
                        onClick={() => {
                          if (isBreathingRunning) return;
                          playSound('click');
                          setBreathingMode('ansiedade');
                          setBreathingPhase('inhale');
                          setPhaseSecondsLeft(4);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all duration-300 ${isBreathingRunning ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'} ${
                          breathingMode === 'ansiedade' 
                            ? 'bg-[#151D33] border-cyan-400/60 shadow-lg shadow-cyan-400/5' 
                            : 'bg-slate-900 border-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            breathingMode === 'ansiedade' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-slate-950 text-slate-500 border-slate-800'
                          }`}>
                            <Activity className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">Alívio Ansiedade (4-7-8)</h4>
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-black text-cyan-455">ANSIEDADE / PÂNICO</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                              Ciclos balanceados recomendados pelo Dr. Andrew Weil. Reduz de forma imediata e mecânica o sistema simpático, estimulando o relaxamento e acalmando crises ansiosas rapidamente.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Technique 3: Nervosismo */}
                      <div 
                        onClick={() => {
                          if (isBreathingRunning) return;
                          playSound('click');
                          setBreathingMode('nervosismo');
                          setBreathingPhase('inhale');
                          setPhaseSecondsLeft(5);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all duration-300 ${isBreathingRunning ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'} ${
                          breathingMode === 'nervosismo' 
                            ? 'bg-[#151D33] border-emerald-500/60 shadow-lg shadow-emerald-500/5' 
                            : 'bg-slate-900 border-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            breathingMode === 'nervosismo' ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' : 'bg-slate-950 text-slate-500 border-slate-800'
                          }`}>
                            <Wind className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">Equilíbrio Físico (Respiração Coerente)</h4>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-455">NERVOSISMO / CURA</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                              Inspiração em 5 segundos seguida de expiração em 5 segundos (sem retenções). Induz a frequência máxima de ressonância cardiovascular, equilibrando a pressão sistólica.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Technique 4: TDAH */}
                      <div 
                        onClick={() => {
                          if (isBreathingRunning) return;
                          playSound('click');
                          setBreathingMode('tdah');
                          setBreathingPhase('inhale');
                          setPhaseSecondsLeft(2);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all duration-300 ${isBreathingRunning ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'} ${
                          breathingMode === 'tdah' 
                            ? 'bg-[#151D33] border-amber-500/60 shadow-lg shadow-amber-500/5' 
                            : 'bg-slate-900 border-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            breathingMode === 'tdah' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-950 text-slate-500 border-slate-800'
                          }`}>
                            <Activity className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">Estabilizar Hiperatividade (Sigh Fisiológico)</h4>
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-black text-amber-500 font-sans">Mente Tagarela / TDAH</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                              Técnica comprovada pelo laboratório do Dr. Andrew Huberman (Stanford). Duas inspirações consecutivas seguidas de uma expiração longa. Alivia e ancora imediatamente o estágio de estresse neurocomportamental.
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Cognitive tips panel */}
                <div className="bg-[#121A30]/40 border border-[#19274A] rounded-3xl p-5 flex items-start gap-4 text-left shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/20 text-lg shrink-0">
                    💡
                  </div>
                  <div className="flex-1 space-y-1 select-none">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">CIÊNCIA DO FOCO CONTRA ANSIEDADE & TDAH</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Controlar a proporção e velocidade de CO₂ em relação ao O₂ no sangue dita o feedback de perigo que o cérebro envia às glândulas suprarrenais. Exercícios focados de 2 a 5 minutos redefinem a neuroquímica que causa ansiedade e a falta de foco do TDAH! Combine-os com ciclos pomodoro diários de 25 minutos de meta ativa.
                    </p>
                  </div>
                </div>

              </motion.div>
            )}

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
                    <h3 className="text-xs font-black text-white uppercase tracking-wider pb-2 border-b border-slate-850 flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-amber-500" /> Preferências de Áudio e Gerais
                    </h3>
                    
                    {/* Task checklist beep preference */}
                    <div className="flex items-center justify-between py-1">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-250 block">Som ao Concluir Tarefas</span>
                        <span className="text-[10px] text-slate-500 block">Emite um bipe sintetizado de feedback positivo ao marcar uma tarefa como pronta.</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => playSound('check')}
                          disabled={!isTaskBeepEnabled}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                            isTaskBeepEnabled 
                              ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white' 
                              : 'bg-slate-950/20 text-slate-600 border-slate-900/40 cursor-not-allowed'
                          }`}
                        >
                          Testar 🔊
                        </button>
                        <button
                          type="button"
                          id="preference-sound-tasks"
                          onClick={() => setIsTaskBeepEnabled(!isTaskBeepEnabled)}
                          className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isTaskBeepEnabled ? 'bg-amber-500' : 'bg-slate-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                              isTaskBeepEnabled ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Level Up chime preference */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-850 py-1">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-250 block">Efeito de Áudio ao Subir de Nível</span>
                        <span className="text-[10px] text-slate-500 block">Toca uma melodia de chime triunfante ao completar a barra de XP com novos níveis.</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => playSound('level')}
                          disabled={!isLevelUpChimeEnabled}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                            isLevelUpChimeEnabled 
                              ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white' 
                              : 'bg-slate-950/20 text-slate-600 border-slate-900/40 cursor-not-allowed'
                          }`}
                        >
                          Testar 🔊
                        </button>
                        <button
                          type="button"
                          id="preference-sound-levelup"
                          onClick={() => setIsLevelUpChimeEnabled(!isLevelUpChimeEnabled)}
                          className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isLevelUpChimeEnabled ? 'bg-amber-500' : 'bg-slate-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                              isLevelUpChimeEnabled ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Dynamic BG indicator */}
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
      </motion.main>

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Prioridade</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormPriority('high')}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-[10px] font-black transition-all duration-200 cursor-pointer ${
                          formPriority === 'high'
                            ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.12)] scale-[1.01]'
                            : 'bg-slate-950/60 border-slate-800 text-slate-450 hover:border-slate-700 hover:text-slate-200'
                        }`}
                        title="Alta Prioridade (Mais XP)"
                      >
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>Alta</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormPriority('medium')}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-[10px] font-black transition-all duration-200 cursor-pointer ${
                          formPriority === 'medium'
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.12)] scale-[1.01]'
                            : 'bg-slate-950/60 border-slate-800 text-slate-450 hover:border-slate-700 hover:text-slate-200'
                        }`}
                        title="Prioridade Média (Médio XP)"
                      >
                        <Zap className="h-3 w-3 shrink-0" />
                        <span>Média</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormPriority('low')}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-[10px] font-black transition-all duration-200 cursor-pointer ${
                          formPriority === 'low'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.12)] scale-[1.01]'
                            : 'bg-slate-950/60 border-slate-800 text-slate-450 hover:border-slate-700 hover:text-slate-200'
                        }`}
                        title="Prioridade Leve (Menos XP)"
                      >
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span>Leve</span>
                      </button>
                    </div>
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

                  {/* Due Date Scheduling */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prazo / Entrega</label>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Active Reminder Toggle */}
                <div className="flex items-center gap-2 pt-1 pb-1">
                  <input
                    type="checkbox"
                    id="formReminder"
                    checked={formReminder}
                    onChange={(e) => setFormReminder(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-amber-550 focus:ring-opacity-50 focus:ring-amber-500 cursor-pointer accent-amber-500"
                  />
                  <label htmlFor="formReminder" className="text-[11px] font-bold text-slate-350 select-none cursor-pointer flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Configurar Lembrete Ativo para esta meta
                  </label>
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

      {/* ========================================================================= */}
      {/* 🔔 CONFIGURAÇÃO RÁPIDA DE LEMBRETES LOCAL/OFFLINE MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isLocalTaskReminderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLocalTaskReminderModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs"
            />

            {/* Modal Dialog Body */}
            <motion.div
              initial={{ scale: 0.94, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 15, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl overflow-hidden z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-850 mb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  Lembrete Local de Tarefas
                </h3>
                <button
                  type="button"
                  onClick={() => setIsLocalTaskReminderModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer animate-[pulse_3s_infinite]"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Intro Info Banner */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-300 text-[11px] leading-relaxed">
                  <p className="font-extrabold text-amber-400 mb-1 flex items-center gap-1">
                    🎯 Funcionamento Offline Ativo
                  </p>
                  Garante o disparo de alertas mesmo em instabilidade de rede ou totalmente sem internet. O motor interno do Citrino verifica diariamente suas tarefas pendentes agendadas para o dia no horário definido e dispara uma notificação nativa do sistema operacional.
                </div>

                {/* Toggle Enable */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Ativar Lembretes Locais</span>
                    <span className="text-[10px] text-slate-500">Disparar alerta no horário escolhido</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocalTaskReminderEnabled(!localTaskReminderEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      localTaskReminderEnabled ? 'bg-amber-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        localTaskReminderEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Time Selection Input */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    Horário de Notificação Diária
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                    <input
                      type="time"
                      value={localTaskReminderTime}
                      disabled={!localTaskReminderEnabled}
                      onChange={(e) => setLocalTaskReminderTime(e.target.value)}
                      className={`w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 [color-scheme:dark] ${
                        !localTaskReminderEnabled ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    No horário configurado, o aplicativo listará todas as tarefas pendentes de hoje.
                  </span>
                </div>

                {/* Permissions Status Check */}
                <div className="space-y-1.5 pt-1.5 border-t border-slate-850">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    Permissão de Notificação do Navegador
                  </label>
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        notificationPermissionStatus === 'granted' ? 'bg-emerald-500 animate-pulse' :
                        notificationPermissionStatus === 'denied' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <span className="text-[11px] font-bold text-slate-350">
                        {notificationPermissionStatus === 'granted' ? 'Notificações Permitidas' :
                         notificationPermissionStatus === 'denied' ? 'Bloqueado (Ativar nas Config do Navegador)' :
                         'Aguardando Autorização'}
                      </span>
                    </div>

                    {notificationPermissionStatus !== 'granted' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const granted = await requestNotificationPermission();
                          setNotificationPermissionStatus(Notification.permission);
                          if (granted) {
                            try {
                              new Notification('Lembrete Citrino Habilitado! 🎯', {
                                body: 'Muito bem! Suas notificações locais estão prontas para disparar offline.',
                              });
                            } catch (e) {
                              console.error(e);
                            }
                          }
                        }}
                        className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-[9px] rounded-lg tracking-wide uppercase hover:brightness-110 cursor-pointer border-0"
                      >
                        Permitir
                      </button>
                    )}
                  </div>
                </div>

                {/* Instant Test Alert Trigger */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window === 'undefined' || !('Notification' in window)) {
                        alert('Seu navegador não suporta notificações de desktop.');
                        return;
                      }

                      const todayTasks = tasks.filter(t => !t.completed && t.dueDate === todayStr);

                      if (Notification.permission !== 'granted') {
                        requestNotificationPermission().then(granted => {
                          setNotificationPermissionStatus(Notification.permission);
                          if (granted) {
                            // Fire instant test
                            const taskTitles = todayTasks.length > 0 
                              ? todayTasks.map(t => `• ${t.title}`).join('\n')
                              : 'Nenhuma tarefa programada para hoje.';
                            new Notification('📅 Teste de Lembrete Local (Sucesso) 🎯', {
                              body: `Disparado offline localmente!\nTarefas pendentes de hoje (${todayTasks.length}):\n${taskTitles}`,
                              tag: 'citrino-local-tasks-reminder'
                            });
                          }
                        });
                      } else {
                        // Permission is already granted, fire immediately
                        const taskTitles = todayTasks.length > 0 
                          ? todayTasks.map(t => `• ${t.title}`).join('\n')
                          : 'Nenhuma tarefa programada para hoje.';
                        new Notification('📅 Teste de Lembrete Local (Sucesso) 🎯', {
                          body: `Disparado offline localmente!\nTarefas pendentes de hoje (${todayTasks.length}):\n${taskTitles}`,
                          tag: 'citrino-local-tasks-reminder'
                        });
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-[10px] font-extrabold tracking-widest uppercase transition-all duration-200 cursor-pointer"
                  >
                    <Volume2 className="h-3.5 w-3.5 shrink-0" />
                    Testar Lembrete Agora 🔔
                  </button>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-4 mt-4 border-t border-slate-850 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsLocalTaskReminderModalOpen(false)}
                  className="px-4.5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-[10px] rounded-xl tracking-wider uppercase transition-colors hover:brightness-110 cursor-pointer border-0 shadow"
                >
                  Concluído ✨
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
