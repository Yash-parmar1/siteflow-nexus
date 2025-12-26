import { useParams } from "react-router-dom";
import { SiteHeader } from "@/components/sites/SiteHeader";
import { SiteTimeline } from "@/components/sites/SiteTimeline";
import { ACSUnitCard } from "@/components/sites/ACSUnitCard";
import { InstallationTracking } from "@/components/sites/InstallationTracking";
import { MaintenanceTickets } from "@/components/sites/MaintenanceTickets";
import { FinanceSnapshot } from "@/components/sites/FinanceSnapshot";

// Mock data for site details
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

const mockACSUnits = [
  {
    id: "acs-001",
    serialNumber: "ACS-MT-001",
    model: "ProCool 5000X",
    location: "Floor 1, Zone A",
    status: "operational" as const,
    installDate: "Dec 15, 2023",
    lastMaintenance: "Jan 10, 2024",
  },
  {
    id: "acs-002",
    serialNumber: "ACS-MT-002",
    model: "ProCool 5000X",
    location: "Floor 1, Zone B",
    status: "operational" as const,
    installDate: "Dec 16, 2023",
  },
  {
    id: "acs-003",
    serialNumber: "ACS-MT-003",
    model: "ProCool 3000",
    location: "Floor 2, Zone A",
    status: "maintenance" as const,
    installDate: "Dec 18, 2023",
    hasIssue: true,
  },
  {
    id: "acs-004",
    serialNumber: "ACS-MT-004",
    model: "ProCool 5000X",
    location: "Floor 2, Zone B",
    status: "pending" as const,
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
  rentStartDate: "Jan 15, 2024",
  monthlyRent: 125000,
  totalRevenue: 250000,
  totalCosts: 180000,
  netProfit: 70000,
  profitMargin: 28,
};

export default function SiteCommandCenter() {
  const { siteId } = useParams();
  const site = getSiteData(siteId || "");

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
            {/* ACS Units Section */}
            <div className="data-card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-foreground">
                  ACS Units
                </h2>
                <span className="text-sm text-muted-foreground">
                  {mockACSUnits.filter((u) => u.status === "operational").length} operational
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mockACSUnits.map((unit) => (
                  <ACSUnitCard key={unit.id} unit={unit} />
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
