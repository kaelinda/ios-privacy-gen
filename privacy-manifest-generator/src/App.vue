<script setup lang="ts">
import { ref, computed } from 'vue'

// 基础状态管理
const includePrivacyTracking = ref(false)
const trackingDomains = ref<string[]>([])
const newDomain = ref('')

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

// 添加的API使用组合列表
const apiUsageEntries = ref<ApiUsageEntry[]>([])

// 收集的数据类型状态
const collectedDataTypes = ref<CollectedDataType[]>([])
const currentDataType = ref({
  selectedTypeId: '',
  linkedToIdentity: false,
  usedForTracking: false,
  selectedPurposes: [] as string[]
})

// 可选的API分类
const availableApiCategories = [
  { id: 'NSPrivacyAccessedAPICategoryFileTimestamp', name: '文件时间戳 APIs' },
  { id: 'NSPrivacyAccessedAPICategorySystemBootTime', name: '系统启动时间 APIs' },
  { id: 'NSPrivacyAccessedAPICategoryDiskSpace', name: '磁盘空间 APIs' },
  { id: 'NSPrivacyAccessedAPICategoryActiveKeyboards', name: '活动键盘 APIs' },
  { id: 'NSPrivacyAccessedAPICategoryUserDefaults', name: '用户默认设置 APIs' }
]

// 当前正在添加的API使用条目
const currentApiUsage = ref({
  selectedCategoryId: '',
  selectedReasons: [] as ApiReason[]
})

// 可选的数据类型
const availableDataTypes = [
  { id: 'NSPrivacyCollectedDataTypeName', name: '姓名', category: 'contact_info' },
  { id: 'NSPrivacyCollectedDataTypeEmailAddress', name: '电子邮件地址', category: 'contact_info' },
  { id: 'NSPrivacyCollectedDataTypePhoneNumber', name: '电话号码', category: 'contact_info' },
  { id: 'NSPrivacyCollectedDataTypePhysicalAddress', name: '物理地址', category: 'contact_info' },
  { id: 'NSPrivacyCollectedDataTypeOtherUserContactInfo', name: '其他用户联系信息', category: 'contact_info' },
  { id: 'NSPrivacyCollectedDataTypeHealthInformation', name: '健康信息', category: 'health_fitness' },
  { id: 'NSPrivacyCollectedDataTypeFitnessInformation', name: '健身信息', category: 'health_fitness' },
  { id: 'NSPrivacyCollectedDataTypePaymentInformation', name: '支付信息', category: 'financial_info' },
  { id: 'NSPrivacyCollectedDataTypeCreditInfo', name: '信用信息', category: 'financial_info' },
  { id: 'NSPrivacyCollectedDataTypeOtherFinancialInfo', name: '其他财务信息', category: 'financial_info' },
  { id: 'NSPrivacyCollectedDataTypePreciseLocation', name: '精确位置', category: 'location' },
  { id: 'NSPrivacyCollectedDataTypeCoarseLocation', name: '粗略位置', category: 'location' },
  { id: 'NSPrivacyCollectedDataTypeSensitiveInfo', name: '敏感信息', category: 'sensitive_info' },
  { id: 'NSPrivacyCollectedDataTypeContacts', name: '通讯录', category: 'contacts' },
  { id: 'NSPrivacyCollectedDataTypeEmails', name: '电子邮件或短信', category: 'messages' },
  { id: 'NSPrivacyCollectedDataTypePhotos', name: '照片或视频', category: 'photos_videos' },
  { id: 'NSPrivacyCollectedDataTypeAudio', name: '音频数据', category: 'audio' },
  { id: 'NSPrivacyCollectedDataTypeGameplayContent', name: '游戏内容', category: 'gameplay_content' },
  { id: 'NSPrivacyCollectedDataTypeCustomerSupport', name: '客户支持', category: 'customer_support' },
  { id: 'NSPrivacyCollectedDataTypeOtherUserContent', name: '其他用户内容', category: 'user_content' },
  { id: 'NSPrivacyCollectedDataTypeBrowsingHistory', name: '浏览历史', category: 'browsing_history' },
  { id: 'NSPrivacyCollectedDataTypeSearchHistory', name: '搜索历史', category: 'search_history' },
  { id: 'NSPrivacyCollectedDataTypeUserID', name: '用户ID', category: 'identifiers' },
  { id: 'NSPrivacyCollectedDataTypeDeviceID', name: '设备ID', category: 'identifiers' },
  { id: 'NSPrivacyCollectedDataTypePurchaseHistory', name: '购买历史', category: 'purchases' },
  { id: 'NSPrivacyCollectedDataTypeProductInteraction', name: '产品互动', category: 'usage_data' },
  { id: 'NSPrivacyCollectedDataTypeAdvertisingData', name: '广告数据', category: 'usage_data' },
  { id: 'NSPrivacyCollectedDataTypeOtherUsageData', name: '其他使用数据', category: 'usage_data' },
  { id: 'NSPrivacyCollectedDataTypeCrashData', name: '崩溃数据', category: 'diagnostics' },
  { id: 'NSPrivacyCollectedDataTypePerformanceData', name: '性能数据', category: 'diagnostics' },
  { id: 'NSPrivacyCollectedDataTypeOtherDiagnosticData', name: '其他诊断数据', category: 'diagnostics' }
]

// 可选的使用目的
const availablePurposes = [
  { id: 'NSPrivacyCollectedDataTypePurposeThirdPartyAdvertising', name: '第三方广告' },
  { id: 'NSPrivacyCollectedDataTypePurposeDeveloperAdvertising', name: '开发者广告' },
  { id: 'NSPrivacyCollectedDataTypePurposeAnalytics', name: '分析' },
  { id: 'NSPrivacyCollectedDataTypePurposeProductPersonalization', name: '产品个性化' },
  { id: 'NSPrivacyCollectedDataTypePurposeAppFunctionality', name: '应用功能' },
  { id: 'NSPrivacyCollectedDataTypePurposeOther', name: '其他目的' }
]

// API原因按类别分组
const apiReasonsByCategory = {
  'NSPrivacyAccessedAPICategoryFileTimestamp': [
    { id: 'dda9-1', code: 'DDA9.1', description: '声明此原因以向设备使用者显示文件时间戳。出于此原因访问的信息或任何衍生信息不得发送到设备外。', selected: false },
    { id: 'c617-1', code: 'C617.1', description: '声明此原因以访问应用容器、应用组容器或应用CloudKit容器内文件的时间戳、大小或其他元数据。', selected: false },
    { id: '3b52-1', code: '3B52.1', description: '声明此原因以访问用户特定授权访问的文件或目录的时间戳、大小或其他元数据，例如使用文档选择器视图控制器。', selected: false },
    { id: '0a2a-1', code: '0A2A.1', description: '如果你的第三方SDK为应用提供了文件时间戳API的包装函数，并且你仅在应用调用你的包装函数时才访问文件时间戳API，请声明此原因。此原因仅可由第三方SDK声明。', selected: false, thirdPartyOnly: true }
  ],
  'NSPrivacyAccessedAPICategorySystemBootTime': [
    { id: '35f9-1', code: '35F9.1', description: '声明此原因以访问系统启动时间，以测量应用内发生的事件之间的经过时间或执行计算以启用计时器。', selected: false },
    { id: '8ffb-1', code: '8FFB.1', description: '声明此原因以访问系统启动时间，以为应用内发生的事件计算绝对时间戳，例如与UIKit或AVFoundation框架相关的事件。', selected: false },
    { id: '3d61-1', code: '3D61.1', description: '如果你的第三方SDK为应用提供了系统启动时间API的包装函数，并且你仅在应用调用你的包装函数时才访问系统启动时间API，请声明此原因。此原因仅可由第三方SDK声明。', selected: false, thirdPartyOnly: true }
  ],
  'NSPrivacyAccessedAPICategoryDiskSpace': [
    { id: 'e174-1', code: 'E174.1', description: '声明此原因以向设备使用者显示磁盘空间信息。磁盘空间可以信息单位（如字节）或时间单位结合媒体类型（如4K视频分钟）显示。', selected: false },
    { id: '7d9e-1', code: '7D9E.1', description: '声明此原因以检查是否有足够的磁盘空间来写入文件，或检查磁盘空间是否不足，以便在磁盘空间不足时删除文件。', selected: false },
    { id: '85f4-1', code: '85F4.1', description: '如果你的第三方SDK为应用提供了磁盘空间API的包装函数，并且你仅在应用调用你的包装函数时才访问磁盘空间API，请声明此原因。此原因仅可由第三方SDK声明。', selected: false, thirdPartyOnly: true }
  ],
  'NSPrivacyAccessedAPICategoryActiveKeyboards': [
    { id: '3ec4-1', code: '3EC4.1', description: '声明此原因以访问活动键盘信息，以向设备使用者展示正确的自定义用户界面。', selected: false },
    { id: '54bd-1', code: '54BD.1', description: '如果你的第三方SDK为应用提供了活动键盘API的包装函数，并且你仅在应用调用你的包装函数时才访问活动键盘API，请声明此原因。此原因仅可由第三方SDK声明。', selected: false, thirdPartyOnly: true }
  ],
  'NSPrivacyAccessedAPICategoryUserDefaults': [
    { id: 'ca92-1', code: 'CA92.1', description: '声明此原因以访问用户默认设置，以读取和写入仅应用本身可访问的信息。', selected: false },
    { id: '1c8f-1', code: '1C8F.1', description: '声明此原因以访问用户默认设置，以读取和写入可用于识别人员或设备的信息。', selected: false },
    { id: 'c56d-1', code: 'C56D.1', description: '如果你的第三方SDK为应用提供了用户默认设置API的包装函数，并且你仅在应用调用你的包装函数时才访问用户默认设置API，请声明此原因。此原因仅可由第三方SDK声明。', selected: false, thirdPartyOnly: true }
  ]
}

// 获取当前选中分类的可用原因
const availableReasonsForCurrentCategory = computed(() => {
  if (!currentApiUsage.value.selectedCategoryId) {
    return []
  }
  return apiReasonsByCategory[currentApiUsage.value.selectedCategoryId as keyof typeof apiReasonsByCategory] || []
})

// API使用管理函数
function resetCurrentApiUsage() {
  currentApiUsage.value.selectedCategoryId = ''
  currentApiUsage.value.selectedReasons = []
}

function addApiUsage() {
  if (!currentApiUsage.value.selectedCategoryId || currentApiUsage.value.selectedReasons.length === 0) {
    return
  }
  
  const categoryName = availableApiCategories.find(cat => cat.id === currentApiUsage.value.selectedCategoryId)?.name || ''
  
  const newEntry: ApiUsageEntry = {
    id: Date.now().toString(),
    categoryId: currentApiUsage.value.selectedCategoryId,
    categoryName: categoryName,
    selectedReasons: [...currentApiUsage.value.selectedReasons]
  }
  
  apiUsageEntries.value.push(newEntry)
  resetCurrentApiUsage()
}

function removeApiUsage(entryId: string) {
  const index = apiUsageEntries.value.findIndex(entry => entry.id === entryId)
  if (index > -1) {
    apiUsageEntries.value.splice(index, 1)
  }
}

function toggleCurrentReason(reason: ApiReason) {
  const index = currentApiUsage.value.selectedReasons.findIndex(r => r.id === reason.id)
  if (index > -1) {
    currentApiUsage.value.selectedReasons.splice(index, 1)
  } else {
    currentApiUsage.value.selectedReasons.push({ ...reason })
  }
}

function isReasonCurrentlySelected(reason: ApiReason) {
  return currentApiUsage.value.selectedReasons.some(r => r.id === reason.id)
}

// 数据类型管理函数
function addDataType() {
  if (!currentDataType.value.selectedTypeId || currentDataType.value.selectedPurposes.length === 0) {
    return
  }
  
  const selectedType = availableDataTypes.find(type => type.id === currentDataType.value.selectedTypeId)
  if (!selectedType) return
  
  const newDataType: CollectedDataType = {
    id: Date.now().toString(),
    name: selectedType.name,
    category: selectedType.id,
    selected: true,
    linkedToIdentity: currentDataType.value.linkedToIdentity,
    usedForTracking: currentDataType.value.usedForTracking,
    purposes: [...currentDataType.value.selectedPurposes]
  }
  
  collectedDataTypes.value.push(newDataType)
  resetCurrentDataType()
}

function removeDataType(dataTypeId: string) {
  const index = collectedDataTypes.value.findIndex(dt => dt.id === dataTypeId)
  if (index > -1) {
    collectedDataTypes.value.splice(index, 1)
  }
}

function resetCurrentDataType() {
  currentDataType.value.selectedTypeId = ''
  currentDataType.value.linkedToIdentity = false
  currentDataType.value.usedForTracking = false
  currentDataType.value.selectedPurposes = []
}

function togglePurpose(purposeId: string) {
  const index = currentDataType.value.selectedPurposes.indexOf(purposeId)
  if (index > -1) {
    currentDataType.value.selectedPurposes.splice(index, 1)
  } else {
    currentDataType.value.selectedPurposes.push(purposeId)
  }
}

function isPurposeSelected(purposeId: string) {
  return currentDataType.value.selectedPurposes.includes(purposeId)
}

function getPurposeName(purposeId: string) {
  const purpose = availablePurposes.find(p => p.id === purposeId)
  return purpose ? purpose.name : purposeId
}

// 域名管理函数
function addDomain() {
  const domain = newDomain.value.trim()
  if (domain && !trackingDomains.value.includes(domain)) {
    trackingDomains.value.push(domain)
    newDomain.value = ''
  }
}

function removeDomain(index: number) {
  trackingDomains.value.splice(index, 1)
}

// 剪贴板和下载函数
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(generatedXml.value)
    alert('已复制到剪贴板！')
  } catch {
    alert('复制到剪贴板失败')
  }
}

function downloadManifest() {
  const blob = new Blob([generatedXml.value], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'PrivacyInfo.xcprivacy'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Generate XML
const generatedXml = computed(() => {
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>'
  ]
  
  if (includePrivacyTracking.value) {
    xmlLines.push('    <key>NSPrivacyTracking</key>')
    xmlLines.push('    <true/>')
  }
  
  if (trackingDomains.value.length > 0) {
    xmlLines.push('    <key>NSPrivacyTrackingDomains</key>')
    xmlLines.push('    <array>')
    trackingDomains.value.forEach(domain => {
      xmlLines.push(`        <string>${domain}</string>`)
    })
    xmlLines.push('    </array>')
  }
  
  if (apiUsageEntries.value.length > 0) {
    xmlLines.push('    <key>NSPrivacyAccessedAPITypes</key>')
    xmlLines.push('    <array>')
    apiUsageEntries.value.forEach(entry => {
      xmlLines.push('        <dict>')
      xmlLines.push(`            <key>NSPrivacyAccessedAPIType</key>`)
      xmlLines.push(`            <string>${entry.categoryId}</string>`)
      if (entry.selectedReasons.length > 0) {
        xmlLines.push('            <key>NSPrivacyAccessedAPITypeReasons</key>')
        xmlLines.push('            <array>')
        entry.selectedReasons.forEach(reason => {
          xmlLines.push(`                <string>${reason.code}</string>`)
        })
        xmlLines.push('            </array>')
      }
      xmlLines.push('        </dict>')
    })
    xmlLines.push('    </array>')
  }
  
  xmlLines.push('    <key>NSPrivacyCollectedDataTypes</key>')
  if (collectedDataTypes.value.length > 0) {
    xmlLines.push('    <array>')
    collectedDataTypes.value.forEach(dataType => {
      xmlLines.push('        <dict>')
      xmlLines.push('            <key>NSPrivacyCollectedDataType</key>')
      xmlLines.push(`            <string>${dataType.category}</string>`)
      xmlLines.push('            <key>NSPrivacyCollectedDataTypeLinkedToUser</key>')
      xmlLines.push(`            <${dataType.linkedToIdentity ? 'true' : 'false'}/>`)
      xmlLines.push('            <key>NSPrivacyCollectedDataTypeTracking</key>')
      xmlLines.push(`            <${dataType.usedForTracking ? 'true' : 'false'}/>`)
      xmlLines.push('            <key>NSPrivacyCollectedDataTypePurposes</key>')
      xmlLines.push('            <array>')
      dataType.purposes.forEach(purpose => {
        xmlLines.push(`                <string>${purpose}</string>`)
      })
      xmlLines.push('            </array>')
      xmlLines.push('        </dict>')
    })
    xmlLines.push('    </array>')
  } else {
    xmlLines.push('    <array></array>')
  }
  xmlLines.push('</dict>')
  xmlLines.push('</plist>')
  
  return xmlLines.join('\n')
})
</script>