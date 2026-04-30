
export class BasePlatformAdapter {
  constructor() { this.name = 'base'; }
  findInput() { throw new Error('findInput must be implemented'); }
  findSendButton() { throw new Error('findSendButton must be implemented'); }
  findContinueButton() { throw new Error('findContinueButton must be implemented'); }
  findCopyButton() { throw new Error('findCopyButton must be implemented'); }
  isGenerating() { throw new Error('isGenerating must be implemented'); }

  async fillInput(text) {
    const input = this.findInput();
    if (input) {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }

  async clickSend() { const button = this.findSendButton(); if (button) { button.click(); return true; } return false; }
  async clickContinue() { const button = this.findContinueButton(); if (button) { button.click(); return true; } return false; }
  async clickCopy() { const button = this.findCopyButton(); if (button) { button.click(); return true; } return false; }
}
