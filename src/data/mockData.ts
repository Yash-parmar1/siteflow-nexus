// Centralized mock data store for projects, sites, and assets

export interface ConfigurationSnapshot {
  id: string;
  version: string;
  createdAt: string;
  createdBy: string;
  baseMonthlyRent: number;
  tenureMonths: number;
  installationChargeable: boolean;
  installationCharge?: number;
  maintenanceIncluded: boolean;
  maintenanceCharge?: number;
}

export interface Subproject {
  id: string;
  name: string;
  projectId: string;
  configuration: ConfigurationSnapshot;
  createdAt: string;
  createdBy: string;
  status: "active" | "archived";
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  clientName: string;
  status: "active" | "on-hold" | "completed" | "archived";
  createdAt: string;
  createdBy: string;
  subprojects: Subproject[];
}

export interface Site {
  id: string;
  name: string;
  location: string;
  stage: "Started" | "WTS" | "WIP" | "TIS" | "Installed" | "Live";
  progress: number;
  acsPlanned: number;
  acsInstalled: number;
  hasDelay: boolean;
  rentStartDate?: string;
  // Project binding
  projectId: string;
  projectName: string;
  subprojectId: string;
  subprojectName: string;
  configVersion: string;
  configuredRent: number;
  configuredTenure: number;
}

export interface ACSUnit {
  id: string;
  serialNumber: string;
  model: string;
  siteId: string;
  siteName: string;
  location: string;
  status: "Operational" | "Under Maintenance" | "Faulty" | "Pending Install" | "In Transit";
  installDate: string;
  lastMaintenance: string;
  nextMaintenance: string;
  warrantyExpiry: string;
  openTickets: number;
  // Project binding (inherited from site)
  projectId: string;
  projectName: string;
  subprojectId: string;
  subprojectName: string;
  configVersion: string;
  configuredRent: number;
  tenureMonths: number;
  rentStartDate?: string;
  rentEndDate?: string;
}

// Projects with subprojects
export const mockProjects: Project[] = [
  {
    id: "proj-001",
    name: "Dava India",
    description: "National ATM network deployment for Dava banking consortium",
    clientId: "client-001",
    clientName: "Dava Banking Group",
    status: "active",
    createdAt: "2023-06-15",
    createdBy: "Rajesh Kumar",
    subprojects: [
      {
        id: "subproj-001",
        name: "Delhi",
        projectId: "proj-001",
        configuration: {
          id: "config-001",
          version: "1.0",
          createdAt: "2023-06-15",
          createdBy: "Rajesh Kumar",
          baseMonthlyRent: 12500,
          tenureMonths: 36,
          installationChargeable: false,
          maintenanceIncluded: true,
        },
        createdAt: "2023-06-15",
        createdBy: "Rajesh Kumar",
        status: "active",
      },
      {
        id: "subproj-002",
        name: "Mumbai",
        projectId: "proj-001",
        configuration: {
          id: "config-002",
          version: "1.0",
          createdAt: "2023-07-01",
          createdBy: "Priya Sharma",
          baseMonthlyRent: 15000,
          tenureMonths: 36,
          installationChargeable: true,
          installationCharge: 25000,
          maintenanceIncluded: true,
        },
        createdAt: "2023-07-01",
        createdBy: "Priya Sharma",
        status: "active",
      },
      {
        id: "subproj-003",
        name: "Bangalore",
        projectId: "proj-001",
        configuration: {
          id: "config-003",
          version: "1.0",
          createdAt: "2023-08-15",
          createdBy: "Amit Verma",
          baseMonthlyRent: 14000,
          tenureMonths: 48,
          installationChargeable: false,
          maintenanceIncluded: true,
        },
        createdAt: "2023-08-15",
        createdBy: "Amit Verma",
        status: "active",
      },
    ],
  },
  {
    id: "proj-002",
    name: "TechBank National",
    description: "Nationwide cooling infrastructure for TechBank ATMs",
    clientId: "client-002",
    clientName: "TechBank Ltd",
    status: "active",
    createdAt: "2023-09-01",
    createdBy: "Suresh Patel",
    subprojects: [
      {
        id: "subproj-004",
        name: "Tier-1 Cities",
        projectId: "proj-002",
        configuration: {
          id: "config-004",
          version: "1.0",
          createdAt: "2023-09-01",
          createdBy: "Suresh Patel",
          baseMonthlyRent: 16000,
          tenureMonths: 36,
          installationChargeable: true,
          installationCharge: 30000,
          maintenanceIncluded: false,
          maintenanceCharge: 2000,
        },
        createdAt: "2023-09-01",
        createdBy: "Suresh Patel",
        status: "active",
      },
      {
        id: "subproj-005",
        name: "Tier-2 Cities",
        projectId: "proj-002",
        configuration: {
          id: "config-005",
          version: "1.0",
          createdAt: "2023-10-15",
          createdBy: "Suresh Patel",
          baseMonthlyRent: 12000,
          tenureMonths: 48,
          installationChargeable: false,
          maintenanceIncluded: true,
        },
        createdAt: "2023-10-15",
        createdBy: "Suresh Patel",
        status: "active",
      },
    ],
  },
  {
    id: "proj-003",
    name: "Metro Finance",
    description: "Metro Finance branch and ATM cooling solutions",
    clientId: "client-003",
    clientName: "Metro Finance Corp",
    status: "on-hold",
    createdAt: "2024-01-10",
    createdBy: "Priya Sharma",
    subprojects: [
      {
        id: "subproj-006",
        name: "Phase 1",
        projectId: "proj-003",
        configuration: {
          id: "config-006",
          version: "1.0",
          createdAt: "2024-01-10",
          createdBy: "Priya Sharma",
          baseMonthlyRent: 11000,
          tenureMonths: 24,
          installationChargeable: false,
          maintenanceIncluded: true,
        },
        createdAt: "2024-01-10",
        createdBy: "Priya Sharma",
        status: "active",
      },
    ],
  },
];

// Sites with project bindings
export const mockSites: Site[] = [
  {
    id: "site-001",
    name: "Metro Tower - Block A",
    location: "Mumbai, Maharashtra",
    stage: "WIP",
    progress: 65,
    acsPlanned: 12,
    acsInstalled: 8,
    hasDelay: true,
    rentStartDate: "Jan 15, 2024",
    projectId: "proj-001",
    projectName: "Dava India",
    subprojectId: "subproj-002",
    subprojectName: "Mumbai",
    configVersion: "1.0",
    configuredRent: 15000,
    configuredTenure: 36,
  },
  {
    id: "site-002",
    name: "Phoenix Mall Expansion",
    location: "Pune, Maharashtra",
    stage: "TIS",
    progress: 88,
    acsPlanned: 24,
    acsInstalled: 21,
    hasDelay: false,
    rentStartDate: "Feb 01, 2024",
    projectId: "proj-001",
    projectName: "Dava India",
    subprojectId: "subproj-002",
    subprojectName: "Mumbai",
    configVersion: "1.0",
    configuredRent: 15000,
    configuredTenure: 36,
  },
  {
    id: "site-003",
    name: "Cyber Hub Tower 5",
    location: "Gurugram, Haryana",
    stage: "Live",
    progress: 100,
    acsPlanned: 18,
    acsInstalled: 18,
    hasDelay: false,
    rentStartDate: "Dec 10, 2023",
    projectId: "proj-001",
    projectName: "Dava India",
    subprojectId: "subproj-001",
    subprojectName: "Delhi",
    configVersion: "1.0",
    configuredRent: 12500,
    configuredTenure: 36,
  },
  {
    id: "site-004",
    name: "Prestige Tech Park",
    location: "Bangalore, Karnataka",
    stage: "Installed",
    progress: 95,
    acsPlanned: 32,
    acsInstalled: 30,
    hasDelay: false,
    rentStartDate: "Mar 01, 2024",
    projectId: "proj-001",
    projectName: "Dava India",
    subprojectId: "subproj-003",
    subprojectName: "Bangalore",
    configVersion: "1.0",
    configuredRent: 14000,
    configuredTenure: 48,
  },
  {
    id: "site-005",
    name: "DLF Cyber City Phase 3",
    location: "Gurugram, Haryana",
    stage: "WTS",
    progress: 35,
    acsPlanned: 16,
    acsInstalled: 5,
    hasDelay: true,
    projectId: "proj-002",
    projectName: "TechBank National",
    subprojectId: "subproj-004",
    subprojectName: "Tier-1 Cities",
    configVersion: "1.0",
    configuredRent: 16000,
    configuredTenure: 36,
  },
  {
    id: "site-006",
    name: "Mindspace IT Park",
    location: "Hyderabad, Telangana",
    stage: "Started",
    progress: 10,
    acsPlanned: 20,
    acsInstalled: 0,
    hasDelay: false,
    projectId: "proj-002",
    projectName: "TechBank National",
    subprojectId: "subproj-005",
    subprojectName: "Tier-2 Cities",
    configVersion: "1.0",
    configuredRent: 12000,
    configuredTenure: 48,
  },
];

// ACS Units with project bindings
export const mockACSUnits: ACSUnit[] = [
  {
    id: "ACS-001",
    serialNumber: "SN-2024-0001",
    model: "ACS Pro X1",
    siteId: "site-001",
    siteName: "Metro Tower - Block A",
    location: "Floor 12, Zone A",
    status: "Operational",
    installDate: "Jan 15, 2024",
    lastMaintenance: "Dec 01, 2024",
    nextMaintenance: "Mar 01, 2025",
    warrantyExpiry: "Jan 15, 2027",
    openTickets: 0,
    projectId: "proj-001",
    projectName: "Dava India",
    subprojectId: "subproj-002",
    subprojectName: "Mumbai",
    configVersion: "1.0",
    configuredRent: 15000,
    tenureMonths: 36,
    rentStartDate: "Jan 15, 2024",
    rentEndDate: "Jan 15, 2027",
  },
  {
    id: "ACS-002",
    serialNumber: "SN-2024-0002",
    model: "ACS Pro X2",
    siteId: "site-001",
    siteName: "Metro Tower - Block A",
    location: "Floor 15, Zone B",
    status: "Under Maintenance",
    installDate: "Jan 18, 2024",
    lastMaintenance: "Nov 15, 2024",
    nextMaintenance: "Feb 15, 2025",
    warrantyExpiry: "Jan 18, 2027",
    openTickets: 1,
    projectId: "proj-001",
    projectName: "Dava India",
    subprojectId: "subproj-002",
    subprojectName: "Mumbai",
    configVersion: "1.0",
    configuredRent: 15000,
    tenureMonths: 36,
    rentStartDate: "Jan 18, 2024",
    rentEndDate: "Jan 18, 2027",
  },
  {
    id: "ACS-003",
    serialNumber: "SN-2024-0003",
    model: "ACS Lite",
    siteId: "site-002",
    siteName: "Phoenix Mall Expansion",
    location: "Atrium Level",
    status: "Operational",
    installDate: "Feb 05, 2024",
    lastMaintenance: "Oct 20, 2024",
    nextMaintenance: "Jan 20, 2025",
    warrantyExpiry: "Feb 05, 2027",
    openTickets: 0,
    projectId: "proj-001",
    projectName: "Dava India",
    subprojectId: "subproj-002",
    subprojectName: "Mumbai",
    configVersion: "1.0",
    configuredRent: 15000,
    tenureMonths: 36,
    rentStartDate: "Feb 05, 2024",
    rentEndDate: "Feb 05, 2027",
  },
  {
    id: "ACS-004",
    serialNumber: "SN-2024-0004",
    model: "ACS Pro X1",
    siteId: "site-003",
    siteName: "Cyber Hub Tower 5",
    location: "Main Lobby",
    status: "Operational",
    installDate: "Dec 10, 2023",
    lastMaintenance: "Dec 10, 2024",
    nextMaintenance: "Mar 10, 2025",
    warrantyExpiry: "Dec 10, 2026",
    openTickets: 0,
    projectId: "proj-001",
    projectName: "Dava India",
    subprojectId: "subproj-001",
    subprojectName: "Delhi",
    configVersion: "1.0",
    configuredRent: 12500,
    tenureMonths: 36,
    rentStartDate: "Dec 10, 2023",
    rentEndDate: "Dec 10, 2026",
  },
  {
    id: "ACS-005",
    serialNumber: "SN-2024-0005",
    model: "ACS Pro X2",
    siteId: "site-004",
    siteName: "Prestige Tech Park",
    location: "Building C, Floor 3",
    status: "Faulty",
    installDate: "Mar 01, 2024",
    lastMaintenance: "Sep 01, 2024",
    nextMaintenance: "Overdue",
    warrantyExpiry: "Mar 01, 2027",
    openTickets: 2,
    projectId: "proj-001",
    projectName: "Dava India",
    subprojectId: "subproj-003",
    subprojectName: "Bangalore",
    configVersion: "1.0",
    configuredRent: 14000,
    tenureMonths: 48,
    rentStartDate: "Mar 01, 2024",
    rentEndDate: "Mar 01, 2028",
  },
  {
    id: "ACS-006",
    serialNumber: "SN-2024-0006",
    model: "ACS Ultra",
    siteId: "site-005",
    siteName: "DLF Cyber City Phase 3",
    location: "Tower A, Floor 8",
    status: "Pending Install",
    installDate: "-",
    lastMaintenance: "-",
    nextMaintenance: "-",
    warrantyExpiry: "-",
    openTickets: 0,
    projectId: "proj-002",
    projectName: "TechBank National",
    subprojectId: "subproj-004",
    subprojectName: "Tier-1 Cities",
    configVersion: "1.0",
    configuredRent: 16000,
    tenureMonths: 36,
  },
  {
    id: "ACS-007",
    serialNumber: "SN-2024-0007",
    model: "ACS Pro X1",
    siteId: "site-006",
    siteName: "Mindspace IT Park",
    location: "Unassigned",
    status: "In Transit",
    installDate: "-",
    lastMaintenance: "-",
    nextMaintenance: "-",
    warrantyExpiry: "-",
    openTickets: 0,
    projectId: "proj-002",
    projectName: "TechBank National",
    subprojectId: "subproj-005",
    subprojectName: "Tier-2 Cities",
    configVersion: "1.0",
    configuredRent: 12000,
    tenureMonths: 48,
  },
];

// Helper functions
export function getProjectById(id: string) {
  return mockProjects.find(p => p.id === id);
}

export function getSubprojectById(id: string) {
  for (const project of mockProjects) {
    const subproject = project.subprojects.find(s => s.id === id);
    if (subproject) return { project, subproject };
  }
  return null;
}

export function getSitesBySubproject(subprojectId: string) {
  return mockSites.filter(s => s.subprojectId === subprojectId);
}

export function getACSBySubproject(subprojectId: string) {
  return mockACSUnits.filter(a => a.subprojectId === subprojectId);
}

export function getProjectStats(projectId: string) {
  const sites = mockSites.filter(s => s.projectId === projectId);
  const units = mockACSUnits.filter(a => a.projectId === projectId);
  return {
    totalSites: sites.length,
    totalACS: units.length,
    activeACS: units.filter(u => u.status === "Operational").length,
    monthlyRevenue: units.reduce((sum, u) => sum + (u.configuredRent || 0), 0),
  };
}

export function getSubprojectStats(subprojectId: string) {
  const sites = mockSites.filter(s => s.subprojectId === subprojectId);
  const units = mockACSUnits.filter(a => a.subprojectId === subprojectId);
  return {
    sitesCount: sites.length,
    acsCount: units.length,
  };
}
