
let currentConfig = {};

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  setupEventListeners();
});

const setupEventListeners = () => {
  document.getElementById('saveBtn').addEventListener('click', saveConfig);
  document.getElementById('resetBtn').addEventListener('click', resetConfig);
};

const loadConfig = async () => {
  const response = await chrome.runtime.sendMessage({ action: 'get_config' });
  currentConfig = response.config || {};
  document.getElementById('maxWaitTime').value = currentConfig.max_wait_time || 120;
  document.getElementById('matchPatterns').value = currentConfig.match_patterns || '';
  document.getElementById('markdownConvert').checked = currentConfig.markdown_convert !== false;
};

const saveConfig = async () => {
  const config = {
    ...currentConfig,
    max_wait_time: parseInt(document.getElementById('maxWaitTime').value) || 120,
    match_patterns: document.getElementById('matchPatterns').value,
    markdown_convert: document.getElementById('markdownConvert').checked
  };
  await chrome.runtime.sendMessage({ action: 'save_config', config });
  alert('设置已保存！');
};

const resetConfig = async () => {
  if (confirm('确定要重置为默认设置吗？')) {
    const defaultConfig = {
      max_wait_time: 120,
      match_patterns: '',
      markdown_convert: true,
      platforms: ['deepseek', 'chatgpt', 'claude', 'grok', 'perplexity', 'coze']
    };
    await chrome.runtime.sendMessage({ action: 'save_config', config: defaultConfig });
    await loadConfig();
    alert('设置已重置！');
  }
};
