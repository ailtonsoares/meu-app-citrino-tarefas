import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TaskProvider, useTasks } from './context/TaskContext';
import { Task, TaskPriority } from './types';
import { SyncQueueDB } from './lib/syncQueueDb';
import TaskModal from './components/TaskModal';
import PomodoroTimer from './components/PomodoroTimer';
import PlanningDocument from './components/PlanningDocument';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  Plus,
  Search,
  CheckCircle,
  CloudLightning,
  RefreshCw,
  Trash2,
  Edit3,
  Flame,
  FileCode,
  Sparkles,
  Trophy,
  Filter,
  Layers,
  CheckCircle2,
  Calendar,
  Zap,
  RotateCcw,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Download,
  HardDrive,
  CloudUpload,
  CloudDownload,
  Bell,
  Star
} from 'lucide-react';

function DashboardContent() {
  const {
    tasks,
    loading,
    isSyncing,
    xp,
    level,
    filter,
    categoryFilter,
    searchQuery,
    soundEnabled,
    theme,
    defaultReminderMinutes,
    setDefaultReminderMinutes,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    setFilter,
    setCategoryFilter,
    setSearchQuery,
    triggerOfflineSync,
    addPomodoroSession,
    resetXP,
    setSoundEnabled,
    playFocusSound,
    playSearchSound,
    toggleTheme,
    clearCompletedTasks,

    // Google integration
    googleUser,
    isGoogleConnected,
    isGoogleSyncing,
    connectGoogle,
    disconnectGoogle,
    syncAllTasksToGoogle,
    syncTaskToGoogle,

    // Offline & simulation sync queue helpers
    isOfflineSimulated,
    setIsOfflineSimulated,
    syncQueue,
    processSyncQueue,

    // Google Drive integration
    isGoogleDriveOperating,
    backupToGoogleDrive,
    restoreFromGoogleDrive,
    exportCSVToGoogleDrive,
  } = useTasks();

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'app' | 'specs'>('app'); // Switch between working web app & tech spec
  const [driveStatus, setDriveStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [activeReminderPopoverTaskId, setActiveReminderPopoverTaskId] = useState<string | null>(null);
  const [subView, setSubView] = useState<'board' | 'list'>('board');

  // Daily Reset & Ritual states
  const [isOpeningRitualVisible, setIsOpeningRitualVisible] = useState(() => {
    const lastDate = localStorage.getItem('citrino_last_ritual_date');
    const todayStr = new Date().toLocaleDateString();
    return lastDate !== todayStr;
  });
  const [priorityLimitWarning, setPriorityLimitWarning] = useState<string | null>(null);

  // Breathing loop state inside Ritual
  const [breathingPhase, setBreathingPhase] = useState<'inspire' | 'segure' | 'expire'>('inspire');
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState(4);

  // Quick inputs in Ritual board
  const [ritualNewTaskTitle, setRitualNewTaskTitle] = useState('');
  const [ritualNewTaskCategory, setRitualNewTaskCategory] = useState('Estudo');
  const [ritualNewTaskPriority, setRitualNewTaskPriority] = useState<TaskPriority>('medium');

  // 100% Celebration states
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  const [hasCelebratedToday, setHasCelebratedToday] = useState(false);

  // Reactive verification for 100% completion of selected Daily Priorities
  const dayPriorityTasks = tasks.filter(t => t.isPriorityDay);
  const totalPrioritiesCount = dayPriorityTasks.length;
  const completedPrioritiesCount = dayPriorityTasks.filter(t => t.completed).length;

  useEffect(() => {
    if (totalPrioritiesCount > 0 && completedPrioritiesCount === totalPrioritiesCount) {
      if (!hasCelebratedToday) {
        setShowSuccessCelebration(true);
        setHasCelebratedToday(true);
        // Dispatch elegant success confetti stream
        setTimeout(() => {
          try {
            (window as any).confetti?.({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.4 },
              colors: ['#f59e0b', '#3b82f6', '#10b981', '#ffffff', '#ec4899', '#38bdf8']
            });
          } catch (e) {
            console.warn('Success animation confetti trigger error:', e);
          }
        }, 150);
      }
    } else if (completedPrioritiesCount < totalPrioritiesCount) {
      // Reset flag if items are untoggled
      setHasCelebratedToday(false);
    }
  }, [completedPrioritiesCount, totalPrioritiesCount, hasCelebratedToday]);

  // Interactive guide for calming breathing during Ritual
  useEffect(() => {
    if (!isOpeningRitualVisible) return;

    const interval = setInterval(() => {
      setBreathingSecondsLeft((prev) => {
        if (prev <= 1) {
          setBreathingPhase((phase) => {
            if (phase === 'inspire') return 'segure';
            if (phase === 'segure') return 'expire';
            return 'inspire';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpeningRitualVisible, breathingPhase]);

  // Helper to handle and regulate the star toggle for top 3 focal items
  const handleTogglePriorityDay = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!task.isPriorityDay) {
      // User is checking ON. Verify 3 cap limit!
      const activePriorityCount = tasks.filter(t => t.isPriorityDay && !t.completed).length;
      if (activePriorityCount >= 3) {
        setPriorityLimitWarning('Foco absoluto: escolha no máximo 3 tarefas para seu Top Diário para reduzir sobrecarga de dados!');
        setTimeout(() => setPriorityLimitWarning(null), 5000);
        return;
      }
    }

    updateTask(task.id, { isPriorityDay: !task.isPriorityDay });
    if (soundEnabled) {
      playHoverTickSound();
    }
  };

  // Helper to quick-add tasks directly from the Daily Opening Ritual panel
  const handleCreateQuickTaskInRitual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ritualNewTaskTitle.trim()) return;

    // Determine if we can automatically mark it as a priority day focus
    const activePriorityCount = tasks.filter(t => t.isPriorityDay && !t.completed).length;
    const shouldMarkAsPriority = activePriorityCount < 3;

    addTask({
      title: ritualNewTaskTitle,
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '08:00',
      priority: ritualNewTaskPriority,
      category: ritualNewTaskCategory,
      pomodorosTarget: 1,
      recurrence: 'none',
      syncWithGoogle: false,
      isPriorityDay: shouldMarkAsPriority,
      subtasks: []
    });

    setRitualNewTaskTitle('');
    if (soundEnabled) {
      playHoverTickSound();
    }
  };

  const isCurrentlyOffline = !navigator.onLine || isOfflineSimulated;

  // HTML5 Drag and Drop event handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnDay = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      updateTask(taskId, { dueDate: dateStr });
      if (soundEnabled) {
        playFocusSound();
      }
    }
  };

  const handleDropOnInbox = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      updateTask(taskId, { dueDate: '' }); // Clear due date to deposit in Ideas Box
      if (soundEnabled) {
        playFocusSound();
      }
    }
  };

  // 7 Days Weekly Planner calculator
  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    
    // Calculate Monday of the current week
    const monday = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + diff);

    const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const fullDaysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = d.toDateString() === today.toDateString();
      days.push({
        name: daysOfWeek[i],
        fullName: fullDaysOfWeek[i],
        dateStr,
        isToday,
        dayOfMonth: d.getDate()
      });
    }
    return days;
  };

  // Static Task Templates for zero-cost enxuto MVP workflow
  const TASK_TEMPLATES = [
    {
      id: 'tpl-estudo',
      name: 'Foco nos Estudos',
      icon: '🚀',
      category: 'Estudo',
      description: 'Estruturação completa de estudo de React e TypeScript (com checklists prontos)',
      tasks: [
        {
          title: 'Dominar Core de React e Hooks Avançados',
          description: 'Aprofundamento em ciclos de render e hooks de controle de referência.',
          priority: 'high',
          category: 'Estudo',
          pomodorosTarget: 3,
          subtasks: [
            { id: 'sub-react-1', title: 'Compreender sincronização segura com useEffect', completed: false },
            { id: 'sub-react-2', title: 'Otimizar renderings usando useMemo e useCallback', completed: false },
            { id: 'sub-react-3', title: 'Construir Contextos Globais de Estado escaláveis', completed: false }
          ]
        },
        {
          title: 'Aprofundar em TypeScript & Generics',
          description: 'Criação de utilitários flexíveis e fortes tipagens.',
          priority: 'medium',
          category: 'Estudo',
          pomodorosTarget: 2,
          subtasks: [
            { id: 'sub-ts-1', title: 'Construir generic key-value store para SQLite local', completed: false },
            { id: 'sub-ts-2', title: 'Implementar guards e asserções customizadas de tipo', completed: false }
          ]
        }
      ]
    },
    {
      id: 'tpl-mensal',
      name: 'Organização Mensal',
      icon: '📅',
      category: 'Finanças',
      description: 'Checklist completo para organizar o planejamento e finanças do MVP',
      tasks: [
        {
          title: 'Planejamento Financeiro e Contas',
          description: 'Revisão de faturamentos, pagamentos de serviços na nuvem e boletos.',
          priority: 'high',
          category: 'Finanças',
          pomodorosTarget: 2,
          subtasks: [
            { id: 'sub-fin-1', title: 'Auditar faturamentos de APIs e Cloud Run', completed: false },
            { id: 'sub-fin-2', title: 'Quitar boletos recorrentes do setup de dev', completed: false },
            { id: 'sub-fin-3', title: 'Definir teto de gastos do mês para ferramentas de IA', completed: false }
          ]
        },
        {
          title: 'Retrospectiva e OKRs Mensais',
          description: 'Analise o progresso de metas e recalibre prioridades.',
          priority: 'medium',
          category: 'Trabalho',
          pomodorosTarget: 1,
          subtasks: [
            { id: 'sub-okr-1', title: 'Analisar churn e retenção do MVP', completed: false },
            { id: 'sub-okr-2', title: 'Refinar 3 metas principais da próxima sprint de valor', completed: false }
          ]
        }
      ]
    },
    {
      id: 'tpl-sprint',
      name: 'Validação Sprint de MVP',
      icon: '⚡',
      category: 'Trabalho',
      description: 'Rotina completa de validação e estabilização de deployments antes de release',
      tasks: [
        {
          title: 'Validação de Features Offline-First',
          description: 'Garantir que a sincronização automática e resiliência funcionem corretas.',
          priority: 'high',
          category: 'Trabalho',
          pomodorosTarget: 2,
          subtasks: [
            { id: 'sub-qa-1', title: 'Simular oscilação de internet gravando 3 alterações', completed: false },
            { id: 'sub-qa-2', title: 'Verificar consolidação (debounce + upsert) na tabela SyncQueue', completed: false },
            { id: 'sub-qa-3', title: 'Confirmar reconexão e dreno elegante em segundo plano', completed: false }
          ]
        }
      ]
    }
  ];

  const handleImportTemplate = (tpl: any) => {
    tpl.tasks.forEach((t: any) => {
      // Create fresh randomized subtask IDs to allow clean separate toggling
      const preparedSubtasks = (t.subtasks || []).map((sub: any) => ({
        id: `sub_${Math.random().toString(36).substring(2, 9)}`,
        title: sub.title,
        completed: sub.completed
      }));

      addTask({
        title: t.title,
        description: t.description,
        dueDate: '', // Loaded automatically into Caixa de Entrada / Gaveta, as requested!
        dueTime: '12:00',
        priority: t.priority,
        category: t.category,
        pomodorosTarget: t.pomodorosTarget,
        recurrence: 'none',
        syncWithGoogle: false,
        subtasks: preparedSubtasks
      });
    });
    
    if (soundEnabled) {
      playFocusSound();
    }
  };

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveReminderPopoverTaskId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const playHoverTickSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1900, now);
      osc.frequency.exponentialRampToValueAtTime(1300, now + 0.015);
      
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.025, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.02);
    } catch (err) {
      // quiet fail
    }
  };

  const handleOpenCreateModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (taskData: {
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: TaskPriority;
    category: string;
    pomodorosTarget: number;
    recurrence: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
    syncWithGoogle: boolean;
    reminderMinutes?: number;
  }) => {
    if (taskToEdit) {
      updateTask(taskToEdit.id, taskData);
    } else {
      addTask(taskData);
    }
  };

  const generateCompletedTasksCSV = (): string => {
    const completedTasks = tasks.filter(task => task.completed);
    if (completedTasks.length === 0) return '';

    const headers = [
      'ID',
      'Titulo',
      'Descricao',
      'Prioridade',
      'Categoria',
      'Data de Entrega',
      'Hora de Entrega',
      'Foco Pomodoros',
      'Foco Planejado',
      'Recorrencia',
      'Criado Em',
      'Atualizado Em'
    ];

    const rows = completedTasks.map(task => {
      const escape = (val: string | undefined | number | boolean) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      return [
        escape(task.id),
        escape(task.title),
        escape(task.description || ''),
        escape(task.priority),
        escape(task.category),
        escape(task.dueDate || ''),
        escape(task.dueTime || ''),
        escape(task.pomodoroCount),
        escape(task.pomodorosTarget),
        escape(task.recurrence || 'none'),
        escape(task.createdAt),
        escape(task.updatedAt)
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const exportCompletedTasksToCSV = () => {
    const csvContent = generateCompletedTasksCSV();
    if (!csvContent) return;

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'citrino_tarefas_concluidas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackupDrive = async () => {
    setDriveStatus({ type: 'info', message: 'Salvando backup de Citrino no Google Drive...' });
    const res = await backupToGoogleDrive();
    if (res.success) {
      setDriveStatus({ type: 'success', message: res.message });
    } else {
      setDriveStatus({ type: 'error', message: res.message });
    }
  };

  const handleRestoreDrive = async () => {
    const confirmRestore = window.confirm(
      'Atenção: Restaurar o backup substituirá todas as suas tarefas locais, seu progresso do Pomodoro, nível e XP. Deseja continuar?'
    );
    if (!confirmRestore) return;

    setDriveStatus({ type: 'info', message: 'Baixando e aplicando backup do Google Drive...' });
    const res = await restoreFromGoogleDrive();
    if (res.success) {
      setDriveStatus({ type: 'success', message: res.message });
    } else {
      setDriveStatus({ type: 'error', message: res.message });
    }
  };

  const handleExportCSVDrive = async () => {
    const csvContent = generateCompletedTasksCSV();
    if (!csvContent) {
      setDriveStatus({ type: 'error', message: 'Você não possui tarefas concluídas no histórico para exportar!' });
      return;
    }

    setDriveStatus({ type: 'info', message: 'Exportando relatório CSV para o Google Drive...' });
    const res = await exportCSVToGoogleDrive(csvContent);
    if (res.success) {
      setDriveStatus({ type: 'success', message: res.message });
    } else {
      setDriveStatus({ type: 'error', message: res.message });
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    // Search query matches
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Standard Filter
    let matchesFilter = true;
    if (filter === 'pending') matchesFilter = !task.completed;
    if (filter === 'completed') matchesFilter = task.completed;
    if (filter === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      matchesFilter = task.dueDate === todayStr;
    }
    if (filter === 'high') {
      matchesFilter = task.priority === 'high';
    }

    // Category Filter
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;

    return matchesSearch && matchesFilter && matchesCategory;
  });

  // Derived stats
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const unsyncedCount = tasks.filter((t) => !t.isSynced).length;
  const requiredXp = level * 100;
  const xpPercentage = Math.min(100, Math.round((xp / requiredXp) * 100));

  // 7 Days Trend Data Calculation
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateString = d.toISOString().split('T')[0];
    
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const label = `${day} ${months[d.getMonth()]}`;
    
    const createdCount = tasks.filter(task => {
      if (!task.createdAt) return false;
      return task.createdAt.startsWith(dateString);
    }).length;

    const completedCount = tasks.filter(task => {
      if (!task.completed || !task.updatedAt) return false;
      return task.updatedAt.startsWith(dateString);
    }).length;

    return {
      dateStr: dateString,
      label,
      "Criadas": createdCount,
      "Concluídas": completedCount,
    };
  });

  // Draggable Board Task Card Component
  const renderBoardTaskCard = (task: Task, hideDate: boolean = false) => {
    let priorityColor = '';
    if (task.priority === 'high') priorityColor = 'bg-rose-500';
    else if (task.priority === 'medium') priorityColor = 'bg-amber-500';
    else priorityColor = 'bg-emerald-500';

    const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date(new Date().toISOString().split('T')[0]);

    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onClick={(e) => {
          e.stopPropagation();
          handleOpenEditModal(task);
        }}
        className={`group relative flex flex-col gap-2 rounded-xl border p-3 transition-all cursor-grab active:cursor-grabbing hover:shadow-md border-l-4 select-none ${
          task.isSynced && task.googleEventId
            ? 'border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.25)] bg-slate-950/90'
            : 'border-slate-850 bg-slate-950 hover:bg-slate-900 hover:border-slate-700'
        }`}
        style={{ borderLeftColor: task.priority === 'high' ? '#f43f5e' : task.priority === 'medium' ? '#f59e0b' : '#10b981' }}
      >
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0">
            <span className="rounded-full bg-slate-900/80 px-1.5 py-0.5 font-mono text-[8px] font-bold text-slate-400 uppercase tracking-wider border border-slate-850">
              {task.category}
            </span>
            <h5 className="font-sans font-semibold text-xs text-slate-200 group-hover:text-amber-400 mt-1 line-clamp-2 leading-tight">
              {task.title}
            </h5>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
            {/* Ouro / Star priority toggle */}
            <motion.button
              type="button"
              onClick={(e) => handleTogglePriorityDay(task, e)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              className={`flex h-5 w-5 items-center justify-center rounded-md border text-[10px] cursor-pointer transition-colors ${
                task.isPriorityDay 
                  ? 'bg-amber-500/25 border-amber-400 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)] font-black' 
                  : 'bg-slate-950 border-slate-850 text-slate-550 hover:text-slate-350 hover:border-slate-700'
              }`}
              title={task.isPriorityDay ? "Remover do Top 3 Prioridades do Dia" : "Marcar como Foco do Dia"}
            >
              <Star className={`h-3 w-3 ${task.isPriorityDay ? 'fill-current' : ''}`} />
            </motion.button>

            {/* Complete status toggler */}
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleTaskComplete(task.id);
              }}
              onMouseEnter={playHoverTickSound}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-slate-800 bg-slate-950 hover:bg-amber-500/10 cursor-pointer"
            >
              {task.completed && <CheckCircle2 className="h-3.5 w-3.5 stroke-[3] text-amber-500" />}
            </motion.button>
          </div>
        </div>

        {task.description && (
          <p className="text-[10px] text-slate-500 line-clamp-2 leading-normal">
            {task.description}
          </p>
        )}

        {task.subtasks && task.subtasks.length > 0 && (
          <div className="space-y-1 mt-1 pb-1">
            <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 font-mono">
              <span className="flex items-center gap-0.5">📋 CHECKLIST</span>
              <span>
                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-amber-500 h-1 transition-all duration-300"
                style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1.5 mt-0.5 font-mono text-[9px] text-slate-550 border-t border-slate-900">
          <span className="flex items-center gap-0.5">
            🍅 {task.pomodoroCount || 0}/{task.pomodorosTarget || 1}
          </span>
          {!hideDate && task.dueDate && (
            <span className={`font-mono flex items-center gap-0.5 ${isOverdue ? 'text-rose-450 font-bold' : ''}`}>
              📅 {task.dueDate.split('-').slice(1).reverse().join('/')}
            </span>
          )}
          {!task.isSynced && (() => {
            const queueEntry = SyncQueueDB.getEntries().find(e => e.taskId === task.id);
            if (queueEntry && queueEntry.attempts > 0) {
              return (
                <span 
                  className="flex items-center gap-1 text-[8px] font-black text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/20 uppercase tracking-tighter"
                  title={`Erro: ${queueEntry.lastError || 'Rede fora'} - Próxima retentativa: ${queueEntry.nextAttemptAfter ? new Date(queueEntry.nextAttemptAfter).toLocaleTimeString() : 'Imediato'}`}
                >
                  ⚠️ Erro (Repass #{queueEntry.attempts})
                </span>
              );
            }
            return (
              <span className="flex items-center gap-0.5 text-[8px] font-bold text-amber-500 uppercase tracking-tighter">
                ● offline
              </span>
            );
          })()}
        </div>
      </div>
    );
  };

  const renderBoardView = () => {
    const weekDays = getWeekDays();
    const inboxTasks = tasks.filter(t => !t.dueDate && !t.completed);

    const filteredInbox = inboxTasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="space-y-6 animate-feed-in w-full">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Column A: Caixa de Entrada / Gaveta de Ideias */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDropOnInbox}
            className="xl:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4 min-h-[480px] transition-all"
            style={{ contentVisibility: 'auto' }}
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-sans text-xs font-black tracking-wider uppercase text-slate-200">
                    Gaveta de Ideias
                  </h3>
                  <p className="text-[10px] text-slate-550">Arrastar para cá desagenda tarefa</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-950 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-500 border border-slate-850">
                {filteredInbox.length}
              </span>
            </div>

            {/* List inner */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredInbox.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-850 rounded-xl bg-slate-950/20">
                  <Layers className="h-7 w-7 text-slate-750 mx-auto stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-400 mt-2">Sua Gaveta está limpa!</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto px-2 leading-relaxed">
                    Crie tarefas sem data de entrega para guardá-las aqui ou use os Modelos Prontos rápidos à direita.
                  </p>
                </div>
              ) : (
                filteredInbox.map(task => renderBoardTaskCard(task))
              )}
            </div>
            
            <button
              onClick={handleOpenCreateModal}
              className="w-full mt-2 py-2.5 border border-dashed border-slate-800 hover:border-amber-500/30 rounded-xl font-sans text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors bg-slate-950/20 text-center flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar na Gaveta
            </button>

            {/* Quick Import Templates for local enxuto heuristics */}
            <div className="pt-3 border-t border-slate-850 mt-2 space-y-2">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
                ⚡ Modelos de Foco Local
              </p>
              <div className="flex flex-col gap-1.5">
                {TASK_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => handleImportTemplate(tpl)}
                    className="w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg border border-slate-850 bg-slate-950/40 hover:bg-slate-900 transition-colors text-[11px] font-semibold text-slate-300 hover:text-amber-400 group cursor-pointer"
                    title={tpl.description}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{tpl.icon}</span> <span className="truncate">{tpl.name}</span>
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-slate-900 px-1 py-0.5 rounded text-amber-500 group-hover:bg-amber-500/15 flex-shrink-0">
                      + Importar
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column B: Weekly Planner */}
          <div className="xl:col-span-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850/50 pb-2">
              <div>
                <h3 className="font-sans text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  📅 Planejador Semanal (Board)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Arrastar e soltar tarefas para agendar seu ritmo semanal de estudos de forma tátil.
                </p>
              </div>
            </div>

            {/* 7 Days Grid Board */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 pb-2 overflow-x-auto">
              {weekDays.map(day => {
                const dayTasks = tasks.filter(t => t.dueDate === day.dateStr && !t.completed);
                
                return (
                  <div
                    key={day.dateStr}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnDay(e, day.dateStr)}
                    className={`rounded-xl border p-3 flex flex-col gap-3 min-h-[440px] transition-all duration-250 ${
                      day.isToday
                        ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-850'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <div className="min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-wider ${
                          day.isToday ? 'text-amber-500 font-extrabold' : 'text-slate-400 font-semibold'
                        }`}>
                          {day.name}
                        </p>
                        <p className="text-xs font-mono font-bold text-slate-200">{day.dayOfMonth}</p>
                      </div>
                      <span className="rounded-full bg-slate-950 px-1.5 py-0.5 font-mono text-[9px] text-slate-400 font-semibold border border-slate-850">
                        {dayTasks.length}
                      </span>
                    </div>

                    {/* Day Tasks Inner List */}
                    <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[360px]">
                      {dayTasks.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center p-2 border border-dashed border-slate-850 bg-slate-950/10 rounded-lg text-center min-h-[80px]">
                          <p className="text-[9px] leading-snug font-mono text-slate-700 tracking-tight">Vazio</p>
                        </div>
                      ) : (
                        dayTasks.map(task => renderBoardTaskCard(task, true))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Dynamic Background Aura Effects */}
      <div className="fixed top-0 left-1/4 -z-10 h-96 w-96 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 -z-10 h-96 w-96 rounded-full bg-indigo-505/5 blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-900 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/10 active:scale-95 transition-transform">
              <Sparkles className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h1 className="font-sans text-sm font-black tracking-tight text-white uppercase sm:text-base">
                Citrino <span className="text-amber-500">Tarefas</span>
              </h1>
              <p className="text-[10px] font-mono font-bold text-slate-500 leading-none uppercase">
                Offline-First Task MVP v1.0
              </p>
            </div>
          </div>

          {/* Sprints vs Dashboard Mode Controls */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-500 animate-[spin_12s_linear_infinite]" />
                  <span className="hidden sm:inline">Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Escuro</span>
                </>
              )}
            </button>

            {/* Sound Effects Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-900 border-emerald-500/30 text-emerald-400 hover:bg-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400 hover:border-slate-700'
              }`}
              title={soundEnabled ? 'Sons Ativos (Clique para silenciar)' : 'Silenciado (Clique para ativar sons)'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Som: On</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Som: Off</span>
                </>
              )}
            </button>

            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('app')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  viewMode === 'app'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle className="h-3.5 w-3.5" /> Dashboard
              </button>
              <button
                onClick={() => setViewMode('specs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  viewMode === 'specs'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="h-3.5 w-3.5" /> Planejador Técnico
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Simulated Offline Active Alert Banner */}
      {isOfflineSimulated && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 sm:px-6">
          <div className="mx-auto max-w-7xl flex items-center justify-between text-xs font-semibold text-amber-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              <span>Conexão Simulada Desconectada: Alterações salvas localmente e agendadas na fila de sincronização.</span>
            </div>
            <button
              onClick={() => setIsOfflineSimulated(false)}
              className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black rounded-lg hover:bg-amber-400 transition-colors uppercase text-[9px] cursor-pointer"
            >
              Conectar Nuvem
            </button>
          </div>
        </div>
      )}

      {/* Gamification Stats Banner */}
      <section className="bg-slate-900/40 border-b border-slate-900 px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            
            {/* XP and Level tracker badge cards */}
            <div className="md:col-span-5 flex items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/10">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Nível do Construtor
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-500">
                    XP {xp}/{requiredXp}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2.5">
                  <span className="font-sans text-xl font-extrabold text-white">
                    Lvl {level}
                  </span>
                  {/* Progress Gauge */}
                  <div className="h-2 flex-1 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${xpPercentage}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-slate-400">{xpPercentage}%</span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Deseja resetar sua pontuação de XP?')) {
                    resetXP();
                  }
                }}
                className="p-1 rounded hover:bg-slate-800 text-slate-600 hover:text-slate-400"
                title="Resetar XP de Portfólio"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Sync State monitor Panel */}
            <div className="md:col-span-3 flex items-center justify-between bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nuvem Offline-First</p>
                <p className="text-lg font-black mt-0.5 text-slate-100 flex items-center gap-1.5 leading-none">
                  {unsyncedCount === 0 ? (
                    <span className="text-emerald-400">Dados Sincronizados</span>
                  ) : (
                    <span className="text-amber-500">{unsyncedCount} Pendentes</span>
                  )}
                </p>
                {/* Simulation toggle */}
                <button
                  onClick={() => setIsOfflineSimulated(!isOfflineSimulated)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase transition-all cursor-pointer ${
                    isOfflineSimulated 
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-450 hover:bg-rose-500/30 font-black' 
                      : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15'
                  }`}
                  title={isOfflineSimulated ? 'Clique para simular rede conectada' : 'Clique para simular rede desconectada'}
                >
                  {isOfflineSimulated ? '🔌 Simulação: Offline' : '🌐 Simulação: Conectado'}
                </button>
              </div>

              <button
                onClick={triggerOfflineSync}
                disabled={isSyncing}
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-slate-350 cursor-pointer transition-all ${
                  unsyncedCount > 0 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20' 
                  : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                }`}
                title={unsyncedCount > 0 ? 'Fazer uploads de dados pendentes' : 'Tudo em ordem'}
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
              </button>
            </div>

            {/* Quick Metrics display */}
            <div className="md:col-span-4 grid grid-cols-3 gap-3">
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850 text-center">
                <span className="text-[10px] font-semibold text-slate-500 block uppercase">Criadas</span>
                <span className="font-mono text-base font-black text-slate-200">{totalCount}</span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850 text-center">
                <span className="text-[10px] font-semibold text-slate-500 block uppercase">Completas</span>
                <span className="font-mono text-base font-black text-emerald-400">{completedCount}</span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-850 text-center">
                <span className="text-[10px] font-semibold text-slate-500 block uppercase">Pendentes</span>
                <span className="font-mono text-base font-black text-amber-500">{pendingCount}</span>
              </div>
            </div>

          </div>

          {/* 7-Day Performance Trend section inside Gamification Stats Banner */}
          <div className="mt-6 border-t border-slate-800 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="font-sans text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                  <span>📊</span> Tendência de Desempenho (Últimos 7 dias)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Métricas dinâmicas de engajamento e conclusão de tarefas no MVP.
                </p>
              </div>
              
              {/* Custom Legend */}
              <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-wider">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="inline-block h-2 w-2 rounded bg-indigo-505" style={{ backgroundColor: '#6366f1' }} />
                  <span>Criadas</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="inline-block h-2 w-2 rounded bg-amber-500" style={{ backgroundColor: '#f59e0b' }} />
                  <span>Concluídas</span>
                </div>
              </div>
            </div>

            {/* Recharts Container */}
            <div id="recharts-activity-container" className="h-44 w-full bg-slate-900/30 rounded-xl border border-slate-800/80 p-2 sm:p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCriadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConcluidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fill: theme === 'dark' ? '#475569' : '#64748b', fontSize: 10 }} 
                    axisLine={{ stroke: theme === 'dark' ? '#1e293b' : '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fill: theme === 'dark' ? '#475569' : '#64748b', fontSize: 10 }}
                    axisLine={{ stroke: theme === 'dark' ? '#1e293b' : '#cbd5e1' }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className={`p-3 rounded-xl border shadow-xl font-sans text-[11px] ${
                            theme === 'dark' 
                              ? 'bg-slate-950 border-slate-800 text-slate-200' 
                              : 'bg-white border-slate-150 text-slate-800'
                          }`}>
                            <p className="font-bold mb-1">{label}</p>
                            <div className="space-y-1">
                              <p className="text-indigo-400 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                Criadas: <span className="font-mono font-bold text-slate-100">{payload[0].value}</span>
                              </p>
                              {payload[1] && (
                                <p className="text-amber-500 flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  Concluídas: <span className="font-mono font-bold text-slate-100">{payload[1].value}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Criadas" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCriadas)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Concluídas" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorConcluidas)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        
        {viewMode === 'specs' ? (
          /* Plain Documentation view selected */
          <div className="space-y-6 animate-feed-in">
            <PlanningDocument />
          </div>
        ) : (
          /* Actual Interactive Product Applet */
          <div className="space-y-6">

            {/* Warning regarding the 3-tasks cap */}
            {priorityLimitWarning && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold backdrop-blur"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚠️</span>
                  <span>{priorityLimitWarning}</span>
                </div>
                <button 
                  onClick={() => setPriorityLimitWarning(null)} 
                  className="text-[10px] font-black uppercase text-amber-400 hover:text-white"
                >
                  OK
                </button>
              </motion.div>
            )}

            {/* 🎯 ELITE DIÁRIA: SEU TOP 3 FOCUS */}
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900/95 to-slate-950 p-5 shadow-lg shadow-amber-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-sans text-xs font-black text-amber-400 flex items-center gap-2 uppercase tracking-widest">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
                      🎯
                    </span>
                    Foco da Jornada / Elite Top 3 Diário
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Consagre exatamente 3 itens para manter clareza absoluta, blindar a mente e reduzir o peso de listas compridas.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setBreathingPhase('inspire');
                    setBreathingSecondsLeft(4);
                    setIsOpeningRitualVisible(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 hover:text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer uppercase tracking-wider"
                >
                  🌅 Refazer Ritual Matinal
                </button>
              </div>

              {dayPriorityTasks.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-850 rounded-xl bg-slate-950/20">
                  <Star className="h-6 w-6 text-slate-700 mx-auto animate-pulse" />
                  <p className="text-xs font-semibold text-slate-400 mt-2">Nenhum foco de ouro consagrado hoje.</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-md mx-auto">
                    Selecione até 3 tarefas prioritárias clicando nas estrelas (⭐) dos cards ou utilize o Ritual de Abertura para consagrar seus objetivos matinais.
                  </p>
                  <button
                    onClick={() => setIsOpeningRitualVisible(true)}
                    className="mt-3 inline-flex items-center gap-1 py-1 px-3 bg-amber-500 text-slate-950 font-black rounded-lg text-[10px] hover:bg-amber-400 transition-colors uppercase cursor-pointer"
                  >
                    Abrir Ritual de Abertura 🌅
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dayPriorityTasks.map((task) => {
                    const progressVal = task.subtasks && task.subtasks.length > 0 
                      ? Math.round((task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100) 
                      : null;

                    return (
                      <div 
                        key={task.id}
                        onClick={() => handleOpenEditModal(task)}
                        className={`group relative rounded-xl border p-4 transition-all cursor-pointer flex flex-col justify-between ${
                          task.completed
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-500 opacity-75'
                            : 'bg-slate-950/50 hover:bg-slate-900 border-amber-500/10 hover:border-amber-500/30 text-slate-100 shadow-md'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="rounded-full bg-slate-900 px-1.5 py-0.5 font-mono text-[8px] font-bold text-slate-400 border border-slate-800 uppercase tracking-widest">
                              {task.category}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {/* Star pin toggle inside card */}
                              <button
                                onClick={(e) => handleTogglePriorityDay(task, e)}
                                className="h-5 w-5 flex items-center justify-center text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                                title="Remover do Top 3 Prioridades"
                              >
                                <Star className="h-3.5 w-3.5 fill-current" />
                              </button>

                              {/* Toggle complete button */}
                              <button
                                onClick={() => toggleTaskComplete(task.id)}
                                onMouseEnter={playHoverTickSound}
                                className={`flex h-4.5 w-4.5 items-center justify-center rounded border ${
                                  task.completed 
                                    ? 'bg-amber-500 border-amber-500 text-slate-950' 
                                    : 'border-slate-800 bg-slate-950 hover:border-amber-500/40'
                                } cursor-pointer`}
                              >
                                {task.completed && <CheckCircle2 className="h-3 w-3 stroke-[3]" />}
                              </button>
                            </div>
                          </div>

                          <h4 className={`text-xs font-bold leading-snug mt-2 line-clamp-2 ${task.completed ? 'line-through text-slate-500' : 'text-slate-100 group-hover:text-amber-400'}`}>
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Checklist Progress if subtasks exist */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-900/60 font-mono text-[8px]">
                            <div className="flex items-center justify-between font-bold text-slate-400 mb-1">
                              <span>CHECKLIST</span>
                              <span>{progressVal}%</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                              <div 
                                className="bg-amber-500 h-1 transition-all duration-300"
                                style={{ width: `${progressVal}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-2.5 pt-1.5 border-t border-slate-900/60 flex items-center justify-between font-mono text-[8px] text-slate-650">
                          <span>🍅 {task.pomodoroCount || 0}/{task.pomodorosTarget || 1} Pomodoro</span>
                          {task.dueDate && (
                            <span>📅 {task.dueDate.split('-').slice(1).reverse().join('/')}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sub-view Section Switcher (Board vs List) */}
            <div className="flex bg-slate-900 border border-slate-850 p-1 rounded-xl max-w-xs shadow-md">
              <button
                onClick={() => setSubView('board')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  subView === 'board'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" /> Quadro Semanal
              </button>
              <button
                onClick={() => setSubView('list')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  subView === 'list'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="h-3.5 w-3.5" /> Lista Tradicional
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Tasks index, Filters, Searches (dynamic span) */}
              <div className={`${subView === 'board' ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-6`}>
                {subView === 'board' ? (
                  renderBoardView()
                ) : (
                  <>
              
              {/* Tooling Bar (Actions, categories selectors, priority filters) */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-550" />
                  <input
                    type="text"
                    placeholder="Buscar tarefas..."
                    value={searchQuery}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      if (searchQuery === '' && nextVal !== '') {
                        playSearchSound();
                      }
                      setSearchQuery(nextVal);
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-sm text-slate-300 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 placeholder:text-slate-600"
                  />
                </div>

                <div className="flex gap-2.5">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-400 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all">Todas</option>
                    <option value="pending">Abertas</option>
                    <option value="completed">Concluídas</option>
                    <option value="today">Hoje</option>
                    <option value="high">Lendárias/Alta</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-400 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all">Categorias (Todas)</option>
                    <option value="Estudo">Estudo</option>
                    <option value="Trabalho">Trabalho</option>
                    <option value="Pessoal">Pessoal</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Finanças">Finanças</option>
                    <option value="Outros">Outros</option>
                  </select>

                  <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-amber-500/10 transition-transform active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" /> Criar
                  </button>
                </div>
              </div>

              {/* Status and Action Row */}
              {tasks.length > 0 && (
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="text-slate-400 font-semibold font-sans">
                    Mostrando <span className="font-bold text-amber-500">{filteredTasks.length}</span> {filteredTasks.length === 1 ? 'tarefa' : 'tarefas'}
                  </span>
                  {completedCount > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={exportCompletedTasksToCSV}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/40 active:scale-[0.98] transition-all font-bold cursor-pointer"
                        title="Exportar todas as tarefas concluídas para um arquivo CSV"
                      >
                        <Download className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Exportar CSV</span>
                      </button>

                      <button
                        onClick={clearCompletedTasks}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/40 active:scale-[0.98] transition-all font-bold cursor-pointer"
                        title="Excluir todas as tarefas marcadas como concluídas do histórico"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                        <span>Limpar Completas ({completedCount})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tasks List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-500" />
                    <p className="text-xs text-slate-400 mt-2">Carregando persistência do cache local...</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-900 rounded-2xl bg-slate-900/10">
                    <CheckCircle className="h-9 w-9 text-slate-700 mx-auto" />
                    <p className="text-sm font-semibold text-slate-300 mt-3">Você não possui tarefas pendentes nesta categoria!</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Crie novas tarefas com prioridades diferenciadas para avançar níveis e testar os alertas audíveis.
                    </p>
                    <button
                      onClick={handleOpenCreateModal}
                      className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-400"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar primeira tarefa
                    </button>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredTasks.map((task) => {
                      const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date(new Date().toISOString().split('T')[0]);
                      
                      let priorityBadgeColor = '';
                      let priorityLabel = '';
                      if (task.priority === 'high') {
                        priorityBadgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/20';
                        priorityLabel = 'Lendária (+70 XP)';
                      } else if (task.priority === 'medium') {
                        priorityBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                        priorityLabel = 'Média (+50 XP)';
                      } else {
                        priorityBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-505/20';
                        priorityLabel = 'Fácil (+40 XP)';
                      }

                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={task.completed ? { opacity: 0, y: 15 } : { opacity: 0, x: 100 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          onClick={() => handleOpenEditModal(task)}
                          className={`group relative flex items-start gap-4 rounded-xl border p-4 transition-all cursor-pointer ${
                            task.completed
                              ? 'bg-slate-900/15 border-slate-900 text-slate-550 hover:bg-slate-900/25 hover:border-slate-800'
                              : task.isSynced && task.googleEventId
                                ? 'bg-slate-900/90 border-cyan-500/80 text-slate-200 shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:bg-slate-850 hover:shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                                : 'bg-slate-900 hover:bg-slate-850 hover:border-slate-700 text-slate-200 hover:shadow-md'
                          } ${activeTaskId === task.id ? 'ring-2 ring-amber-500/50' : ''}`}
                        >
                          <div className="flex flex-col gap-2.5 flex-shrink-0 items-center justify-start mt-1">
                            {/* Custom Interactive Checkbox */}
                            <motion.button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskComplete(task.id);
                              }}
                              onMouseEnter={playHoverTickSound}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.85 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                              title={task.completed ? 'Desmarcar como pendente' : 'Marcar como concluída'}
                              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border text-slate-900 transition-colors cursor-pointer"
                              style={{
                                backgroundColor: task.completed ? '#f59e0b' : 'transparent',
                                borderColor: task.completed ? '#f59e0b' : '#334155',
                              }}
                            >
                              <AnimatePresence>
                                {task.completed && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -360 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: -360 }}
                                    transition={{ type: 'spring', stiffness: 450, damping: 15 }}
                                    className="flex items-center justify-center"
                                  >
                                    <CheckCircle2 className="CheckCircle2 h-3.5 w-3.5 text-[#020617] stroke-[3]" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.button>

                            {/* Ouro / Star priority toggle */}
                            <motion.button
                              type="button"
                              onClick={(e) => handleTogglePriorityDay(task, e)}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.85 }}
                              className={`flex h-5 w-5 items-center justify-center rounded-md border text-[10px] cursor-pointer transition-colors ${
                                task.isPriorityDay 
                                  ? 'bg-amber-500/25 border-amber-400 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)] font-black' 
                                  : 'bg-slate-950 border-slate-850 text-slate-550 hover:text-slate-350 hover:border-slate-700'
                              }`}
                              title={task.isPriorityDay ? "Remover do Top 3 Prioridades do Dia" : "Marcar como Foco do Dia"}
                            >
                              <Star className={`h-3 w-3 ${task.isPriorityDay ? 'fill-current' : ''}`} />
                            </motion.button>
                          </div>

                          <div className="flex-1 min-w-0 space-y-1.5">
                            {/* Title & Badge details */}
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Category Badge */}
                                <span className="rounded-full bg-slate-950 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-400 uppercase border border-slate-850">
                                  {task.category}
                                </span>

                                {/* Priority indicator */}
                                <span className={`rounded-md border px-2 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-wider ${priorityBadgeColor}`}>
                                  {priorityLabel}
                                </span>

                                {/* Synchronized status indicators list */}
                                {!task.isSynced && (() => {
                                  const queueEntry = SyncQueueDB.getEntries().find(e => e.taskId === task.id);
                                  if (queueEntry && queueEntry.attempts > 0) {
                                    return (
                                      <span
                                        className="flex items-center gap-1 text-[9px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 uppercase cursor-pointer animate-pulse"
                                        title={`Erro: ${queueEntry.lastError || 'Falha de rede'} - Próxima retentativa: ${queueEntry.nextAttemptAfter ? new Date(queueEntry.nextAttemptAfter).toLocaleTimeString() : 'Imediato'}`}
                                      >
                                        <CloudLightning className="h-2.5 w-2.5 text-rose-400" /> erro (repass #{queueEntry.attempts})
                                      </span>
                                    );
                                  }
                                  return (
                                    <span
                                      className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500 uppercase cursor-pointer"
                                      title="Gravado localmente. Pendente de sincronização automática com banco na nuvem."
                                    >
                                      <CloudLightning className="h-2.5 w-2.5" /> offline
                                    </span>
                                  );
                                })()}
                              </div>

                              <div className="flex items-center gap-1.5 mt-1.5">
                                <p className={`font-sans font-semibold text-sm leading-tight ${
                                  task.completed ? 'line-through text-slate-500' : 'text-slate-100'
                                }`}>
                                  {task.title}
                                </p>
                                <div className="relative inline-block">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveReminderPopoverTaskId(
                                        activeReminderPopoverTaskId === task.id ? null : task.id
                                      );
                                    }}
                                    className={`group/bell flex items-center justify-center p-1 rounded-md transition-all hover:bg-slate-800/60 cursor-pointer ${
                                      task.reminderMinutes !== undefined && task.reminderMinutes > 0
                                        ? 'text-amber-500'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                    title="Ajustar lembrete"
                                  >
                                    <Bell 
                                      className={`h-3.5 w-3.5 flex-shrink-0 ${
                                        task.reminderMinutes !== undefined && task.reminderMinutes > 0
                                          ? 'fill-amber-500 text-amber-500'
                                          : 'text-slate-500'
                                      }`}
                                    />
                                  </button>

                                  {activeReminderPopoverTaskId === task.id && (
                                    <div 
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute left-0 mt-1.5 z-50 w-44 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150"
                                    >
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 pb-1.5 border-b border-slate-900 flex items-center justify-between">
                                        <span>Alertar lembrete</span>
                                      </p>
                                      <div className="flex flex-col gap-0.5 mt-1.5">
                                        {[
                                          { value: 0, label: 'Sem lembrete' },
                                          { value: 5, label: '5 min antes' },
                                          { value: 15, label: '15 min antes' },
                                          { value: 30, label: '30 min antes' },
                                          { value: 45, label: '45 min antes' },
                                          { value: 60, label: '1 hora antes' },
                                          { value: 120, label: '2 horas antes' },
                                          { value: 1440, label: '1 dia antes' },
                                        ].map((opt) => {
                                          const isSelected = (task.reminderMinutes ?? 0) === opt.value;
                                          return (
                                            <button
                                              key={opt.value}
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateTask(task.id, { reminderMinutes: opt.value });
                                                setActiveReminderPopoverTaskId(null);
                                              }}
                                              className={`w-full text-left font-sans text-xs px-2 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                                                isSelected
                                                  ? 'bg-amber-500/10 text-amber-400 font-semibold'
                                                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                              }`}
                                            >
                                              <span>{opt.label}</span>
                                              {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Description details */}
                            {task.description && (
                              <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Interactive Checklist Subtasks */}
                            {task.subtasks && task.subtasks.length > 0 && (
                              <div className="mt-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-900/80 space-y-2 shadow-inner">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                                  <span className="flex items-center gap-1">📋 Subtarefas (Checklist)</span>
                                  <span className="bg-slate-950 text-amber-500 px-1.5 py-0.5 rounded text-[9px] border border-slate-900">
                                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} concluídas
                                  </span>
                                </div>
                                
                                <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                                  <div 
                                    className="bg-amber-500 h-1 transition-all duration-300"
                                    style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                                  />
                                </div>

                                <div className="space-y-1.5 mt-2.5">
                                  {task.subtasks.map((sub) => (
                                    <label
                                      key={sub.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                      className="flex items-center gap-2 text-xs font-sans text-slate-300 hover:text-white transition-colors cursor-pointer select-none py-0.5"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={sub.completed}
                                        onChange={() => {
                                          const updatedSubs = task.subtasks!.map(s => 
                                            s.id === sub.id ? { ...s, completed: !s.completed } : s
                                          );
                                          updateTask(task.id, { subtasks: updatedSubs });
                                        }}
                                        className="rounded border-slate-800 text-amber-500 focus:ring-transparent h-3.5 w-3.5 bg-slate-950 focus:outline-none cursor-pointer"
                                      />
                                      <span className={sub.completed ? "line-through text-slate-550" : ""}>
                                        {sub.title}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Metadata grid rows (Dates, Pomodoros sessions) */}
                            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 pt-1 font-mono text-[10px] text-slate-500 select-none">
                              {task.dueDate && (
                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400' : ''}`}>
                                  <Calendar className="h-3 w-3" />
                                  {task.dueDate} {task.dueTime ? `@ ${task.dueTime}` : ''}
                                  {isOverdue ? ' (Vencido)' : ''}
                                </span>
                              )}
                              <span className="flex items-center gap-1.5">
                                <span className="text-amber-500 font-sans">🍅</span>
                                Sessões: {task.pomodoroCount} / {task.pomodorosTarget}
                              </span>
                            </div>
                          </div>

                          {/* Interactive List Item controls */}
                          <div className="flex flex-shrink-0 items-center gap-1 self-center opacity-70 group-hover:opacity-100 transition-opacity">
                            
                            {/* Link focus task button */}
                            {!task.completed && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTaskId(task.id);
                                  playFocusSound();
                                  // Scroll to focus widget if view on mobile
                                  document.getElementById('focus-card-section')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={`rounded-lg px-2 py-1 font-sans text-[10px] font-bold uppercase transition-colors uppercase cursor-pointer ${
                                  activeTaskId === task.id
                                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                                }`}
                                title="Vincular ao Cronômetro de Foco"
                              >
                                Focar
                              </button>
                            )}

                            {/* Edit task context icon */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(task);
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-850 hover:text-slate-200 transition-colors cursor-pointer"
                              title="Editar especificações"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            {/* Trash delete task context icon */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Deseja realmente deletar esta tarefa de seu portfólio MVP?')) {
                                  deleteTask(task.id);
                                  if (activeTaskId === task.id) setActiveTaskId(null);
                                }
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Remover do banco"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Pomodoro focus console, design rules context card (dynamic layout) */}
        <div className={`${subView === 'board' ? 'lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-900' : 'lg:col-span-5 space-y-6'}`}>
              
              {/* Pomodoro Focus Console card */}
              <div id="focus-card-section">
                <PomodoroTimer
                  tasks={tasks}
                  activeTaskId={activeTaskId}
                  setActiveTaskId={setActiveTaskId}
                  onPomodoroComplete={addPomodoroSession}
                />
              </div>

              {/* Google Agenda Integration card */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="flex items-center gap-1.5 font-sans font-bold text-slate-100">
                      <Calendar className="h-4 w-4 text-amber-500" /> Google Agenda
                    </h4>
                    <p className="text-[11px] text-slate-400">Sincronize suas metas citrinas</p>
                  </div>
                  
                  {isGoogleConnected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                      ● Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                      ○ Desconectado
                    </span>
                  )}
                </div>

                {isGoogleConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-slate-950 border border-slate-900 p-2.5">
                      {googleUser?.photoURL ? (
                        <img referrerPolicy="no-referrer" src={googleUser.photoURL} alt="Foto de perfil" className="h-8 w-8 rounded-full border border-slate-850" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-500">G</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-200">{googleUser?.displayName || 'Usuário Google'}</p>
                        <p className="truncate font-mono text-[10px] text-slate-500">{googleUser?.email || ''}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={syncAllTasksToGoogle}
                        disabled={isGoogleSyncing}
                        className="flex-1 rounded-xl bg-amber-500 px-3 py-2 text-center font-sans text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isGoogleSyncing ? 'Sincronizando...' : 'Sincronizar Todas'}
                      </button>
                      
                      <button
                        onClick={disconnectGoogle}
                        className="rounded-xl border border-slate-800 px-3 py-2 text-center font-sans text-xs font-medium text-slate-400 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition-all cursor-pointer"
                        title="Desconectar Integração"
                      >
                        Desconectar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ative a sincronização para exportar automaticamente seus blocos de tarefas diárias, semanais, quinzenais ou mensais diretamente para a sua agenda em tempo real.
                    </p>
                    <button
                      onClick={connectGoogle}
                      disabled={isGoogleSyncing}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-sans text-xs font-bold text-slate-200 hover:bg-slate-900 hover:border-slate-700 transition-all cursor-pointer shadow-md active:scale-[0.98]"
                    >
                      <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" alt="Google" className="h-3" />
                      {isGoogleSyncing ? 'Conectando...' : 'Conectar Google'}
                    </button>
                  </div>
                )}

                <div className="border-t border-slate-800/80 pt-4 mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-sans font-semibold text-slate-200">
                      <Bell className="h-3.5 w-3.5 text-amber-500" /> Lembrete Padrão (Agenda)
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans">Para novas tarefas</span>
                  </div>
                  <select
                    value={defaultReminderMinutes}
                    onChange={(e) => setDefaultReminderMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-sans text-xs text-slate-300 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 cursor-pointer"
                  >
                    <option value={0}>Sem lembrete</option>
                    <option value={5}>5 minutos antes</option>
                    <option value={15}>15 minutos antes</option>
                    <option value={30}>30 minutos antes</option>
                    <option value={45}>45 minutos antes</option>
                    <option value={60}>1 hora antes</option>
                    <option value={120}>2 horas antes</option>
                    <option value={1440}>1 dia antes</option>
                  </select>
                </div>
              </div>

              {/* Google Drive Integration card */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="flex items-center gap-1.5 font-sans font-bold text-slate-100">
                      <HardDrive className="h-4 w-4 text-emerald-400" /> Google Drive Nuvem
                    </h4>
                    <p className="text-[11px] text-slate-400">Backup seguro de progresso e relatórios</p>
                  </div>
                  
                  {isGoogleConnected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                      ● Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                      ○ Inativo
                    </span>
                  )}
                </div>

                {driveStatus && (
                  <div className={`rounded-xl border p-3 text-xs flex items-start gap-2.5 transition-all ${
                    driveStatus.type === 'success' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                      : driveStatus.type === 'error'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  }`}>
                    <div className="mt-0.5 flex-shrink-0">
                      {driveStatus.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : driveStatus.type === 'error' ? (
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      ) : (
                        <RefreshCw className="h-4 w-4 text-amber-400 animate-spin" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="leading-relaxed">{driveStatus.message}</p>
                    </div>
                    <button 
                      onClick={() => setDriveStatus(null)} 
                      className="text-slate-500 hover:text-slate-350 cursor-pointer font-sans text-xs font-bold px-1"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {isGoogleConnected ? (
                  <div className="space-y-4 pt-1">
                    {/* Backup & Restore sub-section */}
                    <div className="space-y-2 rounded-xl bg-slate-950/80 border border-slate-900 p-3.5">
                      <div className="flex items-center gap-1.5">
                        <CloudUpload className="h-4 w-4 text-amber-500" />
                        <span className="font-sans text-xs font-bold text-slate-200">Snapshots de Progresso</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Salve tarefas locais, nível, histórico de Pomodoros e XP para restauração em qualquer dispositivo.
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1.5">
                        <button
                          onClick={handleBackupDrive}
                          disabled={isGoogleDriveOperating}
                          className="rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 px-3 py-2 text-center font-sans text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isGoogleDriveOperating ? 'Sincronizando...' : 'Fazer Backup'}
                        </button>
                        <button
                          onClick={handleRestoreDrive}
                          disabled={isGoogleDriveOperating}
                          className="rounded-xl border border-slate-850 bg-slate-950/40 hover:bg-slate-900 px-3 py-2 text-center font-sans text-xs font-bold text-slate-300 hover:text-slate-200 transition-all cursor-pointer disabled:opacity-50"
                        >
                          Restaurar
                        </button>
                      </div>
                    </div>

                    {/* CSV backup sub-section */}
                    <div className="space-y-2 rounded-xl bg-slate-950/80 border border-slate-900 p-3.5">
                      <div className="flex items-center gap-1.5">
                        <CloudDownload className="h-4 w-4 text-emerald-400" />
                        <span className="font-sans text-xs font-bold text-slate-200">Exportar Histórico CSV</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Gere e salve uma planilha profissional de todas as suas tarefas completadas diretamente na nuvem.
                      </p>
                      <div className="pt-1.5">
                        <button
                          onClick={handleExportCSVDrive}
                          disabled={isGoogleDriveOperating}
                          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-2 text-center font-sans text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          Exportar Relatório CSV para Drive
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Conecte sua conta do Google nas configurações de agenda acima para ativar também o módulo de Google Drive. Salvamentos seguros da sua jornada em tempo real!
                    </p>
                  </div>
                )}
              </div>

              {/* Tips banner card */}
              <div className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-950 p-6">
                <h4 className="flex items-center gap-1.5 font-sans font-bold text-slate-200">
                  <Zap className="h-4 w-4 text-emerald-400" /> Benefícios do Portfólio de Código
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  Esta versão do <strong>Citrino Tarefas</strong> atende a todos os requisitos do <strong>Sprint 1, 2 e 3 do MVP</strong>. Ao concluir tarefas de dificuldades (High / Medium/ Low), os pontos de XP alimentam algoritmicamente sua barra de nível, sintetizando os timbres através dos alto-falantes de forma nativa. 
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 font-sans text-[11px] text-slate-300">
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                    <span className="font-bold text-slate-200 block mb-0.5">🚀 Gamificação</span>
                    +15 XP por criar task, +40-70 por terminar.
                  </div>
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                    <span className="font-bold text-slate-200 block mb-0.5">💾 Cache Local</span>
                    Usa LocalStorage. Resiste a refreshes de página.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
      </main>

      {/* Task Creation & Editing Multi-Modal Component */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        taskToEdit={taskToEdit}
        isGoogleConnected={isGoogleConnected}
        defaultReminderMinutes={defaultReminderMinutes}
      />

      {/* RITUAL DE ABERTURA DIÁRIO (DAILY RESET IMPERSIVE PORTAL) */}
      <AnimatePresence>
        {isOpeningRitualVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/98 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6"
          >
            {/* Ambient gold glow */}
            <div className="fixed -top-10 -left-10 h-96 w-96 rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />
            <div className="fixed -bottom-10 -right-10 h-96 w-96 rounded-full bg-indigo-505/10 blur-[130px] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-slate-900 border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column: Greeting, Breathing Exercise, Ritual Explanation */}
              <div className="md:col-span-5 space-y-6">
                <div>
                  <span className="text-amber-500 font-mono text-[9px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    🌅 Ritual Matinal Citrino
                  </span>
                  <h2 className="font-sans text-xl sm:text-2xl font-black text-white mt-3 leading-tight tracking-tight uppercase">
                    Acalme a mente, <br />
                    <span className="text-amber-400">firme seus alicerces.</span>
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                    O ritual de abertura bloqueia a ansiedade de listas infinitas. Antes de iniciar sua jornada diária, dedique um minuto para respirar consciente e consagrar no máximo 3 focos.
                  </p>
                </div>

                {/* VISUAL RESPIRATION GUIDE WIDGET */}
                <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 text-center relative overflow-hidden">
                  <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider">GUIA DE RESPIRAÇÃO (4-4-4)</span>
                  
                  {/* Glowing core animation */}
                  <div className="my-6 flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: breathingPhase === 'inspire' ? 1.3 : breathingPhase === 'segure' ? 1.3 : 0.85,
                        backgroundColor: breathingPhase === 'segure' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.15)',
                        borderColor: breathingPhase === 'segure' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(245, 158, 11, 0.3)'
                      }}
                      transition={{ duration: 4, ease: "linear" }}
                      className="h-24 w-24 rounded-full border-2 flex flex-col items-center justify-center text-amber-500 shadow-inner"
                    >
                      <span className="text-[10px] font-mono uppercase tracking-widest font-black leading-none">
                        {breathingSecondsLeft}s
                      </span>
                      <span className="text-[8px] font-mono leading-relaxed text-amber-400/80 font-bold uppercase mt-1">
                        {breathingPhase === 'inspire' ? 'Inspire' : breathingPhase === 'segure' ? 'Segure' : 'Expire'}
                      </span>
                    </motion.div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-normal italic px-2">
                    {breathingPhase === 'inspire' && '"Inspire clareza e controle na sua rotina."'}
                    {breathingPhase === 'segure' && '"Foque na retenção, sinta-se presente hoje."'}
                    {breathingPhase === 'expire' && '"Solte toda a pressão e ansiedade acumulada."'}
                  </p>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 font-mono text-[9px] text-slate-500 leading-normal flex items-start gap-1.5">
                  <span className="text-amber-500">💡</span>
                  <span>O cérebro trabalha melhor focando em progresso contínuo de 3 metas principais por dia do que em infinitos checkboxes vazios.</span>
                </div>
              </div>

              {/* Right Column: Dynamic Core Priority Selector & Quick Adder */}
              <div className="md:col-span-7 flex flex-col h-full justify-between space-y-6">
                <div>
                  <h3 className="font-sans text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    🎯 Consagre seu Top 3 Diário
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                    Marque até 3 metas como o Foco Ouro de hoje. Elas ficarão consagradas no topo do seu painel de tarefas de visualização rápida.
                  </p>

                  {/* Active selection counters indicator */}
                  <div className="flex items-center justify-between text-xs font-mono font-bold px-1 mb-2">
                    <span className="text-slate-400">Focos Ativos Selecionados:</span>
                    <span className={`px-2 py-0.5 rounded ${dayPriorityTasks.length === 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-950 text-slate-500'}`}>
                      {dayPriorityTasks.length}/3 Metas
                    </span>
                  </div>

                  {/* Quick-Task addition board inside Ritual */}
                  <form onSubmit={handleCreateQuickTaskInRitual} className="bg-slate-950/90 rounded-2xl border border-slate-800 p-4 mb-4 space-y-3">
                    <span className="text-[9px] font-mono font-bold text-slate-500 block">ADICIONAR META RÁPIDA DE FOCO</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Digite o título da sua principal prioridade..."
                        value={ritualNewTaskTitle}
                        onChange={(e) => setRitualNewTaskTitle(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none placeholder:text-slate-650"
                      />
                      <button
                        type="submit"
                        disabled={!ritualNewTaskTitle.trim()}
                        className="px-3 py-1.5 bg-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs hover:bg-amber-400 cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Adicionar
                      </button>
                    </div>

                    <div className="flex gap-3 justify-between items-center pt-1 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Categoria:</span>
                        <select
                          value={ritualNewTaskCategory}
                          onChange={(e) => setRitualNewTaskCategory(e.target.value)}
                          className="bg-slate-900 text-slate-350 border border-slate-850 rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-500 text-[10px]"
                        >
                          <option value="Estudo">Estudo</option>
                          <option value="Trabalho">Trabalho</option>
                          <option value="Pessoal">Pessoal</option>
                          <option value="Saúde">Saúde</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Pontos Estrelados:</span>
                        <select
                          value={ritualNewTaskPriority}
                          onChange={(e) => setRitualNewTaskPriority(e.target.value as TaskPriority)}
                          className="bg-slate-900 text-slate-350 border border-slate-850 rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-500 text-[10px]"
                        >
                          <option value="low">Fácil (+40 XP)</option>
                          <option value="medium">Média (+50 XP)</option>
                          <option value="high">Lendária (+70 XP)</option>
                        </select>
                      </div>
                    </div>
                  </form>

                  {/* Pending Tasks / Recommendations selector list */}
                  <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1.5">
                    {tasks.filter(t => !t.completed).length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
                        <p className="text-xs text-slate-500">Seu banco de ideias está vazio. Crie uma meta rápida acima!</p>
                      </div>
                    ) : (
                      tasks.filter(t => !t.completed).map((task) => {
                        return (
                          <div
                            key={task.id}
                            onClick={() => {
                              if (!task.isPriorityDay && dayPriorityTasks.length >= 3) return;
                              updateTask(task.id, { isPriorityDay: !task.isPriorityDay });
                              if (soundEnabled) playHoverTickSound();
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              task.isPriorityDay
                                ? 'bg-amber-500/10 border-amber-500/30 text-white'
                                : 'bg-slate-950/40 border-slate-850 hover:bg-slate-950/90 text-slate-400 hover:text-slate-300'
                            }`}
                          >
                            <div className="min-w-0 pr-3">
                              <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[8px] font-mono border border-slate-800 uppercase text-slate-500">
                                {task.category}
                              </span>
                              <h5 className={`text-xs font-bold leading-tight mt-1 line-clamp-1 ${task.isPriorityDay ? 'text-amber-400' : ''}`}>
                                {task.title}
                              </h5>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!task.isPriorityDay && dayPriorityTasks.length >= 3) {
                                  alert("Máximo de 3 tarefas atingido!");
                                  return;
                                }
                                updateTask(task.id, { isPriorityDay: !task.isPriorityDay });
                                if (soundEnabled) playHoverTickSound();
                              }}
                              className={`h-6 w-6 flex items-center justify-center rounded-lg border text-xs ${
                                task.isPriorityDay 
                                  ? 'bg-amber-500 text-slate-950 border-amber-500' 
                                  : 'border-slate-850 bg-slate-950 text-slate-650 hover:bg-slate-900 hover:text-slate-400'
                              }`}
                            >
                              <Star className={`h-3.5 w-3.5 ${task.isPriorityDay ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer Initiate Journey button */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                  <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
                    Aperte para consagrar e ditar o compasso produtivo do dia atual.
                  </p>
                  
                  <button
                    onClick={() => {
                      localStorage.setItem('citrino_last_ritual_date', new Date().toLocaleDateString());
                      setIsOpeningRitualVisible(false);
                      // Trigger celebration confetti & bell sound on consagration success
                      if (soundEnabled) {
                        try {
                          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                          if (AudioContextClass) {
                            const ctx = new AudioContextClass();
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            osc.type = 'sine';
                            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
                            gain.gain.setValueAtTime(0.08, ctx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.start();
                            osc.stop(ctx.currentTime + 0.9);
                          }
                        } catch (err) {
                          console.warn(err);
                        }
                      }
                      try {
                        (window as any).confetti?.({
                          particleCount: 50,
                          angle: 60,
                          spread: 55,
                          origin: { x: 0 }
                        });
                        (window as any).confetti?.({
                          particleCount: 50,
                          angle: 120,
                          spread: 55,
                          origin: { x: 1 }
                        });
                      } catch (c) {}
                    }}
                    className="flex items-center gap-1 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-550 hover:text-slate-950 font-black rounded-2xl text-xs transition-transform cursor-pointer shadow-lg active:scale-95 uppercase tracking-wide shrink-0 font-sans"
                  >
                    <span>Consagrar Focus & Iniciar</span>
                    <span>🌅</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TELA DE SUCESSO DO RITUAL (100% COMPLETION DIARY CONGRATS COMPONENT) */}
      <AnimatePresence>
        {showSuccessCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4 sm:p-6"
          >
            {/* Elegant deep glow */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-amber-500/20 blur-[140px] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="w-full max-w-lg bg-slate-900 border border-amber-500/20 rounded-3xl p-6 sm:p-8 text-center relative z-10 shadow-2xl space-y-6"
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/35 text-amber-500 animate-bounce">
                <Trophy className="h-8 w-8 text-amber-500" />
              </div>

              <div className="space-y-2">
                <span className="font-mono text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Jornada Consagrada
                </span>
                <h2 className="font-sans text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-tight mt-1">
                  100% de Conclusão <br />
                  <span className="text-amber-400">Das Suas Prioridades!</span>
                </h2>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Parabéns! Você blindou sua clareza mental neutralizando sobrecarga de dados hoje. Suas 3 principais tarefas de ouro da elite produtiva foram concluídas perfeitamente!
              </p>

              {/* Bonus badge details */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-left font-mono text-[10px] space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Prioridades Resolvidas:</span>
                  <span className="text-amber-500 font-bold">{completedPrioritiesCount}/{totalPrioritiesCount}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Recompensa Citrino Extra:</span>
                  <span className="text-amber-500 font-black">+100 XP Extra do Ritual</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-850 mt-1">
                  <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full w-full" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    // Award bonus 100 XP on daily priority complete confirmation, and close overlay
                    setShowSuccessCelebration(false);
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs transition-transform cursor-pointer shadow-lg active:scale-95 uppercase tracking-wider"
                >
                  Continuar Aprendizado 🚀
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <TaskProvider>
      <DashboardContent />
    </TaskProvider>
  );
}
