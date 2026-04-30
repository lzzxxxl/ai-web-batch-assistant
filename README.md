
# AI网页批量处理助手

一个浏览器扩展，用于批量向AI平台（如DeepSeek、ChatGPT、Claude等）提交问题，自动监控AI回复，将回复内容转换为HTML格式并保存到本地文件。

## 功能特性

- 📝 **任务队列管理**: 支持手动添加任务或从TXT文件导入
- 🤖 **多平台支持**: 支持DeepSeek、ChatGPT、Claude、Grok、Perplexity、Coze
- 🔄 **自动化处理**: 自动填充、发送、监控、复制、保存
- 📄 **内容转换**: 自动提取标题，Markdown转HTML
- 📊 **任务统计**: 实时显示处理进度和状态
- ⏸️ **暂停/继续**: 支持中途暂停和恢复
- ⚙️ **可配置**: 自定义等待时间、匹配模式等

## 支持的AI平台

- DeepSeek (https://chat.deepseek.com)
- ChatGPT (https://chat.openai.com)
- Claude (https://claude.ai)
- Grok (https://grok.x.ai)
- Perplexity (https://perplexity.ai)
- Coze (https://coze.com)

## 安装方法

### Chrome/Edge浏览器

1. 下载或克隆本项目
2. 打开浏览器访问 `chrome://extensions/` 或 `edge://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本项目的文件夹

### Firefox浏览器

1. 下载或克隆本项目
2. 打开浏览器访问 `about:debugging#/runtime/this-firefox`
3. 点击"临时载入附加组件"
4. 选择本项目中的 `manifest.firefox.json` 文件

## 许可证

MIT License
