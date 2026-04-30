
import { BasePlatformAdapter } from './base.js';

export class GrokAdapter extends BasePlatformAdapter {
  constructor() { super(); this.name = 'grok'; }

  findInput() { return document.querySelector('textarea') || document.querySelector('div[contenteditable="true"]'); }

  findSendButton() {
    return Array.from(document.querySelectorAll('button')).find(btn => 
      btn.querySelector('svg') && btn.querySelector('svg').outerHTML.includes('send')
    ) || document.querySelector('button[type="submit"]');
  }

  findContinueButton() { return Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('继续') || btn.textContent.includes('Continue')); }
  findCopyButton() { return Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('复制') || btn.textContent.includes('Copy')); }
  isGenerating() { return document.querySelector('.streaming') !== null || document.querySelector('.generating') !== null; }
}
