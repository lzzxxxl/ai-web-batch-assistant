
import { BasePlatformAdapter } from './base.js';

export class DeepSeekAdapter extends BasePlatformAdapter {
  constructor() { super(); this.name = 'deepseek'; }

  findInput() {
    return document.querySelector('textarea[placeholder*="输入"]') || 
           document.querySelector('textarea') ||
           document.querySelector('div[contenteditable="true"]');
  }

  findSendButton() {
    return document.querySelector('button:has(svg), button:has(span)') ||
           document.querySelector('button[type="submit"]') ||
           Array.from(document.querySelectorAll('button')).find(btn => 
             btn.textContent.includes('发送') || btn.textContent.includes('Send')
           );
  }

  findContinueButton() {
    return Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('继续') || btn.textContent.includes('Continue')
    );
  }

  findCopyButton() {
    return Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('复制') || btn.textContent.includes('Copy') ||
      (btn.querySelector('svg') && btn.querySelector('svg').outerHTML.includes('copy'))
    );
  }

  isGenerating() {
    return document.querySelector('.typing-indicator') !== null ||
           document.querySelector('.generating') !== null ||
           document.querySelector('[data-state="generating"]') !== null;
  }
}
