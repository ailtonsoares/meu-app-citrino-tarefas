import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, AlertTriangle, Layers, Flame, BookOpen, Target } from 'lucide-react';
import { Task, TaskPriority } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: TaskPriority;
    category: string;
    pomodorosTarget: number;
  }) => void;
  taskToEdit?: Task | null;
}

const CATEGORIES = ['Estudo', 'Trabalho', 'Pessoal', 'Saúde', 'Finanças', 'Outros'];

export default function TaskModal({ isOpen, onClose, onSubmit, taskToEdit }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState('Estudo');
  const [pomodorosTarget, setPomodorosTarget] = useState(1);
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setDueDate(taskToEdit.dueDate || '');
      setDueTime(taskToEdit.dueTime || '');
      setPriority(taskToEdit.priority);
      setCategory(taskToEdit.category || 'Estudo');
      setPomodorosTarget(taskToEdit.pomodorosTarget || 1);
    } else {
      // Reset to defaults
      setTitle('');
      setDescription('');
      // Default to today
      setDueDate(new Date().toISOString().split('T')[0]);
      setDueTime('12:00');
      setPriority('medium');
      setCategory('Estudo');
      setPomodorosTarget(1);
    }
    setErrors({});
  }, [taskToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrors({ title: 'O título da tarefa é obrigatório' });
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      dueTime,
      priority,
      category,
      pomodorosTarget,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6 py-4">
              <h3 className="flex items-center gap-2 font-sans text-lg font-semibold text-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-500">
                  <Target className="h-4 w-4" />
                </span>
                {taskToEdit ? 'Editar Tarefa Citrino' : 'Criar Nova Tarefa'}
              </h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title */}
              <div className="space-y-1.5 animate-feed-in">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Título da Tarefa *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors({});
                  }}
                  placeholder="Ex: Desenhar os fluxogramas da arquitetura SUPABASE"
                  className={`w-full rounded-xl border bg-slate-950 px-4 py-3 font-sans text-sm text-slate-150 transition-all placeholder:text-slate-600 focus:outline-none focus:ring-2 ${
                    errors.title
                      ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-800 focus:border-amber-500 focus:ring-amber-500/20'
                  }`}
                />
                {errors.title && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-400">
                    <AlertTriangle className="h-3 w-3" /> {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Descrição Detalhada</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva detalhes específicos da tarefa, links úteis ou passos do fluxo de execução."
                  rows={3}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 font-sans text-sm text-slate-150 transition-all placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* DateTime Dual Rows */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-amber-500/80" /> Prazo Final
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 font-sans text-xs text-slate-300 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-amber-500/80" /> Horário dól
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 font-sans text-xs text-slate-300 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Priority Select */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dificuldade / Prioridade (Rendimento XP)</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => {
                    const active = priority === p;
                    let activeStyles = '';
                    let label = '';
                    let xpAmount = '';

                    if (p === 'low') {
                      activeStyles = active
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                        : 'border-slate-800 hover:bg-slate-800 hover:text-emerald-400';
                      label = 'Fácil';
                      xpAmount = '+40 XP';
                    } else if (p === 'medium') {
                      activeStyles = active
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : 'border-slate-800 hover:bg-slate-800 hover:text-amber-400';
                      label = 'Média';
                      xpAmount = '+50 XP';
                    } else {
                      activeStyles = active
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                        : 'border-slate-800 hover:bg-slate-800 hover:text-rose-400';
                      label = 'Lendária';
                      xpAmount = '+70 XP';
                    }

                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex flex-col items-center justify-center rounded-xl border py-2.5 px-3 transition-all ${activeStyles}`}
                      >
                        <span className="font-sans text-sm font-semibold">{label}</span>
                        <span className="font-mono text-[10px] opacity-75">{xpAmount}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Categoria do MVP</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`rounded-full px-3 py-1 font-sans text-xs font-medium cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/10'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pomodoro Focus Sessions Targets */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
                <div className="space-y-0.5">
                  <h4 className="flex items-center gap-1.5 font-sans text-sm font-semibold text-slate-250">
                    <Flame className="h-4 w-4 text-orange-500 fill-orange-500/20" /> Metas Pomodoro
                  </h4>
                  <p className="text-xs text-slate-500">
                    Ciclos estimados para esta tarefa (+30 XP/ciclo)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPomodorosTarget(Math.max(1, pomodorosTarget - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-lg font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-mono text-sm font-semibold text-slate-200">
                    {pomodorosTarget}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPomodorosTarget(Math.min(10, pomodorosTarget + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-lg font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Submit / Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-850 px-4 py-3 font-sans text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-500 px-4 py-3 font-sans text-sm font-bold text-slate-950 transition-all hover:bg-amber-400 shadow-lg shadow-amber-500/10 active:scale-[0.98]"
                >
                  {taskToEdit ? 'Salvar Edições' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
