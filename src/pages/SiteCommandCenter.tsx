import { useParams } from "react-router-dom";
import { SiteHeader } from "@/components/sites/SiteHeader";
import { SiteTimeline } from "@/components/sites/SiteTimeline";
import { ACSContractCard } from "@/components/sites/ACSContractCard";
import { InstallationTracking } from "@/components/sites/InstallationTracking";
import { MaintenanceTickets } from "@/components/sites/MaintenanceTickets";
import { FinanceSnapshot } from "@/components/sites/FinanceSnapshot";
import { Info } from "lucide-react";

// Mock data for site details with project binding
const getSiteData = (siteId: string) => ({
  id: siteId,
  name: "Metro Tower - Block A",
  location: "Mumbai, Maharashtra",
  stage: "WIP",
  progress: 65,
  acsPlanned: 12,
  acsInstalled: 8,
  hasDelay: true,
  delayDays: 5,
  // Project binding (immutable)
  projectId: "proj-001",
  projectName: "Dava India",
  subprojectId: "subproj-002",
  subprojectName: "Mumbai",
  configVersion: "1.0",
  configuredRent: 15000,
  configuredTenure: 36,
  installationIncluded: false,
  maintenanceIncluded: true,
});

const mockTimelineEvents = [
  {
    id: "1",
    stage: "Started",
    status: "completed" as const,
    date: "Oct 15, 2023",
    user: "Rajesh Kumar",
    notes: "Project kickoff completed. Initial site survey done.",
  },
  {
    id: "2",
    stage: "WTS",
    status: "completed" as const,
    date: "Nov 01, 2023",
    user: "Priya Sharma",
    hasAttachments: true,
  },
  {
    id: "3",
    stage: "WIP",
    status: "current" as const,
    date: "Dec 10, 2023 - Present",
    user: "Installation Team A",
    notes: "8 of 12 units installed. Awaiting shipment for remaining 4 units.",
  },
  {
    id: "4",
    stage: "TIS",
    status: "upcoming" as const,
  },
  {
    id: "5",
    stage: "Installed",
    status: "upcoming" as const,
  },
  {
    id: "6",
    stage: "Live",
    status: "upcoming" as const,
  },
];

// Mock ACS units with individual tenure tracking
const mockACSUnits = [
  {
    id: "acs-001",
    serialNumber: "ACS-MT-001",
    model: "ProCool 5000X",
    location: "Floor 1, Zone A",
    status: "operational" as const,
    installDate: "Dec 15, 2023",
    activationDate: "Dec 20, 2023",
    tenureMonths: 36,
    rentStartDate: "Dec 20, 2023",
    rentEndDate: "Dec 19, 2026",
    contractStatus: "active" as const,
    daysRemaining: 1054,
    monthlyRent: 15000,
    lastMaintenance: "Jan 10, 2024",
    configurationVersion: "1.0",
  },
  {
    id: "acs-002",
    serialNumber: "ACS-MT-002",
    model: "ProCool 5000X",
    location: "Floor 1, Zone B",
    status: "operational" as const,
    installDate: "Dec 16, 2023",
    activationDate: "Dec 22, 2023",
    tenureMonths: 36,
    rentStartDate: "Dec 22, 2023",
    rentEndDate: "Dec 21, 2026",
    contractStatus: "active" as const,
    daysRemaining: 1056,
    monthlyRent: 15000,
    configurationVersion: "1.0",
  },
  {
    id: "acs-003",
    serialNumber: "ACS-MT-003",
    model: "ProCool 3000",
    location: "Floor 2, Zone A",
    status: "maintenance" as const,
    installDate: "Dec 18, 2023",
    activationDate: "Jan 05, 2024",
    tenureMonths: 36,
    rentStartDate: "Jan 05, 2024",
    rentEndDate: "Jan 04, 2027",
    contractStatus: "active" as const,
    daysRemaining: 1100,
    monthlyRent: 15000,
    hasIssue: true,
    configurationVersion: "1.0",
  },
  {
    id: "acs-004",
    serialNumber: "ACS-MT-004",
    model: "ProCool 5000X",
    location: "Floor 2, Zone B",
    status: "pending" as const,
    tenureMonths: 36,
    configurationVersion: "1.0",
  },
  {
    id: "acs-005",
    serialNumber: "ACS-MT-005",
    model: "ProCool 5000X",
    location: "Floor 3, Zone A",
    status: "pending" as const,
    tenureMonths: 36,
    configurationVersion: "1.0",
  },
];

const mockInstallations = [
  {
    id: "inst-001",
    docketId: "DOC-2024-0125",
    shipmentStatus: "in-transit" as const,
    eta: "Jan 28, 2024",
    installer: "Team Alpha",
    unitsCount: 4,
    hasEvidence: false,
  },
  {
    id: "inst-002",
    docketId: "DOC-2024-0089",
    shipmentStatus: "installed" as const,
    installer: "Team Beta",
    unitsCount: 4,
    hasEvidence: true,
  },
  {
    id: "inst-003",
    docketId: "DOC-2024-0067",
    shipmentStatus: "installed" as const,
    installer: "Team Alpha",
    unitsCount: 4,
    hasEvidence: true,
  },
];

const mockTickets = [
  {
    id: "tkt-001",
    title: "Cooling efficiency below threshold",
    priority: "high" as const,
    status: "in-progress" as const,
    assignee: "Amit Verma",
    createdAt: "Jan 20, 2024",
    acsUnit: "ACS-MT-003",
  },
  {
    id: "tkt-002",
    title: "Unusual noise from compressor",
    priority: "medium" as const,
    status: "open" as const,
    assignee: "Suresh Patel",
    createdAt: "Jan 22, 2024",
    acsUnit: "ACS-MT-001",
  },
];

const mockFinanceData = {
  rentStartDate: "Dec 20, 2023",
  monthlyRent: 45000, // 3 active ACS x 15000
  totalRevenue: 90000,
  totalCosts: 65000,
  netProfit: 25000,
  profitMargin: 27.8,
};

export default function SiteCommandCenter() {
  const { siteId } = useParams();
  const site = getSiteData(siteId || "");

  // Calculate aggregate contract stats
  const activeContracts = mockACSUnits.filter(u => u.contractStatus === "active").length;
  const expiringSoon = mockACSUnits.filter(u => (u.contractStatus as string) === "expiring-soon").length;
  const pendingActivation = mockACSUnits.filter(u => u.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader site={site} />

      <div className="p-6 animate-fade-in">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Timeline */}
          <div className="xl:col-span-1">
            <SiteTimeline events={mockTimelineEvents} />
          </div>

          {/* Right Column - Details */}
          <div className="xl:col-span-2 space-y-6">
            {/* ACS Units Section with Contract Info */}
            <div className="data-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    ACS Units & Contracts
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Individual tenure tracking per unit
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-status-success" />
                    <span className="text-muted-foreground">{activeContracts} active</span>
                  </div>
                  {expiringSoon > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-status-warning" />
                      <span className="text-muted-foreground">{expiringSoon} expiring</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-status-info" />
                    <span className="text-muted-foreground">{pendingActivation} pending</span>
                  </div>
                </div>
              </div>

              {/* Info banner about tenure */}
              <div className="mb-4 p-3 rounded-lg bg-status-info/10 border border-status-info/20">
                <div className="flex items-start gap-2 text-sm">
                  <Info className="w-4 h-4 text-status-info shrink-0 mt-0.5" />
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">Tenure is per ACS unit.</span> Each unit's contract starts on activation and ends after {site.configuredTenure} months independently.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mockACSUnits.map((unit) => (
                  <ACSContractCard key={unit.id} unit={unit} />
                ))}
              </div>
            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InstallationTracking installations={mockInstallations} />
              <MaintenanceTickets tickets={mockTickets} />
            </div>

            {/* Finance Snapshot */}
            <FinanceSnapshot data={mockFinanceData} />
          </div>
        </div>
      </div>
    </div>
  );
}
