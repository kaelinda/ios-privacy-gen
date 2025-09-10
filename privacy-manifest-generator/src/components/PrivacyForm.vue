<template>
  <div class="privacy-form">
    <h2 class="section-title">Configure Privacy Manifest</h2>
    
    <!-- Required API Usage Section -->
    <RequiredApiSection />
    
    <!-- Privacy Tracking Section -->
    <PrivacyTrackingSection />
    
    <!-- Collected Data Types Section -->
    <CollectedDataSection />
  </div>
</template>

<script setup lang="ts">
import RequiredApiSection from './RequiredApiSection.vue'
import PrivacyTrackingSection from './PrivacyTrackingSection.vue'
import CollectedDataSection from './CollectedDataSection.vue'
</script>

<style scoped>
.privacy-form {
  height: 100%;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: #212529;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
}
</style>