
export class ContentConverter {
  static markdownToHtml(markdown) {
    let html = markdown;
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => match.includes('<ul>') ? match : `<ol>${match}</ol>`);
    html = html.replace(/\n\n/g, '</p><p>');
    if (!html.startsWith('<p>') && !html.startsWith('<h')) html = `<p>${html}</p>`;
    html = html.replace(/<ul><p>/g, '<ul>');
    html = html.replace(/<\/p><\/ul>/g, '</ul>');
    return html;
  }

  static process(content, platform, sourceUrl, taskId, customPatterns = '', TitleExtractor, MetadataParser, Utils) {
    let extractedTitle = TitleExtractor.extract(content, customPatterns);
    let bodyContent = content;
    let metadata = {};
    if (MetadataParser.hasWordPressFormat(content)) {
      const parsed = MetadataParser.parse(content);
      bodyContent = parsed.content;
      metadata = parsed.metadata;
      if (!extractedTitle && metadata['标题']) extractedTitle = metadata['标题'];
    }
    const htmlBody = this.markdownToHtml(bodyContent);
    const systemMetadata = { platform, title: extractedTitle || 'Untitled', timestamp: Utils.formatTimestamp(), task_id: taskId, source_url: sourceUrl };
    const allMetadata = { ...systemMetadata, ...metadata };
    const metadataComments = MetadataParser.formatMetadataAsComments(allMetadata);
    const finalHtml = `${metadataComments}\n${htmlBody}`;
    return { html: finalHtml, title: extractedTitle || 'Untitled', metadata: allMetadata };
  }
}
