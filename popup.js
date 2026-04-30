
let currentTasks = [];
let currentStatus = 'idle';
let currentStats = {};

document.addEventListener('DOMContentLoaded', async () => {
  await loadTasks();
  setupEventListeners();
});

const setupEventListeners = () => {
  document.getElementById('startBtn').addEventListener('click', startProcessing);
  document.getElementById('pauseBtn').addEventListener('click', pauseProcessing);
  document.getElementById('resetBtn').addEventListener('click', resetProcessing);
  document.getElementById('addTasksBtn').addEventListener('click', showAddTasksDialog);
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  document.getElementById('openSidebarBtn').addEventListener('click', () => {
    chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    window.close();
  });
};

const loadTasks = async () => {
  const response = await chrome.runtime.sendMessage({ action: 'get_tasks' });
  if (response) {
    currentTasks = response.tasks || [];
    currentStatus = response.status || 'idle';
    currentStats = response.stats || {};
    updateUI();
  }
};

const updateUI = () => {
  document.getElementById('totalTasks').textContent = currentStats.total || 0;
  document.getElementById('completedTasks').textContent = currentStats.completed || 0;
  document.getElementById('pendingTasks').textContent = currentStats.pending || 0;
  updateStatusDisplay();
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  if (currentStatus === 'running' || currentStatus === 'paused') {
    progressContainer.style.display = 'block';
    progressBar.style.width = `${currentStats.progress || 0}%`;
  } else {
    progressContainer.style.display = 'none';
  }
  document.getElementById('startBtn').disabled = currentStatus === 'running';
  document.getElementById('pauseBtn').disabled = currentStatus !== 'running';
  updateTaskList();
};

const updateStatusDisplay = () => {
  const statusText = document.getElementById('statusText');
  const statusBadge = document.getElementById('statusBadge');
  switch (currentStatus) {
    case 'idle':
      statusText.textContent = '准备就绪';
      statusBadge.textContent = '空闲';
      statusBadge.className = 'status-tag status-pending';
      break;
    case 'running':
      statusText.textContent = '正在处理...';
      statusBadge.textContent = '运行中';
      statusBadge.className = 'status-tag status-processing';
      break;
    case 'paused':
      statusText.textContent = '已暂停';
      statusBadge.textContent = '暂停';
      statusBadge.className = 'status-tag status-skipped';
      break;
    default:
      statusText.textContent = '准备就绪';
      statusBadge.textContent = '空闲';
      statusBadge.className = 'status-tag status-pending';
  }
};

const updateTaskList = () => {
  const taskList = document.getElementById('taskList');
  if (currentTasks.length === 0) {
    taskList.innerHTML = '<p class="text-gray-500 text-sm">暂无任务，请点击上方添加任务</p>';
    return;
  }
  taskList.innerHTML = currentTasks.slice(0, 10).map(task => `
    <div class="task-item">
      <span class="task-title">${escapeHtml(task.title)}</span>
      <span class="status-tag status-${task.status}">${getStatusText(task.status)}</span>
    </div>
  `).join('');
  if (currentTasks.length > 10) {
    taskList.innerHTML += `<p class="text-gray-500 text-sm text-center mt-2">还有 ${currentTasks.length - 10} 个任务...</p>`;
  }
};

const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    skipped: '已跳过'
  };
  return statusMap[status] || status;
};

const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const showAddTasksDialog = () => {
  const input = prompt('请输入任务标题（每行一个）：');
  if (input) {
    const titles = input.split('\n').map(t => t.trim()).filter(t => t);
    if (titles.length > 0) {
      chrome.runtime.sendMessage({ action: 'add_tasks', titles });
      setTimeout(loadTasks, 100);
    }
  }
};

const startProcessing = async () => {
  const tabs = await chrome.tabs.query({
    url: [
      'https://chat.openai.com/*',
      'https://chat.deepseek.com/*',
      'https://claude.ai/*',
      'https://grok.x.ai/*',
      'https://perplexity.ai/*',
      'https://coze.com/*'
    ]
  });
  if (tabs.length === 0) {
    alert('请先打开一个AI平台页面（如DeepSeek、ChatGPT等）');
    return;
  }
  await chrome.runtime.sendMessage({ action: 'start_processing' });
  await loadTasks();
  processNextTask();
};

const pauseProcessing = async () => {
  await chrome.runtime.sendMessage({ action: 'pause_processing' });
  await loadTasks();
};

const resetProcessing = async () => {
  if (confirm('确定要重置所有任务吗？')) {
    await chrome.runtime.sendMessage({ action: 'reset_processing' });
    await loadTasks();
  }
};

const processNextTask = async () => {
  await loadTasks();
  if (currentStatus !== 'running') return;
  const nextTask = currentTasks.find(t => t.status === 'pending');
  if (!nextTask) {
    alert('所有任务已完成！');
    await loadTasks();
    return;
  }
  const tabs = await chrome.tabs.query({
    url: [
      'https://chat.openai.com/*',
      'https://chat.deepseek.com/*',
      'https://claude.ai/*',
      'https://grok.x.ai/*',
      'https://perplexity.ai/*',
      'https://coze.com/*'
    ]
  });
  if (tabs.length === 0) {
    alert('未找到AI平台标签页');
    await pauseProcessing();
    return;
  }
  const configResponse = await chrome.runtime.sendMessage({ action: 'get_config' });
  const config = configResponse.config;
  await chrome.tabs.update(tabs[0].id, { active: true });
  await chrome.windows.update(tabs[0].windowId, { focused: true });
  try {
    await chrome.tabs.sendMessage(tabs[0].id, {
      action: 'process_task',
      task: nextTask,
      config
    });
    await new Promise(resolve => {
      const checkCompletion = async () => {
        const resp = await chrome.runtime.sendMessage({ action: 'get_tasks' });
        const updatedTask = resp.tasks.find(t => t.id === nextTask.id);
        if (updatedTask && updatedTask.status !== 'processing') {
          resolve();
        } else {
          setTimeout(checkCompletion, 1000);
        }
      };
      checkCompletion();
    });
  } catch (error) {
    console.error('Error processing task:', error);
  }
  setTimeout(processNextTask, 1000);
};

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'task_completed' || message.action === 'task_failed') {
    loadTasks();
  }
});
