<script setup lang="ts">
import { ref, computed } from 'vue'
import AppHeader from './components/AppHeader.vue'
import PrivacyTrackingCard from './components/PrivacyTrackingCard.vue'
import TrackingDomainsCard from './components/TrackingDomainsCard.vue'
import ApiUsageCard from './components/ApiUsageCard.vue'
import DataTypesCard from './components/DataTypesCard.vue'
import PreviewPanel from './components/PreviewPanel.vue'
import ImportDialog from './components/ImportDialog.vue'

// 基础配置状态
const includePrivacyTracking = ref(false)
const trackingDomains = ref<string[]>([])
const newDomain = ref('')

// 导入功能相关状态
const showImportDialog = ref(false)
const importXmlText = ref('')
const importStatus = ref({ type: '', message: '' })

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

// 当前正在添加的API使用条目
const currentApiUsage = ref({
  selectedCategoryId: '',
  selectedReasons: [] as ApiReason[]
})

// 可选的API分类
const availableApiCategories = [
  { id: 'NSPrivacyAccessedAPICategoryFileTimestamp', name: '文件时间戳 APIs' },
  { id: 'NSPrivacyAccessedAPICategorySystemBootTime', name: '系统启动时间 APIs' },
  { id: 'NSPrivacyAccessedAPICategoryDiskSpace', name: '磁盘空间 APIs' },
  { id: 'NSPrivacyAccessedAPICategoryActiveKeyboards', name: '活动键盘 APIs' },
  { id: 'NSPrivacyAccessedAPICategoryUserDefaults', name: '用户默认设置 APIs' }
]

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

// 生成XML
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
  } else {
    xmlLines.push('    <key>NSPrivacyAccessedAPITypes</key>')
    xmlLines.push('    <array></array>')
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

// 基础功能
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
  
  // 重置当前数据类型
  currentDataType.value = {
    selectedTypeId: '',
    linkedToIdentity: false,
    usedForTracking: false,
    selectedPurposes: []
  }
}

function removeDataType(dataTypeId: string) {
  const index = collectedDataTypes.value.findIndex(dt => dt.id === dataTypeId)
  if (index > -1) {
    collectedDataTypes.value.splice(index, 1)
  }
}

function togglePurpose(purposeId: string) {
  const index = currentDataType.value.selectedPurposes.indexOf(purposeId)
  if (index > -1) {
    currentDataType.value.selectedPurposes.splice(index, 1)
  } else {
    currentDataType.value.selectedPurposes.push(purposeId)
  }
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

// 导入相关函数（简化版本，保持核心功能）
function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const xmlContent = e.target?.result as string
      parsePrivacyManifest(xmlContent)
    }
    reader.readAsText(file)
  }
}

function handleTextImport() {
  if (importXmlText.value.trim()) {
    parsePrivacyManifest(importXmlText.value.trim())
    importXmlText.value = ''
  }
}

function clearImportStatus() {
  importStatus.value = { type: '', message: '' }
}

function handleFileDrop(event: DragEvent) {
  event.preventDefault()
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const xmlContent = e.target?.result as string
      parsePrivacyManifest(xmlContent)
    }
    reader.readAsText(file)
  }
}

// 完整的XML解析函数
function parsePrivacyManifest(xmlText: string) {
  try {
    // 清空当前配置
    resetAllConfigurations()
    
    // 创建DOM解析器
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml')
    
    // 检查解析错误
    const parseError = xmlDoc.querySelector('parsererror')
    if (parseError) {
      throw new Error('XML格式错误，请检查文件内容')
    }
    
    // 获取根节点
    const dictElement = xmlDoc.querySelector('plist > dict')
    if (!dictElement) {
      throw new Error('无效的隐私清单文件格式')
    }
    
    // 解析各个配置项
    parsePrivacyTracking(dictElement)
    parseTrackingDomains(dictElement)
    parseAccessedAPITypes(dictElement)
    parseCollectedDataTypes(dictElement)
    
    importStatus.value = { 
      type: 'success', 
      message: '导入成功！已自动填充配置项。' 
    }
    showImportDialog.value = false
    
  } catch (error: unknown) {
    console.error('XML解析错误:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    importStatus.value = { 
      type: 'error', 
      message: `导入失败：${errorMessage}` 
    }
  }
}

// 重置所有配置项
function resetAllConfigurations() {
  includePrivacyTracking.value = false
  trackingDomains.value = []
  apiUsageEntries.value = []
  collectedDataTypes.value = []
  currentDataType.value = {
    selectedTypeId: '',
    linkedToIdentity: false,
    usedForTracking: false,
    selectedPurposes: []
  }
  currentApiUsage.value = {
    selectedCategoryId: '',
    selectedReasons: []
  }
}

// 解析隐私跟踪设置
function parsePrivacyTracking(dictElement: Element) {
  const keys = dictElement.querySelectorAll('key')
  for (const key of keys) {
    if (key.textContent?.trim() === 'NSPrivacyTracking') {
      const nextElement = key.nextElementSibling
      if (nextElement?.tagName === 'true') {
        includePrivacyTracking.value = true
      }
      break
    }
  }
}

// 解析跟踪域名
function parseTrackingDomains(dictElement: Element) {
  const keys = dictElement.querySelectorAll('key')
  for (const key of keys) {
    if (key.textContent?.trim() === 'NSPrivacyTrackingDomains') {
      const arrayElement = key.nextElementSibling
      if (arrayElement?.tagName === 'array') {
        const stringElements = arrayElement.querySelectorAll('string')
        const domains: string[] = []
        stringElements.forEach(stringEl => {
          const domain = stringEl.textContent?.trim()
          if (domain) {
            domains.push(domain)
          }
        })
        trackingDomains.value = domains
      }
      break
    }
  }
}

// 解析API使用类型
function parseAccessedAPITypes(dictElement: Element) {
  const keys = dictElement.querySelectorAll('key')
  for (const key of keys) {
    if (key.textContent?.trim() === 'NSPrivacyAccessedAPITypes') {
      const arrayElement = key.nextElementSibling
      if (arrayElement?.tagName === 'array') {
        const dictElements = arrayElement.querySelectorAll('dict')
        const parsedEntries: ApiUsageEntry[] = []
        
        dictElements.forEach(dictEl => {
          const entry = parseApiUsageEntry(dictEl)
          if (entry) {
            parsedEntries.push(entry)
          }
        })
        
        apiUsageEntries.value = parsedEntries
      }
      break
    }
  }
}

// 解析单个API使用条目
function parseApiUsageEntry(dictElement: Element): ApiUsageEntry | null {
  let categoryId = ''
  let categoryName = ''
  const selectedReasons: ApiReason[] = []
  
  const keys = dictElement.querySelectorAll('key')
  
  for (const key of keys) {
    const keyText = key.textContent?.trim()
    const nextElement = key.nextElementSibling
    
    if (keyText === 'NSPrivacyAccessedAPIType') {
      categoryId = nextElement?.textContent?.trim() || ''
      // 根据categoryId查找对应的分类名称
      const category = availableApiCategories.find(cat => cat.id === categoryId)
      categoryName = category ? category.name : categoryId
    } else if (keyText === 'NSPrivacyAccessedAPITypeReasons') {
      if (nextElement?.tagName === 'array') {
        const reasonElements = nextElement.querySelectorAll('string')
        reasonElements.forEach(reasonEl => {
          const reasonCode = reasonEl.textContent?.trim()
          if (reasonCode) {
            // 查找对应的原因对象
            const allReasons = getAllAvailableReasons()
            const reason = allReasons.find(r => r.code === reasonCode)
            if (reason) {
              selectedReasons.push({ ...reason })
            }
          }
        })
      }
    }
  }
  
  if (categoryId) {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      categoryId,
      categoryName,
      selectedReasons
    }
  }
  
  return null
}

// 获取所有可用的API原因
function getAllAvailableReasons(): ApiReason[] {
  const allReasons: ApiReason[] = []
  
  // 遍历所有分类的原因
  Object.entries(apiReasonsByCategory).forEach(([, reasons]) => {
    reasons.forEach(reason => {
      allReasons.push(reason)
    })
  })
  
  return allReasons
}

// 解析收集的数据类型
function parseCollectedDataTypes(dictElement: Element) {
  const keys = dictElement.querySelectorAll('key')
  for (const key of keys) {
    if (key.textContent?.trim() === 'NSPrivacyCollectedDataTypes') {
      const arrayElement = key.nextElementSibling
      if (arrayElement?.tagName === 'array') {
        const dictElements = arrayElement.querySelectorAll('dict')
        const parsedDataTypes: CollectedDataType[] = []
        
        dictElements.forEach(dictEl => {
          const dataType = parseCollectedDataType(dictEl)
          if (dataType) {
            parsedDataTypes.push(dataType)
          }
        })
        
        collectedDataTypes.value = parsedDataTypes
      }
      break
    }
  }
}

// 解析单个收集的数据类型
function parseCollectedDataType(dictElement: Element): CollectedDataType | null {
  let category = ''
  let name = ''
  let linkedToIdentity = false
  let usedForTracking = false
  const purposes: string[] = []
  
  const keys = dictElement.querySelectorAll('key')
  
  for (const key of keys) {
    const keyText = key.textContent?.trim()
    const nextElement = key.nextElementSibling
    
    switch (keyText) {
      case 'NSPrivacyCollectedDataType':
        category = nextElement?.textContent?.trim() || ''
        // 根据category查找对应的数据类型名称
        const dataType = availableDataTypes.find(dt => dt.id === category)
        name = dataType ? dataType.name : category
        break
        
      case 'NSPrivacyCollectedDataTypeLinkedToUser':
        linkedToIdentity = nextElement?.tagName === 'true'
        break
        
      case 'NSPrivacyCollectedDataTypeTracking':
        usedForTracking = nextElement?.tagName === 'true'
        break
        
      case 'NSPrivacyCollectedDataTypePurposes':
        if (nextElement?.tagName === 'array') {
          const purposeElements = nextElement.querySelectorAll('string')
          purposeElements.forEach(purposeEl => {
            const purpose = purposeEl.textContent?.trim()
            if (purpose) {
              purposes.push(purpose)
            }
          })
        }
        break
    }
  }
  
  if (category) {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      category,
      selected: true,
      linkedToIdentity,
      usedForTracking,
      purposes
    }
  }
  
  return null
}
</script>

<template>
  <div class="app-container">
    <!-- 头部组件 -->
    <AppHeader />

    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 左侧配置面板 -->
      <section class="config-panel">
        <!-- 隐私跟踪设置 -->
        <PrivacyTrackingCard 
          :include-privacy-tracking="includePrivacyTracking"
          @update:include-privacy-tracking="includePrivacyTracking = $event"
        />

        <!-- 跟踪域名 -->
        <TrackingDomainsCard 
          :tracking-domains="trackingDomains"
          :new-domain="newDomain"
          @update:new-domain="newDomain = $event"
          @add-domain="addDomain"
          @remove-domain="removeDomain"
        />

        <!-- API 使用配置 -->
        <ApiUsageCard 
          :current-api-usage="currentApiUsage"
          :available-api-categories="availableApiCategories"
          :available-reasons-for-current-category="availableReasonsForCurrentCategory"
          :api-usage-entries="apiUsageEntries"
          @update:current-api-usage="currentApiUsage = $event"
          @add-api-usage="addApiUsage"
          @remove-api-usage="removeApiUsage"
          @toggle-current-reason="toggleCurrentReason"
        />

        <!-- 收集的数据类型 -->
        <DataTypesCard 
          :current-data-type="currentDataType"
          :available-data-types="availableDataTypes"
          :available-purposes="availablePurposes"
          :collected-data-types="collectedDataTypes"
          @update:current-data-type="currentDataType = $event"
          @add-data-type="addDataType"
          @remove-data-type="removeDataType"
          @toggle-purpose="togglePurpose"
        />
      </section>

      <!-- 右侧预览面板 -->
      <section class="preview-panel">
        <PreviewPanel 
          :generated-xml="generatedXml"
          @copy-to-clipboard="copyToClipboard"
          @download-manifest="downloadManifest"
          @show-import-dialog="showImportDialog = true"
        />
      </section>
    </main>

    <!-- 导入对话框 -->
    <ImportDialog 
      :show-import-dialog="showImportDialog"
      :import-xml-text="importXmlText"
      :import-status="importStatus"
      @update:show-import-dialog="showImportDialog = $event"
      @update:import-xml-text="importXmlText = $event"
      @handle-file-upload="handleFileUpload"
      @handle-text-import="handleTextImport"
      @clear-import-status="clearImportStatus"
      @handle-file-drop="handleFileDrop"
    />
  </div>
</template>

<style>
/* 引入全局样式 */
@import './assets/styles/global.css';

/* ============ 全新的布局系统 ============ */

/* 强制覆盖全局样式 - 确保完全填满 */
* {
  box-sizing: border-box !important;
}

html, body {
  width: 100vw !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow-x: hidden !important;
}

/* 应用容器 - 强制全屏填满布局 */
.app-container {
  min-height: 100vh !important;
  width: 100vw !important; /* 强制使用视口宽度 */
  max-width: none !important; /* 移除任何最大宽度限制 */
  background: var(--background-color) !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow-x: hidden !important;
  position: relative !important;
}

/* 头部区域 - 固定高度，全宽度 */
.app-header {
  width: 100% !important;
  flex-shrink: 0 !important;
  background: var(--gradient-primary) !important;
  position: relative !important;
  z-index: 10 !important;
}

/* 主内容区域 - 强制完全填满布局 */
.main-content {
  flex: 1 !important;
  display: grid !important;
  grid-template-columns: 500px 1fr !important;
  gap: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  width: 100vw !important; /* 强制使用视口宽度 */
  max-width: none !important; /* 移除最大宽度限制 */
  min-width: 100vw !important; /* 确保最小宽度也是视口宽度 */
  height: 100% !important;
  box-sizing: border-box !important;
  align-items: stretch !important;
  background: var(--background-color) !important;
  position: relative !important;
  left: 0 !important;
  right: 0 !important;
}

/* 配置面板和预览面板 - 完全填满布局 */
.config-panel {
  width: 100% !important;
  height: 100% !important; /* 填满整个高度 */
  padding: 1.5rem !important; /* 内边距提供呼吸空间 */
  box-sizing: border-box !important;
  background: var(--background-color) !important;
  border-right: 1px solid var(--border-color) !important; /* 添加分隔线 */
}

.preview-panel {
  width: 100% !important;
  height: 100% !important; /* 填满整个高度 */
  padding: 1.5rem !important; /* 内边距提供呼吸空间 */
  box-sizing: border-box !important;
  background: var(--background-color) !important;
  overflow: hidden !important;
}

/* ============ 响应式布局系统 ============ */

/* 超大屏幕 - 1600px+ */
@media (min-width: 1600px) {
  .main-content {
    grid-template-columns: 550px 1fr !important;
    gap: 0 !important;
    width: 100vw !important;
    max-width: none !important;
  }
}

/* 大屏幕 - 1400px-1599px */
@media (min-width: 1400px) and (max-width: 1599px) {
  .main-content {
    grid-template-columns: 520px 1fr !important;
    gap: 0 !important;
    width: 100vw !important;
    max-width: none !important;
  }
}

/* 中等屏幕 - 1200px-1399px */
@media (min-width: 1200px) and (max-width: 1399px) {
  .main-content {
    grid-template-columns: 480px 1fr !important;
    gap: 0 !important;
    width: 100vw !important;
    max-width: none !important;
  }
}

/* 小屏幕 - 1024px-1199px */
@media (min-width: 1024px) and (max-width: 1199px) {
  .main-content {
    grid-template-columns: 450px 1fr !important;
    gap: 0 !important;
    width: 100vw !important;
    max-width: none !important;
  }
}

/* 平板屏幕 - 768px-1023px */
@media (min-width: 768px) and (max-width: 1023px) {
  .main-content {
    grid-template-columns: 1fr !important;
    gap: 0 !important;
  }
  
  .config-panel {
    border-right: none !important; /* 移除分隔线 */
    border-bottom: 1px solid var(--border-color) !important; /* 添加底部分隔线 */
  }
  
  .preview-panel {
    order: -1 !important; /* 预览面板移到顶部 */
  }
  
  /* 在平板模式下，配置面板也要充分利用宽度 */
  .config-panel {
    max-width: none !important;
    padding: 1rem !important; /* 平板模式下减少内边距 */
  }
  
  .preview-panel {
    min-width: 300px !important; /* 平板模式下降低最小宽度 */
    padding: 1rem !important; /* 平板模式下减少内边距 */
  }
}

/* 手机屏幕 - 480px-767px */
@media (min-width: 480px) and (max-width: 767px) {
  .main-content {
    grid-template-columns: 1fr !important;
    gap: 0 !important;
  }
  
  .config-panel {
    border-right: none !important;
    border-bottom: 1px solid var(--border-color) !important;
  }
  
  .preview-panel {
    order: -1 !important;
    min-width: 200px !important; /* 手机模式下进一步降低最小宽度 */
  }
  
  /* 手机模式下减少容器内边距 */
  .config-panel {
    max-width: none !important;
    padding: 0.75rem !important; /* 手机模式下减少内边距 */
  }
  
  .preview-panel {
    padding: 0.75rem !important; /* 手机模式下减少内边距 */
  }
}

/* 小手机屏幕 - 479px及以下 */
@media (max-width: 479px) {
  .main-content {
    grid-template-columns: 1fr !important;
    gap: 0 !important;
  }
  
  .config-panel {
    border-right: none !important;
    border-bottom: 1px solid var(--border-color) !important;
  }
  
  .preview-panel {
    order: -1 !important;
    min-width: 150px !important; /* 小手机模式下最小宽度 */
  }
  
  /* 小手机模式下进一步减少容器内边距 */
  .config-panel {
    max-width: none !important;
    padding: 0.5rem !important; /* 小手机模式下最小内边距 */
  }
  
  .preview-panel {
    padding: 0.5rem !important; /* 小手机模式下最小内边距 */
  }
}

/* ============ 卡片样式增强 ============ */

/* 所有卡片的统一样式增强 */
.card {
  background: var(--gradient-card) !important;
  border-radius: 20px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid var(--border-color) !important;
  backdrop-filter: blur(20px) !important;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  overflow: hidden !important;
  position: relative !important;
  margin: 0 0 1.5rem 0 !important; /* 只保留底部间距，用于卡片之间的分隔 */
}

.card:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
}

/* 深色模式下的卡片优化 */
@media (prefers-color-scheme: dark) {
  .card {
    background: var(--gradient-card) !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
    border: 1px solid var(--border-color) !important;
  }
  
  .card:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6) !important;
  }
}

/* ============ 滚动条美化 ============ */

/* Webkit 浏览器滚动条 */
::-webkit-scrollbar {
  width: 8px !important;
  height: 8px !important;
}

::-webkit-scrollbar-track {
  background: transparent !important;
}

::-webkit-scrollbar-thumb {
  background: var(--border-color) !important;
  border-radius: 4px !important;
  transition: background 0.3s ease !important;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary) !important;
}

/* Firefox 滚动条 */
* {
  scrollbar-width: thin !important;
  scrollbar-color: var(--border-color) transparent !important;
}
</style>
