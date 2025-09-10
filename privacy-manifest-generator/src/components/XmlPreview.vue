<template>
  <div class="xml-preview">
    <div class="preview-header">
      <h2 class="section-title">Generated XML</h2>
      <div class="actions">
        <button @click="copyToClipboard" class="btn btn-primary">
          Copy to clipboard
        </button>
        <button @click="downloadManifest" class="btn btn-secondary">
          Download manifest
        </button>
      </div>
    </div>
    
    <div class="xml-container">
      <pre class="xml-content">{{ formattedXml }}</pre>
    </div>
    
    <div v-if="copyMessage" class="copy-message">
      {{ copyMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePrivacyStore } from '@/stores/privacy'

const privacyStore = usePrivacyStore()
const copyMessage = ref('')

const formattedXml = computed(() => {
  if (!privacyStore.generateXML) {
    return getDefaultXml()
  }
  return formatXml(privacyStore.generateXML)
})

function getDefaultXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyCollectedDataTypes</key>
    <array></array>
</dict>
</plist>`
}

function formatXml(xml: string): string {
  // Simple XML formatting
  const formatted = xml
    .replace(/></g, '>\\n<')
    .replace(/\s*</g, '<')
    .replace(/>\s*/g, '>')
  
  const lines = formatted.split('\\n')
  let indent = 0
  const indentSize = 4
  
  return lines.map(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith('</')) {
      indent -= indentSize
    }
    
    const indentedLine = ' '.repeat(Math.max(0, indent)) + trimmed
    
    if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
      indent += indentSize
    }
    
    return indentedLine
  }).join('\\n')
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(formattedXml.value)
    copyMessage.value = 'Copied to clipboard!'
    setTimeout(() => {
      copyMessage.value = ''
    }, 2000)
  } catch {
    copyMessage.value = 'Failed to copy to clipboard'
    setTimeout(() => {
      copyMessage.value = ''
    }, 2000)
  }
}

function downloadManifest() {
  const blob = new Blob([formattedXml.value], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'PrivacyInfo.xcprivacy'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.xml-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #212529;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #0066cc;
  color: white;
}

.btn-primary:hover {
  background-color: #0052a3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545862;
}

.xml-container {
  flex: 1;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  overflow: auto;
  background-color: #f8f9fa;
}

.xml-content {
  padding: 1rem;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #212529;
  white-space: pre;
  overflow: auto;
}

.copy-message {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .actions {
    justify-content: stretch;
  }
  
  .btn {
    flex: 1;
  }
}
</style>