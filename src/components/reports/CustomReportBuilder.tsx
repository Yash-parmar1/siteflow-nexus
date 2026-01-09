import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText,
  Download,
  Eye,
  Save,
  Trash2,
  Plus,
  Filter,
  Calendar,
  Building,
  MapPin,
  Box,
  Users,
  IndianRupee,
  Wrench,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { mockProjects, mockSites } from "@/data/mockData";

interface ReportField {
  id: string;
  name: string;
  category: string;
  type: "text" | "number" | "date" | "currency" | "status";
}

interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

const availableFields: ReportField[] = [
  // Site fields
  { id: "site_name", name: "Site Name", category: "Sites", type: "text" },
  { id: "site_location", name: "Location", category: "Sites", type: "text" },
  { id: "site_stage", name: "Stage", category: "Sites", type: "status" },
  { id: "site_progress", name: "Progress %", category: "Sites", type: "number" },
  { id: "site_acs_planned", name: "ACS Planned", category: "Sites", type: "number" },
  { id: "site_acs_installed", name: "ACS Installed", category: "Sites", type: "number" },
  { id: "site_rent_start", name: "Rent Start Date", category: "Sites", type: "date" },
  
  // Project fields
  { id: "project_name", name: "Project Name", category: "Projects", type: "text" },
  { id: "project_client", name: "Client Name", category: "Projects", type: "text" },
  { id: "project_status", name: "Project Status", category: "Projects", type: "status" },
  { id: "subproject_name", name: "Subproject Name", category: "Projects", type: "text" },
  
  // Financial fields
  { id: "config_rent", name: "Monthly Rent", category: "Finance", type: "currency" },
  { id: "config_tenure", name: "Tenure (Months)", category: "Finance", type: "number" },
  { id: "total_revenue", name: "Total Revenue", category: "Finance", type: "currency" },
  { id: "outstanding", name: "Outstanding Amount", category: "Finance", type: "currency" },
  
  // ACS fields
  { id: "acs_serial", name: "Serial Number", category: "Assets", type: "text" },
  { id: "acs_model", name: "Model", category: "Assets", type: "text" },
  { id: "acs_status", name: "ACS Status", category: "Assets", type: "status" },
  { id: "acs_install_date", name: "Install Date", category: "Assets", type: "date" },
  { id: "acs_warranty_expiry", name: "Warranty Expiry", category: "Assets", type: "date" },
  
  // Maintenance fields
  { id: "open_tickets", name: "Open Tickets", category: "Maintenance", type: "number" },
  { id: "last_maintenance", name: "Last Maintenance", category: "Maintenance", type: "date" },
  { id: "next_maintenance", name: "Next Maintenance", category: "Maintenance", type: "date" },
  
  // Installation fields
  { id: "install_status", name: "Installation Status", category: "Installations", type: "status" },
  { id: "installer", name: "Installer", category: "Installations", type: "text" },
  { id: "eta", name: "ETA", category: "Installations", type: "date" },
];

const operators = {
  text: [
    { value: "equals", label: "Equals" },
    { value: "contains", label: "Contains" },
    { value: "starts_with", label: "Starts with" },
    { value: "ends_with", label: "Ends with" },
  ],
  number: [
    { value: "equals", label: "Equals" },
    { value: "greater_than", label: "Greater than" },
    { value: "less_than", label: "Less than" },
    { value: "between", label: "Between" },
  ],
  date: [
    { value: "equals", label: "On" },
    { value: "before", label: "Before" },
    { value: "after", label: "After" },
    { value: "between", label: "Between" },
  ],
  currency: [
    { value: "equals", label: "Equals" },
    { value: "greater_than", label: "Greater than" },
    { value: "less_than", label: "Less than" },
  ],
  status: [
    { value: "equals", label: "Is" },
    { value: "not_equals", label: "Is not" },
  ],
};

const categoryIcons: Record<string, React.ReactNode> = {
  Sites: <MapPin className="w-4 h-4" />,
  Projects: <Building className="w-4 h-4" />,
  Finance: <IndianRupee className="w-4 h-4" />,
  Assets: <Box className="w-4 h-4" />,
  Maintenance: <Wrench className="w-4 h-4" />,
  Installations: <Truck className="w-4 h-4" />,
};

interface CustomReportBuilderProps {
  onClose?: () => void;
}

export function CustomReportBuilder({ onClose }: CustomReportBuilderProps) {
  const [reportName, setReportName] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [groupBy, setGroupBy] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isGenerating, setIsGenerating] = useState(false);

  const categories = [...new Set(availableFields.map(f => f.category))];

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const addFilter = () => {
    setFilters([...filters, { field: "", operator: "", value: "" }]);
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    setFilters(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const getFieldById = (id: string) => availableFields.find(f => f.id === id);

  const handleGenerate = async (format: "preview" | "excel" | "pdf") => {
    if (!reportName.trim()) {
      toast.error("Please enter a report name");
      return;
    }
    if (selectedFields.length === 0) {
      toast.error("Please select at least one field");
      return;
    }

    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsGenerating(false);

    if (format === "preview") {
      toast.success("Report preview generated");
    } else {
      toast.success(`Report exported as ${format.toUpperCase()}`);
    }
  };

  const handleSaveTemplate = () => {
    if (!reportName.trim()) {
      toast.error("Please enter a report name");
      return;
    }
    toast.success("Report template saved");
  };

  return (
    <div className="space-y-6">
      {/* Report Name */}
      <div className="space-y-2">
        <Label htmlFor="reportName">Report Name</Label>
        <Input
          id="reportName"
          placeholder="e.g., Monthly Site Performance Summary"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
        />
      </div>

      {/* Date Range */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Date Range</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Select Fields</CardTitle>
          <CardDescription>Choose the data columns to include in your report</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="multiple" className="w-full">
            {categories.map((category) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="text-sm hover:no-underline">
                  <div className="flex items-center gap-2">
                    {categoryIcons[category]}
                    <span>{category}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {selectedFields.filter(f => getFieldById(f)?.category === category).length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {availableFields
                      .filter(f => f.category === category)
                      .map((field) => (
                        <div key={field.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={field.id}
                            checked={selectedFields.includes(field.id)}
                            onCheckedChange={() => toggleField(field.id)}
                          />
                          <Label htmlFor={field.id} className="text-sm font-normal cursor-pointer">
                            {field.name}
                          </Label>
                        </div>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {selectedFields.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedFields.map((fieldId) => {
                const field = getFieldById(fieldId);
                return field ? (
                  <Badge key={fieldId} variant="secondary" className="gap-1">
                    {field.name}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => toggleField(fieldId)}
                    />
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm">Filters</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={addFilter}>
              <Plus className="w-4 h-4" />
              Add Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {filters.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No filters applied. Click "Add Filter" to narrow your results.
            </p>
          ) : (
            <div className="space-y-3">
              {filters.map((filter, index) => {
                const field = getFieldById(filter.field);
                const fieldOperators = field ? operators[field.type] : [];
                return (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={filter.field}
                      onValueChange={(v) => updateFilter(index, { field: v, operator: "", value: "" })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filter.operator}
                      onValueChange={(v) => updateFilter(index, { operator: v })}
                      disabled={!filter.field}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldOperators.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Value"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                      disabled={!filter.operator}
                      className="flex-1"
                    />

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFilter(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group & Sort */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Group & Sort</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Group By</Label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {selectedFields.map((fieldId) => {
                    const field = getFieldById(fieldId);
                    return field ? (
                      <SelectItem key={fieldId} value={fieldId}>
                        {field.name}
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {selectedFields.map((fieldId) => {
                    const field = getFieldById(fieldId);
                    return field ? (
                      <SelectItem key={fieldId} value={fieldId}>
                        {field.name}
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Order</Label>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={handleSaveTemplate}>
          <Save className="w-4 h-4" />
          Save Template
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleGenerate("preview")}
            disabled={isGenerating}
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => handleGenerate("excel")}
            disabled={isGenerating}
          >
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
          <Button
            onClick={() => handleGenerate("pdf")}
            disabled={isGenerating}
          >
            <FileText className="w-4 h-4" />
            {isGenerating ? "Generating..." : "Generate PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
