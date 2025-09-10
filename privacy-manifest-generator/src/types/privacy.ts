// API Categories
export interface ApiCategory {
  id: string
  name: string
  selected: boolean
}

// API Usage Reasons
export interface ApiUsageReason {
  id: string
  code: string
  description: string
  selected: boolean
  thirdPartyOnly?: boolean
}

// Privacy Data Types
export interface PrivacyDataType {
  id: string
  name: string
  category: string
  selected: boolean
  linkedToIdentity: boolean
  collectedForTracking: boolean
  purposes: string[]
}

// Tracking Purposes
export interface TrackingPurpose {
  id: string
  name: string
  selected: boolean
}

// Privacy Store State
export interface PrivacyState {
  // Required API Usage
  apiCategories: ApiCategory[]
  apiUsageReasons: ApiUsageReason[]
  
  // Privacy Tracking
  includePrivacyTracking: boolean
  trackingDomains: string[]
  
  // Collected Data Types
  collectedDataTypes: PrivacyDataType[]
  trackingPurposes: TrackingPurpose[]
}

// XML Generation
export interface PrivacyManifest {
  NSPrivacyTracking?: boolean
  NSPrivacyTrackingDomains?: string[]
  NSPrivacyCollectedDataTypes?: any[]
  NSPrivacyAccessedAPITypes?: any[]
}