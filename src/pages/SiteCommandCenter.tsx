import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SiteHeader } from "@/components/sites/SiteHeader";
import { SiteTimeline } from "@/components/sites/SiteTimeline";
import { ACSContractCard } from "@/components/sites/ACSContractCard";
import { InstallationTracking } from "@/components/sites/InstallationTracking";
import { MaintenanceTickets } from "@/components/sites/MaintenanceTickets";
import { FinanceSnapshot } from "@/components/sites/FinanceSnapshot";
import { EvidenceGallery } from "@/components/assets/EvidenceGallery";
import { Info, Zap } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SiteCommandCenter() {
  const { siteId } = useParams();
  const { data: appData, loading } = useAppData();
  const navigate = useNavigate();
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [evidenceData, setEvidenceData] = useState<{ photos: any[]; documents: any[]; title: string }>({ photos: [], documents: [], title: "" });

  // Build live site data from appData
  const liveSite = appData?.sites?.find((s) => String(s.id) === siteId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading site details...</p>
      </div>
    );
  }

  if (!liveSite) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Site Not Found</h2>
        <p className="text-muted-foreground">Site #{siteId} could not be found.</p>
        <button className="text-primary hover:underline" onClick={() => navigate("/")}>Back to Sites</button>
      </div>
    );
  }

  const site = {
    id: String(liveSite.id),
    name: liveSite.name,
    location: liveSite.location ?? "",
    stage: liveSite.stage ?? "WIP",
    progress: liveSite.progress ?? 0,
    acsPlanned: liveSite.acsPlanned ?? 0,
    acsInstalled: liveSite.acsInstalled ?? 0,
    hasDelay: liveSite.hasDelay ?? false,
    delayDays: liveSite.delayDays ?? 0,
    projectId: liveSite.projectId ? String(liveSite.projectId) : "",
    projectName: liveSite.projectName ?? "",
    subprojectId: liveSite.subprojectId ? String(liveSite.subprojectId) : "",
    subprojectName: liveSite.subprojectName ?? "",
    configVersion: "1.0",
    configuredRent: liveSite.configuredRent ?? 0,
    configuredTenure: liveSite.configuredTenure ?? 36,
    installationIncluded: false,
    maintenanceIncluded: true,
    stabilizerNumber: liveSite.stabilizerNumber ?? null,
    stabilizerOrderDate: liveSite.stabilizerOrderDate ?? null,
    stabilizerDeliveryDate: liveSite.stabilizerDeliveryDate ?? null,
  };

  // Build ACS units from assets filtered by site
  const siteAssets = appData?.assets?.filter((a) => String(a.siteId) === siteId) || [];
  const acsUnits = siteAssets.map((a, idx) => ({
    id: String(a.id ?? idx),
    serialNumber: a.serialNumber ?? `ACS-${idx + 1}`,
    model: a.model ?? "N/A",
    location: a.locationInSite ?? "",
    isIndoor: a.indoorAc,
    sizeInTon: a.sizeInTon ?? undefined,
    status: (a.status === "ACTIVE" ? "operational" : a.status === "MAINTENANCE" ? "maintenance" : "pending") as "operational" | "maintenance" | "pending",
    installDate: undefined as string | undefined,
    activationDate: undefined as string | undefined,
    tenureMonths: site.configuredTenure,
    rentStartDate: undefined as string | undefined,
    rentEndDate: undefined as string | undefined,
    contractStatus: (a.status === "ACTIVE" ? "active" : "not-started") as "active" | "not-started" | "expiring-soon" | "expired" | "terminated",
    daysRemaining: undefined as number | undefined,
    monthlyRent: a.monthlyRent ?? 0,
    configurationVersion: "1.0",
  }));

  // Build tickets from maintenance tickets filtered by site
  const siteTickets = appData?.maintenanceTickets?.filter((t) => String(t.siteId) === siteId) || [];
  const statusMap: Record<string, string> = { RAISED: "open", INSPECTED: "in-progress", QUOTED: "in-progress", APPROVED: "in-progress", REPAIRED: "resolved", CLOSED: "resolved" };
  const priorityMap: Record<string, string> = { LOW: "low", MEDIUM: "medium", HIGH: "high", CRITICAL: "high" };
  const tickets = siteTickets.map((t, idx) => ({
    id: `tkt-${String(t.id ?? idx + 1).padStart(3, "0")}`,
    title: t.title ?? "Untitled",
    priority: (priorityMap[t.priority] ?? "medium") as "high" | "medium" | "low",
    status: (statusMap[t.status] ?? "open") as "open" | "in-progress" | "resolved",
    assignee: t.assignedTo ?? "-",
    createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-",
    acsUnit: t.acAssetSerial ?? "N/A",
  }));

  // Build installations filtered by site
  const siteInstallations = appData?.installations?.filter((i) => String(i.siteId) === siteId) || [];
  const installShipmentMap: Record<string, string> = { PENDING: "pending", IN_TRANSIT: "in-transit", DELIVERED: "delivered", INSTALLED: "installed" };
  const installations = siteInstallations.map((i, idx) => ({
    id: `inst-${String(idx + 1).padStart(3, "0")}`,
    docketId: i.bookingId ?? `DOC-${idx + 1}`,
    shipmentStatus: (installShipmentMap[i.shipmentStatus] ?? "pending") as "pending" | "in-transit" | "delivered" | "installed",
    eta: i.eta ?? undefined,
    installer: "-",
    unitsCount: 1,
    hasEvidence: !!(i.serialNumberImageUrl || i.evidenceImagesJson),
  }));

  // Build finance data
  const financeData = appData?.finance
    ? {
        rentStartDate: site.configuredRent ? "Active" : "-",
        monthlyRent: acsUnits.filter((u) => u.status === "operational").length * (site.configuredRent || 0),
        totalRevenue: appData.finance.monthlyRevenue ?? 0,
        totalCosts: (appData.finance.totalMaintenanceCost ?? 0) + (appData.finance.totalInstallationCost ?? 0),
        netProfit: appData.finance.netProfit ?? 0,
        profitMargin: appData.finance.monthlyRevenue ? Math.round(((appData.finance.netProfit ?? 0) / appData.finance.monthlyRevenue) * 1000) / 10 : 0,
      }
    : {
        rentStartDate: "-",
        monthlyRent: 0,
        totalRevenue: 0,
        totalCosts: 0,
        netProfit: 0,
        profitMargin: 0,
      };

  // Build timeline events from site stage
  const stageOrder = ["Started", "WTS", "WIP", "TIS", "Installed", "Live"];
  const currentIdx = stageOrder.indexOf(site.stage);
  const timelineEvents = stageOrder.map((stage, i) => ({
    id: String(i + 1),
    stage,
    status: (i < currentIdx ? "completed" : i === currentIdx ? "current" : "upcoming") as "completed" | "current" | "upcoming",
    date: i <= currentIdx ? undefined : undefined,
  }));

  // Calculate aggregate contract stats
  const activeContracts = acsUnits.filter(u => u.contractStatus === "active").length;
  const expiringSoon = acsUnits.filter(u => u.contractStatus === "expiring-soon").length;
  const pendingActivation = acsUnits.filter(u => u.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader site={site} />

      <div className="p-6 animate-fade-in">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Timeline */}
          <div className="xl:col-span-1">
            <SiteTimeline events={timelineEvents} />
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
                {acsUnits.map((unit) => (
                  <ACSContractCard key={unit.id} unit={unit} onClick={() => navigate(`/assets/${unit.id}`)} />
                ))}
              </div>
            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InstallationTracking installations={installations} onViewEvidence={(instId) => {
                const rawInst = siteInstallations.find((_, idx) => `inst-${String(idx + 1).padStart(3, "0")}` === instId);
                if (!rawInst) return;
                const photos: any[] = [];
                const documents: any[] = [];
                if (rawInst.evidenceImagesJson) {
                  try {
                    const urls = JSON.parse(rawInst.evidenceImagesJson);
                    if (Array.isArray(urls)) {
                      urls.forEach((url: string, i: number) => {
                        photos.push({ id: `photo-${i}`, url, thumbnailUrl: url, fileName: url.split('/').pop() || `photo-${i}.jpg`, fileSize: 0, mimeType: "image/jpeg", uploadedAt: rawInst.createdAt || new Date().toISOString(), uploadedBy: "System" });
                      });
                    }
                  } catch {}
                }
                if (rawInst.serialNumberImageUrl) {
                  documents.push({ id: "serial-img", fileUrl: rawInst.serialNumberImageUrl, fileName: "serial-number.jpg", fileSize: 0, mimeType: "image/jpeg", uploadedAt: rawInst.createdAt || new Date().toISOString(), uploadedBy: "System", documentType: "Serial Number", description: "Serial number image" });
                }
                setEvidenceData({ photos, documents, title: rawInst.bookingId || `Installation #${rawInst.id}` });
                setEvidenceDialogOpen(true);
              }} />
              <MaintenanceTickets tickets={tickets} />
            </div>

            {/* Stabilizer Info */}
            {(site.stabilizerNumber || site.stabilizerOrderDate) && (
              <div className="data-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[hsl(var(--status-warning)/0.15)] flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[hsl(var(--status-warning))]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Stabilizer</h2>
                    <p className="text-sm text-muted-foreground">Voltage stabilizer details for this site</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-0.5">Serial / Number</p>
                    <p className="font-medium text-foreground">{site.stabilizerNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Order Date</p>
                    <p className="font-medium text-foreground">{site.stabilizerOrderDate ? new Date(site.stabilizerOrderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Delivery Date</p>
                    <p className="font-medium text-foreground">{site.stabilizerDeliveryDate ? new Date(site.stabilizerDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Finance Snapshot */}
            <FinanceSnapshot data={financeData} />
          </div>
        </div>
      </div>

      {/* Evidence Dialog */}
      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Installation Evidence — {evidenceData.title}</DialogTitle>
          </DialogHeader>
          <EvidenceGallery
            photos={evidenceData.photos}
            videos={[]}
            documents={evidenceData.documents}
            readOnly
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
