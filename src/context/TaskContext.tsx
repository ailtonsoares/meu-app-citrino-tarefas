import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { Task, TaskContextType, TaskPriority } from '../types';

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_TASKS = 'citrino_tasks_mvp';
const LOCAL_STORAGE_KEY_XP = 'citrino_xp_mvp';
const LOCAL_STORAGE_KEY_LEVEL = 'citrino_level_mvp';

// Natively synthesize a crystalline success bell sound using Web Audio API
const playDingSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // A high-quality bell chime with non-harmonic overtones for a rich metallic timbre and long resonance
    const playBellHarmonic = (freq: number, amplitude: number, decay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0, now);
      // Extremely quick onset strike
      gain.gain.linearRampToValueAtTime(amplitude * 0.12, now + 0.005);
      // Exponential decay to create a natural ring
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + decay + 0.05);
    };

    // B5 (987.77 Hz) fundamental chime
    const baseFreq = 987.77;
    
    // Non-harmonic metallic partials for bell-like quality
    playBellHarmonic(baseFreq, 1.0, 1.2);       // Fundamental resonance
    playBellHarmonic(baseFreq * 1.5, 0.45, 0.85); // Quint element
    playBellHarmonic(baseFreq * 2.0, 0.35, 0.65); // Octave
    playBellHarmonic(baseFreq * 2.61, 0.25, 0.45);// Crystalline partial ring
    playBellHarmonic(baseFreq * 3.0, 0.18, 0.35); // Higher fifth ring
    playBellHarmonic(baseFreq * 4.18, 0.12, 0.2);  // High shimmer element
  } catch (err) {
    console.warn('Audio synthesis of success bell failed:', err);
  }
};

const playTicTacSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const playTick = (freq: number, start: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.01);
    };

    // Soft 'tic-tac' micro-interaction tones
    playTick(1500, now, 0.04, 0.06);       // "tic"
    playTick(1100, now + 0.06, 0.04, 0.05); // "tac"
  } catch (err) {
    console.warn('Tic-tac sound failed:', err);
  }
};

const playPopSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    // Pop profile: extremely fast pitch envelope sliding upwards from 150Hz to 600Hz
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.12);
  } catch (err) {
    console.warn('Audio synthesis of pop failed:', err);
  }
};

const playLevelUpSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };
    
    // Retro game level-up flourish
    playTone(261.63, now, 0.1); // C4
    playTone(329.63, now + 0.08, 0.1); // E4
    playTone(392.00, now + 0.16, 0.1); // G4
    playTone(523.25, now + 0.24, 0.35); // C5
  } catch (err) {
    console.warn('Level up sound failed:', err);
  }
};

const initialMockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Modelar o banco de dados local do MVP',
    description: 'Definir o Schema e configurar o localStorage para funcionamento offline.',
    completed: true,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '10:00',
    priority: 'high',
    category: 'Estudo',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isSynced: true,
    pomodoroCount: 2,
    pomodorosTarget: 2
  },
  {
    id: 'task-2',
    title: 'Codificar o hook de gerenciamento de estado (React Context)',
    description: 'Implementar as operações de CRUD, cálculo de XP e mecânica de sincronização.',
    completed: false,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '18:00',
    priority: 'high',
    category: 'Estudo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSynced: false,
    pomodoroCount: 0,
    pomodorosTarget: 3
  },
  {
    id: 'task-3',
    title: 'Criar protótipo de micro-interações animadas',
    description: 'Construir visual com motion, feedback de som ao completar tarefas e estatísticas.',
    completed: false,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueTime: '14:00',
    priority: 'medium',
    category: 'Trabalho',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSynced: false,
    pomodoroCount: 0,
    pomodorosTarget: 1
  },
  {
    id: 'task-4',
    title: 'Organizar apresentação das sprints no GitHub',
    description: 'Criar README do projeto com link de demonstração.',
    completed: false,
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    dueTime: '12:00',
    priority: 'low',
    category: 'Outros',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSynced: true,
    pomodoroCount: 0,
    pomodorosTarget: 1
  }
];

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Side-effect to apply theme class on document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  // 1. Initial Load from LocalStorage (with seamless migration from 'opala' keys)
  useEffect(() => {
    try {
      // Clean migration path to preserve user tasks & XP
      let storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
      if (!storedTasks) {
        const legacyTasks = localStorage.getItem('opala_tasks_mvp');
        if (legacyTasks) {
          storedTasks = legacyTasks;
          localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, legacyTasks);
        }
      }

      let storedXp = localStorage.getItem(LOCAL_STORAGE_KEY_XP);
      if (!storedXp) {
        const legacyXp = localStorage.getItem('opala_xp_mvp');
        if (legacyXp) {
          storedXp = legacyXp;
          localStorage.setItem(LOCAL_STORAGE_KEY_XP, legacyXp);
        }
      }

      let storedLevel = localStorage.getItem(LOCAL_STORAGE_KEY_LEVEL);
      if (!storedLevel) {
        const legacyLevel = localStorage.getItem('opala_level_mvp');
        if (legacyLevel) {
          storedLevel = legacyLevel;
          localStorage.setItem(LOCAL_STORAGE_KEY_LEVEL, legacyLevel);
        }
      }

      let storedSoundEnabled = localStorage.getItem('citrino_sound_enabled');
      if (storedSoundEnabled === null) {
        const legacySound = localStorage.getItem('opala_sound_enabled');
        if (legacySound !== null) {
          storedSoundEnabled = legacySound;
          localStorage.setItem('citrino_sound_enabled', legacySound);
        }
      }

      let storedTheme = localStorage.getItem('citrino_theme');
      if (!storedTheme) {
        const legacyTheme = localStorage.getItem('opala_theme');
        if (legacyTheme) {
          storedTheme = legacyTheme;
          localStorage.setItem('citrino_theme', legacyTheme);
        }
      }

      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      } else {
        // Hydrate with high-quality initial tasks representing the MVP's spec
        setTasks(initialMockTasks);
        localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(initialMockTasks));
      }

      if (storedXp) {
        setXp(parseInt(storedXp, 10));
      }
      if (storedLevel) {
        setLevel(parseInt(storedLevel, 10));
      }
      if (storedSoundEnabled !== null) {
        setSoundEnabledState(storedSoundEnabled === 'true');
      }

      if (storedTheme === 'light' || storedTheme === 'dark') {
        setTheme(storedTheme);
      }
    } catch (err) {
      console.error('Error loading tasks from localStorage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Persist Tasks Helper
  const saveTasksList = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(updatedTasks));
    } catch (err) {
      console.error('Error saving tasks to localStorage:', err);
    }
  };

  // Helper to handle XP changes with linear level boundaries (Level Up threshold = Level * 100)
  const awardXP = (amount: number) => {
    setXp((prevXp) => {
      let currentXp = prevXp + amount;
      let currentLevel = level;
      let requiredXp = currentLevel * 100;

      while (currentXp >= requiredXp) {
        currentXp -= requiredXp;
        currentLevel += 1;
        requiredXp = currentLevel * 100;
        
        // Native level-up sound and state update
        if (soundEnabled) {
          playLevelUpSound();
        }
        setLevel(currentLevel);
        localStorage.setItem(LOCAL_STORAGE_KEY_LEVEL, currentLevel.toString());
      }

      localStorage.setItem(LOCAL_STORAGE_KEY_XP, currentXp.toString());
      return currentXp;
    });
  };

  const deductXP = (amount: number) => {
    setXp((prevXp) => {
      const newXp = Math.max(0, prevXp - amount);
      localStorage.setItem(LOCAL_STORAGE_KEY_XP, newXp.toString());
      return newXp;
    });
  };

  // 3. CRUD operations
  const addTask = (newTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'pomodoroCount'>) => {
    const id = 'task-' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    
    const newTask: Task = {
      ...newTaskData,
      id,
      createdAt: now,
      updatedAt: now,
      isSynced: false, // Created offline, needs synchronization
      pomodoroCount: 0,
    };

    saveTasksList([newTask, ...tasks]);
    // Award 15 XP for planning / creating a task
    awardXP(15);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const now = new Date().toISOString();
    const updated = tasks.map((task) => {
      if (task.id === id) {
        // If updating a critical field, flag as un-synced for offline tracking
        const changesNeedSync = 
          updates.title !== undefined || 
          updates.description !== undefined || 
          updates.completed !== undefined || 
          updates.dueDate !== undefined || 
          updates.priority !== undefined;

        return {
          ...task,
          ...updates,
          updatedAt: now,
          isSynced: changesNeedSync ? false : (updates.isSynced ?? task.isSynced),
        };
      }
      return task;
    });
    saveTasksList(updated);
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    const updated = tasks.filter((task) => task.id !== id);
    saveTasksList(updated);
    
    // Deduct standard creation XP if deleted uncompleted key task
    if (taskToDelete && !taskToDelete.completed) {
      deductXP(10);
    }
  };

  const toggleTaskComplete = (id: string) => {
    const now = new Date().toISOString();
    const updated = tasks.map((task) => {
      if (task.id === id) {
        const nextCompletedState = !task.completed;
        
        if (nextCompletedState) {
          // Play micro-interaction ding, tic-tac and pop sounds!
          if (soundEnabled) {
            playDingSound();
            playTicTacSound();
            playPopSound();
          }
          
          // Trigger crisp success confetti explosion!
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#f59e0b', '#3b82f6', '#10b981', '#ffffff', '#ec4899']
            });
          } catch (err) {
            console.warn('Confetti animation failed:', err);
          }
          
          // Calculate XP awarded based on Priority
          let baseXP = 40;
          if (task.priority === 'high') baseXP = 70;
          if (task.priority === 'medium') baseXP = 50;
          awardXP(baseXP);
        } else {
          // Unchecked task - deduct previous XP
          let xpToDeduct = 40;
          if (task.priority === 'high') xpToDeduct = 70;
          if (task.priority === 'medium') xpToDeduct = 50;
          deductXP(xpToDeduct);
        }

        return {
          ...task,
          completed: nextCompletedState,
          isSynced: false, // Flag sync update
          updatedAt: now,
        };
      }
      return task;
    });
    saveTasksList(updated);
  };

  // 4. Pomodoro Focus integration
  const addPomodoroSession = (id: string) => {
    const updated = tasks.map((task) => {
      if (task.id === id) {
        const nextCount = task.pomodoroCount + 1;
        // Synthesize nice light tick sound
        if (soundEnabled) {
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              const ctx = new AudioContextClass();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.1);
            }
          } catch {}
        }
        
        // Award XP for focused Pomodoro completion!
        awardXP(30);

        return {
          ...task,
          pomodoroCount: nextCount,
          updatedAt: new Date().toISOString(),
          isSynced: false,
        };
      }
      return task;
    });
    saveTasksList(updated);
  };

  // 5. Offline Sync trigger (Simulates sending payloads to standard Supabase/Firebase/Server and flags isSynced)
  const triggerOfflineSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    
    // Simulate real cloud database latency
    await new Promise((resolve) => setTimeout(resolve, 1600));
    
    const syncedTasks = tasks.map(task => ({
      ...task,
      isSynced: true
    }));
    
    saveTasksList(syncedTasks);
    setIsSyncing(false);
    
    // Synthesize successful sync finish chord
    if (soundEnabled) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const now = ctx.currentTime;
          const playTone = (freq: number, start: number, dur: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.08, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + dur);
          };
          playTone(600, now, 0.1);
          playTone(900, now + 0.05, 0.15);
        }
      } catch {}
    }
  };

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem('citrino_sound_enabled', enabled.toString());
  };

  const resetXP = () => {
    setXp(0);
    setLevel(1);
    localStorage.setItem(LOCAL_STORAGE_KEY_XP, '0');
    localStorage.setItem(LOCAL_STORAGE_KEY_LEVEL, '1');
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('citrino_theme', nextTheme);
      return nextTheme;
    });
  };

  const clearCompletedTasks = () => {
    const updated = tasks.filter((task) => !task.completed);
    saveTasksList(updated);
  };

  return (
    <TaskContext.Provider
      value={{
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
        toggleTheme,
        clearCompletedTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
