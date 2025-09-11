<script setup lang="ts">
import { toRefs } from 'vue'

interface Props {
  includePrivacyTracking: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:includePrivacyTracking': [value: boolean]
}>()

const { includePrivacyTracking } = toRefs(props)

function updateTracking(value: boolean) {
  emit('update:includePrivacyTracking', value)
}
</script>

<template>
  <div class="card">
    <h2>隐私跟踪设置</h2>
    <div class="form-group">
      <label class="checkbox-container">
        <input 
          type="checkbox" 
          :checked="includePrivacyTracking"
          @change="updateTracking(($event.target as HTMLInputElement).checked)"
        >
        <span class="checkmark"></span>
        应用是否包含隐私跟踪
      </label>
    </div>
  </div>
</template>
