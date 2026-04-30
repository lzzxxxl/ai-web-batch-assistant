
let currentTasks = [];
let currentStatus = 'idle';
let currentStats = {};
let isProcessing = false;

document.addEventListener('DOMContentLoaded', async () => { await loadTasks(); setupEventListeners(); });

const setupEventListeners = () => {
  document.getElementById('startBtn').addEventListener('click', startProcessing);
  document.getElementById('pauseBtn').addEventListener('click', pauseProcessing);
  document.getElementById('resetBtn').addEventListener('click', resetProcessing);
  document.getElementById('clearCompletedBtn').addEventListener('click', clearCompleted);
  document.getElementById('addTasksBtn').addEventListener('click', addTasks);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('fileInput').click());
  document.getElementById('fileInput').addEventListener('change', handleFileImport);
};

const loadTasks = async () => {
  const response = await chrome.runtime.sendMessage({ action: 'get_tasks' });
  if (response) { currentTasks = response.tasks || []; currentStatus = response.status || 'idle'; currentStats = response.stats || {}; updateUI(); }
};

const updateUI = () => {
  document.getElementById('totalTasks').textContent = currentStats.total || 0;
  document.getElementById('completedTasks').textContent = currentStats.completed || 0;
  document.getElementById('pendingTasks').textContent = currentStats.pending || 0;
  document.getElementById('taskCount').textContent = `${currentTasks.length} 个任务`;
  document.getElementById('startBtn').disabled = currentStatus === 'running' || currentTasks.filter(t => t.status === 'pending').length === 0;
  document.getElementById('pauseBtn').disabled = currentStatus !== 'running';
  const progressSection = document.getElementById('progressSection');
  if (currentStatus === 'running' || currentStatus === 'paused') {
    progressSection.style.display = 'block';
    document.getElementById('progressBar').style.width = `${currentStats.progress || 0}%`;
    const currentTask = currentTasks.find(t => t.status === 'processing');
    if (currentTask) document.getElementById('progressText').textContent = `正在处理: ${currentTask.title}`;
  } else { progressSection.style.display = 'none'; }
  renderTaskList();
};

const renderTaskList = () => {
  const container = document.getElementById('taskListContainer');
  const emptyState = document.getElementById('emptyState');
  if (currentTasks.length === 0) { emptyState.style.display = 'block'; return; }
  emptyState.style.display = 'none';
  const tasksHtml = currentTasks.map(task => {
    const statusClass = `status-${task.status}`;
    const statusText = getStatusText(task.status);
    return `<div class="task-item" data-id="${task.id}"><div class="task-title">${escapeHtml(task.title)}</div><div style="display: flex; align-items: center; gap: 8px;"><span class="status-tag ${statusClass}">${statusText}</span><div class="task-actions">${task.status === 'pending' ? `<button class="btn btn-danger" onclick="removeTask('${task.id}')">删除</button>` : ''}</div></div></div>`;
  }).join('');
  container.innerHTML = tasksHtml;
};

const getStatusText = (status) => ({ pending: '待处理', processing: '处理中', completed: '已完成', failed: '失败', skipped: '已跳过' }[status] || status);
const escapeHtml = (text) => { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; };

const addTasks = () => {
  const input = document.getElementById('taskInput');
  const text = input.value.trim();
  if (!text) { alert('请输入任务标题'); return; }
  const titles = text.split('\n').map(t => t.trim()).filter(t => t);
  chrome.runtime.sendMessage({ action: 'add_tasks', titles });
  input.value = '';
  setTimeout(loadTasks, 100);
};

const handleFileImport = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const titles = text.split('\n').map(t => t.trim()).filter(t => t);
    if (titles.length > 0) { chrome.runtime.sendMessage({ action: 'add_tasks', titles }); setTimeout(loadTasks, 100); }
  };
  reader.readAsText(file);
  event.target.value = '';
};

window.removeTask = (taskId) => { if (confirm('确定要删除这个任务吗？')) { chrome.runtime.sendMessage({ action: 'remove_task', taskId }); setTimeout(loadTasks, 100); } };

const clearCompleted = async () => {
  if (confirm('确定要清除所有已完成的任务吗？')) {
    const pendingTasks = currentTasks.filter(t => t.status === 'pending' || t.status === 'processing');
    await chrome.runtime.sendMessage({ action: 'clear_tasks' });
    if (pendingTasks.length > 0) await chrome.runtime.sendMessage({ action: 'add_tasks', titles: pendingTasks.map(t => t.title) });
    await loadTasks();
  }
};

const startProcessing = async () => {
  const tabs = await chrome.tabs.query({ url: ['https://chat.openai.com/*', 'https://chat.deepseek.com/*', 'https://claude.ai/*', 'https://grok.x.ai/*', 'https://perplexity.ai/*', 'https://coze.com/*'] });
  if (tabs.length === 0) { alert('请先打开一个AI平台页面（如DeepSeek、ChatGPT等）'); return; }
  await chrome.runtime.sendMessage({ action: 'start_processing' });
  await loadTasks();
  processLoop();
};

const pauseProcessing = async () => { await chrome.runtime.sendMessage({ action: 'pause_processing' }); await loadTasks(); isProcessing = false; };
const resetProcessing = async () => { if (confirm('确定要重置所有任务吗？')) { await chrome.runtime.sendMessage({ action: 'reset_processing' }); await loadTasks(); isProcessing = false; } };

const processLoop = async () => {
  isProcessing = true;
  while (isProcessing) {
    await loadTasks();
    if (currentStatus !== 'running') break;
    const nextTask = currentTasks.find(t => t.status === 'pending');
    if (!nextTask) { alert('所有任务已完成！'); isProcessing = false; break; }
    const tabs = await chrome.tabs.query({ url: ['https://chat.openai.com/*', 'https://chat.deepseek.com/*', 'https://claude.ai/*', 'https://grok.x.ai/*', 'https://perplexity.ai/*', 'https://coze.com/*'] });
    if (tabs.length === 0) { alert('未找到AI平台标签页'); await pauseProcessing(); break; }
    const configResponse = await chrome.runtime.sendMessage({ action: 'get_config' });
    const config = configResponse.config;
    await chrome.tabs.update(tabs[0].id, { active: true });
    await chrome.windows.update(tabs[0].windowId, { focused: true });
    try {
      await chrome.tabs.sendMessage(tabs[0].id, { action: 'process_task', task: nextTask, config });
      await waitForTaskCompletion(nextTask.id);
    } catch (error) {
      console.error('Error processing task:', error);
      await chrome.runtime.sendMessage({ action: 'task_failed', taskId: nextTask.id, error: error.message });
    }
    await new Promise(r => setTimeout(r, 1000));
  }
};

const waitForTaskCompletion = async (taskId) => {
  return new Promise((resolve) => {
    const check = async () => {
      const response = await chrome.runtime.sendMessage({ action: 'get_tasks' });
      const task = response.tasks.find(t => t.id === taskId);
      if (task && task.status !== 'pending' && task.status !== 'processing') resolve();
      else setTimeout(check, 500);
    };
    check();
  });
};

chrome.runtime.onMessage.addListener((message) => { if (message.action === 'task_completed' || message.action === 'task_failed') loadTasks(); });
