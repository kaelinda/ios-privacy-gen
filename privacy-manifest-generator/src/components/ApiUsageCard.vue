<script setup lang="ts">
import { toRefs } from 'vue'

// API使用组合的类型定义
interface ApiReason {
  id: string
  code: string
  description: string
  selected: boolean
  thirdPartyOnly?: boolean
}

interface ApiUsageEntry {
  id: string
  categoryId: string
  categoryName: string
  selectedReasons: ApiReason[]
}

interface ApiCategory {
  id: string
  name: string
}

interface CurrentApiUsage {
  selectedCategoryId: string
  selectedReasons: ApiReason[]
}

interface Props {
  currentApiUsage: CurrentApiUsage
  availableApiCategories: ApiCategory[]
  availableReasonsForCurrentCategory: ApiReason[]
  apiUsageEntries: ApiUsageEntry[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:currentApiUsage': [value: CurrentApiUsage]
  'addApiUsage': []
  'removeApiUsage': [entryId: string]
  'toggleCurrentReason': [reason: ApiReason]
}>()

// 使用toRefs解构props以保持响应性
const { 
  currentApiUsage, 
  availableApiCategories, 
  availableReasonsForCurrentCategory, 
  apiUsageEntries 
} = toRefs(props)

function updateSelectedCategory(categoryId: string) {
  emit('update:currentApiUsage', {
    ...props.currentApiUsage,
    selectedCategoryId: categoryId,
    selectedReasons: []
  })
}

function handleToggleReason(reason: ApiReason) {
  emit('toggleCurrentReason', reason)
}

function handleAddApiUsage() {
  emit('addApiUsage')
}

function handleRemoveApiUsage(entryId: string) {
  emit('removeApiUsage', entryId)
}

function isReasonCurrentlySelected(reason: ApiReason) {
  return currentApiUsage.value.selectedReasons.some((r: ApiReason) => r.id === reason.id)
}
</script>

<template>
  <div class="card">
    <h2>API 使用配置</h2>
    <div class="form-group">
      <label for="api-category">选择 API 分类：</label>
      <select 
        id="api-category"
        :value="currentApiUsage.selectedCategoryId"
        @change="updateSelectedCategory(($event.target as HTMLSelectElement).value)"
        class="select-input"
      >
        <option value="">请选择 API 分类</option>
        <option 
          v-for="category in availableApiCategories" 
          :key="category.id" 
          :value="category.id"
        >
          {{ category.name }}
        </option>
      </select>
    </div>

    <!-- 使用原因选择 -->
    <div v-if="currentApiUsage.selectedCategoryId" class="form-group">
      <label>选择使用原因：</label>
      <div class="reason-list">
        <div 
          v-for="reason in availableReasonsForCurrentCategory" 
          :key="reason.id" 
          class="reason-item"
          :class="{ 'third-party-only': reason.thirdPartyOnly }"
        >
          <label class="checkbox-container">
            <input 
              type="checkbox" 
              :checked="isReasonCurrentlySelected(reason)"
              @change="handleToggleReason(reason)"
            >
            <span class="checkmark"></span>
            <div class="reason-content">
              <strong>{{ reason.code }}</strong>
              <p>{{ reason.description }}</p>
              <span v-if="reason.thirdPartyOnly" class="third-party-badge">仅限第三方 SDK</span>
            </div>
          </label>
        </div>
      </div>
      <div class="button-container">
        <button 
          @click="handleAddApiUsage" 
          :disabled="currentApiUsage.selectedReasons.length === 0"
          class="btn-primary"
        >
          添加 API 使用组合
        </button>
      </div>
    </div>

    <!-- 已添加的 API 使用列表 -->
    <div v-if="apiUsageEntries.length > 0" class="added-apis">
      <h3>已添加的 API 使用：</h3>
      <div 
        v-for="entry in apiUsageEntries" 
        :key="entry.id" 
        class="api-entry"
      >
        <div class="api-entry-header">
          <h4>{{ entry.categoryName }}</h4>
          <button @click="handleRemoveApiUsage(entry.id)" class="btn-danger">删除</button>
        </div>
        <div class="api-reasons">
          <div 
            v-for="reason in entry.selectedReasons" 
            :key="reason.id" 
            class="reason-tag"
          >
            {{ reason.code }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* API 使用条目 */
.reason-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  background-color: var(--background-color);
}

.reason-item {
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: var(--card-background);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.reason-item.third-party-only {
  border-left: 4px solid var(--warning-color);
}

.reason-content {
  flex: 1;
}

.reason-content strong {
  color: var(--primary-color);
  font-size: 1rem;
}

.reason-content p {
  margin: 0.5rem 0 0 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.third-party-badge {
  display: inline-block;
  background-color: var(--warning-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.5rem;
}

/* 已添加的 API 列表 */
.added-apis {
  margin-top: 1.5rem;
}

.api-entry {
  background-color: var(--background-color);
  border: 2px solid var(--border-color); /* 增强边框 */
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem; /* 增加间距 */
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 添加阴影 */
}

.api-entry:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.15);
  transform: translateY(-2px);
}

.api-entry::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 12px 12px 0 0;
}

/* 深色模式下的API条目优化 */
@media (prefers-color-scheme: dark) {
  .api-entry {
    background-color: var(--card-background);
    border: 2px solid var(--border-color);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  
  .api-entry:hover {
    border-color: #0a84ff;
    box-shadow: 0 6px 20px rgba(10, 132, 255, 0.25);
  }
}

.api-entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color); /* 添加分隔线 */
}

.api-entry-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.api-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--border-color); /* 添加虚线分隔 */
}

.reason-tag {
  background: linear-gradient(135deg, var(--primary-color), #5856d6);
  color: white;
  padding: 0.375rem 1rem;
  border-radius: 18px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.2);
  transition: all 0.2s ease;
}

.reason-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}
</style>
