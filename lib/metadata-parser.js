
export class MetadataParser {
  static hasWordPressFormat(content) { return content.includes('***') || content.includes('---'); }

  static parse(content) {
    if (!this.hasWordPressFormat(content)) return { content, metadata: {} };
    const separator = content.includes('***') ? '***' : '---';
    const parts = content.split(separator).map(p => p.trim()).filter(p => p);
    if (parts.length >= 2) {
      const body = parts[0];
      const metadataPart = parts.slice(1).join('\n');
      const metadata = this.parseMetadataLines(metadataPart);
      return { content: body, metadata };
    }
    return { content, metadata: {} };
  }

  static parseMetadataLines(lines) {
    const metadata = {};
    const lineArray = lines.split(/\r?\n/);
    for (const line of lineArray) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const match = trimmed.match(/^(\*\*)?([^*:：]+)(\*\*)?\s*[:：]\s*(.+)$/);
      if (match) { const key = match[2].trim(); const value = match[4].trim(); metadata[key] = value; }
    }
    return metadata;
  }

  static formatMetadataAsComments(metadata) {
    let comments = '';
    for (const [key, value] of Object.entries(metadata)) comments += `<!-- ${key}: ${value} -->\n`;
    return comments;
  }
}
