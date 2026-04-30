
let currentAdapter = null;

const loadModules = async () => {
  try {
    const { PlatformFactory } = await import('./lib/ai-platforms/index.js');
    currentAdapter = PlatformFactory.getAdapter(window.location.href);
    console.log('AI Batch Assistant: Content script loaded for', PlatformFactory.getPlatformName(window.location.href));
  } catch (error) {
    console.error('AI Batch Assistant: Error loading content script modules', error);
  }
};

loadModules();

const waitForElement = (selector, timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      const element = typeof selector === 'function' ? selector() : document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error('Element not found'));
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });
};

const waitForCondition = (condition, timeout = 120000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'fill_input':
          if (currentAdapter) {
            await currentAdapter.fillInput(request.text);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'Adapter not found' });
          }
          break;

        case 'click_send':
          if (currentAdapter) {
            await currentAdapter.clickSend();
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'Adapter not found' });
          }
          break;

        case 'check_continue':
          if (currentAdapter) {
            const hasContinue = currentAdapter.findContinueButton() !== null;
            if (hasContinue) {
              await currentAdapter.clickContinue();
            }
            sendResponse({ hasContinue, success: true });
          } else {
            sendResponse({ success: false, error: 'Adapter not found' });
          }
          break;

        case 'click_copy':
          if (currentAdapter) {
            await currentAdapter.clickCopy();
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'Adapter not found' });
          }
          break;

        case 'is_generating':
          if (currentAdapter) {
            const isGenerating = currentAdapter.isGenerating();
            sendResponse({ isGenerating });
          } else {
            sendResponse({ success: false, error: 'Adapter not found' });
          }
          break;

        case 'get_clipboard':
          try {
            const text = await navigator.clipboard.readText();
            sendResponse({ success: true, text });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'process_task':
          if (currentAdapter) {
            await processTask(request.task, request.config);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'Adapter not found' });
          }
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('AI Batch Assistant: Error in content script', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  return true;
});

const processTask = async (task, config) => {
  try {
    await chrome.runtime.sendMessage({ action: 'mark_task_processing', taskId: task.id });
    
    console.log('AI Batch Assistant: Filling input', task.title);
    await currentAdapter.fillInput(task.title);
    await new Promise(r => setTimeout(r, 500));

    console.log('AI Batch Assistant: Clicking send');
    await currentAdapter.clickSend();
    await new Promise(r => setTimeout(r, 1000));

    console.log('AI Batch Assistant: Waiting for generation to complete');
    const maxWaitTime = config.max_wait_time || 120;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime * 1000) {
      const continueButton = currentAdapter.findContinueButton();
      if (continueButton) {
        console.log('AI Batch Assistant: Clicking continue button');
        await currentAdapter.clickContinue();
        await new Promise(r => setTimeout(r, 2000));
      }

      if (!currentAdapter.isGenerating()) {
        break;
      }

      await new Promise(r => setTimeout(r, 1000));
    }

    await new Promise(r => setTimeout(r, 2000));

    console.log('AI Batch Assistant: Clicking copy');
    await currentAdapter.clickCopy();
    await new Promise(r => setTimeout(r, 500));

    let text = '';
    try {
      text = await navigator.clipboard.readText();
      console.log('AI Batch Assistant: Got clipboard content');
    } catch (clipboardError) {
      console.warn('AI Batch Assistant: Failed to read clipboard, trying to get content from page');
      const responseElements = document.querySelectorAll('[class*="message"], [class*="response"], [class*="answer"]');
      if (responseElements.length > 0) {
        text = responseElements[responseElements.length - 1].textContent;
      }
    }

    const [{ ContentConverter }, { PlatformFactory: PF }, { TitleExtractor }, { MetadataParser }, { Utils }] = await Promise.all([
      import('./lib/content-converter.js'),
      import('./lib/ai-platforms/index.js'),
      import('./lib/title-extractor.js'),
      import('./lib/metadata-parser.js'),
      import('./lib/utils.js')
    ]);
    
    const result = ContentConverter.process(
      text || task.title,
      PF.getPlatformName(window.location.href),
      window.location.href,
      task.id,
      config.match_patterns,
      TitleExtractor,
      MetadataParser,
      Utils
    );

    const filename = `${task.id}_${Utils.sanitizeFilename(result.title)}_${Date.now()}.html`;
    
    chrome.runtime.sendMessage({
      action: 'download_file',
      content: result.html,
      filename: filename,
      saveAs: false
    });

    await chrome.runtime.sendMessage({
      action: 'task_completed',
      taskId: task.id,
      result: result
    });

  } catch (error) {
    console.error('AI Batch Assistant: Error processing task', error);
    await chrome.runtime.sendMessage({
      action: 'task_failed',
      taskId: task.id,
      error: error.message
    });
    throw error;
  }
};
