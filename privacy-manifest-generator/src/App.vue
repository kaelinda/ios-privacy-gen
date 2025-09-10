<script setup lang="ts">
import { ref, computed } from 'vue'

// 基础配置状态
const includePrivacyTracking = ref(false)
const trackingDomains = ref<string[]>([])
const newDomain = ref('')

// 导入功能相关状态
const showImportDialog = ref(false)
const importXmlText = ref('')
const importStatus = ref({ type: '', message: '' })

// 简化的导入函数 -> 完整的XML解析函数
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
    
  } catch (error: any) {
    console.error('XML解析错误:', error)
    importStatus.value = { 
      type: 'error', 
      message: `导入失败：${error.message}` 
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
  Object.entries(apiReasonsByCategory).forEach(([categoryId, reasons]) => {
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

function isPurposeSelected(purposeId: string) {
  return currentDataType.value.selectedPurposes.includes(purposeId)
}

function getPurposeName(purposeId: string) {
  const purpose = availablePurposes.find(p => p.id === purposeId)
  return purpose ? purpose.name : purposeId
}

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

// 基础状态管理（已在文件开头声明）

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
</script>

<template>
  <div class="app-container">
    <!-- 头部 -->
    <header class="app-header">
      <h1>Apple 隐私清单生成器</h1>
      <p class="subtitle">为您的 iOS 应用生成符合 Apple 要求的隐私清单文件</p>
    </header>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 左侧配置面板 -->
      <section class="config-panel">
        <!-- 隐私跟踪设置 -->
        <div class="card">
          <h2>隐私跟踪设置</h2>
          <div class="form-group">
            <label class="checkbox-container">
              <input 
                type="checkbox" 
                v-model="includePrivacyTracking"
              >
              <span class="checkmark"></span>
              应用是否包含隐私跟踪
            </label>
          </div>
        </div>

        <!-- 跟踪域名 -->
        <div class="card">
          <h2>跟踪域名</h2>
          <div class="form-group">
            <div class="input-group">
              <input
                type="text"
                v-model="newDomain"
                placeholder="输入域名 (例如: analytics.example.com)"
                @keyup.enter="addDomain"
                class="domain-input"
              >
              <button @click="addDomain" class="add-btn">添加</button>
            </div>
          </div>
          <div class="domain-list" v-if="trackingDomains.length > 0">
            <div 
              v-for="(domain, index) in trackingDomains" 
              :key="index" 
              class="domain-item"
            >
              <span>{{ domain }}</span>
              <button @click="removeDomain(index)" class="remove-btn">删除</button>
            </div>
          </div>
        </div>

        <!-- API 使用配置 -->
        <div class="card">
          <h2>API 使用配置</h2>
          <div class="form-group">
            <label for="api-category">选择 API 分类：</label>
            <select 
              id="api-category"
              v-model="currentApiUsage.selectedCategoryId"
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
                    @change="toggleCurrentReason(reason)"
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
                @click="addApiUsage" 
                :disabled="currentApiUsage.selectedReasons.length === 0"
                class="add-api-btn"
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
                <button @click="removeApiUsage(entry.id)" class="remove-btn">删除</button>
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

        <!-- 收集的数据类型 -->
        <div class="card">
          <h2>收集的数据类型</h2>
          <div class="form-group">
            <label for="data-type">选择数据类型：</label>
            <select 
              id="data-type"
              v-model="currentDataType.selectedTypeId"
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

          <div v-if="currentDataType.selectedTypeId" class="data-type-config">
            <div class="form-group">
              <label class="checkbox-container">
                <input 
                  type="checkbox" 
                  v-model="currentDataType.linkedToIdentity"
                >
                <span class="checkmark"></span>
                与用户身份关联
              </label>
            </div>

            <div class="form-group">
              <label class="checkbox-container">
                <input 
                  type="checkbox" 
                  v-model="currentDataType.usedForTracking"
                >
                <span class="checkmark"></span>
                用于跟踪
              </label>
            </div>

            <div class="form-group">
              <label>使用目的：</label>
              <div class="purpose-list">
                <label 
                  v-for="purpose in availablePurposes" 
                  :key="purpose.id" 
                  class="checkbox-container purpose-item"
                >
                  <input 
                    type="checkbox" 
                    :checked="isPurposeSelected(purpose.id)"
                    @change="togglePurpose(purpose.id)"
                  >
                  <span class="checkmark"></span>
                  {{ purpose.name }}
                </label>
              </div>
            </div>

            <div class="button-container">
              <button 
                @click="addDataType" 
                :disabled="currentDataType.selectedPurposes.length === 0"
                class="add-data-btn"
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
                <button @click="removeDataType(dataType.id)" class="remove-btn">删除</button>
              </div>
              <div class="data-type-details">
                <div class="data-type-flags">
                  <span v-if="dataType.linkedToIdentity" class="flag linked">身份关联</span>
                  <span v-if="dataType.usedForTracking" class="flag tracking">用于跟踪</span>
                </div>
                <div class="data-type-purposes">
                  <span 
                    v-for="purposeId in dataType.purposes" 
                    :key="purposeId" 
                    class="purpose-tag"
                  >
                    {{ getPurposeName(purposeId) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧预览面板 -->
      <section class="preview-panel">
        <div class="card">
          <div class="preview-header">
            <h2>生成的隐私清单预览</h2>
            <div class="action-buttons">
              <button @click="showImportDialog = true" class="import-btn">导入XML文件</button>
              <button @click="copyToClipboard" class="copy-btn">复制到剪贴板</button>
              <button @click="downloadManifest" class="download-btn">下载文件</button>
            </div>
          </div>
          <div class="xml-preview">
            <pre><code>{{ generatedXml }}</code></pre>
          </div>
        </div>

        <!-- 导入对话框 -->
        <div v-if="showImportDialog" class="import-dialog-overlay" @click="showImportDialog = false">
          <div class="import-dialog" @click.stop>
            <div class="import-dialog-header">
              <h3>导入隐私清单文件</h3>
              <button @click="showImportDialog = false" class="close-btn">×</button>
            </div>
            
            <div class="import-dialog-content">
              <!-- 文件上传区域 -->
              <div class="upload-area" 
                   @drop="handleFileDrop" 
                   @dragover.prevent 
                   @dragenter.prevent>
                <input 
                  type="file" 
                  accept=".xml,.xcprivacy"
                  @change="handleFileUpload"
                  id="file-input"
                  class="file-input"
                >
                <label for="file-input" class="upload-label">
                  <div class="upload-icon">📁</div>
                  <div class="upload-text">
                    <div class="upload-primary">点击选择文件或拖拽到此处</div>
                    <div class="upload-secondary">支持 .xml 和 .xcprivacy 文件</div>
                  </div>
                </label>
              </div>

              <!-- 文本导入区域 -->
              <div class="text-import-area">
                <label for="xml-text">或直接粘贴XML内容：</label>
                <textarea 
                  id="xml-text"
                  v-model="importXmlText" 
                  placeholder="粘贴您的XML内容到这里..."
                  class="xml-textarea"
                ></textarea>
                <button @click="handleTextImport" :disabled="!importXmlText.trim()" class="import-text-btn">
                  导入文本内容
                </button>
              </div>

              <!-- 状态消息 -->
              <div v-if="importStatus.message" 
                   :class="['import-status', importStatus.type]">
                {{ importStatus.message }}
                <button @click="clearImportStatus" class="status-close">×</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* 全局样式重置和背景色修复 - 苹果官方配色方案 */
:root {
  /* 苹果官方主色调 */
  --primary-color: #007aff; /* 苹果蓝 */
  --secondary-color: #34c759; /* 苹果绿 */
  --danger-color: #ff3b30; /* 苹果红 */
  --warning-color: #ff9500; /* 苹果橙 */
  
  /* 浅色模式 - 苹果官网风格 */
  --background-color: #f5f5f7; /* 苹果浅灰背景 */
  --card-background: #ffffff;
  --border-color: #d2d2d7; /* 苹果边框灰 */
  --text-primary: #1d1d1f; /* 苹果深色文字 */
  --text-secondary: #86868b; /* 苹果次要文字 */
  --shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  --border-radius: 12px;
  
  /* 苹果特色渐变色 */
  --gradient-primary: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
  --gradient-card: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
}

/* 深色模式适配 - 苹果官网深色风格 */
@media (prefers-color-scheme: dark) {
  :root {
    --background-color: #000000; /* 苹果纯黑背景 */
    --card-background: #1c1c1e; /* 苹果深灰卡片 */
    --border-color: #38383a; /* 苹果深色边框 */
    --text-primary: #f2f2f7; /* 苹果浅色文字 */
    --text-secondary: #8e8e93; /* 苹果次要文字深色版 */
    --shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    
    /* 深色模式渐变 */
    --gradient-primary: linear-gradient(135deg, #0a84ff 0%, #64d2ff 100%);
    --gradient-card: linear-gradient(145deg, #1c1c1e 0%, #2c2c2e 100%);
  }
}

* {
  box-sizing: border-box;
}

body, html {
  background-color: var(--background-color) !important;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text-primary);
}

/* 应用容器 - 最大化利用宽度 */
.app-container {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: 0;
  max-width: 1800px; /* 支持超宽屏 */
  margin: 0 auto;
}

/* 头部样式 - 苹果官网风格 */
.app-header {
  background: var(--gradient-primary);
  color: white;
  padding: 3rem 2rem;
  text-align: center;
  margin-bottom: 0;
  position: relative;
  overflow: hidden;
}

.app-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
  pointer-events: none;
}

.app-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  position: relative;
  z-index: 1;
}

.subtitle {
  margin: 0;
  font-size: 1.25rem;
  opacity: 0.9;
  font-weight: 400;
  position: relative;
  z-index: 1;
  max-width: 600px;
  margin: 0 auto;
}

/* 主要内容区域 - 苹果官网风格网格布局 */
.main-content {
  display: grid;
  grid-template-columns: 1.4fr 0.6fr;
  gap: 2.5rem;
  padding: 3rem 2rem;
  max-width: 100%;
  background: var(--background-color);
  margin-top: -1rem; /* 与头部连接 */
  border-radius: 20px 20px 0 0; /* 苹果式圆角 */
  position: relative;
  z-index: 1;
}

/* 响应式设计 - 最大化利用不同屏幕宽度 */
@media (min-width: 1600px) {
  .main-content {
    grid-template-columns: 1.5fr 0.5fr;
    gap: 3rem;
    padding: 0 3rem 3rem 3rem;
  }
  .app-header {
    padding: 3rem 3rem;
  }
}

@media (max-width: 1400px) {
  .main-content {
    grid-template-columns: 1.3fr 0.7fr;
    gap: 1.5rem;
  }
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 0 1.5rem 1.5rem 1.5rem;
  }
  .app-header {
    padding: 1.5rem;
  }
  .app-header h1 {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 0 1rem 1rem 1rem;
    gap: 1rem;
  }
  .app-header {
    padding: 1rem;
  }
  .app-header h1 {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 0 0.75rem 0.75rem 0.75rem;
  }
  .app-header {
    padding: 0.75rem;
  }
}

/* 配置面板和预览面板 */
.config-panel,
.preview-panel {
  width: 100%;
}

/* 卡片样式 - 苹果官网风格 */
.card {
  background: var(--gradient-card);
  border-radius: 16px; /* 苹果式大圆角 */
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  width: 100%;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  pointer-events: none;
}

.card h2 {
  margin: 0 0 1.5rem 0;
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.card h3 {
  margin: 2rem 0 1rem 0;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* 深色模式下的卡片优化 */
@media (prefers-color-scheme: dark) {
  .card {
    background: var(--gradient-card);
    border: 1px solid var(--border-color);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  }
  
  .card::before {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  }
  
  .card h2,
  .card h3 {
    color: var(--text-primary);
  }
}

/* 表单组件 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
}

/* 深色模式下的表单优化 */
@media (prefers-color-scheme: dark) {
  .form-group label {
    color: #ffffff;
    font-weight: 600;
  }
}

.select-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--border-color); /* 增强边框厚度 */
  border-radius: 12px;
  font-size: 1rem;
  background-color: var(--card-background);
  color: var(--text-primary);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); /* 添加轻微阴影 */
  cursor: pointer;
}

.select-input:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.1);
  transform: translateY(-1px);
}

.select-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
  transform: translateY(-1px);
}

/* 深色模式下的选择器优化 */
@media (prefers-color-scheme: dark) {
  .select-input {
    border: 2px solid #4a4a4a; /* 更明显的边框颜色 */
    background-color: #2c2c2e; /* 稍亮背景色 */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .select-input:hover {
    border-color: #4da6ff;
    box-shadow: 0 2px 6px rgba(77, 166, 255, 0.2);
  }
  
  .select-input:focus {
    border-color: #4da6ff; /* 深色模式下的聚焦高亮效果 */
    box-shadow: 0 0 0 3px rgba(77, 166, 255, 0.2);
  }
}


/* 输入组 */
.input-group {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  align-items: center; /* 垂直居中对齐 */
}

.domain-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color); /* 增强边框厚度 */
  border-radius: 10px;
  font-size: 1rem;
  background-color: var(--card-background);
  color: var(--text-primary);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(10px);
  height: 44px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); /* 添加轻微阴影 */
}

.domain-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
  transform: translateY(-1px);
}

.domain-input::placeholder {
  color: var(--text-secondary);
  font-weight: 400;
}

/* 深色模式下的域名输入框优化 */
@media (prefers-color-scheme: dark) {
  .domain-input {
    border: 2px solid #4a4a4a; /* 更明显的边框颜色 */
    background-color: #2c2c2e; /* 稍亮背景色 */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .domain-input:focus {
    border-color: #4da6ff;
    box-shadow: 0 0 0 3px rgba(77, 166, 255, 0.2);
  }
  
  .domain-input::placeholder {
    color: #8e8e93;
  }
}


/* 按钮容器 - 实现左右居中对齐 */
.button-container {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
  width: 100%;
}

/* 按钮样式 - 苹果官网风格 */
.add-btn,
.add-api-btn,
.add-data-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
  position: relative;
  overflow: hidden;
  height: 44px; /* 与输入框高度一致 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 跟踪域名模块的添加按钮特别优化 */
.add-btn {
  padding: 0 1.5rem; /* 减少水平内边距 */
  border-radius: 10px; /* 与输入框圆角一致 */
  font-size: 0.9rem; /* 稍微减小字体 */
  min-width: 80px; /* 最小宽度 */
}

.add-btn::before,
.add-api-btn::before,
.add-data-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.add-btn:hover::before,
.add-api-btn:hover::before,
.add-data-btn:hover::before {
  left: 100%;
}

.add-btn:hover,
.add-api-btn:hover,
.add-data-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 122, 255, 0.4);
}

.add-btn:active,
.add-api-btn:active,
.add-data-btn:active {
  transform: translateY(0px);
}

.add-btn:disabled,
.add-api-btn:disabled,
.add-data-btn:disabled {
  background: linear-gradient(135deg, #c6c6c8, #b0b0b0);
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

.remove-btn {
  background: linear-gradient(135deg, var(--danger-color), #ff6b6b);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);
}

.remove-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.4);
}


/* 复选框样式 */
.checkbox-container {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  position: relative;
  padding-left: 2rem;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.checkbox-container input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkmark {
  position: absolute;
  top: 0.125rem;
  left: 0;
  height: 1.25rem;
  width: 1.25rem;
  background-color: var(--card-background);
  border: 2px solid var(--border-color);
  border-radius: 4px;
  transition: all 0.2s;
}

.checkbox-container:hover input ~ .checkmark {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.checkbox-container input:checked ~ .checkmark {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 4px;
  top: 1px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 3px 3px 0; /* 增加勾选符号粗细 */
  transform: rotate(45deg);
}

/* 深色模式下的复选框优化 */
@media (prefers-color-scheme: dark) {
  .checkmark {
    border: 2px solid #606060; /* 更明显的边框 */
    background-color: #3a3a3a; /* 更明显的背景 */
  }
  
  .checkbox-container:hover input ~ .checkmark {
    border-color: #4da6ff;
    background-color: #404040;
    box-shadow: 0 0 0 2px rgba(77, 166, 255, 0.3);
  }
  
  .checkbox-container input:checked ~ .checkmark {
    background-color: #007aff;
    border-color: #007aff;
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.4);
  }
}

/* 域名列表 */
.domain-list {
  margin-top: 1.5rem;
}

.domain-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: var(--background-color);
  border: 2px solid var(--border-color); /* 增强边框 */
  border-radius: 12px;
  margin-bottom: 1rem; /* 增加间距 */
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 添加阴影 */
}

.domain-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.15);
  transform: translateY(-2px);
}

.domain-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--warning-color), var(--danger-color));
  border-radius: 12px 12px 0 0;
}

.domain-item span {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 1rem;
  letter-spacing: -0.01em;
}

/* 深色模式下的域名条目优化 */
@media (prefers-color-scheme: dark) {
  .domain-item {
    background-color: var(--card-background);
    border: 2px solid var(--border-color);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  
  .domain-item:hover {
    border-color: #0a84ff;
    box-shadow: 0 6px 20px rgba(10, 132, 255, 0.25);
  }
  
  .domain-item span {
    color: var(--text-primary);
  }
}

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

/* 数据类型配置 */
.data-type-config {
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.purpose-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.purpose-item {
  margin-bottom: 0.5rem;
}

/* 已添加的数据类型 */
.added-data-types {
  margin-top: 1.5rem;
}

.data-type-entry {
  background-color: var(--background-color);
  border: 2px solid var(--border-color); /* 增强边框 */
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem; /* 增加间距 */
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 添加阴影 */
}

.data-type-entry:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.15);
  transform: translateY(-2px);
}

.data-type-entry::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 12px 12px 0 0;
}

/* 深色模式下的数据类型条目优化 */
@media (prefers-color-scheme: dark) {
  .data-type-entry {
    background-color: var(--card-background);
    border: 2px solid var(--border-color);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  
  .data-type-entry:hover {
    border-color: #0a84ff;
    box-shadow: 0 6px 20px rgba(10, 132, 255, 0.25);
  }
}

.data-type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color); /* 添加分隔线 */
}

.data-type-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.data-type-details {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* 增加间距 */
}

.data-type-flags {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.flag {
  padding: 0.375rem 0.875rem; /* 增加内边距 */
  border-radius: 20px; /* 更圆润的边框 */
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.flag.linked {
  background: linear-gradient(135deg, var(--secondary-color), #40d65a);
  color: white;
}

.flag.tracking {
  background: linear-gradient(135deg, var(--warning-color), #ffb340);
  color: white;
}

.data-type-purposes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--border-color); /* 添加虚线分隔 */
}

.purpose-tag {
  background: linear-gradient(135deg, var(--primary-color), #5856d6);
  color: white;
  padding: 0.375rem 1rem;
  border-radius: 18px;
  font-size: 0.8rem;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.2);
  transition: all 0.2s ease;
}

.purpose-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

/* 预览面板 */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.copy-btn,
.download-btn,
.import-btn {
  padding: 0.875rem 2rem;
  border: 2px solid transparent; /* 为深色模式准备边框 */
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
}

.import-btn {
  background: linear-gradient(135deg, var(--warning-color), #ffb347);
  color: white;
  box-shadow: 0 4px 16px rgba(255, 149, 0, 0.3);
  border-color: #ff9500; /* 橙色边框 */
}

.import-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 149, 0, 0.4);
}

.copy-btn {
  background: linear-gradient(135deg, var(--secondary-color), #40d65a);
  color: white;
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.3);
  border-color: #40d65a; /* 绿色边框 */
}

.copy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(52, 199, 89, 0.4);
}

.download-btn {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
  border-color: #4da6ff; /* 蓝色边框 */
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 122, 255, 0.4);
}

/* 深色模式下的按钮边框优化 */
@media (prefers-color-scheme: dark) {
  .import-btn {
    border-color: #ff9500;
    box-shadow: 0 4px 16px rgba(255, 149, 0, 0.4), 0 0 0 1px rgba(255, 149, 0, 0.2);
  }
  
  .import-btn:hover {
    box-shadow: 0 8px 25px rgba(255, 149, 0, 0.5), 0 0 0 2px rgba(255, 149, 0, 0.3);
  }
  
  .copy-btn {
    border-color: #40d65a;
    box-shadow: 0 4px 16px rgba(64, 214, 90, 0.4), 0 0 0 1px rgba(64, 214, 90, 0.2);
  }
  
  .copy-btn:hover {
    box-shadow: 0 8px 25px rgba(64, 214, 90, 0.5), 0 0 0 2px rgba(64, 214, 90, 0.3);
  }
  
  .download-btn {
    border-color: #4da6ff;
    box-shadow: 0 4px 16px rgba(77, 166, 255, 0.4), 0 0 0 1px rgba(77, 166, 255, 0.2);
  }
  
  .download-btn:hover {
    box-shadow: 0 8px 25px rgba(77, 166, 255, 0.5), 0 0 0 2px rgba(77, 166, 255, 0.3);
  }
}


.xml-preview {
  background-color: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.xml-preview pre {
  margin: 0;
  padding: 1.5rem;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #d4d4d4;
  background-color: transparent;
}

/* 深色模式下的XML预览优化 */
@media (prefers-color-scheme: dark) {
  .xml-preview {
    background-color: #0d1117;
    border-color: var(--border-color);
  }
  
  .xml-preview pre {
    color: #e6edf3;
  }
}

/* 浅色模式下的XML预览 */
@media (prefers-color-scheme: light) {
  .xml-preview {
    background-color: #f6f8fa;
    border-color: var(--border-color);
  }
  
  .xml-preview pre {
    color: #24292f;
  }
}

.xml-preview code {
  font-family: inherit;
  color: inherit;
  background-color: transparent;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .purpose-list {
    grid-template-columns: 1fr;
  }
  
  .xml-preview pre {
    font-size: 0.75rem;
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .copy-btn,
  .download-btn,
  .import-btn {
    width: 100%;
    text-align: center;
  }
}

/* 导入对话框样式 */
.import-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.import-dialog {
  background: var(--card-background);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.import-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.import-dialog-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: var(--border-color);
  color: var(--text-primary);
}

.import-dialog-content {
  padding: 2rem;
}

/* 文件上传区域 */
.upload-area {
  margin-bottom: 2rem;
}

.file-input {
  display: none;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  background-color: var(--background-color);
}

.upload-label:hover {
  border-color: var(--primary-color);
  background-color: rgba(0, 122, 255, 0.05);
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-text {
  text-align: center;
}

.upload-primary {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.upload-secondary {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* 文本导入区域 */
.text-import-area {
  margin-bottom: 1.5rem;
}

.text-import-area label {
  display: block;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  font-weight: 500;
}

.xml-textarea {
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  background-color: var(--background-color);
  color: var(--text-primary);
  resize: vertical;
  transition: border-color 0.2s;
}

.xml-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.xml-textarea::placeholder {
  color: var(--text-secondary);
}

.import-text-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--gradient-primary);
  color: white;
  border: 2px solid #4da6ff; /* 蓝色边框 */
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.import-text-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.import-text-btn:disabled {
  background: linear-gradient(135deg, #c6c6c8, #b0b0b0);
  border-color: #c6c6c8;
  cursor: not-allowed;
  transform: none;
}

/* 状态消息 */
.import-status {
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.import-status.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.import-status.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.status-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

/* 深色模式下的导入对话框优化 */
@media (prefers-color-scheme: dark) {
  .import-dialog {
    background: var(--card-background);
    border: 1px solid var(--border-color);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  }
  
  .import-dialog-header {
    border-bottom-color: var(--border-color);
  }
  
  .import-dialog-header h3 {
    color: var(--text-primary);
  }
  
  .upload-label:hover {
    border-color: #0a84ff;
    background-color: rgba(10, 132, 255, 0.1);
  }
  
  .xml-textarea {
    background-color: var(--card-background);
    border-color: var(--border-color);
    color: var(--text-primary);
  }
  
  .xml-textarea:focus {
    border-color: #0a84ff;
    box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.2);
  }
  
  .import-text-btn {
    border-color: #4da6ff;
    box-shadow: 0 0 0 1px rgba(77, 166, 255, 0.2);
  }
  
  .import-text-btn:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(77, 166, 255, 0.4), 0 0 0 1px rgba(77, 166, 255, 0.3);
  }
  
  .import-status.success {
    background-color: rgba(64, 214, 90, 0.2);
    color: #40d65a;
    border-color: rgba(64, 214, 90, 0.3);
  }
  
  .import-status.error {
    background-color: rgba(255, 85, 85, 0.2);
    color: #ff5555;
    border-color: rgba(255, 85, 85, 0.3);
  }
}
</style>