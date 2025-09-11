<script setup lang="ts">
interface Props {
  trackingDomains: string[]
  newDomain: string
}

interface Emits {
  (e: 'update:newDomain', value: string): void
  (e: 'addDomain'): void
  (e: 'removeDomain', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function updateNewDomain(value: string) {
  emit('update:newDomain', value)
}

function handleAddDomain() {
  emit('addDomain')
}

function handleRemoveDomain(index: number) {
  emit('removeDomain', index)
}

function handleKeyUp(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleAddDomain()
  }
}
</script>

<template>
  <div class="card">
    <h2>跟踪域名</h2>
    <div class="form-group">
      <div class="input-group">
        <input
          type="text"
          :value="newDomain"
          @input="updateNewDomain(($event.target as HTMLInputElement).value)"
          placeholder="输入域名 (例如: analytics.example.com)"
          @keyup="handleKeyUp"
          class="text-input"
        >
        <button @click="handleAddDomain" class="btn-primary btn-primary-small">添加</button>
      </div>
    </div>
    <div class="domain-list" v-if="trackingDomains.length > 0">
      <div 
        v-for="(domain, index) in trackingDomains" 
        :key="index" 
        class="domain-item"
      >
        <span>{{ domain }}</span>
        <button @click="handleRemoveDomain(index)" class="btn-danger">删除</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 域名列表 */
.domain-list {
  margin-top: 1.5rem;
}

.domain-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: var(--background-color);
  border: 2px solid var(--border-color); /* 增强边框 */
  border-radius: 12px;
  margin-bottom: 1rem; /* 增加间距 */
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 添加阴影 */
}

.domain-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.15);
  transform: translateY(-2px);
}

.domain-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--warning-color), var(--danger-color));
  border-radius: 12px 12px 0 0;
}

.domain-item span {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 1rem;
  letter-spacing: -0.01em;
}

/* 深色模式下的域名条目优化 */
@media (prefers-color-scheme: dark) {
  .domain-item {
    background-color: var(--card-background);
    border: 2px solid var(--border-color);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  
  .domain-item:hover {
    border-color: #0a84ff;
    box-shadow: 0 6px 20px rgba(10, 132, 255, 0.25);
  }
  
  .domain-item span {
    color: var(--text-primary);
  }
}
</style>
