import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Play,
  Edit,
  Trash2,
  MoreHorizontal,
  Clock,
  Calendar,
  Copy,
  Download,
  Search,
  Star,
  StarOff,
} from "lucide-react";
import { toast } from "sonner";

interface SavedTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fieldsCount: number;
  filtersCount: number;
  lastRun: string;
  createdBy: string;
  createdAt: string;
  isFavorite: boolean;
  isScheduled: boolean;
  scheduleFrequency?: string;
}

const mockTemplates: SavedTemplate[] = [
  {
    id: "tpl-001",
    name: "Monthly Revenue by Project",
    description: "Revenue breakdown across all active projects with client details",
    category: "Finance",
    fieldsCount: 8,
    filtersCount: 2,
    lastRun: "2 hours ago",
    createdBy: "Raj Kumar",
    createdAt: "Dec 01, 2024",
    isFavorite: true,
    isScheduled: true,
    scheduleFrequency: "Monthly",
  },
  {
    id: "tpl-002",
    name: "Site Installation Progress",
    description: "Track installation status and progress across all sites",
    category: "Operations",
    fieldsCount: 12,
    filtersCount: 3,
    lastRun: "5 hours ago",
    createdBy: "Priya Singh",
    createdAt: "Nov 15, 2024",
    isFavorite: false,
    isScheduled: true,
    scheduleFrequency: "Weekly",
  },
  {
    id: "tpl-003",
    name: "ACS Maintenance Due",
    description: "List of ACS units with upcoming or overdue maintenance",
    category: "Maintenance",
    fieldsCount: 10,
    filtersCount: 1,
    lastRun: "1 day ago",
    createdBy: "Amit Patel",
    createdAt: "Nov 20, 2024",
    isFavorite: true,
    isScheduled: false,
  },
  {
    id: "tpl-004",
    name: "Client Outstanding Report",
    description: "Outstanding payments grouped by client with aging analysis",
    category: "Finance",
    fieldsCount: 6,
    filtersCount: 1,
    lastRun: "3 days ago",
    createdBy: "Sunita Reddy",
    createdAt: "Oct 10, 2024",
    isFavorite: false,
    isScheduled: false,
  },
  {
    id: "tpl-005",
    name: "Vendor Performance Summary",
    description: "Vendor ratings, job completion rates, and response times",
    category: "Operations",
    fieldsCount: 9,
    filtersCount: 2,
    lastRun: "1 week ago",
    createdBy: "Raj Kumar",
    createdAt: "Sep 05, 2024",
    isFavorite: false,
    isScheduled: true,
    scheduleFrequency: "Monthly",
  },
];

const categoryColors: Record<string, string> = {
  Finance: "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]",
  Operations: "bg-primary/10 text-primary",
  Maintenance: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]",
  Assets: "bg-[hsl(var(--status-info)/0.15)] text-[hsl(var(--status-info))]",
};

interface SavedReportTemplatesProps {
  onEdit?: (templateId: string) => void;
}

export function SavedReportTemplates({ onEdit }: SavedReportTemplatesProps) {
  const [templates, setTemplates] = useState(mockTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [runningId, setRunningId] = useState<string | null>(null);

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRun = async (template: SavedTemplate) => {
    setRunningId(template.id);
    await new Promise(r => setTimeout(r, 1500));
    setRunningId(null);
    toast.success(`Report "${template.name}" generated successfully`);
  };

  const handleToggleFavorite = (templateId: string) => {
    setTemplates(prev =>
      prev.map(t =>
        t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
      )
    );
  };

  const handleDuplicate = (template: SavedTemplate) => {
    const newTemplate: SavedTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toLocaleDateString(),
      isFavorite: false,
      isScheduled: false,
    };
    setTemplates(prev => [newTemplate, ...prev]);
    toast.success("Template duplicated");
  };

  const handleDelete = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success("Template deleted");
  };

  // Sort with favorites first
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search saved templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {sortedTemplates.map((template, index) => (
          <Card
            key={template.id}
            className="data-card animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => handleToggleFavorite(template.id)}
                      className="shrink-0"
                    >
                      {template.isFavorite ? (
                        <Star className="w-4 h-4 text-[hsl(var(--status-warning))] fill-current" />
                      ) : (
                        <StarOff className="w-4 h-4 text-muted-foreground hover:text-[hsl(var(--status-warning))]" />
                      )}
                    </button>
                    <h3 className="font-medium text-foreground truncate">{template.name}</h3>
                    <Badge className={`${categoryColors[template.category]} border-0 shrink-0`}>
                      {template.category}
                    </Badge>
                    {template.isScheduled && (
                      <Badge variant="outline" className="shrink-0">
                        <Calendar className="w-3 h-3 mr-1" />
                        {template.scheduleFrequency}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{template.fieldsCount} fields</span>
                    <span>{template.filtersCount} filters</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last run: {template.lastRun}
                    </span>
                    <span>by {template.createdBy}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleRun(template)}
                    disabled={runningId === template.id}
                  >
                    {runningId === template.id ? (
                      <>Generating...</>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem onClick={() => onEdit?.(template.id)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Template
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Export Definition
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(template.id)}
                        className="text-[hsl(var(--status-error))]"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">No templates found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "Try a different search term" : "Create your first custom report template"}
          </p>
        </div>
      )}
    </div>
  );
}
