export type TaskPriority = 'low' | 'medium' | 'high';

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
  dueDate?: string; // Format: YYYY-MM-DD
  dueTime?: string; // Format: HH:MM
  priority: TaskPriority;
  category: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  isSynced: boolean; // For tracking sync with cloud
  pomodoroCount: number; // Completed Pomodoro sessions
  pomodorosTarget: number; // Planned Pomodoro sessions
  recurrence?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  googleEventId?: string;
  syncWithGoogle?: boolean;
  reminderMinutes?: number; // Minutes before dueTime for reminder
  subtasks?: SubTask[];
  isPriorityDay?: boolean; // Elite Top 3 active priorities for the day
}

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  isSyncing: boolean;
  xp: number;
  level: number;
  filter: string;
  categoryFilter: string;
  searchQuery: string;
  soundEnabled: boolean;
  theme: 'light' | 'dark';
  defaultReminderMinutes: number;
  autoClearFrequency: 'none' | 'daily' | 'weekly' | 'monthly';
}

export interface TaskContextType extends TaskState {
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'pomodoroCount'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  setFilter: (filter: string) => void;
  setCategoryFilter: (category: string) => void;
  setSearchQuery: (query: string) => void;
  triggerOfflineSync: () => Promise<void>;
  addPomodoroSession: (id: string) => void;
  resetXP: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setDefaultReminderMinutes: (minutes: number) => void;
  setAutoClearFrequency: (frequency: 'none' | 'daily' | 'weekly' | 'monthly') => void;
  playFocusSound: () => void;
  playSearchSound: () => void;
  toggleTheme: () => void;
  clearCompletedTasks: () => void;

  // Google Calendar Integration states & methods
  googleUser: any;
  isGoogleConnected: boolean;
  isGoogleSyncing: boolean;
  connectGoogle: () => Promise<void>;
  disconnectGoogle: () => Promise<void>;
  syncAllTasksToGoogle: () => Promise<void>;
  syncTaskToGoogle: (taskId: string) => Promise<void>;

  // Offline & Queued Sync support
  isOfflineSimulated: boolean;
  setIsOfflineSimulated: (simulated: boolean) => void;
  syncQueue: string[];
  processSyncQueue: () => Promise<void>;

  // Google Drive Integration states & methods
  isGoogleDriveOperating: boolean;
  backupToGoogleDrive: () => Promise<{ success: boolean; message: string }>;
  restoreFromGoogleDrive: () => Promise<{ success: boolean; message: string }>;
  exportCSVToGoogleDrive: (csvContent: string) => Promise<{ success: boolean; message: string }>;
}
