
let taskManager = null;

const loadModules = async () => {
  try {
    const { TaskManager } = await import('./lib/task-manager.js');
    taskManager = new TaskManager();
    await taskManager.init();
    console.log('AI Batch Assistant: Background service initialized');
  } catch (error) {
    console.error('AI Batch Assistant: Error loading modules', error);
  }
};

loadModules();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'get_tasks':
          if (taskManager) {
            sendResponse({ tasks: taskManager.tasks, status: taskManager.status, stats: taskManager.getStats() });
          }
          break;

        case 'add_tasks':
          if (taskManager) {
            taskManager.addTasks(request.titles);
            sendResponse({ success: true });
          }
          break;

        case 'remove_task':
          if (taskManager) {
            taskManager.removeTask(request.taskId);
            sendResponse({ success: true });
          }
          break;

        case 'clear_tasks':
          if (taskManager) {
            taskManager.clearAll();
            sendResponse({ success: true });
          }
          break;

        case 'start_processing':
          if (taskManager) {
            await taskManager.start();
            sendResponse({ success: true });
          }
          break;

        case 'pause_processing':
          if (taskManager) {
            await taskManager.pause();
            sendResponse({ success: true });
          }
          break;

        case 'reset_processing':
          if (taskManager) {
            await taskManager.reset();
            sendResponse({ success: true });
          }
          break;

        case 'get_config':
          const { StorageManager } = await import('./lib/storage.js');
          const config = await StorageManager.getConfig();
          sendResponse({ config });
          break;

        case 'save_config':
          const { StorageManager: StorageManager2 } = await import('./lib/storage.js');
          await StorageManager2.setConfig(request.config);
          sendResponse({ success: true });
          break;

        case 'download_file':
          const filename = request.filename || `ai_result_${Date.now()}.html`;
          const blob = new Blob([request.content], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: request.saveAs !== false
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              console.error('Download failed:', chrome.runtime.lastError);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              sendResponse({ success: true, downloadId });
            }
            URL.revokeObjectURL(url);
          });
          return true;

        case 'task_completed':
          if (taskManager) {
            await taskManager.markTaskAsCompleted(request.taskId, request.result);
            chrome.runtime.sendMessage({ 
              action: 'task_completed', 
              taskId: request.taskId, 
              result: request.result 
            }).catch(() => {});
            sendResponse({ success: true });
          }
          break;

        case 'task_failed':
          if (taskManager) {
            await taskManager.markTaskAsFailed(request.taskId, request.error);
            chrome.runtime.sendMessage({ 
              action: 'task_failed', 
              taskId: request.taskId, 
              error: request.error 
            }).catch(() => {});
            sendResponse({ success: true });
          }
          break;

        case 'mark_task_processing':
          if (taskManager) {
            await taskManager.markTaskAsProcessing(request.taskId);
            sendResponse({ success: true });
          }
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('AI Batch Assistant: Error handling message', error);
      sendResponse({ error: error.message });
    }
  })();
  return true;
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('AI Batch Assistant: Extension installed');
  }
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
