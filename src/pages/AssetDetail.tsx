import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EvidenceGallery } from "@/components/assets/EvidenceGallery";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAppData } from "@/context/AppDataContext";
import api from "@/lib/api";

const statusConfig: Record<string, { label: string; color: string }> = {
  "ACTIVE": { label: "Operational", color: "status-success" },
  "operational": { label: "Operational", color: "status-success" },
  "INACTIVE": { label: "Inactive", color: "status-neutral" },
  "in-stock": { label: "In Stock", color: "status-neutral" },
  "in-transit": { label: "In Transit", color: "status-info" },
  "pending-install": { label: "Pending Install", color: "status-info" },
  "MAINTENANCE": { label: "Under Maintenance", color: "status-warning" },
  "maintenance": { label: "Under Maintenance", color: "status-warning" },
  "DECOMMISSIONED": { label: "Decommissioned", color: "status-neutral" },
  "REPLACED": { label: "Replaced", color: "status-neutral" },
  "faulty": { label: "Faulty", color: "status-error" },
  "offline": { label: "Offline", color: "status-error" },
};

interface MaintenanceRecord {
  id: number;
  ticketId?: number;
  description: string;
  actionTaken?: string;
  performedBy?: string;
  performedAt?: string;
  costIncurred?: number;
  partsReplaced?: string;
  nextScheduledDate?: string;
}

interface AuditLogEntry {
  id: number;
  action: string;
  entityTable: string;
  entityId: number;
  description: string;
  performedBy: any;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
}

export default function AssetDetail() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const { data: appData, loading } = useAppData();
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [evidencePhotos, setEvidencePhotos] = useState<any[]>([]);
  const [evidenceVideos, setEvidenceVideos] = useState<any[]>([]);
  const [evidenceDocuments, setEvidenceDocuments] = useState<any[]>([]);

  // Find asset from context
  const assetData = appData?.assets?.find(a => String(a.id) === assetId);
  
  // Find installation for this asset
  const installation = appData?.installations?.find(i => String(i.acAssetId) === assetId);
  
  // Find maintenance tickets for this asset
  const tickets = appData?.maintenanceTickets?.filter(t => String(t.acAssetId) === assetId) || [];

  // Fetch maintenance history & audit logs
  useEffect(() => {
    if (!assetId) return;
    
    api.get(`/maintenance-history/asset/${assetId}`)
      .then(res => setMaintenanceHistory(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});

    api.get(`/audit/logs?entityTable=ac_assets&entityId=${assetId}&page=0&size=50`)
      .then(res => {
        const logs = res.data?.content || res.data || [];
        setAuditLogs(Array.isArray(logs) ? logs : []);
      })
      .catch(() => {});
  }, [assetId]);

  // Parse evidence images from installation
  useEffect(() => {
    if (installation?.evidenceImagesJson) {
      try {
        const urls = JSON.parse(installation.evidenceImagesJson as string);
        if (Array.isArray(urls)) {
          const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
          const photoUrls: string[] = [];
          const videoUrls: string[] = [];
          
          urls.forEach((url: string) => {
            const lower = url.toLowerCase();
            if (videoExtensions.some(ext => lower.includes(ext))) {
              videoUrls.push(url);
            } else {
              photoUrls.push(url);
            }
          });
          
          setEvidencePhotos(photoUrls.map((url: string, i: number) => ({
            id: `photo-${i}`,
            url,
            thumbnailUrl: url,
            fileName: url.split('/').pop() || `photo-${i}.jpg`,
            fileSize: 0,
            mimeType: "image/jpeg",
            uploadedAt: installation.createdAt || new Date().toISOString(),
            uploadedBy: "System",
          })));
          
          setEvidenceVideos(videoUrls.map((url: string, i: number) => ({
            id: `video-${i}`,
            url,
            thumbnailUrl: url,
            fileName: url.split('/').pop() || `video-${i}.mp4`,
            fileSize: 0,
            mimeType: "video/mp4",
            uploadedAt: installation.createdAt || new Date().toISOString(),
            uploadedBy: "System",
          })));
        }
      } catch {}
    }
    if (installation?.serialNumberImageUrl) {
      setEvidenceDocuments([{
        id: "serial-img",
        fileUrl: installation.serialNumberImageUrl,
        fileName: "serial-number.jpg",
        fileSize: 0,
        mimeType: "image/jpeg",
        uploadedAt: installation.createdAt || new Date().toISOString(),
        uploadedBy: "System",
        documentType: "serial",
        description: "Serial number image",
      }]);
    }
  }, [installation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading asset details...</p>
      </div>
    );
  }

  if (!assetData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Box className="w-16 h-16 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold">Asset Not Found</h2>
        <p className="text-muted-foreground">Asset #{assetId} could not be found.</p>
        <Button variant="outline" onClick={() => navigate("/assets")}>Back to Assets</Button>
      </div>
    );
  }

  // Map to display values
  const status = statusConfig[assetData.status] || { label: assetData.status, color: "status-neutral" };
  const monthlyRent = assetData.monthlyRent ?? 0;
  const warrantyActive = assetData.warrantyExpiryDate ? new Date(assetData.warrantyExpiryDate) > new Date() : false;
  const totalMaintenanceCost = maintenanceHistory.reduce((s, m) => s + (m.costIncurred || 0), 0);

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
                  {assetData.model || "Unknown Model"} · {assetData.manufacturer || "Unknown Manufacturer"} {assetData.sizeInTon ? `· ${assetData.sizeInTon}T` : ''}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${assetData.indoorAc ? 'bg-[hsl(var(--status-info)/0.15)] text-[hsl(var(--status-info))]' : 'bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]'}`}>
                    {assetData.indoorAc ? 'Indoor Unit' : 'Outdoor Unit'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Info Pills */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                <MapPin className="w-4 h-4 text-primary" />
                <Link 
                  to={`/site/${assetData.siteId}`} 
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {assetData.siteName || "Unassigned"}
                </Link>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {installation?.installationDate 
                    ? `Installed ${new Date(installation.installationDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}` 
                    : `Size: ${assetData.sizeInTon ?? 'N/A'} Ton`}
                </span>
              </div>
            </div>
          </div>

          {/* Configuration Context Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Configuration:</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-foreground" />
                <span className="text-sm font-semibold text-foreground">{assetData.projectName || "N/A"}</span>
              </div>
              {assetData.subprojectName && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-sm font-medium text-foreground">{assetData.subprojectName}</span>
                </>
              )}
              <span className="ml-auto px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                {assetData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent p-0 h-auto border-b-0 gap-1 w-full justify-start">
              {[
                { id: "overview", label: "Overview", icon: Activity },
                { id: "installation", label: "Installation", icon: Wrench },
                { id: "maintenance", label: "Maintenance", icon: Settings },
                { id: "evidence", label: "Evidence", icon: Camera },
                { id: "finance", label: "Finance", icon: DollarSign },
                { id: "timeline", label: "Timeline", icon: History },
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
                    Asset Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Rent</p>
                      <p className="text-2xl font-bold text-foreground">₹{monthlyRent.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Size</p>
                      <p className="text-2xl font-bold text-foreground">{assetData.sizeInTon ?? "N/A"} <span className="text-base font-normal text-muted-foreground">Ton</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Purchase Cost</p>
                      <p className="text-lg font-semibold text-foreground">
                        {assetData.purchaseCost ? `₹${assetData.purchaseCost.toLocaleString()}` : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sell Price</p>
                      <p className="text-lg font-semibold text-foreground">
                        {assetData.sellPrice ? `₹${assetData.sellPrice.toLocaleString()}` : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model No.</p>
                      <p className="text-lg font-semibold text-foreground">
                        {assetData.modelNumber || assetData.model || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">First Month Rent</p>
                      <p className="text-lg font-semibold text-foreground">
                        {assetData.firstMonthRent ? `₹${assetData.firstMonthRent.toLocaleString()}` : "N/A"}
                      </p>
                    </div>
                  </div>

                  {assetData.nextMaintenanceDate && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-muted-foreground">Next Maintenance</span>
                        <span className="font-semibold text-foreground">
                          {new Date(assetData.nextMaintenanceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location & Warranty Grid */}
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
                      <Link 
                        to={`/site/${assetData.siteId}`} 
                        className="text-base font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                      >
                        {assetData.siteName || "Unassigned"}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Specific Location</p>
                      <p className="text-base font-semibold text-foreground">{assetData.locationInSite || "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="data-card border-border/50 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Warranty Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Status</span>
                      <Badge 
                        variant={warrantyActive ? "default" : "secondary"}
                        className="font-semibold"
                      >
                        {warrantyActive ? "Active" : "Expired"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valid Until</p>
                      <p className="text-base font-semibold text-foreground">
                        {assetData.warrantyExpiryDate 
                          ? new Date(assetData.warrantyExpiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="data-card border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveTab("timeline")}
                      className="gap-2"
                    >
                      View All
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">
                    {auditLogs.length > 0 ? auditLogs.slice(0, 8).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{log.description || log.action}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {typeof log.performedBy === 'string' ? log.performedBy : (log.performedBy?.firstName ? `${log.performedBy.firstName} ${log.performedBy.lastName || ''}`.trim() : 'System')}
                            {' · '}
                            {new Date(log.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No activity recorded yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Maintenance (moved to right column) */}
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
                    <span className="text-sm text-muted-foreground">Monthly Rent</span>
                    <span className="text-lg font-semibold text-foreground">₹{monthlyRent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Maintenance Cost</span>
                    <span className="text-lg font-semibold text-status-error">₹{totalMaintenanceCost.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Purchase Cost</span>
                    <span className="text-xl font-bold text-foreground">{assetData.purchaseCost ? `₹${assetData.purchaseCost.toLocaleString()}` : 'N/A'}</span>
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
                    <span className="text-sm font-medium text-muted-foreground">Total Services</span>
                    <span className="text-lg font-bold text-foreground">{maintenanceHistory.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-muted-foreground">Open Tickets</span>
                    <span className="text-lg font-bold text-foreground">
                      {tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-muted-foreground">Last Service</span>
                    <span className="text-sm font-semibold text-foreground">
                      {assetData.lastMaintenanceDate
                        ? new Date(assetData.lastMaintenanceDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                        : "N/A"}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-4 gap-2" 
                    onClick={() => setActiveTab("maintenance")}
                  >
                    <Wrench className="w-4 h-4" />
                    Schedule Maintenance
                  </Button>
                </CardContent>
              </Card>

              {/* Evidence Summary */}
              <Card className="data-card border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Camera className="w-5 h-5 text-primary" />
                      Evidence
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveTab("evidence")}
                      className="gap-2"
                    >
                      View All
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-center">
                      <p className="text-2xl font-bold text-foreground">{evidencePhotos.length}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Photos</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-center">
                      <p className="text-2xl font-bold text-foreground">{evidenceVideos.length}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Videos</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-center">
                      <p className="text-2xl font-bold text-foreground">{evidenceDocuments.length}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Documents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
               {/* Recent Maintenance (moved from left) */}
              <Card className="data-card border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-primary" />
                      Recent Maintenance
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveTab("maintenance")}
                      className="gap-2"
                    >
                      View All
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {maintenanceHistory.slice(-3).reverse().map((record) => (
                    <div key={record.id} className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-sm text-foreground line-clamp-2">{record.description}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{record.performedBy || "—"}</span>
                        <span>{record.performedAt ? new Date(record.performedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : "—"}</span>
                      </div>
                    </div>
                  ))}

                  {maintenanceHistory.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No maintenance records yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Installation Tab */}
        {activeTab === "installation" && (
          <div className="max-w-5xl space-y-8">
            {installation ? (
              <>
                {/* Installation Summary */}
                <Card className="data-card border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-status-success" />
                      Installation {installation.status === 'COMPLETED' ? 'Complete' : installation.status || 'Details'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</p>
                        <p className="text-base font-semibold text-foreground">
                          {installation.installationDate 
                            ? new Date(installation.installationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : "Pending"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Site</p>
                        <p className="text-base font-semibold text-foreground">{installation.siteName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Receiver</p>
                        <p className="text-base font-semibold text-foreground">{installation.receiverName || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Shipment Status</p>
                        <Badge variant="secondary" className="font-semibold">
                          {installation.shipmentStatus}
                        </Badge>
                      </div>
                    </div>

                    {installation.remarks && (
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Remarks</p>
                        <p className="text-foreground">{installation.remarks}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Evidence from installation */}
                {(evidencePhotos.length > 0 || evidenceVideos.length > 0 || evidenceDocuments.length > 0) && (
                  <Card className="data-card border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Installation Evidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EvidenceGallery
                        photos={evidencePhotos}
                        videos={evidenceVideos}
                        documents={evidenceDocuments}
                        readOnly
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Installation Timeline */}
                <Card className="data-card border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Installation Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: "Booking Created", date: installation.bookingDate, status: installation.bookingDate ? "done" : "pending" },
                        { label: "ETA", date: installation.eta, status: installation.eta ? "done" : "pending" },
                        { label: "Installation Date", date: installation.installationDate, status: installation.installationDate ? "done" : "pending" },
                        { label: "Closed", date: installation.closedDate, status: installation.closedDate ? "done" : "pending" },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full shrink-0 ${step.status === 'done' ? 'bg-status-success' : 'bg-muted-foreground/30'}`} />
                          <span className="text-sm font-medium text-foreground w-40">{step.label}</span>
                          <span className="text-sm text-muted-foreground">
                            {step.date ? new Date(step.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="data-card border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Wrench className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Installation Record</h3>
                  <p className="text-sm text-muted-foreground">No installation has been recorded for this asset yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === "maintenance" && (
          <div className="max-w-5xl space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Maintenance History</h2>
                <p className="text-muted-foreground mt-1">Complete service record for this asset</p>
              </div>
              <Button className="gap-2">
                <Wrench className="w-4 h-4" />
                Schedule Maintenance
              </Button>
            </div>

            {maintenanceHistory.map((record) => (
              <Card key={record.id} className="data-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{record.description}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="font-medium">{record.performedBy || "—"}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span>{record.performedAt ? new Date(record.performedAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : "—"}</span>
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {record.actionTaken && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-foreground">Action Taken</h4>
                      <p className="text-sm text-muted-foreground">{record.actionTaken}</p>
                    </div>
                  )}

                  {record.partsReplaced && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-foreground">Parts Replaced</h4>
                      <p className="text-sm text-muted-foreground">{record.partsReplaced}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-sm font-medium text-muted-foreground">Cost Incurred</span>
                    <span className="text-xl font-bold text-foreground">₹{(record.costIncurred || 0).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {maintenanceHistory.length === 0 && (
              <Card className="data-card border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Wrench className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No maintenance records</h3>
                  <p className="text-sm text-muted-foreground mb-6">This asset has no maintenance history yet</p>
                  <Button className="gap-2">
                    <Wrench className="w-4 h-4" />
                    Schedule First Maintenance
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
              <p className="text-muted-foreground mt-1">Photos, videos, and documents related to this asset</p>
            </div>
            {(evidencePhotos.length > 0 || evidenceVideos.length > 0 || evidenceDocuments.length > 0) ? (
              <EvidenceGallery
                photos={evidencePhotos}
                videos={evidenceVideos}
                documents={evidenceDocuments}
                readOnly={false}
                onUpload={(type) => console.log("Upload:", type)}
              />
            ) : (
              <Card className="data-card border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Camera className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Evidence Available</h3>
                  <p className="text-sm text-muted-foreground">No photos or documents have been uploaded for this asset yet</p>
                </CardContent>
              </Card>
            )}
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
              <Card className="data-card border-border/50 shadow-sm">
                <CardContent className="p-6 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Purchase Cost</p>
                  <p className="text-3xl font-bold text-foreground">{assetData.purchaseCost ? `₹${assetData.purchaseCost.toLocaleString()}` : 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">one-time</p>
                </CardContent>
              </Card>
              <Card className="data-card border-border/50 shadow-sm">
                <CardContent className="p-6 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sell Price</p>
                  <p className="text-3xl font-bold text-foreground">{assetData.sellPrice ? `₹${assetData.sellPrice.toLocaleString()}` : 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">to client</p>
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
                  <p className="text-xs font-medium text-primary uppercase tracking-wide">First Month Rent</p>
                  <p className="text-3xl font-bold text-foreground">{assetData.firstMonthRent ? `₹${assetData.firstMonthRent.toLocaleString()}` : 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">initial charge</p>
                </CardContent>
              </Card>
            </div>

            {/* Config Context */}
            <Card className="data-card border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  Pricing Configuration (Locked)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Financial details for this asset. Values are based on asset configuration.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Base Rent</p>
                    <p className="text-lg font-bold text-foreground">₹{monthlyRent.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Size</p>
                    <p className="text-lg font-bold text-foreground">{assetData.sizeInTon ?? "N/A"} <span className="text-sm font-normal text-muted-foreground">Ton</span></p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project</p>
                    <p className="text-sm font-semibold text-foreground">{assetData.projectName || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subproject</p>
                    <p className="text-sm font-semibold text-foreground">{assetData.subprojectName || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="max-w-4xl">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground">Complete Lifecycle</h2>
              <p className="text-muted-foreground mt-1">
                Full audit trail of all events for this asset
              </p>
            </div>
            <div className="space-y-4">
              {auditLogs.length > 0 ? auditLogs.map((log) => (
                <div key={log.id} className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary mt-1" />
                    <div className="w-px flex-1 bg-border mt-1" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">{log.description || log.action}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {typeof log.performedBy === 'string' ? log.performedBy : (log.performedBy?.firstName ? `${log.performedBy.firstName} ${log.performedBy.lastName || ''}`.trim() : 'System')}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' '}
                        {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <Card className="data-card border-border/50">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <History className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Timeline Events</h3>
                    <p className="text-sm text-muted-foreground">No audit trail available for this asset yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}