// Commercial model types - Projects, Subprojects, and Configurations

export interface ConfigurationSnapshot {
  id: string;
  version: string;
  createdAt: string;
  createdBy: string;
  
  // Pricing rules
  baseMonthlyRent: number;
  tenureMonths: number;
  stabilizerEnabled?: boolean;
  firstMonthRent?: number;
  
  // Installation rules
  installationChargeable: boolean;
  installationCharge?: number;
  
  // Maintenance rules
  maintenanceIncluded: boolean;
  maintenanceCharge?: number;
  
  // Additional charges
  additionalCharges?: {
    name: string;
    amount: number;
    recurring: boolean;
  }[];
  
  // Notes
  notes?: string;
}

export interface Subproject {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  configuration: ConfigurationSnapshot;
  createdAt: string;
  createdBy: string;
  status: "active" | "archived";
  sitesCount: number;
  acsCount: number;
  plannedAcsCount?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  clientName: string;
  status: "active" | "on-hold" | "completed" | "archived";
  createdAt: string;
  createdBy: string;
  subprojects: Subproject[];
  
  // Aggregated stats
  totalSites: number;
  totalACS: number;
  activeACS: number;
  monthlyRevenue: number;
}

// ACS unit with tenure tracking
export interface ACSUnitWithTenure {
  id: string;
  serialNumber: string;
  model: string;
  location: string;
  status: "operational" | "maintenance" | "pending" | "offline" | "decommissioned";
  
  // Installation dates
  installDate?: string;
  activationDate?: string;
  // Indoor / Outdoor flag
  isIndoor?: boolean;
  
  // Tenure tracking (copied from configuration at activation)
  tenureMonths?: number;
  rentStartDate?: string;
  rentEndDate?: string;
  
  // Contract status
  contractStatus?: "not-started" | "active" | "expiring-soon" | "expired" | "terminated";
  daysRemaining?: number;
  
  // Maintenance
  lastMaintenance?: string;
  hasIssue?: boolean;
  
  // Configuration reference
  configurationId?: string;
  configurationVersion?: string;
}

// Site with project binding
export interface SiteWithProject {
  id: string;
  name: string;
  location: string;
  stage: "Started" | "WTS" | "WIP" | "TIS" | "Installed" | "Live";
  progress: number;
  acsPlanned: number;
  acsInstalled: number;
  hasDelay: boolean;
  delayDays?: number;
  
  // Project binding (immutable after creation)
  projectId: string;
  projectName: string;
  subprojectId?: string;
  subprojectName?: string;
  configurationId: string;
  configurationVersion: string;
  boundAt: string;
  
  // Derived from configuration (read-only)
  configuredRent: number;
  configuredTenure: number;
  installationIncluded: boolean;
  maintenanceIncluded: boolean;
}
