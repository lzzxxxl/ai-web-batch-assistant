
import { BasePlatformAdapter } from './base.js';

export class ClaudeAdapter extends BasePlatformAdapter {
  constructor() { super(); this.name = 'claude'; }

  findInput() {
    return document.querySelector('textarea[placeholder*="Claude"]') ||
           document.querySelector('textarea') ||
           document.querySelector('div[contenteditable="true"]');
  }

  findSendButton() {
    return document.querySelector('button:has(svg)') ||
           Array.from(document.querySelectorAll('button')).find(btn => 
             btn.querySelector('svg') && btn.querySelector('svg').outerHTML.includes('paper')
           );
  }

  findContinueButton() {
    return Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('继续') || btn.textContent.includes('Continue')
    );
  }

  findCopyButton() {
    return Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('复制') || btn.textContent.includes('Copy')
    );
  }

  isGenerating() {
    return document.querySelector('[data-testid*="streaming"]') !== null ||
           document.querySelector('.typing') !== null;
  }
}
