import { ArrowLeft, MapPin, AlertTriangle, MoreHorizontal, Edit, Download, Trash2, Lock, FolderKanban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  site: {
    id: string;
    name: string;
    location: string;
    stage: string;
    progress: number;
    acsPlanned: number;
    acsInstalled: number;
    hasDelay: boolean;
    delayDays?: number;
    // Project binding
    projectName: string;
    subprojectName?: string;
    configVersion: string;
    configuredRent: number;
    configuredTenure: number;
    installationIncluded: boolean;
    maintenanceIncluded: boolean;
  };
}

const stageColors: Record<string, string> = {
  Started: "bg-stage-started",
  WTS: "bg-stage-wts",
  WIP: "bg-stage-wip",
  TIS: "bg-stage-tis",
  Installed: "bg-stage-installed",
  Live: "bg-stage-live",
};

export function SiteHeader({ site }: SiteHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="px-6 py-4">
        {/* Breadcrumb & Actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sites
          </button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4" />
              Edit Site
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </DropdownMenuItem>
                <DropdownMenuItem>View Audit Log</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-status-error">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Site
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Project Binding Banner */}
        <div className="mb-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FolderKanban className="w-4 h-4 text-primary" />
                  <span>{site.projectName}</span>
                  {site.subprojectName && (
                    <>
                      <span className="text-muted-foreground">/</span>
                      <span>{site.subprojectName}</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>Configuration v{site.configVersion}</span>
                  <span className="text-primary/50">•</span>
                  <span>Immutable binding</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center cursor-help">
                    <div className="font-semibold text-foreground">₹{site.configuredRent.toLocaleString("en-IN")}</div>
                    <div className="text-xs text-muted-foreground">Base Rent/mo</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Configured base monthly rent (read-only)</TooltipContent>
              </Tooltip>
              <div className="w-px h-8 bg-border" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center cursor-help">
                    <div className="font-semibold text-foreground">{site.configuredTenure} mo</div>
                    <div className="text-xs text-muted-foreground">Tenure</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Configured tenure per ACS (read-only)</TooltipContent>
              </Tooltip>
              <div className="w-px h-8 bg-border" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center cursor-help">
                    <div className={cn("font-semibold", site.installationIncluded ? "text-status-success" : "text-foreground")}>
                      {site.installationIncluded ? "Included" : "Chargeable"}
                    </div>
                    <div className="text-xs text-muted-foreground">Installation</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Installation charges (read-only)</TooltipContent>
              </Tooltip>
              <div className="w-px h-8 bg-border" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center cursor-help">
                    <div className={cn("font-semibold", site.maintenanceIncluded ? "text-status-success" : "text-foreground")}>
                      {site.maintenanceIncluded ? "Included" : "Chargeable"}
                    </div>
                    <div className="text-xs text-muted-foreground">Maintenance</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Maintenance charges (read-only)</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Site Info */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-foreground truncate">
                {site.name}
              </h1>
              <span
                className={cn(
                  "status-badge shrink-0"
                )}
                style={{
                  backgroundColor: `hsl(var(--stage-${site.stage.toLowerCase()}) / 0.15)`,
                  color: `hsl(var(--stage-${site.stage.toLowerCase()}))`,
                }}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", stageColors[site.stage])} />
                {site.stage}
              </span>
              {site.hasDelay && (
                <span className="status-badge status-warning">
                  <AlertTriangle className="w-3 h-3" />
                  {site.delayDays} days delayed
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{site.location}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-semibold text-foreground">
                {site.progress}%
              </div>
              <div className="text-xs text-muted-foreground font-medium">Progress</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-semibold text-foreground">
                {site.acsInstalled}
                <span className="text-base text-muted-foreground font-normal">
                  /{site.acsPlanned}
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-medium">ACS Units</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", stageColors[site.stage])}
              style={{ width: `${site.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
