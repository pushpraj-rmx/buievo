import { create } from 'zustand';
import { toast } from 'sonner';
import { configService } from './config';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  progress: number;
  speed?: string;
  eta?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  abortController?: AbortController;
}

interface TaskStore {
  tasks: Map<string, Task>;
  taskHistory: Map<string, Task>;
  autoOpenWorkerArea: boolean;
  addTask: (task: Omit<Task, 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  getTask: (id: string) => Task | undefined;
  getAllTasks: () => Task[];
  getActiveTasks: () => Task[];
  getTaskHistory: () => Task[];
  cancelTask: (id: string) => void;
  clearCompletedTasks: () => void;
  clearTaskHistory: () => void;
  setAutoOpenWorkerArea: (autoOpen: boolean) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: new Map(),
  taskHistory: new Map(),
  autoOpenWorkerArea: configService.getWorkerAreaConfig().autoOpen,

  addTask: (task) => {
    const newTask: Task = {
      ...task,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => {
      const newTasks = new Map(state.tasks);
      newTasks.set(task.id, newTask);
      return { tasks: newTasks };
    });

    // Auto-open worker area if enabled
    const workerAreaConfig = configService.getWorkerAreaConfig();
    if (workerAreaConfig.autoOpen) {
      // Dispatch custom event to trigger auto-open
      window.dispatchEvent(new CustomEvent('openWorkerArea'));
    }

    // Show toast notification for new task if enabled
    if (workerAreaConfig.showNotifications) {
      toast.info(`${task.name} started`, {
        id: task.id,
        duration: Infinity,
        action: {
          label: 'Cancel',
          onClick: () => get().cancelTask(task.id),
        },
      });
    }
  },

  updateTask: (id, updates) => {
    set((state) => {
      const task = state.tasks.get(id);
      if (!task) return state;

      const updatedTask: Task = {
        ...task,
        ...updates,
        updatedAt: new Date(),
      };

      // Move to history when task is completed, failed, or cancelled
      if (updates.status === 'completed' || updates.status === 'failed' || updates.status === 'cancelled') {
        const taskWithCompletedAt = {
          ...updatedTask,
          completedAt: new Date(),
        };

        const newTasks = new Map(state.tasks);
        newTasks.delete(id);
        
        const newHistory = new Map(state.taskHistory);
        newHistory.set(id, taskWithCompletedAt);

        // Update toast based on status if notifications are enabled
        const workerAreaConfig = configService.getWorkerAreaConfig();
        if (workerAreaConfig.showNotifications) {
          if (updates.status === 'completed') {
            toast.success(`${task.name} completed successfully`, {
              id,
              duration: 3000,
            });
          } else if (updates.status === 'failed') {
            toast.error(`${task.name} failed: ${updates.error || 'Unknown error'}`, {
              id,
              duration: 5000,
            });
          } else if (updates.status === 'cancelled') {
            toast.info(`${task.name} cancelled`, {
              id,
              duration: 3000,
            });
          }
        }

        return { tasks: newTasks, taskHistory: newHistory };
      }

      const newTasks = new Map(state.tasks);
      newTasks.set(id, updatedTask);

      if (updates.progress !== undefined) {
        // Update progress in toast if notifications are enabled
        const workerAreaConfig = configService.getWorkerAreaConfig();
        if (workerAreaConfig.showNotifications) {
          toast.info(`${task.name} - ${updates.progress}%`, {
            id,
            duration: Infinity,
            action: {
              label: 'Cancel',
              onClick: () => get().cancelTask(id),
            },
          });
        }
      }

      return { tasks: newTasks };
    });
  },

  removeTask: (id) => {
    set((state) => {
      const newTasks = new Map(state.tasks);
      newTasks.delete(id);
      return { tasks: newTasks };
    });

    // Dismiss toast
    toast.dismiss(id);
  },

  getTask: (id) => {
    return get().tasks.get(id);
  },

  getAllTasks: () => {
    return Array.from(get().tasks.values());
  },

  getActiveTasks: () => {
    return Array.from(get().tasks.values()).filter(
      (task) => task.status === 'pending' || task.status === 'running'
    );
  },

  getTaskHistory: () => {
    return Array.from(get().taskHistory.values()).sort(
      (a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
    );
  },

  cancelTask: (id) => {
    const task = get().getTask(id);
    if (!task) return;

    // Abort the upload if controller exists
    if (task.abortController) {
      task.abortController.abort();
    }

    get().updateTask(id, { status: 'cancelled' });
  },

  clearCompletedTasks: () => {
    set((state) => {
      const newTasks = new Map();
      for (const [id, task] of state.tasks) {
        if (task.status !== 'completed' && task.status !== 'failed' && task.status !== 'cancelled') {
          newTasks.set(id, task);
        } else {
          toast.dismiss(id);
        }
      }
      return { tasks: newTasks };
    });
  },

  clearTaskHistory: () => {
    set(() => {
      return { taskHistory: new Map() };
    });
  },

  setAutoOpenWorkerArea: (autoOpen) => {
    set({ autoOpenWorkerArea: autoOpen });
    // Also update the centralized config
    configService.updateWorkerAreaConfig({ autoOpen });
  },
}));
