
export class StorageManager {
  static async get(key, defaultValue = null) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] !== undefined ? result[key] : defaultValue);
      });
    });
  }

  static async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }

  static async remove(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, resolve);
    });
  }

  static async getConfig() {
    const config = await this.get('config', {});
    return {
      last_folder: config.last_folder || '',
      auto_save: config.auto_save !== false,
      always_on_top: config.always_on_top || false,
      theme: config.theme || 'system',
      markdown_convert: config.markdown_convert !== false,
      match_patterns: config.match_patterns || '**原文章标题**,**原文件标题**,**文章标题**,**文件标题**',
      platforms: config.platforms || ['deepseek', 'chatgpt', 'claude'],
      save_mode: config.save_mode || 'new_file',
      folder_mode: config.folder_mode || 'none',
      max_wait_time: config.max_wait_time || 120,
      retry_times: config.retry_times || 3
    };
  }

  static async setConfig(config) {
    return this.set('config', config);
  }
}
