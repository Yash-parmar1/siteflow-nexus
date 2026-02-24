import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { SiteHeader } from "@/components/sites/SiteHeader";
import { SiteTimeline } from "@/components/sites/SiteTimeline";
import { ACSContractCard } from "@/components/sites/ACSContractCard";
import { InstallationTracking } from "@/components/sites/InstallationTracking";
import { MaintenanceTickets } from "@/components/sites/MaintenanceTickets";
import { FinanceSnapshot } from "@/components/sites/FinanceSnapshot";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info, Package, X, ImageIcon } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";

/** Derive timeline events dynamically from site date fields and currentStage. */
function buildTimelineEvents(site: any) {
  // Stage order: Started → WTS → WIP → TIS → Installed → Live
  const stageOrder = ["Started", "WTS", "WIP", "TIS", "Installed", "Live"];
  // Map date fields to stages
  const stageDateMap: Record<string, { dateField: string | null; notes?: string }> = {
    Started: { dateField: "createdAt", notes: "Project started and site registered." },
    WTS: { dateField: "stabilizerOrderDate", notes: "Stabilizer ordered / work to start." },
    WIP: { dateField: "acOrderedDate", notes: "AC ordered, work in progress." },
    TIS: { dateField: "installationScheduled", notes: "Installation scheduled for testing." },
    Installed: { dateField: "installationDone", notes: "Installation completed." },
    Live: { dateField: "actualLiveDate", notes: "Site is live and operational." },
  };

  // Determine current stage index from the site's currentStage field
  const currentStageRaw = (site.currentStage ?? site.stage ?? "").toUpperCase();
  const stageNameMap: Record<string, number> = {
    STARTED: 0, PLANNING: 0,
    WTS: 1, WORK_TO_START: 1,
    WIP: 2, WORK_IN_PROGRESS: 2,
    TIS: 3, TESTING: 3,
    INSTALLED: 4, INSTALLATION_DONE: 4,
    LIVE: 5, ACTIVE: 5,
  };
  const currentIdx = stageNameMap[currentStageRaw] ?? 0;

  const fmt = (d: string | null) => {
    if (!d) return undefined;
    try {
      return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return undefined; }
  };

  return stageOrder.map((stage, idx) => {
    const cfg = stageDateMap[stage];
    const dateVal = cfg.dateField ? (site as any)[cfg.dateField] : null;
    let status: "completed" | "current" | "upcoming";
    if (idx < currentIdx) status = "completed";
    else if (idx === currentIdx) status = "current";
    else status = "upcoming";

    return {
      id: String(idx + 1),
      stage,
      status,
      date: fmt(dateVal),
      notes: status !== "upcoming" ? cfg.notes : undefined,
    };
  });
}

export default function SiteCommandCenter() {
  const { siteId } = useParams();
  const { data: appData } = useAppData();
  const navigate = useNavigate();

  // Build live site data from appData
  const liveSite = appData?.sites?.find((s) => String(s.id) === siteId);

  // Parse location from addressJson
  let siteLocation = "";
  if (liveSite?.addressJson) {
    try {
      const addr = JSON.parse(liveSite.addressJson);
      siteLocation = [addr.city, addr.state].filter(Boolean).join(", ");
    } catch { /* ignore */ }
  }

  if (!liveSite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <h2 className="text-xl font-semibold">Site Not Found</h2>
          <p className="text-muted-foreground">The site with ID "{siteId}" could not be found.</p>
        </div>
      </div>
    );
  }

  const site = {
    id: String(liveSite.id),
    name: liveSite.name,
    location: siteLocation || liveSite.location || "",
    stage: liveSite.currentStage ?? liveSite.stage ?? "PLANNING",
    progress: liveSite.progress ?? 0,
    acsPlanned: liveSite.plannedAcsCount ?? liveSite.acsPlanned ?? 0,
    acsInstalled: liveSite.acsInstalled ?? 0,
    hasDelay: liveSite.hasDelay ?? false,
    delayDays: liveSite.delayDays ?? 0,
    projectId: liveSite.projectId ? String(liveSite.projectId) : "",
    projectName: liveSite.projectName ?? "",
    subprojectId: liveSite.subprojectId ? String(liveSite.subprojectId) : "",
    subprojectName: liveSite.subprojectName ?? "",
    configVersion: liveSite.configurationId ? `v${liveSite.configurationId}` : "-",
    configuredRent: liveSite.configuredRent ?? 0,
    configuredTenure: liveSite.configuredTenure ?? 0,
    installationIncluded: false,
    maintenanceIncluded: true,
  };

  // Build live ACS units from assets filtered by site
  const siteAssets = appData?.assets?.filter((a) => String(a.siteId) === siteId) ?? [];
  const siteTenure = liveSite.configuredTenure ?? 0;
  const acsUnits = siteAssets.map((a, idx) => {
    // Find completed installation for this asset
    const inst = appData?.installations?.find(
      (i) => i.acAssetId === (a.id ?? 0) && i.installationDate
    );
    const installDate = inst?.installationDate ?? undefined;
    // Compute rent end date from install date + site tenure
    let rentEndDate: string | undefined;
    let daysRemaining: number | undefined;
    if (installDate && siteTenure > 0) {
      const d = new Date(installDate);
      d.setMonth(d.getMonth() + siteTenure);
      rentEndDate = d.toISOString().split("T")[0];
      daysRemaining = Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
    }
    return {
      id: String(a.id ?? idx),
      serialNumber: a.serialNumber ?? `ACS-${idx + 1}`,
      model: a.model ?? "N/A",
      location: a.locationInSite ?? "",
      status: (a.status === "ACTIVE" ? "operational" : a.status === "MAINTENANCE" ? "maintenance" : "pending") as "operational" | "maintenance" | "pending",
      installDate,
      activationDate: installDate,
      tenureMonths: siteTenure,
      rentStartDate: installDate,
      rentEndDate,
      contractStatus: (a.status === "ACTIVE" ? "active" : "not-started") as "active" | "not-started",
      daysRemaining,
      monthlyRent: a.monthlyRent ?? 0,
      configurationVersion: liveSite.configurationId ? `v${liveSite.configurationId}` : "-",
      isIndoor: a.indoorAc,
    };
  });

  // Build live tickets from maintenance tickets filtered by site
  const siteTickets = appData?.maintenanceTickets?.filter((t) => String(t.siteId) === siteId) ?? [];
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

  // Build live installations filtered by site
  const siteInstallations = appData?.installations?.filter((i) => String(i.siteId) === siteId) ?? [];
  const installShipmentMap: Record<string, string> = { PENDING: "pending", IN_TRANSIT: "in-transit", DELIVERED: "delivered", INSTALLED: "installed" };
  const installations = siteInstallations.map((i, idx) => ({
    id: `inst-${String(idx + 1).padStart(3, "0")}`,
    docketId: i.bookingId ?? `DOC-${idx + 1}`,
    shipmentStatus: (installShipmentMap[i.shipmentStatus] ?? "pending") as "pending" | "in-transit" | "delivered" | "installed",
    eta: i.eta ? new Date(i.eta).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined,
    installer: i.receiverName ?? "-",
    unitsCount: 1,
    hasEvidence: !!(i.evidenceImagesJson || i.serialNumberImageUrl),
    serialNumberImageUrl: i.serialNumberImageUrl ?? null,
    evidenceImagesJson: i.evidenceImagesJson ?? null,
  }));

  // Evidence dialog state
  const [evidenceDialog, setEvidenceDialog] = useState<{
    open: boolean;
    title: string;
    images: string[];
    serialImg: string | null;
  }>({ open: false, title: "", images: [], serialImg: null });

  const handleViewEvidence = (inst: (typeof installations)[0]) => {
    const images: string[] = [];
    if (inst.evidenceImagesJson) {
      try {
        const parsed = JSON.parse(inst.evidenceImagesJson);
        if (Array.isArray(parsed)) images.push(...parsed);
      } catch { /* ignore */ }
    }
    setEvidenceDialog({
      open: true,
      title: `Evidence — ${inst.docketId}`,
      images,
      serialImg: inst.serialNumberImageUrl,
    });
  };

  // Build per-site finance data from financial transactions
  const siteTransactions = appData?.financialTransactions?.filter((t) => String(t.siteId) === siteId) ?? [];
  // Rent = base rent × number of operational outdoor ACs
  const siteMonthlyRent = acsUnits.filter((u) => u.status === "operational" && !u.isIndoor).length * (site.configuredRent || 0);
  const siteTotalRevenue = siteTransactions
    .filter((t) => ["MONTHLY_RENT_BILL", "EXTRA_MATERIALS", "FINAL_INVOICE"].includes(t.transactionType))
    .reduce((sum, t) => sum + (t.totalAmount ?? 0), 0);
  const siteTotalCosts = siteTransactions
    .filter((t) => ["INSTALLATION_INVOICE", "INSTALLATION_MATERIALS", "PAYMENT_RECEIVED", "ADJUSTMENT"].includes(t.transactionType))
    .reduce((sum, t) => sum + (t.totalAmount ?? 0), 0)
    + siteTickets.reduce((sum, t) => sum + (t.visitingCharge ?? 0), 0);
  const siteNetProfit = siteTotalRevenue > 0 ? siteTotalRevenue - siteTotalCosts : siteMonthlyRent - siteTotalCosts;

  const financeData = {
    rentStartDate: liveSite.actualLiveDate
      ? new Date(liveSite.actualLiveDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : siteMonthlyRent > 0 ? "Active" : undefined,
    monthlyRent: siteMonthlyRent,
    totalRevenue: siteTotalRevenue > 0 ? siteTotalRevenue : siteMonthlyRent,
    totalCosts: siteTotalCosts,
    netProfit: siteNetProfit,
    profitMargin: siteTotalRevenue > 0 ? Math.round((siteNetProfit / siteTotalRevenue) * 1000) / 10 : siteMonthlyRent > 0 ? Math.round((siteNetProfit / siteMonthlyRent) * 1000) / 10 : 0,
  };

  // Derive timeline from real site data
  const timelineEvents = buildTimelineEvents(liveSite);

  // Calculate aggregate contract stats
  const activeContracts = acsUnits.filter(u => u.contractStatus === "active").length;
  const expiringSoon = acsUnits.filter(u => (u.contractStatus as string) === "expiring-soon").length;
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
              <InstallationTracking installations={installations} onViewEvidence={handleViewEvidence} />
              <MaintenanceTickets tickets={tickets} />
            </div>

            {/* Finance Snapshot */}
            <FinanceSnapshot data={financeData} />
          </div>
        </div>
      </div>

      {/* Evidence Dialog */}
      <Dialog open={evidenceDialog.open} onOpenChange={(o) => setEvidenceDialog((prev) => ({ ...prev, open: o }))}>
        <DialogContent className="sm:max-w-[640px] max-h-[80vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              {evidenceDialog.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {evidenceDialog.serialImg && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Serial Number</p>
                <img
                  src={evidenceDialog.serialImg.startsWith("http") ? evidenceDialog.serialImg : `/api/files/${evidenceDialog.serialImg}`}
                  alt="Serial Number"
                  className="w-full max-h-64 object-contain rounded-lg border border-border bg-muted/50"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
            {evidenceDialog.images.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Evidence Photos ({evidenceDialog.images.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {evidenceDialog.images.map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={imgUrl.startsWith("http") ? imgUrl : `/api/files/${imgUrl}`}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(imgUrl.startsWith("http") ? imgUrl : `/api/files/${imgUrl}`, "_blank")}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ))}
                </div>
              </div>
            )}
            {!evidenceDialog.serialImg && evidenceDialog.images.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No evidence images available for this installation.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
