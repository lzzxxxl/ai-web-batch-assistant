
import { DeepSeekAdapter } from './deepseek.js';
import { ChatGPTAdapter } from './chatgpt.js';
import { ClaudeAdapter } from './claude.js';
import { GrokAdapter } from './grok.js';
import { PerplexityAdapter } from './perplexity.js';
import { CozeAdapter } from './coze.js';

export const PlatformFactory = {
  getAdapter(url) {
    if (url.includes('chat.deepseek.com')) return new DeepSeekAdapter();
    if (url.includes('chat.openai.com')) return new ChatGPTAdapter();
    if (url.includes('claude.ai')) return new ClaudeAdapter();
    if (url.includes('grok.x.ai')) return new GrokAdapter();
    if (url.includes('perplexity.ai')) return new PerplexityAdapter();
    if (url.includes('coze.com')) return new CozeAdapter();
    return null;
  },

  getPlatformName(url) {
    if (url.includes('chat.deepseek.com')) return 'deepseek';
    if (url.includes('chat.openai.com')) return 'chatgpt';
    if (url.includes('claude.ai')) return 'claude';
    if (url.includes('grok.x.ai')) return 'grok';
    if (url.includes('perplexity.ai')) return 'perplexity';
    if (url.includes('coze.com')) return 'coze';
    return 'unknown';
  }
};
