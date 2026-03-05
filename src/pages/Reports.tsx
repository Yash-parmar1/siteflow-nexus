import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, Download, FileText, BarChart3, PieChart, TrendingUp,
  Calendar, Clock, Eye, Wand2, Play, Trash2, X, Plus, Filter,
  Box, MapPin, IndianRupee, Wrench, Truck, Building, Loader2,
  CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Save,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { useAppData } from "@/context/AppDataContext";
import * as XLSX from "xlsx";

// ── Report field definitions (map to real data fields) ────────────
interface ReportField {
  id: string;
  name: string;
  category: string;
  type: "text" | "number" | "date" | "currency" | "status" | "boolean";
  getValue: (item: any) => any;
}

const siteFields: ReportField[] = [
  { id: "site_code", name: "Site Code", category: "Sites", type: "text", getValue: (s) => s.siteCode },
  { id: "site_name", name: "Site Name", category: "Sites", type: "text", getValue: (s) => s.name },
  { id: "site_client", name: "Client", category: "Sites", type: "text", getValue: (s) => s.clientName },
  { id: "site_subproject", name: "Subproject", category: "Sites", type: "text", getValue: (s) => s.subprojectName },
  { id: "site_project", name: "Project", category: "Sites", type: "text", getValue: (s) => s.projectName },
  { id: "site_stage", name: "Stage", category: "Sites", type: "status", getValue: (s) => s.currentStage },
  { id: "site_progress", name: "Progress %", category: "Sites", type: "number", getValue: (s) => s.progress },
  { id: "site_status", name: "Status", category: "Sites", type: "status", getValue: (s) => s.status },
  { id: "site_type", name: "Site Type", category: "Sites", type: "text", getValue: (s) => s.siteType },
  { id: "site_region", name: "Region Type", category: "Sites", type: "text", getValue: (s) => s.regionType },
  { id: "site_acs_planned", name: "ACS Planned", category: "Sites", type: "number", getValue: (s) => s.plannedAcsCount ?? s.acsPlanned ?? 0 },
  { id: "site_acs_installed", name: "ACS Installed", category: "Sites", type: "number", getValue: (s) => s.acsInstalled ?? 0 },
  { id: "site_has_delay", name: "Has Delay", category: "Sites", type: "boolean", getValue: (s) => s.hasDelay },
  { id: "site_delay_days", name: "Delay Days", category: "Sites", type: "number", getValue: (s) => s.delayDays ?? 0 },
  { id: "site_expected_live", name: "Expected Live Date", category: "Sites", type: "date", getValue: (s) => s.expectedLiveDate },
  { id: "site_actual_live", name: "Actual Live Date", category: "Sites", type: "date", getValue: (s) => s.actualLiveDate },
  { id: "site_rent", name: "Configured Rent", category: "Sites", type: "currency", getValue: (s) => s.configuredRent ?? 0 },
  { id: "site_tenure", name: "Configured Tenure", category: "Sites", type: "number", getValue: (s) => s.configuredTenure ?? 0 },
  { id: "site_created", name: "Created At", category: "Sites", type: "date", getValue: (s) => s.createdAt },
];

const assetFields: ReportField[] = [
  { id: "asset_serial", name: "Serial Number", category: "Assets", type: "text", getValue: (a) => a.serialNumber },
  { id: "asset_model", name: "Model", category: "Assets", type: "text", getValue: (a) => a.model },
  { id: "asset_manufacturer", name: "Manufacturer", category: "Assets", type: "text", getValue: (a) => a.manufacturer },
  { id: "asset_type", name: "Type", category: "Assets", type: "text", getValue: (a) => a.indoorAc ? "Indoor" : "Outdoor" },
  { id: "asset_size", name: "Size (Ton)", category: "Assets", type: "number", getValue: (a) => a.sizeInTon },
  { id: "asset_status", name: "Status", category: "Assets", type: "status", getValue: (a) => a.status },
  { id: "asset_site", name: "Site", category: "Assets", type: "text", getValue: (a) => a.siteName },
  { id: "asset_project", name: "Project", category: "Assets", type: "text", getValue: (a) => a.projectName },
  { id: "asset_subproject", name: "Subproject", category: "Assets", type: "text", getValue: (a) => a.subprojectName },
  { id: "asset_location", name: "Location in Site", category: "Assets", type: "text", getValue: (a) => a.locationInSite },
  { id: "asset_rent", name: "Monthly Rent", category: "Assets", type: "currency", getValue: (a) => a.monthlyRent ?? 0 },
  { id: "asset_warranty", name: "Warranty Expiry", category: "Assets", type: "date", getValue: (a) => a.warrantyExpiryDate },
  { id: "asset_next_maint", name: "Next Maintenance", category: "Assets", type: "date", getValue: (a) => a.nextMaintenanceDate },
  { id: "asset_last_maint", name: "Last Maintenance", category: "Assets", type: "date", getValue: (a) => a.lastMaintenanceDate },
];

const installationFields: ReportField[] = [
  { id: "inst_booking", name: "Booking ID", category: "Installations", type: "text", getValue: (i) => i.bookingId },
  { id: "inst_site", name: "Site", category: "Installations", type: "text", getValue: (i) => i.siteName },
  { id: "inst_asset", name: "AC Asset Serial", category: "Installations", type: "text", getValue: (i) => i.acAssetSerial },
  { id: "inst_shipment", name: "Shipment Status", category: "Installations", type: "status", getValue: (i) => i.shipmentStatus },
  { id: "inst_status", name: "Installation Status", category: "Installations", type: "status", getValue: (i) => i.status },
  { id: "inst_eta", name: "ETA", category: "Installations", type: "date", getValue: (i) => i.eta },
  { id: "inst_date", name: "Installation Date", category: "Installations", type: "date", getValue: (i) => i.installationDate },
  { id: "inst_receiver", name: "Receiver Name", category: "Installations", type: "text", getValue: (i) => i.receiverName },
  { id: "inst_created", name: "Created At", category: "Installations", type: "date", getValue: (i) => i.createdAt },
];

const ticketFields: ReportField[] = [
  { id: "ticket_title", name: "Title", category: "Maintenance", type: "text", getValue: (t) => t.title },
  { id: "ticket_site", name: "Site", category: "Maintenance", type: "text", getValue: (t) => t.siteName },
  { id: "ticket_asset", name: "AC Asset Serial", category: "Maintenance", type: "text", getValue: (t) => t.acAssetSerial },
  { id: "ticket_priority", name: "Priority", category: "Maintenance", type: "status", getValue: (t) => t.priority },
  { id: "ticket_status", name: "Status", category: "Maintenance", type: "status", getValue: (t) => t.status },
  { id: "ticket_assigned", name: "Assigned To", category: "Maintenance", type: "text", getValue: (t) => t.assignedTo },
  { id: "ticket_charge", name: "Visiting Charge", category: "Maintenance", type: "currency", getValue: (t) => t.visitingCharge ?? 0 },
  { id: "ticket_created", name: "Created At", category: "Maintenance", type: "date", getValue: (t) => t.createdAt },
  { id: "ticket_closed", name: "Closed At", category: "Maintenance", type: "date", getValue: (t) => t.closedAt },
];

const financeFields: ReportField[] = [
  { id: "tx_direction", name: "Direction", category: "Finance", type: "text", getValue: (t) => t.direction },
  { id: "tx_type", name: "Type", category: "Finance", type: "text", getValue: (t) => t.type },
  { id: "tx_invoice", name: "Invoice Ref", category: "Finance", type: "text", getValue: (t) => t.invoiceRef },
  { id: "tx_site_code", name: "Site Code", category: "Finance", type: "text", getValue: (t) => t.siteCode },
  { id: "tx_site_name", name: "Site Name", category: "Finance", type: "text", getValue: (t) => t.siteName },
  { id: "tx_amount", name: "Amount", category: "Finance", type: "currency", getValue: (t) => t.amount ?? 0 },
  { id: "tx_cgst", name: "CGST", category: "Finance", type: "currency", getValue: (t) => t.cgst ?? 0 },
  { id: "tx_sgst", name: "SGST", category: "Finance", type: "currency", getValue: (t) => t.sgst ?? 0 },
  { id: "tx_total", name: "Total with GST", category: "Finance", type: "currency", getValue: (t) => t.totalWithGst ?? 0 },
  { id: "tx_payment_status", name: "Payment Status", category: "Finance", type: "status", getValue: (t) => t.paymentStatus },
  { id: "tx_days_overdue", name: "Days Overdue", category: "Finance", type: "number", getValue: (t) => t.daysOverdue ?? 0 },
  { id: "tx_date", name: "Date", category: "Finance", type: "date", getValue: (t) => t.date },
];

const allFields = [...siteFields, ...assetFields, ...installationFields, ...ticketFields, ...financeFields];

// ── Filter operators ───────────────────────────────────────────
const operatorsByType: Record<string, { value: string; label: string }[]> = {
  text: [
    { value: "contains", label: "Contains" },
    { value: "equals", label: "Equals" },
    { value: "starts_with", label: "Starts with" },
  ],
  number: [
    { value: "equals", label: "=" },
    { value: "gt", label: ">" },
    { value: "lt", label: "<" },
    { value: "gte", label: ">=" },
  ],
  currency: [
    { value: "gt", label: ">" },
    { value: "lt", label: "<" },
    { value: "equals", label: "=" },
  ],
  date: [
    { value: "after", label: "After" },
    { value: "before", label: "Before" },
  ],
  status: [
    { value: "equals", label: "Is" },
    { value: "not_equals", label: "Is not" },
  ],
  boolean: [
    { value: "equals", label: "Is" },
  ],
};

// ── Preset report templates ────────────────────────────────────
interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  dataSource: string;
  fields: string[];
  defaultFilters?: { field: string; operator: string; value: string }[];
}

const presetTemplates: TemplateConfig[] = [
  {
    id: "site-performance",
    name: "Site Performance Summary",
    description: "All sites with progress, delays, stage, and ACS unit counts",
    category: "Operations",
    icon: BarChart3,
    dataSource: "sites",
    fields: ["site_code", "site_name", "site_client", "site_subproject", "site_stage", "site_progress", "site_acs_planned", "site_acs_installed", "site_has_delay", "site_delay_days", "site_expected_live", "site_actual_live"],
  },
  {
    id: "asset-status",
    name: "ACS Unit Status Report",
    description: "Complete asset inventory with status, rent, and maintenance info",
    category: "Assets",
    icon: Box,
    dataSource: "assets",
    fields: ["asset_serial", "asset_model", "asset_manufacturer", "asset_type", "asset_size", "asset_status", "asset_site", "asset_subproject", "asset_rent", "asset_warranty", "asset_next_maint"],
  },
  {
    id: "installation-progress",
    name: "Installation Progress Report",
    description: "Track all shipments and installation completions",
    category: "Operations",
    icon: Truck,
    dataSource: "installations",
    fields: ["inst_booking", "inst_site", "inst_asset", "inst_shipment", "inst_status", "inst_eta", "inst_date", "inst_receiver", "inst_created"],
  },
  {
    id: "maintenance-summary",
    name: "Maintenance Tickets",
    description: "Open and closed tickets with resolution data",
    category: "Maintenance",
    icon: Wrench,
    dataSource: "maintenanceTickets",
    fields: ["ticket_title", "ticket_site", "ticket_asset", "ticket_priority", "ticket_status", "ticket_assigned", "ticket_charge", "ticket_created", "ticket_closed"],
  },
  {
    id: "revenue-collections",
    name: "Revenue & Collections",
    description: "All financial transactions with payment status and overdue tracking",
    category: "Finance",
    icon: TrendingUp,
    dataSource: "financialTransactions",
    fields: ["tx_direction", "tx_type", "tx_invoice", "tx_site_code", "tx_site_name", "tx_amount", "tx_cgst", "tx_sgst", "tx_total", "tx_payment_status", "tx_days_overdue", "tx_date"],
  },
  {
    id: "overdue-report",
    name: "Overdue Payments Report",
    description: "Outstanding and overdue transactions requiring attention",
    category: "Finance",
    icon: AlertCircle,
    dataSource: "financialTransactions",
    fields: ["tx_invoice", "tx_site_code", "tx_site_name", "tx_amount", "tx_total", "tx_payment_status", "tx_days_overdue", "tx_date"],
    defaultFilters: [{ field: "tx_days_overdue", operator: "gt", value: "0" }],
  },
];

// ── Saved report entry ──────────────────────────────────────────
interface GeneratedReport {
  id: string;
  name: string;
  generatedAt: string;
  rowCount: number;
  fields: string[];
  dataSource: string;
  filters: { field: string; operator: string; value: string }[];
}

// ── Helper: format cell value for display ──────────────────────
function formatValue(val: any, type: string): string {
  if (val === null || val === undefined) return "-";
  if (type === "currency") return `₹${Number(val).toLocaleString("en-IN")}`;
  if (type === "boolean") return val ? "Yes" : "No";
  if (type === "date" && val) {
    try { return new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return String(val); }
  }
  return String(val);
}

// ── Helper: apply filter to a value ─────────────────────────────
function matchesFilter(val: any, operator: string, filterValue: string, type: string): boolean {
  if (!filterValue) return true;
  const strVal = String(val ?? "").toLowerCase();
  const fv = filterValue.toLowerCase();
  switch (operator) {
    case "contains": return strVal.includes(fv);
    case "equals": return type === "number" || type === "currency" ? Number(val) === Number(filterValue) : strVal === fv;
    case "not_equals": return strVal !== fv;
    case "starts_with": return strVal.startsWith(fv);
    case "gt": return Number(val) > Number(filterValue);
    case "lt": return Number(val) < Number(filterValue);
    case "gte": return Number(val) >= Number(filterValue);
    case "after": return new Date(val) > new Date(filterValue);
    case "before": return new Date(val) < new Date(filterValue);
    default: return true;
  }
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Reports() {
  const { data: appData } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Custom report builder state
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderReportName, setBuilderReportName] = useState("");
  const [builderDataSource, setBuilderDataSource] = useState<string>("");
  const [builderFields, setBuilderFields] = useState<string[]>([]);
  const [builderFilters, setBuilderFilters] = useState<{ field: string; operator: string; value: string }[]>([]);
  const [builderSortBy, setBuilderSortBy] = useState("");
  const [builderSortOrder, setBuilderSortOrder] = useState<"asc" | "desc">("asc");

  // Preview state
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: any[][]; fields: ReportField[] } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Generated reports history (localStorage)
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>(() => {
    try { return JSON.parse(localStorage.getItem("nexgen_reports") || "[]"); }
    catch { return []; }
  });
  const saveReports = (reports: GeneratedReport[]) => {
    setGeneratedReports(reports);
    localStorage.setItem("nexgen_reports", JSON.stringify(reports));
  };

  // Saved custom templates (localStorage)
  const [savedTemplates, setSavedTemplates] = useState<{
    id: string; name: string; dataSource: string; fields: string[];
    filters: { field: string; operator: string; value: string }[];
    sortBy: string; sortOrder: "asc" | "desc"; createdAt: string;
  }[]>(() => {
    try { return JSON.parse(localStorage.getItem("nexgen_report_templates") || "[]"); }
    catch { return []; }
  });
  const saveTemplates = (templates: typeof savedTemplates) => {
    setSavedTemplates(templates);
    localStorage.setItem("nexgen_report_templates", JSON.stringify(templates));
  };

  // ── Data source selection ─────────────────────────────────────
  const getDataArray = useCallback((source: string) => {
    if (!appData) return [];
    switch (source) {
      case "sites": return appData.sites;
      case "assets": return appData.assets;
      case "installations": return appData.installations;
      case "maintenanceTickets": return appData.maintenanceTickets;
      case "financialTransactions": return appData.financialTransactions;
      default: return [];
    }
  }, [appData]);

  const getFieldsForSource = (source: string): ReportField[] => {
    switch (source) {
      case "sites": return siteFields;
      case "assets": return assetFields;
      case "installations": return installationFields;
      case "maintenanceTickets": return ticketFields;
      case "financialTransactions": return financeFields;
      default: return [];
    }
  };

  const dataSourceLabel = (source: string) => {
    switch (source) {
      case "sites": return "Sites";
      case "assets": return "Assets";
      case "installations": return "Installations";
      case "maintenanceTickets": return "Maintenance Tickets";
      case "financialTransactions": return "Financial Transactions";
      default: return source;
    }
  };

  // ── Generate report logic ─────────────────────────────────────
  const generateReport = useCallback((
    dataSource: string,
    selectedFieldIds: string[],
    filters: { field: string; operator: string; value: string }[],
    sortBy: string,
    sortOrder: "asc" | "desc",
  ) => {
    const rawData = getDataArray(dataSource);
    const fields = selectedFieldIds.map(id => allFields.find(f => f.id === id)!).filter(Boolean);

    // Apply filters
    let filtered = rawData.filter(item => {
      return filters.every(f => {
        const field = allFields.find(af => af.id === f.field);
        if (!field) return true;
        return matchesFilter(field.getValue(item), f.operator, f.value, field.type);
      });
    });

    // Apply sort
    if (sortBy) {
      const sortField = allFields.find(f => f.id === sortBy);
      if (sortField) {
        filtered = [...filtered].sort((a, b) => {
          const va = sortField.getValue(a);
          const vb = sortField.getValue(b);
          const cmp = typeof va === "number" && typeof vb === "number"
            ? va - vb
            : String(va ?? "").localeCompare(String(vb ?? ""));
          return sortOrder === "asc" ? cmp : -cmp;
        });
      }
    }

    // Build rows
    const headers = fields.map(f => f.name);
    const rows = filtered.map(item => fields.map(f => f.getValue(item)));
    return { headers, rows, fields };
  }, [getDataArray]);

  // ── Export to Excel ──────────────────────────────────────────
  const exportToExcel = useCallback((
    reportName: string,
    dataSource: string,
    selectedFieldIds: string[],
    filters: { field: string; operator: string; value: string }[],
    sortBy: string,
    sortOrder: "asc" | "desc",
  ) => {
    const { headers, rows, fields } = generateReport(dataSource, selectedFieldIds, filters, sortBy, sortOrder);

    if (rows.length === 0) {
      toast.error("No data matches the selected criteria");
      return;
    }

    // Format values for Excel
    const formattedRows = rows.map(row =>
      row.map((val, i) => {
        const type = fields[i]?.type;
        if (type === "boolean") return val ? "Yes" : "No";
        if (type === "date" && val) {
          try { return new Date(val).toLocaleDateString("en-IN"); }
          catch { return val; }
        }
        return val ?? "";
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...formattedRows]);

    // Auto-width columns
    const colWidths = headers.map((h, i) => {
      const maxLen = Math.max(h.length, ...formattedRows.map(r => String(r[i] ?? "").length));
      return { wch: Math.min(maxLen + 2, 40) };
    });
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, reportName.slice(0, 31));
    XLSX.writeFile(wb, `${reportName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`);

    // Save to history
    const newReport: GeneratedReport = {
      id: `GEN-${Date.now()}`,
      name: reportName,
      generatedAt: new Date().toISOString(),
      rowCount: rows.length,
      fields: selectedFieldIds,
      dataSource,
      filters,
    };
    saveReports([newReport, ...generatedReports].slice(0, 50));

    toast.success(`Report exported: ${rows.length} rows`);
  }, [generateReport, generatedReports]);

  // ── Preview report ──────────────────────────────────────────
  const previewReport = useCallback((
    dataSource: string,
    selectedFieldIds: string[],
    filters: { field: string; operator: string; value: string }[],
    sortBy: string,
    sortOrder: "asc" | "desc",
  ) => {
    const result = generateReport(dataSource, selectedFieldIds, filters, sortBy, sortOrder);
    setPreviewData(result);
    setShowPreview(true);
  }, [generateReport]);

  // ── Open builder with a template ──────────────────────────────
  const openFromTemplate = (template: TemplateConfig) => {
    setBuilderReportName(template.name);
    setBuilderDataSource(template.dataSource);
    setBuilderFields(template.fields);
    setBuilderFilters(template.defaultFilters ?? []);
    setBuilderSortBy("");
    setBuilderSortOrder("asc");
    setShowBuilder(true);
  };

  // ── Quick generate from template ──────────────────────────────
  const quickGenerate = (template: TemplateConfig) => {
    exportToExcel(template.name, template.dataSource, template.fields, template.defaultFilters ?? [], "", "asc");
  };

  // ── Builder helpers ──────────────────────────────────────────
  const toggleField = (fieldId: string) => {
    setBuilderFields(prev => prev.includes(fieldId) ? prev.filter(f => f !== fieldId) : [...prev, fieldId]);
  };

  const builderAvailableFields = getFieldsForSource(builderDataSource);

  // ── Save template ────────────────────────────────────────────
  const saveCurrentAsTemplate = () => {
    if (!builderReportName.trim() || !builderDataSource || builderFields.length === 0) return;
    const tmpl = {
      id: `TMPL-${Date.now()}`,
      name: builderReportName,
      dataSource: builderDataSource,
      fields: builderFields,
      filters: builderFilters,
      sortBy: builderSortBy,
      sortOrder: builderSortOrder,
      createdAt: new Date().toISOString(),
    };
    saveTemplates([tmpl, ...savedTemplates]);
    toast.success("Template saved");
  };

  // ── Filter templates ──────────────────────────────────────────
  const filteredTemplates = presetTemplates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === "all" || t.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // ── KPI stats from live data ──────────────────────────────────
  const totalSites = appData?.sites.length ?? 0;
  const totalAssets = appData?.assets.length ?? 0;
  const totalInstallations = appData?.installations.length ?? 0;
  const totalTickets = appData?.maintenanceTickets.length ?? 0;

  // ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Generate custom reports from live data</p>
        </div>
        <Button size="default" onClick={() => { setBuilderReportName(""); setBuilderDataSource(""); setBuilderFields([]); setBuilderFilters([]); setShowBuilder(true); }}>
          <Wand2 className="w-4 h-4" />
          Custom Report
        </Button>
      </div>

      {/* Live Data Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Sites", value: totalSites, icon: MapPin, color: "text-primary" },
          { label: "ACS Units", value: totalAssets, icon: Box, color: "text-[hsl(var(--status-info))]" },
          { label: "Installations", value: totalInstallations, icon: Truck, color: "text-[hsl(var(--status-warning))]" },
          { label: "Tickets", value: totalTickets, icon: Wrench, color: "text-[hsl(var(--status-error))]" },
          { label: "Transactions", value: appData?.financialTransactions.length ?? 0, icon: IndianRupee, color: "text-[hsl(var(--status-success))]" },
        ].map((stat, i) => (
          <Card key={i} className="data-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="metric-value">{stat.value}</p>
                  <p className="metric-label">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="templates">Report Templates</TabsTrigger>
            <TabsTrigger value="saved">My Templates</TabsTrigger>
            <TabsTrigger value="generated">Generated Reports</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="search" placeholder="Search reports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-[200px]" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] bg-secondary/50"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {["all", "Operations", "Assets", "Maintenance", "Finance"].map(c => (
                  <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ═══════════ TEMPLATES TAB ═══════════ */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTemplates.map((template, index) => {
              const Icon = template.icon;
              const dataLen = getDataArray(template.dataSource).length;
              return (
                <Card key={template.id} className="data-card group animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{template.fields.length} fields</Badge>
                        <Badge className="bg-primary/10 text-primary border-0 text-[10px]">{dataLen} rows</Badge>
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{template.description}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => quickGenerate(template)}>
                        <Download className="w-4 h-4" />Export Excel
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        previewReport(template.dataSource, template.fields, template.defaultFilters ?? [], "", "asc");
                      }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openFromTemplate(template)}>
                        <Filter className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══════════ SAVED TEMPLATES TAB ═══════════ */}
        <TabsContent value="saved">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">My Custom Templates</CardTitle>
              <CardDescription>Your saved custom report configurations</CardDescription>
            </CardHeader>
            <CardContent>
              {savedTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No saved templates yet</p>
                  <Button variant="outline" size="sm" onClick={() => { setBuilderReportName(""); setBuilderDataSource(""); setBuilderFields([]); setBuilderFilters([]); setShowBuilder(true); }}>
                    <Plus className="w-4 h-4" />Create Template
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedTemplates.map((tmpl) => (
                    <div key={tmpl.id} className="flex items-center justify-between p-4 rounded-lg border border-border/60 hover:border-border transition-colors">
                      <div>
                        <p className="font-medium text-foreground">{tmpl.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Badge variant="outline" className="text-[10px]">{dataSourceLabel(tmpl.dataSource)}</Badge>
                          <span>{tmpl.fields.length} fields</span>
                          {tmpl.filters.length > 0 && <span>• {tmpl.filters.length} filter{tmpl.filters.length > 1 ? "s" : ""}</span>}
                          <span>• {new Date(tmpl.createdAt).toLocaleDateString("en-IN")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => previewReport(tmpl.dataSource, tmpl.fields, tmpl.filters, tmpl.sortBy, tmpl.sortOrder)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => exportToExcel(tmpl.name, tmpl.dataSource, tmpl.fields, tmpl.filters, tmpl.sortBy, tmpl.sortOrder)}>
                          <Download className="w-4 h-4" />Export
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => saveTemplates(savedTemplates.filter(t => t.id !== tmpl.id))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ GENERATED REPORTS TAB ═══════════ */}
        <TabsContent value="generated">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Report History</CardTitle>
              <CardDescription>Previously generated reports (last 50)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {generatedReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No reports generated yet. Use a template or build a custom report.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {generatedReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-success)/0.1)] flex items-center justify-center">
                          <FileSpreadsheet className="w-5 h-5 text-[hsl(var(--status-success))]" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{report.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>{new Date(report.generatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                            <span>•</span>
                            <span>{report.rowCount} rows</span>
                            <span>•</span>
                            <span>{report.fields.length} fields</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => exportToExcel(report.name, report.dataSource, report.fields, report.filters, "", "asc")}>
                          <Download className="w-4 h-4" />Re-export
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => saveReports(generatedReports.filter(r => r.id !== report.id))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════════ CUSTOM REPORT BUILDER DIALOG ═══════════ */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Custom Report Builder</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Report Name */}
            <div className="space-y-2">
              <Label>Report Name</Label>
              <Input placeholder="e.g., Monthly Site Performance" value={builderReportName} onChange={(e) => setBuilderReportName(e.target.value)} />
            </div>

            {/* Data Source */}
            <div className="space-y-2">
              <Label>Data Source <span className="text-destructive">*</span></Label>
              <Select value={builderDataSource} onValueChange={(v) => { setBuilderDataSource(v); setBuilderFields([]); setBuilderFilters([]); setBuilderSortBy(""); }}>
                <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select data source" /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="sites">Sites ({appData?.sites.length ?? 0} records)</SelectItem>
                  <SelectItem value="assets">Assets ({appData?.assets.length ?? 0} records)</SelectItem>
                  <SelectItem value="installations">Installations ({appData?.installations.length ?? 0} records)</SelectItem>
                  <SelectItem value="maintenanceTickets">Maintenance Tickets ({appData?.maintenanceTickets.length ?? 0} records)</SelectItem>
                  <SelectItem value="financialTransactions">Financial Transactions ({appData?.financialTransactions.length ?? 0} records)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Field Selection */}
            {builderDataSource && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Select Fields ({builderFields.length} selected)</CardTitle>
                    <button type="button" onClick={() => setBuilderFields(builderFields.length === builderAvailableFields.length ? [] : builderAvailableFields.map(f => f.id))} className="text-xs text-primary hover:underline">
                      {builderFields.length === builderAvailableFields.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {builderAvailableFields.map(field => (
                      <div key={field.id} className="flex items-center space-x-2">
                        <Checkbox id={`builder-${field.id}`} checked={builderFields.includes(field.id)} onCheckedChange={() => toggleField(field.id)} />
                        <Label htmlFor={`builder-${field.id}`} className="text-sm font-normal cursor-pointer">{field.name}</Label>
                      </div>
                    ))}
                  </div>
                  {builderFields.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {builderFields.map(fId => {
                        const f = allFields.find(af => af.id === fId);
                        return f ? (
                          <Badge key={fId} variant="secondary" className="gap-1 text-xs">
                            {f.name}
                            <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => toggleField(fId)} />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            {builderDataSource && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><Filter className="w-4 h-4" />Filters</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setBuilderFilters([...builderFilters, { field: "", operator: "", value: "" }])}>
                      <Plus className="w-4 h-4" />Add Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {builderFilters.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">No filters applied — all records will be included</p>
                  ) : (
                    <div className="space-y-2">
                      {builderFilters.map((filter, index) => {
                        const field = allFields.find(f => f.id === filter.field);
                        const ops = field ? operatorsByType[field.type] || [] : [];
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <Select value={filter.field} onValueChange={(v) => { const updated = [...builderFilters]; updated[index] = { ...updated[index], field: v, operator: "", value: "" }; setBuilderFilters(updated); }}>
                              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select field" /></SelectTrigger>
                              <SelectContent className="bg-popover border-border">{builderAvailableFields.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={filter.operator} onValueChange={(v) => { const updated = [...builderFilters]; updated[index].operator = v; setBuilderFilters(updated); }} disabled={!filter.field}>
                              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Op" /></SelectTrigger>
                              <SelectContent className="bg-popover border-border">{ops.map(op => <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>)}</SelectContent>
                            </Select>
                            <Input placeholder="Value" value={filter.value} onChange={(e) => { const updated = [...builderFilters]; updated[index].value = e.target.value; setBuilderFilters(updated); }} disabled={!filter.operator} className="flex-1" />
                            <Button variant="ghost" size="icon-sm" onClick={() => setBuilderFilters(builderFilters.filter((_, i) => i !== index))} className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sort */}
            {builderDataSource && builderFields.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Sort By</Label>
                  <Select value={builderSortBy || "none"} onValueChange={(v) => setBuilderSortBy(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="none">None</SelectItem>
                      {builderFields.map(fId => { const f = allFields.find(af => af.id === fId); return f ? <SelectItem key={fId} value={fId}>{f.name}</SelectItem> : null; })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Order</Label>
                  <Select value={builderSortOrder} onValueChange={(v) => setBuilderSortOrder(v as "asc" | "desc")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="ghost" size="sm" disabled={!builderDataSource || builderFields.length === 0 || !builderReportName.trim()} onClick={saveCurrentAsTemplate}>
                <Save className="w-4 h-4" />Save as Template
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" disabled={!builderDataSource || builderFields.length === 0} onClick={() => previewReport(builderDataSource, builderFields, builderFilters, builderSortBy, builderSortOrder)}>
                  <Eye className="w-4 h-4" />Preview
                </Button>
                <Button disabled={!builderDataSource || builderFields.length === 0 || !builderReportName.trim()} onClick={() => {
                  exportToExcel(builderReportName, builderDataSource, builderFields, builderFilters, builderSortBy, builderSortOrder);
                  setShowBuilder(false);
                }}>
                  <Download className="w-4 h-4" />Export Excel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ PREVIEW DIALOG ═══════════ */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Report Preview ({previewData?.rows.length ?? 0} rows)</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border border-border/60 rounded-lg">
            {previewData && (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    {previewData.headers.map((h, i) => (
                      <TableHead key={i} className="whitespace-nowrap">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.rows.slice(0, 100).map((row, ri) => (
                    <TableRow key={ri} className="hover:bg-muted/50 border-border/50">
                      {row.map((cell, ci) => (
                        <TableCell key={ci} className="whitespace-nowrap text-xs">
                          {formatValue(cell, previewData.fields[ci]?.type || "text")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {previewData.rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={previewData.headers.length} className="text-center py-8 text-muted-foreground">No data matches the selected criteria</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
          {previewData && previewData.rows.length > 100 && (
            <p className="text-xs text-muted-foreground text-center mt-2">Showing first 100 of {previewData.rows.length} rows. Export for full data.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
