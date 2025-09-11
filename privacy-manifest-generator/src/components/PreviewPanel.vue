<script setup lang="ts">
import { toRefs } from 'vue'

interface Props {
  generatedXml: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  copyToClipboard: []
  downloadManifest: []
  showImportDialog: []
}>()

const { generatedXml } = toRefs(props)

function handleCopyToClipboard() {
  emit('copyToClipboard')
}

function handleDownloadManifest() {
  emit('downloadManifest')
}

function handleShowImportDialog() {
  emit('showImportDialog')
}
</script>

<template>
  <div class="card">
    <div class="preview-header">
      <h2>生成的隐私清单预览</h2>
      <div class="action-buttons">
        <button @click="handleShowImportDialog" class="import-btn">导入XML文件</button>
        <button @click="handleCopyToClipboard" class="copy-btn">复制到剪贴板</button>
        <button @click="handleDownloadManifest" class="download-btn">下载文件</button>
      </div>
    </div>
    <div class="xml-preview">
      <pre><code>{{ generatedXml }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
/* 预览面板容器优化 - 填满整个区域 */
.card {
  max-width: 100%;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: visible;
  box-sizing: border-box;
}

/* 预览面板 */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.preview-header h2 {
  margin: 0;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.copy-btn,
.download-btn,
.import-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid transparent; /* 为深色模式准备边框 */
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.import-btn {
  background: linear-gradient(135deg, var(--warning-color), #ffb347);
  color: white;
  box-shadow: 0 4px 16px rgba(255, 149, 0, 0.3);
  border-color: #ff9500; /* 橙色边框 */
}

.import-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 149, 0, 0.4);
}

.copy-btn {
  background: linear-gradient(135deg, var(--secondary-color), #40d65a);
  color: white;
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.3);
  border-color: #40d65a; /* 绿色边框 */
}

.copy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(52, 199, 89, 0.4);
}

.download-btn {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
  border-color: #4da6ff; /* 蓝色边框 */
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 122, 255, 0.4);
}

/* 深色模式下的按钮边框优化 */
@media (prefers-color-scheme: dark) {
  .import-btn {
    border-color: #ff9500;
    box-shadow: 0 4px 16px rgba(255, 149, 0, 0.4), 0 0 0 1px rgba(255, 149, 0, 0.2);
  }
  
  .import-btn:hover {
    box-shadow: 0 8px 25px rgba(255, 149, 0, 0.5), 0 0 0 2px rgba(255, 149, 0, 0.3);
  }
  
  .copy-btn {
    border-color: #40d65a;
    box-shadow: 0 4px 16px rgba(64, 214, 90, 0.4), 0 0 0 1px rgba(64, 214, 90, 0.2);
  }
  
  .copy-btn:hover {
    box-shadow: 0 8px 25px rgba(64, 214, 90, 0.5), 0 0 0 2px rgba(64, 214, 90, 0.3);
  }
  
  .download-btn {
    border-color: #4da6ff;
    box-shadow: 0 4px 16px rgba(77, 166, 255, 0.4), 0 0 0 1px rgba(77, 166, 255, 0.2);
  }
  
  .download-btn:hover {
    box-shadow: 0 8px 25px rgba(77, 166, 255, 0.5), 0 0 0 2px rgba(77, 166, 255, 0.3);
  }
}

.xml-preview {
  background-color: #1e1e1e;
  border-radius: 8px;
  overflow: auto;
  border: 1px solid var(--border-color);
  max-width: 100%;
  width: 100%;
  flex: 1; /* 占据剩余的所有空间 */
  min-height: 0; /* 确保可以收缩 */
}

.xml-preview pre {
  margin: 0;
  padding: 1.5rem;
  overflow-x: auto;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #d4d4d4;
  background-color: transparent;
  white-space: pre;
  word-wrap: break-word;
  max-width: 100%;
  box-sizing: border-box;
}

/* 深色模式下的XML预览优化 */
@media (prefers-color-scheme: dark) {
  .xml-preview {
    background-color: #0d1117;
    border-color: var(--border-color);
  }
  
  .xml-preview pre {
    color: #e6edf3;
  }
}

/* 浅色模式下的XML预览 */
@media (prefers-color-scheme: light) {
  .xml-preview {
    background-color: #f6f8fa;
    border-color: var(--border-color);
  }
  
  .xml-preview pre {
    color: #24292f;
  }
}

.xml-preview code {
  font-family: inherit;
  color: inherit;
  background-color: transparent;
}

/* 移动端优化 */
@media (max-width: 1023px) {
  .preview-header {
    margin-bottom: 1rem;
  }
  
  .preview-header h2 {
    font-size: 1.125rem;
  }
}

@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .action-buttons {
    justify-content: center;
    gap: 0.75rem;
  }
  
  .xml-preview pre {
    font-size: 0.8rem;
    padding: 1.25rem;
    line-height: 1.4;
  }
}

@media (max-width: 480px) {
  .action-buttons {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .copy-btn,
  .download-btn,
  .import-btn {
    width: 100%;
    text-align: center;
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
  
  .xml-preview pre {
    font-size: 0.75rem;
    padding: 1rem;
  }
}
</style>
