<script setup lang="ts">
interface ImportStatus {
  type: string
  message: string
}

interface Props {
  showImportDialog: boolean
  importXmlText: string
  importStatus: ImportStatus
}

interface Emits {
  (e: 'update:showImportDialog', value: boolean): void
  (e: 'update:importXmlText', value: string): void
  (e: 'handleFileUpload', event: Event): void
  (e: 'handleTextImport'): void
  (e: 'clearImportStatus'): void
  (e: 'handleFileDrop', event: DragEvent): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function closeDialog() {
  emit('update:showImportDialog', false)
}

function updateImportXmlText(value: string) {
  emit('update:importXmlText', value)
}

function handleFileUpload(event: Event) {
  emit('handleFileUpload', event)
}

function handleTextImport() {
  emit('handleTextImport')
}

function clearImportStatus() {
  emit('clearImportStatus')
}

function handleFileDrop(event: DragEvent) {
  emit('handleFileDrop', event)
}

function handleOverlayClick() {
  closeDialog()
}

function handleDialogClick(event: Event) {
  event.stopPropagation()
}
</script>

<template>
  <!-- 导入对话框 -->
  <div v-if="props.showImportDialog" class="import-dialog-overlay" @click="handleOverlayClick">
    <div class="import-dialog" @click="handleDialogClick">
      <div class="import-dialog-header">
        <h3>导入隐私清单文件</h3>
        <button @click="closeDialog" class="close-btn">×</button>
      </div>
      
      <div class="import-dialog-content">
        <!-- 文件上传区域 -->
        <div class="upload-area" 
             @drop="handleFileDrop" 
             @dragover.prevent 
             @dragenter.prevent>
          <input 
            type="file" 
            accept=".xml,.xcprivacy"
            @change="handleFileUpload"
            id="file-input"
            class="file-input"
          >
          <label for="file-input" class="upload-label">
            <div class="upload-icon">📁</div>
            <div class="upload-text">
              <div class="upload-primary">点击选择文件或拖拽到此处</div>
              <div class="upload-secondary">支持 .xml 和 .xcprivacy 文件</div>
            </div>
          </label>
        </div>

        <!-- 文本导入区域 -->
        <div class="text-import-area">
          <label for="xml-text">或直接粘贴XML内容：</label>
          <textarea 
            id="xml-text"
            :value="props.importXmlText"
            @input="updateImportXmlText(($event.target as HTMLTextAreaElement).value)"
            placeholder="粘贴您的XML内容到这里..."
            class="xml-textarea"
          ></textarea>
          <button @click="handleTextImport" :disabled="!props.importXmlText.trim()" class="import-text-btn">
            导入文本内容
          </button>
        </div>

        <!-- 状态消息 -->
        <div v-if="props.importStatus.message" 
             :class="['import-status', props.importStatus.type]">
          {{ props.importStatus.message }}
          <button @click="clearImportStatus" class="status-close">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 导入对话框样式 */
.import-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.import-dialog {
  background: var(--card-background);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.import-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.import-dialog-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: var(--border-color);
  color: var(--text-primary);
}

.import-dialog-content {
  padding: 2rem;
}

/* 文件上传区域 */
.upload-area {
  margin-bottom: 2rem;
}

.file-input {
  display: none;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  background-color: var(--background-color);
}

.upload-label:hover {
  border-color: var(--primary-color);
  background-color: rgba(0, 122, 255, 0.05);
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-text {
  text-align: center;
}

.upload-primary {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.upload-secondary {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* 文本导入区域 */
.text-import-area {
  margin-bottom: 1.5rem;
}

.text-import-area label {
  display: block;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  font-weight: 500;
}

.xml-textarea {
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  background-color: var(--background-color);
  color: var(--text-primary);
  resize: vertical;
  transition: border-color 0.2s;
}

.xml-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.xml-textarea::placeholder {
  color: var(--text-secondary);
}

.import-text-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--gradient-primary);
  color: white;
  border: 2px solid #4da6ff; /* 蓝色边框 */
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.import-text-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.import-text-btn:disabled {
  background: linear-gradient(135deg, #c6c6c8, #b0b0b0);
  border-color: #c6c6c8;
  cursor: not-allowed;
  transform: none;
}

/* 状态消息 */
.import-status {
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.import-status.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.import-status.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.status-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

/* 深色模式下的导入对话框优化 */
@media (prefers-color-scheme: dark) {
  .import-dialog {
    background: var(--card-background);
    border: 1px solid var(--border-color);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  }
  
  .import-dialog-header {
    border-bottom-color: var(--border-color);
  }
  
  .import-dialog-header h3 {
    color: var(--text-primary);
  }
  
  .upload-label:hover {
    border-color: #0a84ff;
    background-color: rgba(10, 132, 255, 0.1);
  }
  
  .xml-textarea {
    background-color: var(--card-background);
    border-color: var(--border-color);
    color: var(--text-primary);
  }
  
  .xml-textarea:focus {
    border-color: #0a84ff;
    box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.2);
  }
  
  .import-text-btn {
    border-color: #4da6ff;
    box-shadow: 0 0 0 1px rgba(77, 166, 255, 0.2);
  }
  
  .import-text-btn:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(77, 166, 255, 0.4), 0 0 0 1px rgba(77, 166, 255, 0.3);
  }
  
  .import-status.success {
    background-color: rgba(64, 214, 90, 0.2);
    color: #40d65a;
    border-color: rgba(64, 214, 90, 0.3);
  }
  
  .import-status.error {
    background-color: rgba(255, 85, 85, 0.2);
    color: #ff5555;
    border-color: rgba(255, 85, 85, 0.3);
  }
}
</style>
