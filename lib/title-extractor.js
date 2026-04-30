
export class TitleExtractor {
  static buildPatterns(customPatterns = '') {
    const defaultPatterns = [
      '**原文章标题：**', '**原文件标题：**', '**文章标题：**', '**文件标题：**',
      '原文章标题：', '原文件标题：', '文章标题：', '文件标题：', 'title:', '<title>'
    ];
    const customList = customPatterns.split(',').map(p => p.trim()).filter(p => p);
    const allPatterns = [...defaultPatterns, ...customList];
    const regexPatterns = [];
    for (const pattern of allPatterns) {
      const cleanPattern = pattern.replace(/^\*\*|\*\*$/g, '');
      regexPatterns.push(new RegExp(`^\\*\\*${cleanPattern}\\*\\*\\s*(.+)$`, 'm'));
      regexPatterns.push(new RegExp(`^${cleanPattern}\\s*[:：]\\s*(.+)$`, 'm'));
      regexPatterns.push(new RegExp(`<strong>${cleanPattern}[:：]?</strong>\\s*(.+)$`, 'm'));
    }
    return regexPatterns;
  }

  static extract(content, customPatterns = '') {
    const patterns = this.buildPatterns(customPatterns);
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) return match[1].trim();
    }
    return null;
  }
}
