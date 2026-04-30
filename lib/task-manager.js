
import { Utils } from './utils.js';
import { StorageManager } from './storage.js';

export class TaskManager {
  static STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    SKIPPED: 'skipped'
  };

  constructor() {
    this.tasks = [];
    this.status = 'idle';
    this.currentTaskIndex = -1;
    this.listeners = [];
  }

  addListener(listener) { this.listeners.push(listener); }
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) this.listeners.splice(index, 1);
  }
  notifyListeners() { for (const listener of this.listeners) listener(); }

  async init() {
    this.tasks = await StorageManager.get('tasks', []);
    this.status = await StorageManager.get('task_status', 'idle');
    this.currentTaskIndex = await StorageManager.get('current_task_index', -1);
    this.notifyListeners();
  }

  async saveState() {
    await StorageManager.set('tasks', this.tasks);
    await StorageManager.set('task_status', this.status);
    await StorageManager.set('current_task_index', this.currentTaskIndex);
    this.notifyListeners();
  }

  addTasks(titles) {
    const uniqueTitles = Utils.deduplicateArray(titles);
    const newTasks = uniqueTitles.map((title, index) => ({
      id: Utils.generateId(),
      title,
      status: TaskManager.STATUS.PENDING,
      order: this.tasks.length + index,
      createdAt: new Date().toISOString()
    }));
    this.tasks.push(...newTasks);
    this.saveState();
  }

  addTask(title) { this.addTasks([title]); }

  removeTask(taskId) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index > -1) { this.tasks.splice(index, 1); this.saveState(); }
  }

  clearCompleted() {
    this.tasks = this.tasks.filter(t => 
      t.status !== TaskManager.STATUS.COMPLETED && 
      t.status !== TaskManager.STATUS.SKIPPED &&
      t.status !== TaskManager.STATUS.FAILED
    );
    this.saveState();
  }

  clearAll() { this.tasks = []; this.currentTaskIndex = -1; this.status = 'idle'; this.saveState(); }
  getTask(taskId) { return this.tasks.find(t => t.id === taskId); }
  getCurrentTask() { return (this.currentTaskIndex >= 0 && this.currentTaskIndex < this.tasks.length) ? this.tasks[this.currentTaskIndex] : null; }
  getNextPendingTask() { return this.tasks.find(t => t.status === TaskManager.STATUS.PENDING); }

  async start() { this.status = 'running'; await this.saveState(); }
  async pause() { this.status = 'paused'; await this.saveState(); }
  async reset() {
    this.status = 'idle'; this.currentTaskIndex = -1;
    for (const task of this.tasks) {
      if (task.status === TaskManager.STATUS.PROCESSING) task.status = TaskManager.STATUS.PENDING;
    }
    await this.saveState();
  }

  async updateTaskStatus(taskId, status, result = null) {
    const task = this.getTask(taskId);
    if (task) {
      task.status = status;
      if (result) task.result = result;
      task.updatedAt = new Date().toISOString();
      await this.saveState();
    }
  }

  async markTaskAsProcessing(taskId) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index > -1) { this.currentTaskIndex = index; await this.updateTaskStatus(taskId, TaskManager.STATUS.PROCESSING); }
  }
  async markTaskAsCompleted(taskId, result) { await this.updateTaskStatus(taskId, TaskManager.STATUS.COMPLETED, result); }
  async markTaskAsFailed(taskId, error) { await this.updateTaskStatus(taskId, TaskManager.STATUS.FAILED, { error }); }
  async markTaskAsSkipped(taskId) { await this.updateTaskStatus(taskId, TaskManager.STATUS.SKIPPED); }

  getStats() {
    const total = this.tasks.length;
    const pending = this.tasks.filter(t => t.status === TaskManager.STATUS.PENDING).length;
    const processing = this.tasks.filter(t => t.status === TaskManager.STATUS.PROCESSING).length;
    const completed = this.tasks.filter(t => t.status === TaskManager.STATUS.COMPLETED).length;
    const failed = this.tasks.filter(t => t.status === TaskManager.STATUS.FAILED).length;
    const skipped = this.tasks.filter(t => t.status === TaskManager.STATUS.SKIPPED).length;
    return { total, pending, processing, completed, failed, skipped, progress: total > 0 ? Math.round((completed + failed + skipped) / total * 100) : 0 };
  }
}
