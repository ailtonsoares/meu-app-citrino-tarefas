import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TaskProvider, useTasks } from './context/TaskContext';
import { Task, TaskPriority } from './types';
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
  Moon
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
  } = useTasks();

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'app' | 'specs'>('app'); // Switch between working web app & tech spec

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
  }) => {
    if (taskToEdit) {
      updateTask(taskToEdit.id, taskData);
    } else {
      addTask(taskData);
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
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nuvem Offline-First</p>
                <p className="text-lg font-black mt-0.5 text-slate-100 flex items-center gap-1.5">
                  {unsyncedCount === 0 ? (
                    <span className="text-emerald-400">Dados Sincronizados</span>
                  ) : (
                    <span className="text-amber-500">{unsyncedCount} Pendentes</span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Atua localmente, sincroniza em background.
                </p>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Tasks index, Filters, Searches */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Tooling Bar (Actions, categories selectors, priority filters) */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-550" />
                  <input
                    type="text"
                    placeholder="Buscar tarefas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    <button
                      onClick={clearCompletedTasks}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/40 active:scale-[0.98] transition-all font-bold cursor-pointer"
                      title="Excluir todas as tarefas marcadas como concluídas do histórico"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      <span>Limpar Completas ({completedCount})</span>
                    </button>
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
                          exit={{ opacity: 0, x: 100 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className={`group relative flex items-start gap-4 rounded-xl border p-4 transition-all ${
                            task.completed
                              ? 'bg-slate-900/15 border-slate-900 text-slate-500'
                              : 'bg-slate-900 hover:border-slate-800 text-slate-200 hover:shadow-md'
                          } ${activeTaskId === task.id ? 'ring-2 ring-amber-500/50' : ''}`}
                        >
                          {/* Custom Interactive Checkbox */}
                          <motion.button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskComplete(task.id);
                            }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                            title={task.completed ? 'Desmarcar como pendente' : 'Marcar como concluída'}
                            className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border text-slate-900 transition-colors cursor-pointer"
                            style={{
                              backgroundColor: task.completed ? '#f59e0b' : 'transparent',
                              borderColor: task.completed ? '#f59e0b' : '#334155',
                            }}
                          >
                            {task.completed && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 450, damping: 15 }}
                                className="flex items-center justify-center"
                              >
                                <CheckCircle2 className="CheckCircle2 h-3.5 w-3.5 text-[#020617] stroke-[3]" />
                              </motion.div>
                            )}
                          </motion.button>

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
                                {!task.isSynced && (
                                  <span
                                    className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500 uppercase cursor-pointer"
                                    title="Gravado localmente. Pendente de sincronização automática com banco na nuvem."
                                  >
                                    <CloudLightning className="h-2.5 w-2.5" /> offline
                                  </span>
                                )}
                              </div>

                              <p className={`font-sans font-semibold text-sm leading-tight mt-1.5 ${
                                task.completed ? 'line-through text-slate-500' : 'text-slate-100'
                              }`}>
                                {task.title}
                              </p>
                            </div>

                            {/* Description details */}
                            {task.description && (
                              <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-2">
                                {task.description}
                              </p>
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
                                onClick={() => {
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
                              onClick={() => handleOpenEditModal(task)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-850 hover:text-slate-200 transition-colors cursor-pointer"
                              title="Editar especificações"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            {/* Trash delete task context icon */}
                            <button
                              onClick={() => {
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
            </div>

            {/* Right Column: Pomodoro focus console, design rules context card */}
            <div className="lg:col-span-5 space-y-6">
              
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
        )}
      </main>

      {/* Task Creation & Editing Multi-Modal Component */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        taskToEdit={taskToEdit}
        isGoogleConnected={isGoogleConnected}
      />
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
