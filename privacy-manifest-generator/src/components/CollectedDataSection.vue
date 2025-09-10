<template>
  <div class="section">
    <h3 class="section-heading">Collected Data Types</h3>
    
    <!-- Data Type Selection -->
    <div class="subsection">
      <div class="data-type-input-group">
        <select v-model="selectedDataType" class="data-type-select">
          <option value="">-- Choose a data type --</option>
          <optgroup v-for="category in privacyStore.dataTypes" :key="category.category" :label="category.category">
            <option v-for="item in category.items" :key="item" :value="item">
              {{ item }}
            </option>
          </optgroup>
        </select>
        <button @click="addDataType" class="add-button" :disabled="!selectedDataType">
          Add tracked data
        </button>
      </div>
    </div>
    
    <!-- Added Data Types List -->
    <div v-if="privacyStore.collectedDataTypes.length > 0" class="data-types-list">
      <div 
        v-for="(dataType, index) in privacyStore.collectedDataTypes" 
        :key="index" 
        class="data-type-item"
      >
        <div class="data-type-header">
          <span class="data-type-name">{{ dataType.name }}</span>
          <button @click="removeDataType(index)" class="remove-button">
            ×
          </button>
        </div>
        
        <div class="data-type-options">
          <label class="option-item">
            <input 
              type="checkbox" 
              :checked="dataType.linkedToIdentity"
              @change="updateDataType(index, { linkedToIdentity: $event.target.checked })"
            />
            <span class="option-label">Linked to identity</span>
          </label>
          
          <label class="option-item">
            <input 
              type="checkbox" 
              :checked="dataType.collectedForTracking"
              @change="updateDataType(index, { collectedForTracking: $event.target.checked })"
            />
            <span class="option-label">Collected for tracking</span>
          </label>
        </div>
        
        <!-- Tracking Reasons -->
        <div class="tracking-reasons">
          <h5 class="reasons-title">Tracking reasons</h5>
          <div class="reasons-grid">
            <label 
              v-for="purpose in privacyStore.trackingPurposes" 
              :key="purpose.id" 
              class="reason-item"
            >
              <input 
                type="checkbox" 
                :checked="dataType.purposes.includes(purpose.id)"
                @change="togglePurpose(index, purpose.id, $event.target.checked)"
              />
              <span class="reason-label">{{ purpose.name }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
    
    <p v-else class="empty-state">
      No data types added yet. Select a data type from the dropdown above to get started.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePrivacyStore } from '@/stores/privacy'
import type { PrivacyDataType } from '@/types/privacy'

const privacyStore = usePrivacyStore()
const selectedDataType = ref('')

function addDataType() {
  if (!selectedDataType.value) return
  
  const newDataType: PrivacyDataType = {
    id: Date.now().toString(),
    name: selectedDataType.value,
    category: findCategoryForDataType(selectedDataType.value),
    selected: true,
    linkedToIdentity: false,
    collectedForTracking: false,
    purposes: []
  }
  
  privacyStore.addDataType(newDataType)
  selectedDataType.value = ''
}

function findCategoryForDataType(dataTypeName: string): string {
  for (const category of privacyStore.dataTypes) {
    if (category.items.includes(dataTypeName)) {
      return category.category
    }
  }
  return 'Other'
}

function removeDataType(index: number) {
  privacyStore.removeDataType(index)
}

function updateDataType(index: number, updates: Partial<PrivacyDataType>) {
  privacyStore.updateDataType(index, updates)
}

function togglePurpose(index: number, purposeId: string, isChecked: boolean) {
  const dataType = privacyStore.collectedDataTypes[index]
  const purposes = [...dataType.purposes]
  
  if (isChecked) {
    if (!purposes.includes(purposeId)) {
      purposes.push(purposeId)
    }
  } else {
    const purposeIndex = purposes.indexOf(purposeId)
    if (purposeIndex > -1) {
      purposes.splice(purposeIndex, 1)
    }
  }
  
  updateDataType(index, { purposes })
}
</script>

<style scoped>
.section {
  margin-bottom: 2rem;
}

.section-heading {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: #212529;
}

.subsection {
  margin-bottom: 1.5rem;
}

.data-type-input-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.data-type-select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: white;
}

.data-type-select:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.25);
}

.add-button {
  padding: 0.5rem 1rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.add-button:hover:not(:disabled) {
  background-color: #218838;
}

.add-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.data-types-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.data-type-item {
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 1rem;
  background-color: #fff;
}

.data-type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.data-type-name {
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.remove-button {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.remove-button:hover {
  background-color: #f5c6cb;
}

.data-type-options {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.option-item {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.option-item input[type="checkbox"] {
  margin-right: 0.5rem;
  cursor: pointer;
}

.option-label {
  font-size: 0.875rem;
  color: #495057;
}

.tracking-reasons {
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.reasons-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: #495057;
}

.reasons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
}

.reason-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.reason-item:hover {
  background-color: #f8f9fa;
}

.reason-item input[type="checkbox"] {
  margin-right: 0.5rem;
  cursor: pointer;
}

.reason-label {
  font-size: 0.75rem;
  color: #495057;
}

.empty-state {
  font-size: 0.875rem;
  color: #6c757d;
  font-style: italic;
  margin: 0;
  text-align: center;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .data-type-input-group {
    flex-direction: column;
  }
  
  .data-type-options {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .reasons-grid {
    grid-template-columns: 1fr;
  }
  
  .section-heading {
    font-size: 1.125rem;
  }
}
</style>