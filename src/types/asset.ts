// Extensible Asset and Installation Types

// ============================================
// DYNAMIC METADATA SYSTEM
// Key-value pairs that can evolve without schema changes
// ============================================

export interface MetadataField {
  key: string;
  label: string;
  value: string | number | boolean;
  type: "text" | "number" | "boolean" | "date" | "currency" | "select";
  unit?: string; // e.g., "meters", "kg", "pcs"
  category?: string; // For grouping in UI
  required?: boolean;
  options?: string[]; // For select type
}

export interface MetadataTemplate {
  id: string;
  name: string;
  description?: string;
  category: "installation" | "maintenance" | "inspection" | "replacement";
  fields: Omit<MetadataField, "value">[];
  createdAt: string;
  isActive: boolean;
}

// ============================================
// INSTALLATION METADATA
// Captures materials, components, costs during installation
// ============================================

export interface InstallationMaterial {
  id: string;
  name: string;
  category: string; // cables, brackets, sensors, consumables, etc.
  quantity: number;
  unit: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  cost?: number;
  notes?: string;
}

export interface InstallationDetails {
  id: string;
  acsUnitId: string;
  installationDate: string;
  completedBy: string;
  teamId?: string;
  teamName?: string;
  
  // Duration tracking
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  
  // Materials used (extensible array)
  materials: InstallationMaterial[];
  
  // Dynamic metadata fields (template-driven)
  metadata: MetadataField[];
  
  // Evidence
  photos: MediaEvidence[];
  videos: MediaEvidence[];
  documents: DocumentEvidence[];
  
  // Signatures
  installerSignature?: string;
  clientSignature?: string;
  
  // Quality check
  qualityCheckPassed?: boolean;
  qualityCheckNotes?: string;
  qualityCheckedBy?: string;
  qualityCheckDate?: string;
  
  // Notes
  generalNotes?: string;
  issuesEncountered?: string;
  
  // Context (immutable references)
  siteId: string;
  siteName: string;
  projectId: string;
  projectName: string;
  subprojectId?: string;
  subprojectName?: string;
  configurationId: string;
  configurationVersion: string;
}

// ============================================
// MEDIA AND DOCUMENT EVIDENCE
// ============================================

export interface MediaEvidence {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  caption?: string;
  tags?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, string>;
}

export interface DocumentEvidence {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  documentType: string; // invoice, certificate, manual, etc.
  description?: string;
  expiryDate?: string;
}

// ============================================
// MAINTENANCE RECORD
// ============================================

export interface MaintenanceRecord {
  id: string;
  acsUnitId: string;
  type: "scheduled" | "unscheduled" | "emergency" | "preventive";
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  
  performedBy: string;
  teamId?: string;
  
  // Work performed
  description: string;
  partsReplaced: ReplacedPart[];
  
  // Dynamic metadata
  metadata: MetadataField[];
  
  // Costs
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  
  // Evidence
  photos: MediaEvidence[];
  documents: DocumentEvidence[];
  
  // Follow-up
  requiresFollowUp?: boolean;
  followUpNotes?: string;
  nextMaintenanceDate?: string;
  
  // Context
  ticketId?: string;
  siteId: string;
  siteName: string;
}

export interface ReplacedPart {
  id: string;
  partName: string;
  partNumber?: string;
  oldSerialNumber?: string;
  newSerialNumber?: string;
  quantity: number;
  cost?: number;
  warrantyInfo?: string;
  reason: string;
}

// ============================================
// ASSET LIFECYCLE EVENT
// ============================================

export type LifecycleEventType = 
  | "created"
  | "assigned-to-site"
  | "shipped"
  | "delivered"
  | "installation-started"
  | "installation-completed"
  | "activated"
  | "rent-started"
  | "maintenance-scheduled"
  | "maintenance-completed"
  | "issue-reported"
  | "issue-resolved"
  | "part-replaced"
  | "deactivated"
  | "rent-ended"
  | "removed"
  | "decommissioned"
  | "reassigned"
  | "config-changed";

export interface LifecycleEvent {
  id: string;
  acsUnitId: string;
  eventType: LifecycleEventType;
  timestamp: string;
  performedBy: string;
  
  title: string;
  description?: string;
  
  // Reference to related records
  referenceType?: "installation" | "maintenance" | "ticket" | "shipment";
  referenceId?: string;
  
  // Context snapshot
  siteId?: string;
  siteName?: string;
  configurationVersion?: string;
  
  // Evidence
  photos?: MediaEvidence[];
  documents?: DocumentEvidence[];
  
  // Metadata captured at event time
  metadata?: MetadataField[];
}

// ============================================
// COMPREHENSIVE ASSET (ACS UNIT)
// ============================================

export interface ACSAsset {
  id: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  
  // Current status
  status: "in-stock" | "in-transit" | "pending-install" | "operational" | "maintenance" | "faulty" | "offline" | "decommissioned";
  
  // Current location
  currentSiteId?: string;
  currentSiteName?: string;
  locationWithinSite?: string;
  
  // Contract/tenure info (per-unit)
  tenureMonths?: number;
  rentStartDate?: string;
  rentEndDate?: string;
  contractStatus?: "not-started" | "active" | "expiring-soon" | "expired" | "terminated";
  daysRemaining?: number;
  monthlyRent?: number;
  
  // Configuration binding
  configurationId?: string;
  configurationVersion?: string;
  
  // Project context
  projectId?: string;
  projectName?: string;
  subprojectId?: string;
  subprojectName?: string;
  
  // Installation details
  installationDetails?: InstallationDetails;
  
  // Maintenance history (array of records)
  maintenanceHistory: MaintenanceRecord[];
  
  // Complete lifecycle
  lifecycleEvents: LifecycleEvent[];
  
  // All evidence across lifecycle
  allPhotos: MediaEvidence[];
  allVideos: MediaEvidence[];
  allDocuments: DocumentEvidence[];
  
  // Financial summary
  totalRevenueEarned?: number;
  totalMaintenanceCost?: number;
  netContribution?: number;
  
  // Warranty
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyStatus?: "active" | "expiring-soon" | "expired";
  
  // Audit
  createdAt: string;
  createdBy: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
}

// ============================================
// REPORTING TYPES
// ============================================

export interface AssetReportFilter {
  searchQuery?: string;
  status?: string[];
  model?: string[];
  projectId?: string[];
  subprojectId?: string[];
  siteId?: string[];
  contractStatus?: string[];
  dateRange?: {
    field: "installDate" | "rentStartDate" | "rentEndDate" | "createdAt";
    from?: string;
    to?: string;
  };
  materialUsed?: {
    name?: string;
    brand?: string;
    category?: string;
  };
  region?: string[];
}

export interface MaterialConsumptionReport {
  materialName: string;
  category: string;
  totalQuantity: number;
  totalCost: number;
  usedAtSites: number;
  byProject: {
    projectName: string;
    quantity: number;
    cost: number;
  }[];
  byRegion: {
    region: string;
    quantity: number;
  }[];
}
