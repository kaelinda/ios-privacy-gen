<template>
  <div class="section">
    <h3 class="section-heading">Required API usage</h3>
    
    <!-- API Category Selection -->
    <div class="subsection">
      <h4 class="subsection-title">API Category</h4>
      <p class="subsection-description">Pick all relevant options for your usage</p>
      
      <div class="checkbox-group">
        <label v-for="category in privacyStore.apiCategories" :key="category.id" class="checkbox-item">
          <input 
            type="checkbox" 
            :checked="category.selected"
            @change="privacyStore.toggleApiCategory(category.id)"
          />
          <span class="checkbox-label">{{ category.name }}</span>
        </label>
      </div>
    </div>
    
    <!-- API Usage Reasons -->
    <div class="subsection" v-if="hasSelectedCategories">
      <h4 class="subsection-title">Choose your API Usage reason(s)</h4>
      <p class="subsection-description">Pick one or more Usage reasons that fit your app's usage.</p>
      
      <div class="reasons-group">
        <div 
          v-for="reason in privacyStore.apiUsageReasons" 
          :key="reason.id" 
          class="reason-item"
          :class="{ 'third-party-only': reason.thirdPartyOnly }"
        >
          <label class="reason-header">
            <input 
              type="checkbox" 
              :checked="reason.selected"
              @change="privacyStore.toggleApiUsageReason(reason.id)"
            />
            <span class="reason-code">{{ reason.code }}</span>
          </label>
          <p class="reason-description">{{ reason.description }}</p>
          <p v-if="reason.thirdPartyOnly" class="third-party-note">
            Information accessed for this reason, or any derived information, may not be used for your third-party SDK's own purposes or sent off-device by your third-party SDK.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePrivacyStore } from '@/stores/privacy'

const privacyStore = usePrivacyStore()

const hasSelectedCategories = computed(() => 
  privacyStore.selectedApiCategories.length > 0
)
</script>

<style scoped>
.section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e9ecef;
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

.subsection-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #495057;
}

.subsection-description {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
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
}

.reasons-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reason-item {
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 1rem;
  background-color: #fff;
}

.reason-item.third-party-only {
  border-color: #ffc107;
  background-color: #fff3cd;
}

.reason-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.reason-header input[type="checkbox"] {
  margin-right: 0.5rem;
  cursor: pointer;
}

.reason-code {
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.reason-description {
  font-size: 0.875rem;
  color: #495057;
  line-height: 1.4;
  margin: 0;
}

.third-party-note {
  font-size: 0.75rem;
  color: #856404;
  font-style: italic;
  margin: 0.5rem 0 0 0;
  line-height: 1.3;
}

@media (max-width: 768px) {
  .section-heading {
    font-size: 1.125rem;
  }
  
  .reason-item {
    padding: 0.75rem;
  }
}
</style>