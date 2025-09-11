<script setup lang="ts">
import { toRefs } from 'vue'

// 收集的数据类型定义
interface CollectedDataType {
  id: string
  name: string
  category: string
  selected: boolean
  linkedToIdentity: boolean
  usedForTracking: boolean
  purposes: string[]
}

interface DataType {
  id: string
  name: string
  category: string
}

interface Purpose {
  id: string
  name: string
}

interface CurrentDataType {
  selectedTypeId: string
  linkedToIdentity: boolean
  usedForTracking: boolean
  selectedPurposes: string[]
}

interface Props {
  currentDataType: CurrentDataType
  availableDataTypes: DataType[]
  availablePurposes: Purpose[]
  collectedDataTypes: CollectedDataType[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:currentDataType': [value: CurrentDataType]
  'addDataType': []
  'removeDataType': [dataTypeId: string]
  'togglePurpose': [purposeId: string]
}>()

// 使用toRefs解构props以保持响应性
const { 
  currentDataType, 
  availableDataTypes, 
  availablePurposes, 
  collectedDataTypes 
} = toRefs(props)

function updateSelectedTypeId(typeId: string) {
  emit('update:currentDataType', {
    ...props.currentDataType,
    selectedTypeId: typeId
  })
}

function updateLinkedToIdentity(value: boolean) {
  emit('update:currentDataType', {
    ...props.currentDataType,
    linkedToIdentity: value
  })
}

function updateUsedForTracking(value: boolean) {
  emit('update:currentDataType', {
    ...props.currentDataType,
    usedForTracking: value
  })
}

function handleTogglePurpose(purposeId: string) {
  emit('togglePurpose', purposeId)
}

function handleAddDataType() {
  emit('addDataType')
}

function handleRemoveDataType(dataTypeId: string) {
  emit('removeDataType', dataTypeId)
}

function isPurposeSelected(purposeId: string) {
  return props.currentDataType.selectedPurposes.includes(purposeId)
}
</script>

<template>
  <div class="card">
    <h2>收集的数据类型</h2>
    <div class="form-group">
      <label for="data-type">选择数据类型：</label>
      <select 
        id="data-type"
        :value="currentDataType.selectedTypeId"
        @change="updateSelectedTypeId(($event.target as HTMLSelectElement).value)"
        class="select-input"
      >
        <option value="">请选择数据类型</option>
        <option 
          v-for="dataType in availableDataTypes" 
          :key="dataType.id" 
          :value="dataType.id"
        >
          {{ dataType.name }}
        </option>
      </select>
    </div>

    <!-- 数据使用设置 -->
    <div v-if="currentDataType.selectedTypeId" class="form-group">
      <div class="checkbox-group">
        <label class="checkbox-container">
          <input 
            type="checkbox" 
            :checked="currentDataType.linkedToIdentity"
            @change="updateLinkedToIdentity(($event.target as HTMLInputElement).checked)"
          >
          <span class="checkmark"></span>
          与用户身份关联
        </label>
        
        <label class="checkbox-container">
          <input 
            type="checkbox" 
            :checked="currentDataType.usedForTracking"
            @change="updateUsedForTracking(($event.target as HTMLInputElement).checked)"
          >
          <span class="checkmark"></span>
          用于跟踪
        </label>
      </div>
    </div>

    <!-- 使用目的选择 -->
    <div v-if="currentDataType.selectedTypeId" class="form-group">
      <label>选择使用目的：</label>
      <div class="purpose-list">
        <label 
          v-for="purpose in availablePurposes" 
          :key="purpose.id" 
          class="checkbox-container"
        >
          <input 
            type="checkbox" 
            :checked="isPurposeSelected(purpose.id)"
            @change="handleTogglePurpose(purpose.id)"
          >
          <span class="checkmark"></span>
          {{ purpose.name }}
        </label>
      </div>
      <div class="button-container">
        <button 
          @click="handleAddDataType" 
          :disabled="currentDataType.selectedPurposes.length === 0"
          class="btn-primary"
        >
          添加数据类型
        </button>
      </div>
    </div>

    <!-- 已添加的数据类型列表 -->
    <div v-if="collectedDataTypes.length > 0" class="added-data-types">
      <h3>已添加的数据类型：</h3>
      <div 
        v-for="dataType in collectedDataTypes" 
        :key="dataType.id" 
        class="data-type-entry"
      >
        <div class="data-type-header">
          <h4>{{ dataType.name }}</h4>
          <button @click="handleRemoveDataType(dataType.id)" class="btn-danger">删除</button>
        </div>
        <div class="data-type-details">
          <span v-if="dataType.linkedToIdentity" class="detail-badge identity">与身份关联</span>
          <span v-if="dataType.usedForTracking" class="detail-badge tracking">用于跟踪</span>
        </div>
        <div class="data-type-purposes">
          <span 
            v-for="purpose in dataType.purposes" 
            :key="purpose" 
            class="purpose-tag"
          >
            {{ availablePurposes.find((p: Purpose) => p.id === purpose)?.name || purpose }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.purpose-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.added-data-types {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.data-type-entry {
  background-color: rgba(0, 122, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.data-type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.data-type-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.data-type-details {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.detail-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.detail-badge.identity {
  background-color: rgba(52, 199, 89, 0.2);
  color: var(--secondary-color);
}

.detail-badge.tracking {
  background-color: rgba(255, 59, 48, 0.2);
  color: var(--danger-color);
}

.data-type-purposes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.purpose-tag {
  background-color: rgba(0, 122, 255, 0.1);
  color: var(--primary-color);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* 深色模式优化 */
@media (prefers-color-scheme: dark) {
  .data-type-entry {
    background-color: rgba(0, 122, 255, 0.1);
  }
  
  .detail-badge.identity {
    background-color: rgba(64, 214, 90, 0.3);
    color: #40d65a;
  }
  
  .detail-badge.tracking {
    background-color: rgba(255, 107, 107, 0.3);
    color: #ff6b6b;
  }
  
  .purpose-tag {
    background-color: rgba(77, 166, 255, 0.2);
    color: #4da6ff;
  }
}
</style>