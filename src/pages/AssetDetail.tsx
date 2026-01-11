import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ConfigurationBadge } from "@/components/sites/ConfigurationBadge";
import { AssetLifecycleTimeline } from "@/components/assets/AssetLifecycleTimeline";
import { InstallationMaterialsForm } from "@/components/assets/InstallationMaterialsForm";
import { DynamicMetadataForm } from "@/components/assets/DynamicMetadataForm";
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
  Folder,
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
import type { ACSAsset, LifecycleEvent, InstallationMaterial, MetadataField, MediaEvidence, DocumentEvidence, MaintenanceRecord } from "@/types/asset";

// Mock data for a comprehensive asset
const mockAsset: ACSAsset = {
  id: "ACS-001",
  serialNumber: "SN-2024-0001",
  model: "ProCool 5000X",
  manufacturer: "CoolTech Industries",
  status: "operational",
  currentSiteId: "site-001",
  currentSiteName: "Metro Tower - Block A",
  locationWithinSite: "Floor 12, Zone A",
  
  // Contract/tenure
  tenureMonths: 36,
  rentStartDate: "2024-01-15",
  rentEndDate: "2027-01-14",
  contractStatus: "active",
  daysRemaining: 730,
  monthlyRent: 15000,
  
  // Configuration
  configurationId: "config-001",
  configurationVersion: "1.0",
  projectId: "proj-001",
  projectName: "Dava India",
  subprojectId: "subproj-002",
  subprojectName: "Mumbai Region",
  
  // Installation details
  installationDetails: {
    id: "inst-001",
    acsUnitId: "ACS-001",
    installationDate: "2024-01-15",
    completedBy: "Rajesh Kumar",
    teamId: "team-alpha",
    teamName: "Team Alpha",
    startTime: "09:00",
    endTime: "14:30",
    durationMinutes: 330,
    materials: [
      { id: "m1", name: "Power Cable 2.5mm", category: "cables", quantity: 15, unit: "meters", brand: "Havells", cost: 45 },
      { id: "m2", name: "Wall Mount Bracket", category: "brackets", quantity: 2, unit: "pcs", brand: "Unistrut", model: "P1001", cost: 850 },
      { id: "m3", name: "Temperature Sensor", category: "sensors", quantity: 1, unit: "pcs", brand: "Honeywell", serialNumber: "TS-2024-001", cost: 2500 },
      { id: "m4", name: "Cable Ties 300mm", category: "consumables", quantity: 50, unit: "pcs", brand: "3M", cost: 5 },
      { id: "m5", name: "Stabilizer 5KVA", category: "stabilizers", quantity: 1, unit: "pcs", brand: "V-Guard", model: "VGMEW 500", serialNumber: "VG-2024-0123", cost: 8500 },
    ],
    metadata: [
      { key: "power_supply_phase", label: "Power Supply Phase", value: "3-Phase", type: "select", category: "Electrical" },
      { key: "voltage_reading", label: "Voltage Reading", value: 415, type: "number", unit: "V", category: "Electrical" },
      { key: "earthing_checked", label: "Earthing Verified", value: true, type: "boolean", category: "Safety" },
      { key: "ambient_temp", label: "Ambient Temperature", value: 28, type: "number", unit: "°C", category: "Environment" },
      { key: "humidity", label: "Humidity Level", value: 65, type: "number", unit: "%", category: "Environment" },
    ],
    photos: [
      { id: "p1", url: "", thumbnailUrl: "", fileName: "installation_front.jpg", fileSize: 2400000, mimeType: "image/jpeg", uploadedAt: "2024-01-15T14:00:00Z", uploadedBy: "Rajesh Kumar", caption: "Front view after installation", tags: ["installation", "completed"] },
      { id: "p2", url: "", thumbnailUrl: "", fileName: "wiring_complete.jpg", fileSize: 1800000, mimeType: "image/jpeg", uploadedAt: "2024-01-15T13:30:00Z", uploadedBy: "Rajesh Kumar", caption: "Wiring connections", tags: ["wiring"] },
      { id: "p3", url: "", thumbnailUrl: "", fileName: "stabilizer_setup.jpg", fileSize: 2100000, mimeType: "image/jpeg", uploadedAt: "2024-01-15T12:00:00Z", uploadedBy: "Rajesh Kumar", caption: "Stabilizer installation", tags: ["stabilizer"] },
    ],
    videos: [
      { id: "v1", url: "", thumbnailUrl: "", fileName: "installation_walkthrough.mp4", fileSize: 45000000, mimeType: "video/mp4", uploadedAt: "2024-01-15T14:30:00Z", uploadedBy: "Rajesh Kumar", caption: "Complete installation walkthrough" },
    ],
    documents: [
      { id: "d1", url: "", fileName: "installation_checklist.pdf", fileSize: 150000, mimeType: "application/pdf", uploadedAt: "2024-01-15T14:35:00Z", uploadedBy: "Rajesh Kumar", documentType: "checklist", description: "Signed installation checklist" },
      { id: "d2", url: "", fileName: "warranty_card.pdf", fileSize: 80000, mimeType: "application/pdf", uploadedAt: "2024-01-15T14:40:00Z", uploadedBy: "Rajesh Kumar", documentType: "warranty", description: "Manufacturer warranty card" },
    ],
    qualityCheckPassed: true,
    qualityCheckedBy: "Amit Verma",
    qualityCheckDate: "2024-01-16",
    generalNotes: "Installation completed smoothly. Client requested additional cable management.",
    siteId: "site-001",
    siteName: "Metro Tower - Block A",
    projectId: "proj-001",
    projectName: "Dava India",
    subprojectId: "subproj-002",
    subprojectName: "Mumbai Region",
    configurationId: "config-001",
    configurationVersion: "1.0",
  },
  
  // Maintenance history
  maintenanceHistory: [
    {
      id: "maint-001",
      acsUnitId: "ACS-001",
      type: "scheduled",
      status: "completed",
      scheduledDate: "2024-04-15",
      startedAt: "2024-04-15T10:00:00Z",
      completedAt: "2024-04-15T12:30:00Z",
      performedBy: "Suresh Patel",
      description: "Quarterly preventive maintenance",
      partsReplaced: [],
      metadata: [
        { key: "filter_cleaned", label: "Filter Cleaned", value: true, type: "boolean", category: "Maintenance" },
        { key: "coolant_level", label: "Coolant Level", value: "OK", type: "text", category: "Maintenance" },
      ],
      laborCost: 1500,
      partsCost: 0,
      totalCost: 1500,
      photos: [],
      documents: [],
      siteId: "site-001",
      siteName: "Metro Tower - Block A",
    },
    {
      id: "maint-002",
      acsUnitId: "ACS-001",
      type: "unscheduled",
      status: "completed",
      startedAt: "2024-06-20T14:00:00Z",
      completedAt: "2024-06-20T17:00:00Z",
      performedBy: "Amit Verma",
      description: "Compressor noise issue - bearing replacement",
      partsReplaced: [
        { id: "part-001", partName: "Compressor Bearing", partNumber: "CB-5000-01", oldSerialNumber: "OLD-123", newSerialNumber: "NEW-456", quantity: 1, cost: 3500, reason: "Worn out bearing causing noise" },
      ],
      metadata: [],
      laborCost: 2000,
      partsCost: 3500,
      totalCost: 5500,
      photos: [],
      documents: [],
      ticketId: "TKT-2024-089",
      siteId: "site-001",
      siteName: "Metro Tower - Block A",
    },
  ],
  
  // Lifecycle events
  lifecycleEvents: [
    { id: "e1", acsUnitId: "ACS-001", eventType: "created", timestamp: "2023-12-01T10:00:00Z", performedBy: "System", title: "Asset Created", description: "Asset registered in inventory" },
    { id: "e2", acsUnitId: "ACS-001", eventType: "assigned-to-site", timestamp: "2024-01-10T09:00:00Z", performedBy: "Operations Team", title: "Assigned to Site", description: "Assigned to Metro Tower - Block A", siteName: "Metro Tower - Block A" },
    { id: "e3", acsUnitId: "ACS-001", eventType: "shipped", timestamp: "2024-01-12T08:00:00Z", performedBy: "Logistics", title: "Shipped to Site", referenceType: "shipment", referenceId: "SHIP-2024-001" },
    { id: "e4", acsUnitId: "ACS-001", eventType: "delivered", timestamp: "2024-01-14T15:00:00Z", performedBy: "Logistics", title: "Delivered", description: "Received at site warehouse" },
    { id: "e5", acsUnitId: "ACS-001", eventType: "installation-started", timestamp: "2024-01-15T09:00:00Z", performedBy: "Rajesh Kumar", title: "Installation Started", siteName: "Metro Tower - Block A" },
    { id: "e6", acsUnitId: "ACS-001", eventType: "installation-completed", timestamp: "2024-01-15T14:30:00Z", performedBy: "Rajesh Kumar", title: "Installation Completed", description: "All checks passed", referenceType: "installation", referenceId: "inst-001", photos: [{ id: "p1", url: "", thumbnailUrl: "", fileName: "complete.jpg", fileSize: 1000000, mimeType: "image/jpeg", uploadedAt: "2024-01-15T14:30:00Z", uploadedBy: "Rajesh Kumar" }] },
    { id: "e7", acsUnitId: "ACS-001", eventType: "activated", timestamp: "2024-01-15T15:00:00Z", performedBy: "Amit Verma", title: "Asset Activated", description: "Quality check passed, unit activated", configurationVersion: "1.0" },
    { id: "e8", acsUnitId: "ACS-001", eventType: "rent-started", timestamp: "2024-01-15T15:00:00Z", performedBy: "System", title: "Rent Started", description: "36-month tenure begins" },
    { id: "e9", acsUnitId: "ACS-001", eventType: "maintenance-completed", timestamp: "2024-04-15T12:30:00Z", performedBy: "Suresh Patel", title: "Quarterly Maintenance", description: "Preventive maintenance completed", referenceType: "maintenance", referenceId: "maint-001" },
    { id: "e10", acsUnitId: "ACS-001", eventType: "issue-reported", timestamp: "2024-06-20T10:00:00Z", performedBy: "Client", title: "Issue Reported", description: "Compressor noise reported", referenceType: "ticket", referenceId: "TKT-2024-089" },
    { id: "e11", acsUnitId: "ACS-001", eventType: "part-replaced", timestamp: "2024-06-20T17:00:00Z", performedBy: "Amit Verma", title: "Part Replaced", description: "Compressor bearing replaced", referenceType: "maintenance", referenceId: "maint-002" },
    { id: "e12", acsUnitId: "ACS-001", eventType: "issue-resolved", timestamp: "2024-06-20T17:30:00Z", performedBy: "Amit Verma", title: "Issue Resolved", description: "Ticket closed, unit operational" },
  ],
  
  // All evidence
  allPhotos: [],
  allVideos: [],
  allDocuments: [],
  
  // Financial
  totalRevenueEarned: 180000,
  totalMaintenanceCost: 7000,
  netContribution: 173000,
  
  // Warranty
  warrantyStartDate: "2024-01-15",
  warrantyEndDate: "2027-01-14",
  warrantyStatus: "active",
  
  // Audit
  createdAt: "2023-12-01T10:00:00Z",
  createdBy: "System",
  lastModifiedAt: "2024-06-20T17:30:00Z",
  lastModifiedBy: "Amit Verma",
};

const statusConfig = {
  "in-stock": { label: "In Stock", color: "status-neutral" },
  "in-transit": { label: "In Transit", color: "status-info" },
  "pending-install": { label: "Pending Install", color: "status-info" },
  "operational": { label: "Operational", color: "status-success" },
  "maintenance": { label: "Under Maintenance", color: "status-warning" },
  "faulty": { label: "Faulty", color: "status-error" },
  "offline": { label: "Offline", color: "status-error" },
  "decommissioned": { label: "Decommissioned", color: "status-neutral" },
};

export default function AssetDetail() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const asset = mockAsset; // In real app, fetch by assetId
  const status = statusConfig[asset.status];

  // Calculate tenure progress
  const tenureProgress = asset.tenureMonths && asset.daysRemaining
    ? ((asset.tenureMonths * 30 - asset.daysRemaining) / (asset.tenureMonths * 30)) * 100
    : 0;

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
                <span className="text-foreground font-medium">{asset.serialNumber}</span>
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
                    {asset.serialNumber}
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
                  {asset.model} · {asset.manufacturer}
                </p>
              </div>
            </div>

            {/* Quick Info Pills */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                <MapPin className="w-4 h-4 text-primary" />
                <Link 
                  to={`/site/${asset.currentSiteId}`} 
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {asset.currentSiteName}
                </Link>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Installed {new Date(asset.installationDetails?.installationDate || "").toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                <span className="text-sm font-semibold text-foreground">{asset.projectName}</span>
              </div>
              {asset.subprojectName && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-sm font-medium text-foreground">{asset.subprojectName}</span>
                </>
              )}
              <span className="ml-auto px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                Version {asset.configurationVersion || "1.0"}
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
                    Contract & Tenure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Rent</p>
                      <p className="text-2xl font-bold text-foreground">₹{asset.monthlyRent?.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tenure</p>
                      <p className="text-2xl font-bold text-foreground">{asset.tenureMonths} <span className="text-base font-normal text-muted-foreground">months</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Date</p>
                      <p className="text-lg font-semibold text-foreground">
                        {new Date(asset.rentStartDate || "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">End Date</p>
                      <p className="text-lg font-semibold text-foreground">
                        {new Date(asset.rentEndDate || "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Contract Progress</span>
                      <span className="font-semibold text-foreground">
                        {asset.daysRemaining} days remaining
                      </span>
                    </div>
                    <Progress value={tenureProgress} className="h-2.5" />
                  </div>
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
                        to={`/site/${asset.currentSiteId}`} 
                        className="text-base font-semibold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                      >
                        {asset.currentSiteName}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Specific Location</p>
                      <p className="text-base font-semibold text-foreground">{asset.locationWithinSite}</p>
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
                        variant={asset.warrantyStatus === "active" ? "default" : "secondary"}
                        className="font-semibold"
                      >
                        {asset.warrantyStatus === "active" ? "Active" : "Expired"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valid Until</p>
                      <p className="text-base font-semibold text-foreground">
                        {new Date(asset.warrantyEndDate || "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
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
                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    <AssetLifecycleTimeline events={asset.lifecycleEvents.slice(-8).reverse()} compact />
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
                    <span className="text-sm text-muted-foreground">Revenue Earned</span>
                    <span className="text-lg font-semibold text-status-success">₹{asset.totalRevenueEarned?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Maintenance Cost</span>
                    <span className="text-lg font-semibold text-status-error">₹{asset.totalMaintenanceCost?.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Net Contribution</span>
                    <span className="text-xl font-bold text-foreground">₹{asset.netContribution?.toLocaleString()}</span>
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
                    <span className="text-lg font-bold text-foreground">{asset.maintenanceHistory.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-muted-foreground">Parts Replaced</span>
                    <span className="text-lg font-bold text-foreground">
                      {asset.maintenanceHistory.reduce((sum, m) => sum + m.partsReplaced.length, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-muted-foreground">Last Service</span>
                    <span className="text-sm font-semibold text-foreground">
                      {asset.maintenanceHistory.length > 0
                        ? new Date(asset.maintenanceHistory[asset.maintenanceHistory.length - 1].completedAt || "").toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
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
                      <p className="text-2xl font-bold text-foreground">{asset.installationDetails?.photos.length || 0}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Photos</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-center">
                      <p className="text-2xl font-bold text-foreground">{asset.installationDetails?.videos.length || 0}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Videos</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-center">
                      <p className="text-2xl font-bold text-foreground">{asset.installationDetails?.documents.length || 0}</p>
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
                  {asset.maintenanceHistory.slice(-3).reverse().map((record) => (
                    <div key={record.id} className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-sm text-foreground line-clamp-2">{record.description}</p>
                        <Badge 
                          variant={record.type === "scheduled" ? "secondary" : "outline"}
                          className="shrink-0 text-xs"
                        >
                          {record.type}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{record.performedBy}</span>
                        <span>{new Date(record.completedAt || record.startedAt || "").toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  ))}

                  {asset.maintenanceHistory.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No maintenance records yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Installation Tab */}
        {activeTab === "installation" && asset.installationDetails && (
          <div className="max-w-5xl space-y-8">
            {/* Installation Summary */}
            <Card className="data-card border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-status-success" />
                  Installation Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</p>
                    <p className="text-base font-semibold text-foreground">{asset.installationDetails.installationDate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Team</p>
                    <p className="text-base font-semibold text-foreground">{asset.installationDetails.teamName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed By</p>
                    <p className="text-base font-semibold text-foreground">{asset.installationDetails.completedBy}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Duration</p>
                    <p className="text-base font-semibold text-foreground">
                      {Math.floor((asset.installationDetails.durationMinutes || 0) / 60)}h {(asset.installationDetails.durationMinutes || 0) % 60}m
                    </p>
                  </div>
                </div>

                {asset.installationDetails.qualityCheckPassed && (
                  <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/20 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-status-success shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Quality Check Passed</p>
                      <p className="text-sm text-muted-foreground">
                        Verified by {asset.installationDetails.qualityCheckedBy} on {asset.installationDetails.qualityCheckDate}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Materials Used */}
            <Card className="data-card border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Materials Used</CardTitle>
              </CardHeader>
              <CardContent>
                <InstallationMaterialsForm
                  materials={asset.installationDetails.materials}
                  onChange={() => {}}
                  readOnly
                />
              </CardContent>
            </Card>

            {/* Installation Metadata */}
            <Card className="data-card border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Installation Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicMetadataForm
                  fields={asset.installationDetails.metadata}
                  onChange={() => {}}
                  readOnly
                  showAddCustom={false}
                />
              </CardContent>
            </Card>

            {/* Installation Notes */}
            {asset.installationDetails.generalNotes && (
              <Card className="data-card border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Installation Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{asset.installationDetails.generalNotes}</p>
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

            {asset.maintenanceHistory.map((record) => (
              <Card key={record.id} className="data-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{record.description}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="font-medium">{record.performedBy}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span>{new Date(record.completedAt || record.startedAt || "").toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </p>
                    </div>
                    <Badge 
                      variant={record.type === "scheduled" ? "secondary" : "outline"}
                      className="shrink-0"
                    >
                      {record.type === "scheduled" ? "Scheduled" : "Unscheduled"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {record.partsReplaced.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-foreground">Parts Replaced</h4>
                      <div className="space-y-3">
                        {record.partsReplaced.map((part) => (
                          <div 
                            key={part.id} 
                            className="flex items-start justify-between p-4 rounded-lg bg-muted/30 border border-border/50"
                          >
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">{part.partName}</p>
                              <p className="text-sm text-muted-foreground">{part.reason}</p>
                            </div>
                            <span className="font-semibold text-foreground shrink-0 ml-4">
                              ₹{part.cost?.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-sm font-medium text-muted-foreground">Total Cost</span>
                    <span className="text-xl font-bold text-foreground">₹{record.totalCost?.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {asset.maintenanceHistory.length === 0 && (
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
        {activeTab === "evidence" && asset.installationDetails && (
          <div className="max-w-6xl">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Evidence & Documentation</h2>
              <p className="text-muted-foreground mt-1">Photos, videos, and documents related to this asset</p>
            </div>
            <EvidenceGallery
              photos={asset.installationDetails.photos}
              videos={asset.installationDetails.videos}
              documents={asset.installationDetails.documents}
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
                  <p className="text-3xl font-bold text-foreground">₹{asset.monthlyRent?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </CardContent>
              </Card>
              <Card className="data-card border-status-success/20 shadow-sm bg-status-success/5">
                <CardContent className="p-6 space-y-2">
                  <p className="text-xs font-medium text-status-success uppercase tracking-wide">Total Revenue</p>
                  <p className="text-3xl font-bold text-status-success">₹{asset.totalRevenueEarned?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">since activation</p>
                </CardContent>
              </Card>
              <Card className="data-card border-status-error/20 shadow-sm bg-status-error/5">
                <CardContent className="p-6 space-y-2">
                  <p className="text-xs font-medium text-status-error uppercase tracking-wide">Maintenance Cost</p>
                  <p className="text-3xl font-bold text-status-error">₹{asset.totalMaintenanceCost?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">total spent</p>
                </CardContent>
              </Card>
              <Card className="data-card border-primary/20 shadow-sm bg-primary/5">
                <CardContent className="p-6 space-y-2">
                  <p className="text-xs font-medium text-primary uppercase tracking-wide">Net Contribution</p>
                  <p className="text-3xl font-bold text-foreground">₹{asset.netContribution?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">revenue - costs</p>
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
                  Financial rules inherited from configuration v{asset.configurationVersion} at time of activation.
                  These values are locked and cannot be changed retroactively.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Base Rent</p>
                    <p className="text-lg font-bold text-foreground">₹{asset.monthlyRent?.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tenure</p>
                    <p className="text-lg font-bold text-foreground">{asset.tenureMonths} <span className="text-sm font-normal text-muted-foreground">months</span></p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project</p>
                    <p className="text-sm font-semibold text-foreground">{asset.projectName}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subproject</p>
                    <p className="text-sm font-semibold text-foreground">{asset.subprojectName || "—"}</p>
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
            <AssetLifecycleTimeline events={asset.lifecycleEvents} />
          </div>
        )}
      </div>
    </div>
  );
}