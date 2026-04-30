
export const Utils = {
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  formatTimestamp(date = new Date()) {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  },

  sanitizeFilename(title) {
    return title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 100);
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  deduplicateArray(arr) {
    return [...new Set(arr.map(item => item.trim()).filter(item => item))];
  },

  parseTextLines(text) {
    return text.split(/\r?\n/).map(line => line.trim()).filter(line => line);
  }
};
