import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SiteHeader } from "@/components/sites/SiteHeader";
import { SiteTimeline } from "@/components/sites/SiteTimeline";
import { ACSContractCard } from "@/components/sites/ACSContractCard";
import { InstallationTracking } from "@/components/sites/InstallationTracking";
import { MaintenanceTickets } from "@/components/sites/MaintenanceTickets";
import { FinanceSnapshot } from "@/components/sites/FinanceSnapshot";
import { EvidenceGallery } from "@/components/assets/EvidenceGallery";
import { Info, Zap, Package } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { normalizeStage, computeProgress, STAGE_ORDER, stageIndex } from "@/lib/stageUtils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import api from "@/lib/api";

export default function SiteCommandCenter() {
  const { siteId } = useParams();
  const { data: appData, loading, refresh } = useAppData();
  const navigate = useNavigate();
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [evidenceData, setEvidenceData] = useState<{ photos: any[]; documents: any[]; title: string }>({ photos: [], documents: [], title: "" });
  const [extraMaterials, setExtraMaterials] = useState<any>(null);

  // Fetch per-site extra materials
  useEffect(() => {
    if (!siteId) return;
    api.get(`/finance/sites/${siteId}/extra-materials`)
      .then(res => setExtraMaterials(res.data))
      .catch(() => {});
  }, [siteId]);

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

  const displayStage = normalizeStage(liveSite.currentStage);
  const planned = liveSite.acsPlanned ?? liveSite.plannedAcsCount ?? 0;
  const installed = liveSite.acsInstalled ?? 0;

  const site = {
    id: String(liveSite.id),
    name: liveSite.name,
    location: liveSite.location ?? "",
    stage: displayStage,
    progress: computeProgress(liveSite.progress ?? 0, displayStage, planned, installed),
    acsPlanned: planned,
    acsInstalled: installed,
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
        monthlyRent: acsUnits.filter((u) => u.status === "operational" && u.isIndoor).length * (site.configuredRent || 0),
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

  // Build timeline events from site stage — use real dates from liveSite fields
  const stageFieldMap: Record<string, { dateField: keyof typeof liveSite; notes: string }> = {
    Started:   { dateField: "createdAt",             notes: "Project started and site registered." },
    WTS:       { dateField: "stabilizerOrderDate",    notes: "Stabilizer ordered / work to start." },
    WIP:       { dateField: "acOrderedDate",          notes: "AC ordered, work in progress." },
    TIS:       { dateField: "installationScheduled",  notes: "Installation scheduled for testing." },
    Installed: { dateField: "installationDone",       notes: "Installation completed." },
    Live:      { dateField: "actualLiveDate",         notes: "Site is live and operational." },
  };
  const currentIdx = stageIndex(displayStage);
  const fmtDate = (v: any) => { if (!v) return undefined; try { return new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return undefined; } };
  const timelineEvents = STAGE_ORDER.map((stage, i) => {
    const info = stageFieldMap[stage];
    const dateVal = info?.dateField ? (liveSite as any)[info.dateField] : null;
    return {
      id: String(i + 1),
      stage,
      status: (i < currentIdx ? "completed" : i === currentIdx ? "current" : "upcoming") as "completed" | "current" | "upcoming",
      date: fmtDate(dateVal),
      notes: i <= currentIdx ? info?.notes : undefined,
    };
  });

  // Calculate aggregate contract stats
  const activeContracts = acsUnits.filter(u => u.contractStatus === "active").length;
  const expiringSoon = acsUnits.filter(u => u.contractStatus === "expiring-soon").length;
  const pendingActivation = acsUnits.filter(u => u.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader site={site} onRefresh={refresh} />

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

            {/* Extra Materials Used */}
            {extraMaterials && extraMaterials.entries?.length > 0 && (
              <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Package className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Extra Materials</h2>
                    <p className="text-sm text-muted-foreground">Materials used at this site beyond standard installation</p>
                  </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Total Cost</p>
                    <p className="font-semibold text-foreground">₹{Number(extraMaterials.totalExtraMaterialsCost ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Total Sell</p>
                    <p className="font-semibold text-foreground">₹{Number(extraMaterials.totalExtraMaterialsSell ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Margin</p>
                    <p className="font-semibold text-foreground">₹{(Number(extraMaterials.totalExtraMaterialsSell ?? 0) - Number(extraMaterials.totalExtraMaterialsCost ?? 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>

                {/* Materials table */}
                {extraMaterials.entries.map((entry: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    {entry.booking_address && (
                      <p className="text-xs text-muted-foreground font-medium">{entry.booking_address}</p>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="text-left py-1.5 font-medium">Material</th>
                            <th className="text-right py-1.5 font-medium">Qty</th>
                            <th className="text-right py-1.5 font-medium">Unit</th>
                            <th className="text-right py-1.5 font-medium">Cost/Unit</th>
                            <th className="text-right py-1.5 font-medium">Sell/Unit</th>
                            <th className="text-right py-1.5 font-medium">Cost Total</th>
                            <th className="text-right py-1.5 font-medium">Sell Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(entry.materials || []).map((m: any, mi: number) => (
                            <tr key={mi} className="border-b border-border/50">
                              <td className="py-1.5 text-foreground">{m.material_name}</td>
                              <td className="text-right py-1.5">{m.quantity}</td>
                              <td className="text-right py-1.5">{m.unit}</td>
                              <td className="text-right py-1.5">₹{Number(m.unit_price ?? 0).toLocaleString('en-IN')}</td>
                              <td className="text-right py-1.5">₹{Number(m.sell_price ?? 0).toLocaleString('en-IN')}</td>
                              <td className="text-right py-1.5 font-medium">₹{Number(m.line_total ?? 0).toLocaleString('en-IN')}</td>
                              <td className="text-right py-1.5 font-medium">₹{Number(m.sell_total ?? 0).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                        {entry.total_cost != null && (
                          <tfoot>
                            <tr className="border-t border-border font-semibold text-foreground">
                              <td colSpan={5} className="py-1.5">Entry Total</td>
                              <td className="text-right py-1.5">₹{Number(entry.total_cost ?? 0).toLocaleString('en-IN')}</td>
                              <td className="text-right py-1.5">₹{Number(entry.total_sell ?? 0).toLocaleString('en-IN')}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
