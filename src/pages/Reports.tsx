import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Download,
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Clock,
  RefreshCw,
  Eye,
  Share2,
  ArrowUpRight,
  ArrowDownRight,
  Wand2,
} from "lucide-react";
import { CustomReportBuilder } from "@/components/reports/CustomReportBuilder";
import { SavedReportTemplates } from "@/components/reports/SavedReportTemplates";

// Mock data for reports
const reportTemplates = [
  {
    id: "RPT-001",
    name: "Site Performance Summary",
    description: "Overview of all sites with progress, delays, and key metrics",
    category: "Operations",
    lastRun: "2 hours ago",
    frequency: "Daily",
    icon: BarChart3,
  },
  {
    id: "RPT-002",
    name: "ACS Unit Status Report",
    description: "Current status of all ACS units across sites",
    category: "Assets",
    lastRun: "1 day ago",
    frequency: "Weekly",
    icon: PieChart,
  },
  {
    id: "RPT-003",
    name: "Installation Progress Report",
    description: "Track shipments, installations, and pending work",
    category: "Operations",
    lastRun: "5 hours ago",
    frequency: "Daily",
    icon: TrendingUp,
  },
  {
    id: "RPT-004",
    name: "Maintenance Summary",
    description: "Open tickets, resolution times, and technician performance",
    category: "Maintenance",
    lastRun: "3 hours ago",
    frequency: "Daily",
    icon: FileText,
  },
  {
    id: "RPT-005",
    name: "Revenue & Collections",
    description: "Monthly revenue, outstanding payments, and forecasts",
    category: "Finance",
    lastRun: "1 day ago",
    frequency: "Monthly",
    icon: TrendingUp,
  },
  {
    id: "RPT-006",
    name: "Vendor Performance",
    description: "Vendor ratings, job completion, and response times",
    category: "Operations",
    lastRun: "1 week ago",
    frequency: "Monthly",
    icon: BarChart3,
  },
];

const recentReports = [
  {
    id: "GEN-001",
    name: "Site Performance Summary - Dec 2024",
    generatedAt: "Dec 26, 2024 10:30 AM",
    generatedBy: "System",
    size: "2.4 MB",
    format: "PDF",
  },
  {
    id: "GEN-002",
    name: "ACS Unit Status Report - Week 52",
    generatedAt: "Dec 25, 2024 08:00 AM",
    generatedBy: "Raj Kumar",
    size: "1.8 MB",
    format: "Excel",
  },
  {
    id: "GEN-003",
    name: "Revenue & Collections - Nov 2024",
    generatedAt: "Dec 24, 2024 02:15 PM",
    generatedBy: "Finance Team",
    size: "3.2 MB",
    format: "PDF",
  },
  {
    id: "GEN-004",
    name: "Installation Progress Report",
    generatedAt: "Dec 24, 2024 09:00 AM",
    generatedBy: "System",
    size: "1.1 MB",
    format: "PDF",
  },
];

const quickStats = [
  { label: "Reports Generated", value: "156", change: "+12%", positive: true },
  { label: "Scheduled Reports", value: "8", change: "Active", positive: true },
  { label: "Avg Generation Time", value: "2.3s", change: "-0.5s", positive: true },
  { label: "Failed Reports", value: "2", change: "This Month", positive: false },
];

const categoryColors: Record<string, string> = {
  Operations: "bg-primary/10 text-primary",
  Assets: "bg-[hsl(var(--status-info)/0.15)] text-[hsl(var(--status-info))]",
  Maintenance: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]",
  Finance: "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]",
};

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  const filteredTemplates = reportTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "Operations", "Assets", "Maintenance", "Finance"];

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate and manage operational reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="default">
            <Calendar className="w-4 h-4" />
            Schedule
          </Button>
          <Button size="default" onClick={() => setShowCustomBuilder(true)}>
            <Wand2 className="w-4 h-4" />
            Custom Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="data-card">
            <CardContent className="p-4">
              <p className="metric-label mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <p className="metric-value">{stat.value}</p>
                <span className={`text-xs flex items-center gap-0.5 ${stat.positive ? "text-[hsl(var(--status-success))]" : "text-[hsl(var(--status-error))]"}`}>
                  {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
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
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

          <div className="flex gap-2">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] bg-secondary/50">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Report Templates */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTemplates.map((template, index) => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.id}
                  className="data-card cursor-pointer group animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <Badge className={`${categoryColors[template.category]} border-0`}>
                        {template.category}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {template.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last run: {template.lastRun}
                      </div>
                      <div className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        {template.frequency}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <FileText className="w-4 h-4" />
                        Generate
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Saved Templates Tab */}
        <TabsContent value="saved">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">My Custom Templates</CardTitle>
              <CardDescription>Your saved custom report configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <SavedReportTemplates onEdit={() => setShowCustomBuilder(true)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generated Reports */}
        <TabsContent value="generated">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Reports</CardTitle>
              <CardDescription>Download or share previously generated reports</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentReports.map((report, index) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-error)/0.1)] flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[hsl(var(--status-error))]" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{report.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{report.generatedAt}</span>
                          <span>•</span>
                          <span>By {report.generatedBy}</span>
                          <span>•</span>
                          <span>{report.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{report.format}</Badge>
                      <Button variant="ghost" size="icon-sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Reports */}
        <TabsContent value="scheduled">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Scheduled Reports</CardTitle>
                  <CardDescription>Automated report generation schedules</CardDescription>
                </div>
                <Button size="sm">
                  <Calendar className="w-4 h-4" />
                  New Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportTemplates.slice(0, 4).map((template, index) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/60 hover:border-border transition-colors animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full bg-[hsl(var(--status-success))]`} />
                      <div>
                        <p className="font-medium text-foreground">{template.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {template.frequency} at 8:00 AM • Next: Tomorrow
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>3 recipients</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Custom Report Builder Dialog */}
      <Dialog open={showCustomBuilder} onOpenChange={setShowCustomBuilder}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Custom Report Builder</DialogTitle>
          </DialogHeader>
          <CustomReportBuilder onClose={() => setShowCustomBuilder(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
