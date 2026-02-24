import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AssetLifecycleTimeline } from "@/components/assets/AssetLifecycleTimeline";
import { EvidenceGallery } from "@/components/assets/EvidenceGallery";
import { useAppData } from "@/context/AppDataContext";
import {
  ArrowLeft,
  Box,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Wrench,
  Settings,
  FileText,
  Camera,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Download,
  Printer,
  MoreHorizontal,
  Building,
  Lock,
  TrendingUp,
  History,
  Activity,
  Package,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const statusConfig: Record<string, { label: string; color: string }> = {
  "IN_STOCK": { label: "In Stock", color: "status-neutral" },
  "IN_TRANSIT": { label: "In Transit", color: "status-info" },
  "PENDING_INSTALL": { label: "Pending Install", color: "status-info" },
  "ACTIVE": { label: "Operational", color: "status-success" },
  "MAINTENANCE": { label: "Under Maintenance", color: "status-warning" },
  "FAULTY": { label: "Faulty", color: "status-error" },
  "OFFLINE": { label: "Offline", color: "status-error" },
  "DECOMMISSIONED": { label: "Decommissioned", color: "status-neutral" },
  // Lowercase fallbacks
  "in-stock": { label: "In Stock", color: "status-neutral" },
  "in-transit": { label: "In Transit", color: "status-info" },
  "pending-install": { label: "Pending Install", color: "status-info" },
  "operational": { label: "Operational", color: "status-success" },
  "maintenance": { label: "Under Maintenance", color: "status-warning" },
  "faulty": { label: "Faulty", color: "status-error" },
  "offline": { label: "Offline", color: "status-error" },
  "decommissioned": { label: "Decommissioned", color: "status-neutral" },
};

const defaultStatus = { label: "Unknown", color: "status-neutral" };

export default function AssetDetail() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const { data: appData } = useAppData();
  const [activeTab, setActiveTab] = useState("overview");

  // Find the asset from real data
  const assetData = appData?.assets?.find((a) => String(a.id) === assetId);

  // Find the site this asset is deployed at
  const site = assetData?.siteId
    ? appData?.sites?.find((s) => s.id === assetData.siteId)
    : null;

  // Find installations for this asset
  const assetInstallations = appData?.installations?.filter(
    (i) => String(i.acAssetId) === assetId
  ) ?? [];

  // Find maintenance tickets for this asset
  const assetTickets = appData?.maintenanceTickets?.filter(
    (t) => String(t.acAssetId) === assetId
  ) ?? [];

  if (!assetData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <h2 className="text-xl font-semibold">Asset Not Found</h2>
          <p className="text-muted-foreground">The asset with ID "{assetId}" could not be found.</p>
          <Button onClick={() => navigate("/assets")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assets
          </Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[assetData.status] ?? defaultStatus;
  const monthlyRent = assetData.monthlyRent ?? 0;
  const totalMaintenanceCost = assetTickets.reduce(
    (sum, t) => sum + (t.visitingCharge ?? 0), 0
  );

  // Parse site location
  let siteLocation = "";
  if (site?.addressJson) {
    try {
      const addr = JSON.parse(site.addressJson);
      siteLocation = [addr.city, addr.state].filter(Boolean).join(", ");
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6">
          {/* Breadcrumb and Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <nav className="text-sm text-muted-foreground flex items-center">
                <Link to="/assets" className="hover:text-foreground transition-colors font-medium">
                  Assets
                </Link>
                <span className="mx-2 text-muted-foreground/50">/</span>
                <span className="text-foreground font-medium">{assetData.serialNumber}</span>
              </nav>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="gap-2">
                    <Wrench className="w-4 h-4" />
                    Schedule Maintenance
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <FileText className="w-4 h-4" />
                    Create Ticket
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    <Building className="w-4 h-4" />
                    Transfer to Another Site
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Decommission
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Asset Identity */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
            <div className="flex items-start gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: `hsl(var(--${status.color}) / 0.15)` }}
              >
                <Box className="w-8 h-8" style={{ color: `hsl(var(--${status.color}))` }} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-semibold text-foreground tracking-tight">
                    {assetData.serialNumber}
                  </h1>
                  <span
                    className="status-badge px-3 py-1.5 text-sm font-medium"
                    style={{
                      backgroundColor: `hsl(var(--${status.color}) / 0.15)`,
                      color: `hsl(var(--${status.color}))`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: `hsl(var(--${status.color}))` }}
                    />
                    {status.label}
                  </span>
                </div>
                <p className="text-base text-muted-foreground">
                  {[assetData.model, assetData.manufacturer].filter(Boolean).join(" · ") || "AC Unit"}
                </p>
              </div>
            </div>

            {/* Quick Info Pills */}
            <div className="flex flex-wrap items-center gap-4">
              {site && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                  <MapPin className="w-4 h-4 text-primary" />
                  <Link 
                    to={`/site/${site.id}`} 
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    {site.name}
                  </Link>
                </div>
              )}
              {siteLocation && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{siteLocation}</span>
                </div>
              )}
              {assetData.sizeInTon && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                  <Box className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{assetData.sizeInTon} Ton</span>
                </div>
              )}
            </div>
          </div>

          {/* Configuration Context Banner */}
          {(assetData.projectName || assetData.subprojectName) && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-medium">Configuration:</span>
                </div>
                {assetData.projectName && (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-foreground" />
                    <span className="text-sm font-semibold text-foreground">{assetData.projectName}</span>
                  </div>
                )}
                {assetData.subprojectName && (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="text-sm font-medium text-foreground">{assetData.subprojectName}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent p-0 h-auto border-b-0 gap-1 w-full justify-start">
              {[
                { id: "overview", label: "Overview", icon: Activity },
                { id: "installation", label: "Installations", icon: Wrench },
                { id: "maintenance", label: "Maintenance", icon: Settings },
                { id: "evidence", label: "Evidence", icon: Camera },
                { id: "finance", label: "Finance", icon: DollarSign },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? "border-primary text-foreground bg-muted/30"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "installation" && assetInstallations.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{assetInstallations.length}</Badge>
                  )}
                  {tab.id === "maintenance" && assetTickets.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{assetTickets.length}</Badge>
                  )}
                </button>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Main Info (2/3 width) */}
            <div className="xl:col-span-2 space-y-8">
              {/* Contract Status Card */}
              <Card className="data-card border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Contract & Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Rent</p>
                      <p className="text-2xl font-bold text-foreground">₹{monthlyRent.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">First Month Rent</p>
                      <p className="text-2xl font-bold text-foreground">₹{(assetData.firstMonthRent ?? monthlyRent).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Purchase Cost</p>
                      <p className="text-lg font-semibold text-foreground">
                        {assetData.purchaseCost ? `₹${assetData.purchaseCost.toLocaleString()}` : "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Insurance Threshold</p>
                      <p className="text-lg font-semibold text-foreground">
                        {assetData.insuranceThreshold ? `₹${assetData.insuranceThreshold.toLocaleString()}` : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location & Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="data-card border-border/50 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Location Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Site</p>
                      {site ? (
                        <Link 
                          to={`/site/${site.id}`} 
                          className="text-base font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                        >
                          {site.name}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <p className="text-base font-semibold text-foreground">{assetData.siteName ?? "Unassigned"}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location Within Site</p>
                      <p className="text-base font-semibold text-foreground">{assetData.locationInSite || "—"}</p>
                    </div>
                    {siteLocation && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">City / State</p>
                        <p className="text-base font-semibold text-foreground">{siteLocation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="data-card border-border/50 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      Technical Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Model Number</span>
                      <span className="text-sm font-semibold text-foreground">{assetData.modelNumber || assetData.model || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Size</span>
                      <span className="text-sm font-semibold text-foreground">{assetData.sizeInTon ? `${assetData.sizeInTon} Ton` : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Type</span>
                      <span className="text-sm font-semibold text-foreground">{assetData.indoorAc ? "Indoor" : "Outdoor"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Maintenance</span>
                      <Badge variant={assetData.maintenanceSupported ? "default" : "secondary"}>
                        {assetData.maintenanceSupported ? "Supported" : "Not Included"}
                      </Badge>
                    </div>
                    {assetData.warrantyExpiryDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Warranty Until</span>
                        <span className="text-sm font-semibold text-foreground">
                          {new Date(assetData.warrantyExpiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column - Summary Cards (1/3 width) */}
            <div className="space-y-6">
              {/* Financial Summary */}
              <Card className="data-card border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                    <span className="text-lg font-semibold text-status-success">₹{monthlyRent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Maintenance Cost</span>
                    <span className="text-lg font-semibold text-status-error">₹{totalMaintenanceCost.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Net Contribution</span>
                    <span className="text-xl font-bold text-foreground">₹{(monthlyRent - totalMaintenanceCost).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Summary */}
              <Card className="data-card border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Maintenance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-muted-foreground">Total Tickets</span>
                    <span className="text-lg font-bold text-foreground">{assetTickets.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-muted-foreground">Open</span>
                    <span className="text-lg font-bold text-status-warning">
                      {assetTickets.filter((t) => t.status !== "CLOSED" && t.status !== "REPAIRED").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-muted-foreground">Next Maintenance</span>
                    <span className="text-sm font-semibold text-foreground">
                      {assetData.nextMaintenanceDate 
                        ? new Date(assetData.nextMaintenanceDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                        : "—"}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-4 gap-2" 
                    onClick={() => setActiveTab("maintenance")}
                  >
                    <Wrench className="w-4 h-4" />
                    View Maintenance
                  </Button>
                </CardContent>
              </Card>

              {/* Installations Summary */}
              <Card className="data-card border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Installations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assetInstallations.length > 0 ? (
                    assetInstallations.slice(0, 3).map((inst) => {
                      const shipmentMap: Record<string, { label: string; color: string }> = {
                        PENDING: { label: "Pending", color: "status-neutral" },
                        IN_TRANSIT: { label: "In Transit", color: "status-info" },
                        DELIVERED: { label: "Delivered", color: "status-success" },
                        INSTALLED: { label: "Installed", color: "status-success" },
                      };
                      const sm = shipmentMap[inst.shipmentStatus] ?? { label: inst.shipmentStatus, color: "status-neutral" };
                      return (
                        <div key={inst.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{inst.bookingId || `Installation #${inst.id}`}</span>
                            <Badge variant="secondary" className="text-xs">{sm.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {inst.installationDate
                              ? `Installed: ${new Date(inst.installationDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`
                              : inst.eta
                              ? `ETA: ${new Date(inst.eta).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`
                              : "Date pending"}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No installation records</p>
                  )}
                  {assetInstallations.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("installation")}>
                      +{assetInstallations.length - 3} more
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Installation Tab */}
        {activeTab === "installation" && (
          <div className="max-w-5xl space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Installation Records</h2>
              <p className="text-muted-foreground mt-1">Shipment and installation history for this asset</p>
            </div>

            {assetInstallations.length > 0 ? (
              assetInstallations.map((inst) => {
                const shipmentMap: Record<string, { label: string; color: string }> = {
                  PENDING: { label: "Pending", color: "status-neutral" },
                  IN_TRANSIT: { label: "In Transit", color: "status-info" },
                  DELIVERED: { label: "Delivered", color: "status-success" },
                  INSTALLED: { label: "Installed", color: "status-success" },
                };
                const sm = shipmentMap[inst.shipmentStatus] ?? { label: inst.shipmentStatus, color: "status-neutral" };
                return (
                  <Card key={inst.id} className="data-card border-border/50 shadow-sm">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{inst.bookingId || `Installation #${inst.id}`}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Site: {inst.siteName}
                          </p>
                        </div>
                        <Badge 
                          variant="secondary"
                          className="shrink-0"
                          style={{
                            backgroundColor: `hsl(var(--${sm.color}) / 0.15)`,
                            color: `hsl(var(--${sm.color}))`,
                          }}
                        >
                          {sm.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Booking Date</p>
                          <p className="text-base font-semibold text-foreground">
                            {inst.bookingDate ? new Date(inst.bookingDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ETA</p>
                          <p className="text-base font-semibold text-foreground">
                            {inst.eta ? new Date(inst.eta).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Installation Date</p>
                          <p className="text-base font-semibold text-foreground">
                            {inst.installationDate ? new Date(inst.installationDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Receiver</p>
                          <p className="text-base font-semibold text-foreground">
                            {inst.receiverName || "—"}
                          </p>
                        </div>
                      </div>
                      {inst.remarks && (
                        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-sm text-muted-foreground">{inst.remarks}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="data-card border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No installation records</h3>
                  <p className="text-sm text-muted-foreground">This asset has no installation history yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === "maintenance" && (
          <div className="max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Maintenance History</h2>
                <p className="text-muted-foreground mt-1">Tickets and service records for this asset</p>
              </div>
              <Button className="gap-2">
                <Wrench className="w-4 h-4" />
                Create Ticket
              </Button>
            </div>

            {assetTickets.length > 0 ? (
              assetTickets.map((ticket) => {
                const priorityColors: Record<string, string> = {
                  LOW: "status-info", MEDIUM: "status-warning", HIGH: "status-error", CRITICAL: "status-error",
                };
                const statusLabels: Record<string, string> = {
                  RAISED: "Open", INSPECTED: "Inspected", QUOTED: "Quoted", APPROVED: "Approved", REPAIRED: "Repaired", CLOSED: "Closed",
                };
                return (
                  <Card key={ticket.id} className="data-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{ticket.title || `Ticket #${ticket.id}`}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" }) : ""}
                            {ticket.assignedTo && ` · ${ticket.assignedTo}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline"
                            style={{
                              borderColor: `hsl(var(--${priorityColors[ticket.priority] ?? "status-neutral"}))`,
                              color: `hsl(var(--${priorityColors[ticket.priority] ?? "status-neutral"}))`,
                            }}
                          >
                            {ticket.priority}
                          </Badge>
                          <Badge variant="secondary">
                            {statusLabels[ticket.status] ?? ticket.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {ticket.description && (
                        <p className="text-sm text-muted-foreground mb-4">{ticket.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <span className="text-sm font-medium text-muted-foreground">Visiting Charge</span>
                        <span className="text-lg font-bold text-foreground">
                          {ticket.visitingCharge ? `₹${ticket.visitingCharge.toLocaleString()}` : "—"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="data-card border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Wrench className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No maintenance records</h3>
                  <p className="text-sm text-muted-foreground mb-6">This asset has no maintenance history yet</p>
                  <Button className="gap-2">
                    <Wrench className="w-4 h-4" />
                    Create First Ticket
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Evidence Tab */}
        {activeTab === "evidence" && (
          <div className="max-w-6xl">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Evidence & Documentation</h2>
              <p className="text-muted-foreground mt-1">Photos, videos, and documents related to this asset and its site from installation records</p>
            </div>
            <EvidenceGallery
              photos={(() => {
                const photos: { id: string; url: string; thumbnailUrl?: string; fileName: string; fileSize: number; mimeType: string; uploadedAt: string; uploadedBy: string; caption?: string }[] = [];

                // Helper to extract photos from an installation record
                const extractFromInstallation = (inst: typeof assetInstallations[0], labelPrefix: string) => {
                  // Serial number image
                  if (inst.serialNumberImageUrl) {
                    const url = inst.serialNumberImageUrl.startsWith("http") ? inst.serialNumberImageUrl : `/api/files/${inst.serialNumberImageUrl}`;
                    photos.push({
                      id: `serial-${inst.id}`,
                      url,
                      fileName: `serial-${inst.acAssetSerial || inst.id}.jpg`,
                      fileSize: 0,
                      mimeType: "image/jpeg",
                      uploadedAt: inst.installationDate || inst.createdAt,
                      uploadedBy: inst.receiverName || "System",
                      caption: `${labelPrefix}Serial Number — ${inst.acAssetSerial || inst.bookingId || `Installation #${inst.id}`}`,
                    });
                  }
                  // Evidence images from JSON
                  if (inst.evidenceImagesJson) {
                    try {
                      const parsed = JSON.parse(inst.evidenceImagesJson);
                      if (Array.isArray(parsed)) {
                        parsed.forEach((imgUrl: string, idx: number) => {
                          const url = imgUrl.startsWith("http") ? imgUrl : `/api/files/${imgUrl}`;
                          photos.push({
                            id: `evidence-${inst.id}-${idx}`,
                            url,
                            fileName: `evidence-${inst.id}-${idx + 1}.jpg`,
                            fileSize: 0,
                            mimeType: "image/jpeg",
                            uploadedAt: inst.installationDate || inst.createdAt,
                            uploadedBy: inst.receiverName || "System",
                            caption: `${labelPrefix}Evidence ${idx + 1} — ${inst.acAssetSerial || inst.bookingId || `Installation #${inst.id}`}`,
                          });
                        });
                      }
                    } catch { /* ignore */ }
                  }
                };

                // 1) Evidence directly linked to this asset
                assetInstallations.forEach((inst) => extractFromInstallation(inst, ""));

                // 2) If no direct evidence, fall back to all installations at the same site
                if (photos.length === 0 && assetData?.siteId) {
                  const siteInstallations = (appData?.installations ?? []).filter(
                    (i) => i.siteId === assetData.siteId && String(i.acAssetId) !== assetId
                  );
                  siteInstallations.forEach((inst) => extractFromInstallation(inst, `[${inst.acAssetSerial || "Site"}] `));
                }

                return photos;
              })()}
              videos={[]}
              documents={[]}
              readOnly={false}
              onUpload={(type) => console.log("Upload:", type)}
            />
          </div>
        )}

        {/* Finance Tab */}
        {activeTab === "finance" && (
          <div className="max-w-5xl space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Financial Overview</h2>
              <p className="text-muted-foreground mt-1">Revenue, costs, and profitability metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="data-card border-border/50 shadow-sm">
                <CardContent className="p-6 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Rent</p>
                  <p className="text-3xl font-bold text-foreground">₹{monthlyRent.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </CardContent>
              </Card>
              <Card className="data-card border-status-success/20 shadow-sm bg-status-success/5">
                <CardContent className="p-6 space-y-2">
                  <p className="text-xs font-medium text-status-success uppercase tracking-wide">Purchase Cost</p>
                  <p className="text-3xl font-bold text-status-success">₹{(assetData.purchaseCost ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">one-time</p>
                </CardContent>
              </Card>
              <Card className="data-card border-status-error/20 shadow-sm bg-status-error/5">
                <CardContent className="p-6 space-y-2">
                  <p className="text-xs font-medium text-status-error uppercase tracking-wide">Maintenance Cost</p>
                  <p className="text-3xl font-bold text-status-error">₹{totalMaintenanceCost.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">total spent</p>
                </CardContent>
              </Card>
              <Card className="data-card border-primary/20 shadow-sm bg-primary/5">
                <CardContent className="p-6 space-y-2">
                  <p className="text-xs font-medium text-primary uppercase tracking-wide">Net per Month</p>
                  <p className="text-3xl font-bold text-foreground">₹{(monthlyRent - totalMaintenanceCost).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">revenue - costs</p>
                </CardContent>
              </Card>
            </div>

            {/* Config Context */}
            {(assetData.projectName || assetData.subprojectName) && (
              <Card className="data-card border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    Pricing Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Financial rules inherited from the project configuration at time of asset creation.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Base Rent</p>
                      <p className="text-lg font-bold text-foreground">₹{monthlyRent.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">First Month</p>
                      <p className="text-lg font-bold text-foreground">₹{(assetData.firstMonthRent ?? monthlyRent).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project</p>
                      <p className="text-sm font-semibold text-foreground">{assetData.projectName ?? "—"}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subproject</p>
                      <p className="text-sm font-semibold text-foreground">{assetData.subprojectName ?? "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}