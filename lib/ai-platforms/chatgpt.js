
import { BasePlatformAdapter } from './base.js';

export class ChatGPTAdapter extends BasePlatformAdapter {
  constructor() { super(); this.name = 'chatgpt'; }

  findInput() {
    return document.querySelector('#prompt-textarea') ||
           document.querySelector('textarea') ||
           document.querySelector('div[contenteditable="true"]');
  }

  findSendButton() {
    return document.querySelector('button[data-testid="send-button"]') ||
           document.querySelector('button[type="submit"]') ||
           Array.from(document.querySelectorAll('button')).find(btn => 
             btn.querySelector('svg') && btn.querySelector('svg').outerHTML.includes('arrow')
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
    return document.querySelector('.result-streaming') !== null ||
           document.querySelector('[data-testid*="streaming"]') !== null;
  }
}
