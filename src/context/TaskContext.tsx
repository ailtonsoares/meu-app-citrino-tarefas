import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Task, TaskContextType, TaskPriority } from '../types';
import { initAuth, googleSignIn, logout as googleLogout, getAccessToken } from '../lib/googleAuth';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../lib/googleCalendar';
import { SyncQueueDB } from '../lib/syncQueueDb';
import { parseNaturalLanguageDate } from '../lib/nlpParser';

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

const playReverseClickSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    // Downward pitch progression for reverse effect (representing unchecking)
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
    
    // Smooth fast attack and slightly softer release
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.12);
  } catch (err) {
    console.warn('Audio synthesis of reverse click failed:', err);
  }
};

const playFocusSoundInternal = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    // 'soft tick' profile: high frequency (e.g. 1600Hz) decaying extremely fast
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.04);
    
    // Fast attack and extremely fast decay (40ms total) with soft amplitude (0.06)
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.05);
  } catch (err) {
    console.warn('Audio synthesis of focus tick failed:', err);
  }
};

const playSearchSoundInternal = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    // Gentle high pitch ping at 1320 Hz
    osc.frequency.setValueAtTime(1320, now);
    // Smooth subtle slide to 1200 Hz to sweeten the tone
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    
    // Smooth but transient attack, very short decay for a clean ping
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.004); // subtle volume
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (err) {
    console.warn('Audio synthesis of search ping failed:', err);
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
  const [defaultReminderMinutes, setDefaultReminderMinutesState] = useState<number>(15);
  const [autoClearFrequency, setAutoClearFrequencyState] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');

  // Google Calendar Integration States
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [isGoogleSyncing, setIsGoogleSyncing] = useState<boolean>(false);
  const [isGoogleDriveOperating, setIsGoogleDriveOperating] = useState<boolean>(false);

  // Offline Sync and Simulation states
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [isAppOffline, setIsAppOffline] = useState<boolean>(false);
  const [syncQueue, setSyncQueue] = useState<string[]>([]);
  const debounceTimers = useRef<{ [taskId: string]: any }>({});

  const isCurrentlyOffline = isAppOffline || isOfflineSimulated;

  // Sync Queue Local Persistence and Network Listeners
  useEffect(() => {
    const savedQueue = localStorage.getItem('citrino_google_sync_queue');
    if (savedQueue) {
      try {
        setSyncQueue(JSON.parse(savedQueue));
      } catch (e) {
        console.error('Failed to parse sync queue', e);
      }
    }

    const savedOfflineSim = localStorage.getItem('citrino_offline_simulated');
    if (savedOfflineSim !== null) {
      setIsOfflineSimulated(savedOfflineSim === 'true');
    }

    const handleOnline = () => {
      setIsAppOffline(false);
    };
    const handleOffline = () => {
      setIsAppOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsAppOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync queue auto-drain effect when online status changes
  useEffect(() => {
    if (!isCurrentlyOffline && syncQueue.length > 0) {
      processSyncQueue();
    }
    localStorage.setItem('citrino_offline_simulated', isOfflineSimulated.toString());
  }, [isOfflineSimulated, isAppOffline]);

  // Periodic background queue retry trigger for elapsed backoff entries (every 12 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isCurrentlyOffline && syncQueue.length > 0) {
        console.log('[Sync Queue] Iniciando varredura em segundo plano para retentativas elegíveis...');
        processSyncQueue();
      }
    }, 12000);
    return () => clearInterval(timer);
  }, [isCurrentlyOffline, syncQueue]);

  // Listen for Google Auth state changes
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
        setIsGoogleConnected(true);
      },
      () => {
        setGoogleUser(null);
        setIsGoogleConnected(false);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Keep track of tasks that have already fired a notification in the current session / day
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  // Load notified tasks on mount & request native notification permissions
  useEffect(() => {
    const savedNotified = localStorage.getItem('citrino_notified_task_ids');
    if (savedNotified) {
      try {
        const parsed = JSON.parse(savedNotified) as string[];
        notifiedTasksRef.current = new Set(parsed);
      } catch (e) {
        console.error('Failed to parse notified tasks from localStorage', e);
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch((err) => {
          console.warn('Native notification permission request rejected/failed', err);
        });
      }
    }
  }, []);

  // Helper to trigger native Notification instance with voice sound synthesis fallback
  const triggerNativeNotification = (task: Task) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const title = `Lembrete: ${task.title}`;
      const options: NotificationOptions = {
        body: `Sua tarefa da categoria "${task.category}" é para as ${task.dueTime}.\nPrioridade: ${
          task.priority === 'high' ? 'Alta 🌟' : task.priority === 'medium' ? 'Média ⚡' : 'Fácil 🍀'
        }`,
        tag: task.id,
        requireInteraction: true,
      };

      try {
        const notification = new Notification(title, options);
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Play the crystalline ding sound
        playDingSound();
      } catch (err) {
        console.error('Failed to trigger native Notification instance:', err);
      }
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          triggerNativeNotification(task);
        }
      });
    }
  };

  // Periodic background check for upcoming task reminders (offline-ready)
  useEffect(() => {
    const checkReminders = () => {
      if (tasks.length === 0) return;
      const nowTime = Date.now();
      let changed = false;

      tasks.forEach((task) => {
        // Only verify pending/uncompleted tasks with valid dueDate and dueTime
        if (task.completed || !task.dueDate || !task.dueTime) return;

        // Skip if already notified
        if (notifiedTasksRef.current.has(task.id)) return;

        try {
          const [year, month, day] = task.dueDate.split('-').map(Number);
          const [hours, minutes] = task.dueTime.split(':').map(Number);

          if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) return;

          const dueDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
          const minutesBefore = task.reminderMinutes !== undefined ? task.reminderMinutes : defaultReminderMinutes;

          const reminderDateTime = new Date(dueDateTime.getTime() - minutesBefore * 60 * 1000);
          const reminderTime = reminderDateTime.getTime();
          const dueTimeMs = dueDateTime.getTime();

          // Trigger reminder if current time is within active reminder window
          // Active window: from the reminder time up to 30 minutes past the due time
          if (nowTime >= reminderTime && nowTime <= dueTimeMs + 30 * 60 * 1000) {
            notifiedTasksRef.current.add(task.id);
            changed = true;

            triggerNativeNotification(task);
          }
        } catch (e) {
          console.error('Error checking reminders for task ID:', task.id, e);
        }
      });

      if (changed) {
        localStorage.setItem(
          'citrino_notified_task_ids',
          JSON.stringify(Array.from(notifiedTasksRef.current))
        );
      }
    };

    // Run check immediately, then run every 15 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 15000);

    return () => clearInterval(interval);
  }, [tasks, defaultReminderMinutes]);

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

      let storedDefaultReminder = localStorage.getItem('citrino_default_reminder_minutes');
      let storedAutoClear = localStorage.getItem('citrino_auto_clear_frequency');

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
      if (storedDefaultReminder !== null) {
        setDefaultReminderMinutesState(parseInt(storedDefaultReminder, 10));
      }
      if (storedAutoClear === 'none' || storedAutoClear === 'daily' || storedAutoClear === 'weekly' || storedAutoClear === 'monthly') {
        setAutoClearFrequencyState(storedAutoClear);
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
  // Direct Google Calendar Sync (hashing original logic)
  const syncTaskToGoogleDirect = async (taskId: string, currentTasksList?: Task[]) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        console.warn('Google Calendar status: Not connected / OAuth token unavailable');
        return;
      }

      // Read fresh list
      const list = currentTasksList || tasks;
      const FreshTasks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_TASKS) || '[]');
      const task = FreshTasks.find((t: Task) => t.id === taskId) || list.find((t: Task) => t.id === taskId);
      if (!task) return;

      // Only attempt actual Google sync if the user explicitly has Google syncing toggled or has a google event already
      if (!task.syncWithGoogle && !task.googleEventId) {
        return;
      }

      if (!task.googleEventId) {
        // Create a new calendar event
        const eventId = await createCalendarEvent(task, token);
        setTasks(prev => {
          const updated = prev.map(t => t.id === taskId ? { ...t, googleEventId: eventId, isSynced: true } : t);
          localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(updated));
          return updated;
        });
      } else {
        // Update the existing calendar event
        await updateCalendarEvent(task.googleEventId, task, token);
        setTasks(prev => {
          const updated = prev.map(t => t.id === taskId ? { ...t, isSynced: true } : t);
          localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error(`Error in direct sync of task ${taskId} to Google Calendar:`, err);
      throw err; // propagates to queue re-adder
    }
  };

  // Queued Sync with local debounce and emulated SQLite Table Consolidation
  const queueTaskSync = (taskId: string, currentTasksList?: Task[], action: 'INSERT' | 'UPDATE' | 'DELETE' = 'UPDATE') => {
    // Clear existing timer if any for this task to achieve debounce!
    if (debounceTimers.current[taskId]) {
      clearTimeout(debounceTimers.current[taskId]);
    }

    const list = currentTasksList || tasks;
    const task = list.find((t: Task) => t.id === taskId) || { id: taskId, title: 'Tarefa Removida', completed: true, priority: 'low' as TaskPriority, category: 'Geral', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isSynced: false, pomodoroCount: 0, pomodorosTarget: 1 } as Task;

    // Persist into sqlite/hive-simulated database table with upsert/collapsing consolidation rules
    SyncQueueDB.upsert(taskId, action, task);

    // Sync React SyncQueue state keys directly with SQLite table primary/foreign keys
    const entries = SyncQueueDB.getEntries();
    const queueIds = entries.map(e => e.taskId);
    setSyncQueue(queueIds);
    localStorage.setItem('citrino_google_sync_queue', JSON.stringify(queueIds));

    // Mark task locally as NOT synced in the main task list to give visual feedback (yellow/orange sync badge)
    if (action !== 'DELETE') {
      setTasks(prev => {
        const updated = prev.map(t => t.id === taskId ? { ...t, isSynced: false } : t);
        localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(updated));
        return updated;
      });
    }

    // Set debounce timer (1500ms delay)
    debounceTimers.current[taskId] = setTimeout(() => {
      processTaskFromQueue(taskId);
    }, 1500);
  };

  const processTaskFromQueue = async (taskId: string) => {
    if (isCurrentlyOffline) {
      console.log(`[Sync Queue] Simulated offline. Row for task ${taskId} remains safely in simulated SQLite database.`);
      return;
    }

    const entries = SyncQueueDB.getEntries();
    const entry = entries.find(e => e.taskId === taskId);
    if (!entry) return;

    try {
      if (entry.action === 'DELETE') {
        const token = await getAccessToken();
        if (token && entry.payload.googleEventId) {
          await deleteCalendarEvent(entry.payload.googleEventId, token);
        }
      } else {
        // Run final consolidated API upsert logic
        await syncTaskToGoogleDirect(taskId);
      }
      
      // On successful background transaction, delete rows from our SQLite table
      SyncQueueDB.remove(taskId);

      // Mark the active task in state as successfully synchronized and true!
      setTasks(prev => {
        const updated = prev.map(t => t.id === taskId ? { ...t, isSynced: true } : t);
        localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(updated));
        return updated;
      });

      // Update React state queue list
      const latestEntries = SyncQueueDB.getEntries();
      const latestQueueIds = latestEntries.map(e => e.taskId);
      setSyncQueue(latestQueueIds);
      localStorage.setItem('citrino_google_sync_queue', JSON.stringify(latestQueueIds));
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      console.warn(`[Sync Queue] Sync failed for task ${taskId}. Recording failure for exponential backoff: ${errorMsg}`);
      
      // Compute and persist exponential delay
      SyncQueueDB.recordFailure(taskId, errorMsg);
      
      // Ensure syncQueue state is synced with SQLite table entries
      const latestQueueIds = SyncQueueDB.getEntries().map(e => e.taskId);
      setSyncQueue(latestQueueIds);
      localStorage.setItem('citrino_google_sync_queue', JSON.stringify(latestQueueIds));
    }
  };

  const processSyncQueue = async () => {
    if (isCurrentlyOffline) return;

    const entries = SyncQueueDB.getEntries();
    if (entries.length === 0) return;

    // Get ONLY eligible entries to prevent failed/cooling down tasks from locking processing
    const eligibleEntries = SyncQueueDB.getEligibleEntries();
    if (eligibleEntries.length === 0) {
      console.log(`[Sync Queue DB] Fila possui ${entries.length} tarefas pendentes, mas todas estão em cooldown de backoff ativo.`);
      return;
    }

    console.log(`[Sync Queue DB] Consolidando e drenando ${eligibleEntries.length} tarefas elegíveis (Total pendente: ${entries.length}) para o Google Agenda...`);
    setIsGoogleSyncing(true);

    try {
      for (const entry of eligibleEntries) {
        try {
          if (entry.action === 'DELETE') {
            const token = await getAccessToken();
            if (token && entry.payload.googleEventId) {
              await deleteCalendarEvent(entry.payload.googleEventId, token);
            }
          } else {
            await syncTaskToGoogleDirect(entry.taskId);
          }
          
          // Transaction complete, remove this row
          SyncQueueDB.remove(entry.taskId);
          
          // Mark as synchronized in general task state
          setTasks(prev => {
            const updated = prev.map(t => t.id === entry.taskId ? { ...t, isSynced: true } : t);
            localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(updated));
            return updated;
          });
        } catch (e: any) {
          const errorMsg = e?.message || String(e);
          console.error(`[Sync Queue DB] Erro específico durante sincronização da tarefa ${entry.taskId}:`, e);
          
          // Increment attempts and set backoff cooldown, without blocking other tasks in the loop
          SyncQueueDB.recordFailure(entry.taskId, errorMsg);
        }
      }

      // Re-evaluate Sync Queue state
      const finalized = SyncQueueDB.getEntries().map(e => e.taskId);
      setSyncQueue(finalized);
      localStorage.setItem('citrino_google_sync_queue', JSON.stringify(finalized));
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  // Sync wrapper that triggers queuing under-the-hood with action type
  const syncTaskToGoogle = async (taskId: string, currentTasksList?: Task[], action: 'INSERT' | 'UPDATE' | 'DELETE' = 'UPDATE') => {
    queueTaskSync(taskId, currentTasksList, action);
  };

  const syncAllTasksToGoogle = async () => {
    const token = await getAccessToken();
    if (!token) return;

    setIsGoogleSyncing(true);
    try {
      const updatedTasks = [...tasks];
      for (const task of updatedTasks) {
        if (task.syncWithGoogle || task.googleEventId) {
          try {
            if (!task.googleEventId) {
              const eventId = await createCalendarEvent(task, token);
              task.googleEventId = eventId;
              task.isSynced = true;
            } else {
              await updateCalendarEvent(task.googleEventId, task, token);
              task.isSynced = true;
            }
          } catch (e) {
            console.error(`Error syncing task ${task.id} to Google Calendar:`, e);
          }
        }
      }
      saveTasksList(updatedTasks);
    } catch (err) {
      console.error('Error syncing all tasks to Google Calendar:', err);
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const connectGoogle = async () => {
    try {
      setIsGoogleSyncing(true);
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setIsGoogleConnected(true);
      }
    } catch (err) {
      console.error('Failed to connect with Google Calendar:', err);
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const disconnectGoogle = async () => {
    try {
      await googleLogout();
      setGoogleUser(null);
      setIsGoogleConnected(false);
    } catch (err) {
      console.error('Failed to disconnect Google Calendar:', err);
    }
  };

  const backupToGoogleDrive = async (): Promise<{ success: boolean; message: string }> => {
    setIsGoogleDriveOperating(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Conta Google não conectada ou sessão expirada. Por favor, conecte-se novamente.');
      }

      const backupData = {
        tasks,
        xp,
        level,
        soundEnabled,
        theme,
        backupDate: new Date().toISOString(),
        version: '1.0'
      };
      const backupContent = JSON.stringify(backupData, null, 2);

      const query = encodeURIComponent("name = 'citrino_tasks_backup.json' and trashed = false");
      const resQuery = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime)`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataQuery = await resQuery.json();
      const existingFiles = dataQuery.files || [];

      if (existingFiles.length > 0) {
        const fileId = existingFiles[0].id;
        const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: backupContent
        });
        if (!uploadRes.ok) {
          throw new Error('Falha ao atualizar o arquivo de backup existente no Google Drive.');
        }
      } else {
        const metaRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'citrino_tasks_backup.json',
            mimeType: 'application/json'
          })
        });
        if (!metaRes.ok) {
          throw new Error('Falha ao criar o arquivo de backup no Google Drive.');
        }
        const fileMetadata = await metaRes.json();
        const fileId = fileMetadata.id;

        const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: backupContent
        });
        if (!uploadRes.ok) {
          throw new Error('Falha ao fazer upload dos dados de backup para o Google Drive.');
        }
      }

      return { success: true, message: 'Backup concluído com sucesso no seu Google Drive!' };
    } catch (err: any) {
      console.error('Error backing up to Google Drive:', err);
      return { success: false, message: err.message || 'Ocorreu um erro ao realizar o backup.' };
    } finally {
      setIsGoogleDriveOperating(false);
    }
  };

  const restoreFromGoogleDrive = async (): Promise<{ success: boolean; message: string }> => {
    setIsGoogleDriveOperating(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Conta Google não conectada ou sessão expirada. Por favor, conecte-se novamente.');
      }

      const query = encodeURIComponent("name = 'citrino_tasks_backup.json' and trashed = false");
      const resQuery = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime)`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataQuery = await resQuery.json();
      const existingFiles = dataQuery.files || [];

      if (existingFiles.length === 0) {
        throw new Error('Nenhum arquivo de backup "citrino_tasks_backup.json" foi encontrado no seu Google Drive.');
      }

      const fileId = existingFiles[0].id;
      const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!contentRes.ok) {
        throw new Error('Falha ao ler o arquivo de backup do Google Drive.');
      }

      const backupData = await contentRes.json();
      
      if (backupData.tasks && Array.isArray(backupData.tasks)) {
        setTasks(backupData.tasks);
        localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(backupData.tasks));
      }
      if (backupData.xp !== undefined && typeof backupData.xp === 'number') {
        setXp(backupData.xp);
        localStorage.setItem(LOCAL_STORAGE_KEY_XP, backupData.xp.toString());
      }
      if (backupData.level !== undefined && typeof backupData.level === 'number') {
        setLevel(backupData.level);
        localStorage.setItem(LOCAL_STORAGE_KEY_LEVEL, backupData.level.toString());
      }
      if (backupData.theme === 'light' || backupData.theme === 'dark') {
        setTheme(backupData.theme);
        localStorage.setItem('citrino_theme', backupData.theme);
      }
      if (backupData.soundEnabled !== undefined && typeof backupData.soundEnabled === 'boolean') {
        setSoundEnabledState(backupData.soundEnabled);
        localStorage.setItem('citrino_sound_enabled', backupData.soundEnabled.toString());
      }

      return { success: true, message: 'Dados restaurados com sucesso do seu Google Drive!' };
    } catch (err: any) {
      console.error('Error restoring from Google Drive:', err);
      return { success: false, message: err.message || 'Ocorreu um erro ao restaurar o backup.' };
    } finally {
      setIsGoogleDriveOperating(false);
    }
  };

  const exportCSVToGoogleDrive = async (csvContent: string): Promise<{ success: boolean; message: string }> => {
    setIsGoogleDriveOperating(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Conta Google não conectada ou sessão expirada. Por favor, conecte-se novamente.');
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `citrino_tarefas_concluidas_${dateStr}.csv`;

      const metaRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: filename,
          mimeType: 'text/csv'
        })
      });
      if (!metaRes.ok) {
        throw new Error('Falha ao criar o arquivo CSV no Google Drive.');
      }
      const fileMetadata = await metaRes.json();
      const fileId = fileMetadata.id;

      const bomContent = "\ufeff" + csvContent;
      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/csv;charset=utf-8;'
        },
        body: bomContent
      });
      if (!uploadRes.ok) {
        throw new Error('Falha ao enviar o arquivo CSV para o Google Drive.');
      }

      return { success: true, message: `Histórico CSV exportado com sucesso para o seu Google Drive com o arquivo "${filename}"!` };
    } catch (err: any) {
      console.error('Error exporting CSV to Google Drive:', err);
      return { success: false, message: err.message || 'Ocorreu um erro ao exportar o CSV.' };
    } finally {
      setIsGoogleDriveOperating(false);
    }
  };

  const addTask = (newTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'pomodoroCount'>) => {
    const id = 'task-' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    
    // Parse title for date keywords (e.g. hoje, amanhã, segunda, etc)
    const nlpResult = parseNaturalLanguageDate(newTaskData.title);
    const finalTitle = nlpResult.title;
    const finalDueDate = newTaskData.dueDate || nlpResult.dueDate || '';
    
    const newTask: Task = {
      ...newTaskData,
      title: finalTitle,
      dueDate: finalDueDate,
      id,
      createdAt: now,
      updatedAt: now,
      isSynced: false, // Created offline, needs synchronization
      pomodoroCount: 0,
    };

    const updatedTasks = [newTask, ...tasks];
    saveTasksList(updatedTasks);
    // Award 15 XP for planning / creating a task
    awardXP(15);

    // If marked to sync with Google Agenda, run sync in background
    if (newTask.syncWithGoogle) {
      setTimeout(() => {
        syncTaskToGoogle(id, updatedTasks, 'INSERT');
      }, 100);
    }
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const now = new Date().toISOString();
    
    let finalUpdates = { ...updates };
    if (updates.title) {
      const nlpResult = parseNaturalLanguageDate(updates.title);
      finalUpdates.title = nlpResult.title;
      if (nlpResult.dueDate && !updates.dueDate) {
        finalUpdates.dueDate = nlpResult.dueDate;
      }
    }

    const updated = tasks.map((task) => {
      if (task.id === id) {
        const changesNeedSync = 
          finalUpdates.title !== undefined || 
          finalUpdates.description !== undefined || 
          finalUpdates.completed !== undefined || 
          finalUpdates.dueDate !== undefined || 
          finalUpdates.priority !== undefined ||
          finalUpdates.recurrence !== undefined ||
          finalUpdates.syncWithGoogle !== undefined;

        return {
          ...task,
          ...finalUpdates,
          updatedAt: now,
          isSynced: changesNeedSync ? false : (finalUpdates.isSynced ?? task.isSynced),
        };
      }
      return task;
    });
    saveTasksList(updated);

    // Call calendar update immediately if exists on Google or marked to sync
    const targetTask = updated.find(t => t.id === id);
    if (targetTask && (targetTask.syncWithGoogle || targetTask.googleEventId)) {
      setTimeout(() => {
        syncTaskToGoogle(id, updated, 'UPDATE');
      }, 100);
    }
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    const updated = tasks.filter((task) => task.id !== id);
    saveTasksList(updated);
    
    // Deduct standard creation XP if deleted uncompleted key task
    if (taskToDelete && !taskToDelete.completed) {
      deductXP(10);
    }

    // Call delete calendar event if synced to google
    if (taskToDelete && taskToDelete.googleEventId) {
      if (isCurrentlyOffline) {
        syncTaskToGoogle(id, [taskToDelete], 'DELETE');
      } else {
        getAccessToken().then(token => {
          if (token) {
            deleteCalendarEvent(taskToDelete.googleEventId!, token).catch(e => {
              console.error('Error deleting event on calendar, fallback queuing as delete:', e);
              syncTaskToGoogle(id, [taskToDelete], 'DELETE');
            });
          } else {
            syncTaskToGoogle(id, [taskToDelete], 'DELETE');
          }
        });
      }
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
          // Play micro-interaction descending reverse click sound!
          if (soundEnabled) {
            playReverseClickSound();
          }
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

    // Call calendar update immediately if exists on Google or marked to sync
    const completedTask = updated.find(t => t.id === id);
    if (completedTask && (completedTask.googleEventId || completedTask.syncWithGoogle)) {
      setTimeout(() => {
        syncTaskToGoogle(id, updated);
      }, 100);
    }
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

  const setDefaultReminderMinutes = (minutes: number) => {
    setDefaultReminderMinutesState(minutes);
    localStorage.setItem('citrino_default_reminder_minutes', minutes.toString());
  };

  const playFocusSound = () => {
    if (soundEnabled) {
      playFocusSoundInternal();
    }
  };

  const playSearchSound = () => {
    if (soundEnabled) {
      playSearchSoundInternal();
    }
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

  const setAutoClearFrequency = (frequency: 'none' | 'daily' | 'weekly' | 'monthly') => {
    setAutoClearFrequencyState(frequency);
    localStorage.setItem('citrino_auto_clear_frequency', frequency);
    if (frequency !== 'none' && !localStorage.getItem('citrino_last_auto_clear_timestamp')) {
      localStorage.setItem('citrino_last_auto_clear_timestamp', Date.now().toString());
    }
  };

  // Automatic Cleanup Effect Based on Selected Frequency
  useEffect(() => {
    if (autoClearFrequency === 'none' || loading) return;

    const lastClearStr = localStorage.getItem('citrino_last_auto_clear_timestamp');
    const now = Date.now();
    let threshold = 0;

    if (autoClearFrequency === 'daily') {
      threshold = 24 * 60 * 60 * 1000;
    } else if (autoClearFrequency === 'weekly') {
      threshold = 7 * 24 * 60 * 60 * 1000;
    } else if (autoClearFrequency === 'monthly') {
      threshold = 30 * 24 * 60 * 60 * 1000;
    }

    if (!lastClearStr) {
      localStorage.setItem('citrino_last_auto_clear_timestamp', now.toString());
      return;
    }

    const lastClear = parseInt(lastClearStr, 10);
    if (isNaN(lastClear) || now - lastClear >= threshold) {
      console.log(`[Database Optimization] Performing automatic cleanup of completed tasks (Frequency: ${autoClearFrequency})`);
      setTasks((prevTasks) => {
        const completedCount = prevTasks.filter(t => t.completed).length;
        if (completedCount === 0) {
          localStorage.setItem('citrino_last_auto_clear_timestamp', now.toString());
          return prevTasks;
        }

        const updated = prevTasks.filter((task) => !task.completed);
        localStorage.setItem('citrino_tasks_mvp', JSON.stringify(updated));
        localStorage.setItem('citrino_last_auto_clear_timestamp', now.toString());
        return updated;
      });
    }
  }, [autoClearFrequency, loading]);

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
        defaultReminderMinutes,
        autoClearFrequency,
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
        setDefaultReminderMinutes,
        setAutoClearFrequency,
        playFocusSound,
        playSearchSound,
        toggleTheme,
        clearCompletedTasks,
        
        // Google Calendar integration
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
