<template>
  <div class="section">
    <!-- Privacy Tracking -->
    <div class="subsection">
      <h3 class="section-heading">Privacy tracking</h3>
      
      <label class="checkbox-item">
        <input 
          type="checkbox" 
          v-model="privacyStore.includePrivacyTracking"
        />
        <span class="checkbox-label">Include NSPrivacyTracking</span>
      </label>
      
      <p class="help-text">
        Check this option if your app or a third-party SDK uses data tracking as described by Apple in their 
        App Tracking Transparency framework. For more info see 
        <a href="https://developer.apple.com/app-store/user-privacy-and-data-use/" target="_blank" class="help-link">
          Apple's User privacy and data use guide
        </a>.
      </p>
    </div>
    
    <!-- Tracking Domains -->
    <div class="subsection">
      <h3 class="section-heading">Tracking Domains</h3>
      
      <div class="domain-input-group">
        <input 
          type="text" 
          v-model="newDomain" 
          @keyup.enter="addDomain"
          placeholder="Enter domain (e.g., example.com)"
          class="domain-input"
        />
        <button @click="addDomain" class="add-button" :disabled="!newDomain.trim()">
          Add domain
        </button>
      </div>
      
      <div v-if="privacyStore.trackingDomains.length > 0" class="domains-list">
        <div 
          v-for="(domain, index) in privacyStore.trackingDomains" 
          :key="index" 
          class="domain-item"
        >
          <span class="domain-text">{{ domain }}</span>
          <button @click="removeDomain(index)" class="remove-button">
            ×
          </button>
        </div>
      </div>
      
      <p v-else class="empty-state">
        No tracking domains added yet.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePrivacyStore } from '@/stores/privacy'

const privacyStore = usePrivacyStore()
const newDomain = ref('')

function addDomain() {
  const domain = newDomain.value.trim()
  if (domain) {
    privacyStore.addTrackingDomain(domain)
    newDomain.value = ''
  }
}

function removeDomain(index: number) {
  privacyStore.removeTrackingDomain(index)
}
</script>

<style scoped>
.section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e9ecef;
}

.subsection {
  margin-bottom: 1.5rem;
}

.section-heading {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: #212529;
}

.checkbox-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  margin-bottom: 0.5rem;
}

.checkbox-item:hover {
  background-color: #f8f9fa;
}

.checkbox-item input[type="checkbox"] {
  margin-right: 0.5rem;
  cursor: pointer;
}

.checkbox-label {
  font-size: 0.875rem;
  color: #495057;
  font-weight: 500;
}

.help-text {
  font-size: 0.875rem;
  color: #6c757d;
  line-height: 1.4;
  margin: 0;
}

.help-link {
  color: #0066cc;
  text-decoration: none;
}

.help-link:hover {
  text-decoration: underline;
}

.domain-input-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.domain-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
}

.domain-input:focus {
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
}

.add-button:hover:not(:disabled) {
  background-color: #218838;
}

.add-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.domains-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.domain-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}

.domain-text {
  font-size: 0.875rem;
  color: #495057;
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

.empty-state {
  font-size: 0.875rem;
  color: #6c757d;
  font-style: italic;
  margin: 0;
}

@media (max-width: 768px) {
  .domain-input-group {
    flex-direction: column;
  }
  
  .section-heading {
    font-size: 1.125rem;
  }
}
</style>