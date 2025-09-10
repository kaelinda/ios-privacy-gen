import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ApiCategory, ApiUsageReason, PrivacyDataType, TrackingPurpose, PrivacyManifest } from '@/types/privacy'

export const usePrivacyStore = defineStore('privacy', () => {
  // API Categories
  const apiCategories = ref<ApiCategory[]>([
    { id: 'file-timestamp', name: 'File timestamp APIs', selected: false },
    { id: 'system-boot-time', name: 'System boot time APIs', selected: false },
    { id: 'disk-space', name: 'Disk space APIs', selected: false },
    { id: 'active-keyboard', name: 'Active keyboard APIs', selected: false },
    { id: 'user-defaults', name: 'User Defaults APIs', selected: false }
  ])

  // API Usage Reasons
  const apiUsageReasons = ref<ApiUsageReason[]>([
    {
      id: 'dda9-1',
      code: 'DDA9.1',
      description: 'Declare this reason to display file timestamps to the person using the device. Information accessed for this reason, or any derived information, may not be sent off-device.',
      selected: false
    },
    {
      id: 'c617-1',
      code: 'C617.1',
      description: 'Declare this reason to access the timestamps, size, or other metadata of files inside the app container, app group container, or the app\'s CloudKit container.',
      selected: false
    },
    {
      id: '3b52-1',
      code: '3B52.1',
      description: 'Declare this reason to access the timestamps, size, or other metadata of files or directories that the user specifically granted access to, such as using a document picker view controller.',
      selected: false
    },
    {
      id: '0a2a-1',
      code: '0A2A.1',
      description: 'Declare this reason if your third-party SDK is providing a wrapper function around file timestamp API(s) for the app to use, and you only access the file timestamp APIs when the app calls your wrapper function. This reason may only be declared by third-party SDKs.',
      selected: false,
      thirdPartyOnly: true
    }
  ])

  // Privacy Tracking
  const includePrivacyTracking = ref(false)
  const trackingDomains = ref<string[]>([])

  // Data Types
  const dataTypes = [
    { category: 'Contact Info', items: ['Name', 'Email address', 'Phone number', 'Physical address', 'Other user contact info'] },
    { category: 'Health & Fitness', items: ['Health', 'Fitness'] },
    { category: 'Financial Info', items: ['Payment info', 'Credit info', 'Other financial info'] },
    { category: 'Location', items: ['Precise location', 'Coarse location'] },
    { category: 'Sensitive Info', items: ['Sensitive info'] },
    { category: 'Contacts', items: ['Contacts'] },
    { category: 'User Content', items: ['Emails or text messages', 'Photos or videos', 'Audio data', 'Gameplay content', 'Customer support', 'Other user content'] },
    { category: 'Browsing History', items: ['Browsing history'] },
    { category: 'Search History', items: ['Search history'] },
    { category: 'Identifiers', items: ['User ID', 'Device ID'] },
    { category: 'Purchases', items: ['Purchase history'] },
    { category: 'Usage Data', items: ['Product interaction', 'Advertising data', 'Other usage data'] },
    { category: 'Diagnostics', items: ['Crash data', 'Performance data', 'Other diagnostic data'] },
    { category: 'Surroundings', items: ['Environment scanning'] },
    { category: 'Body', items: ['Hands', 'Head'] },
    { category: 'Other', items: ['Other data types'] }
  ]

  const collectedDataTypes = ref<PrivacyDataType[]>([])

  // Tracking Purposes
  const trackingPurposes = ref<TrackingPurpose[]>([
    { id: '3rd-party-ads', name: '3rd party ads', selected: false },
    { id: 'developer-ads', name: 'Developer ads', selected: false },
    { id: 'analytics', name: 'Analytics', selected: false },
    { id: 'personalization', name: 'Personalization', selected: false },
    { id: 'app-functionality', name: 'App functionality', selected: false },
    { id: 'other', name: 'Other', selected: false }
  ])

  // Computed values
  const selectedApiCategories = computed(() => 
    apiCategories.value.filter(cat => cat.selected)
  )

  const selectedApiUsageReasons = computed(() => 
    apiUsageReasons.value.filter(reason => reason.selected)
  )

  const selectedDataTypes = computed(() => 
    collectedDataTypes.value.filter(data => data.selected)
  )

  // Generate XML
  const generateXML = computed(() => {
    const manifest: PrivacyManifest = {}

    // Add privacy tracking
    if (includePrivacyTracking.value) {
      manifest.NSPrivacyTracking = true
    }

    // Add tracking domains
    if (trackingDomains.value.length > 0) {
      manifest.NSPrivacyTrackingDomains = trackingDomains.value
    }

    // Add collected data types
    if (selectedDataTypes.value.length > 0) {
      manifest.NSPrivacyCollectedDataTypes = selectedDataTypes.value.map(dataType => ({
        NSPrivacyCollectedDataType: dataType.name,
        NSPrivacyCollectedDataTypeLinked: dataType.linkedToIdentity,
        NSPrivacyCollectedDataTypeTracking: dataType.collectedForTracking,
        NSPrivacyCollectedDataTypePurposes: dataType.purposes
      }))
    }

    // Add API usage
    if (selectedApiCategories.value.length > 0) {
      manifest.NSPrivacyAccessedAPITypes = selectedApiCategories.value.map(category => ({
        NSPrivacyAccessedAPIType: category.id,
        NSPrivacyAccessedAPITypeReasons: selectedApiUsageReasons.value.map(reason => reason.code)
      }))
    }

    // Convert to XML string
    const xmlDoc = createXMLDocument(manifest)
    return new XMLSerializer().serializeToString(xmlDoc)
  })

  // Helper function to create XML document
  function createXMLDocument(manifest: PrivacyManifest): Document {
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${Object.keys(manifest).length === 0 ? '<key>NSPrivacyCollectedDataTypes</key><array></array>' : ''}
</dict>
</plist>`
    
    const parser = new DOMParser()
    return parser.parseFromString(xmlString, 'text/xml')
  }

  // Actions
  function toggleApiCategory(categoryId: string) {
    const category = apiCategories.value.find(cat => cat.id === categoryId)
    if (category) {
      category.selected = !category.selected
    }
  }

  function toggleApiUsageReason(reasonId: string) {
    const reason = apiUsageReasons.value.find(r => r.id === reasonId)
    if (reason) {
      reason.selected = !reason.selected
    }
  }

  function addTrackingDomain(domain: string) {
    if (domain && !trackingDomains.value.includes(domain)) {
      trackingDomains.value.push(domain)
    }
  }

  function removeTrackingDomain(index: number) {
    trackingDomains.value.splice(index, 1)
  }

  function addDataType(dataType: PrivacyDataType) {
    collectedDataTypes.value.push(dataType)
  }

  function removeDataType(index: number) {
    collectedDataTypes.value.splice(index, 1)
  }

  function updateDataType(index: number, updates: Partial<PrivacyDataType>) {
    Object.assign(collectedDataTypes.value[index], updates)
  }

  return {
    // State
    apiCategories,
    apiUsageReasons,
    includePrivacyTracking,
    trackingDomains,
    collectedDataTypes,
    trackingPurposes,
    dataTypes,
    
    // Computed
    selectedApiCategories,
    selectedApiUsageReasons,
    selectedDataTypes,
    generateXML,
    
    // Actions
    toggleApiCategory,
    toggleApiUsageReason,
    addTrackingDomain,
    removeTrackingDomain,
    addDataType,
    removeDataType,
    updateDataType
  }
})