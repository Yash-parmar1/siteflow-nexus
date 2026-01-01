import { MapPin, Box, AlertTriangle, ArrowRight, Lock, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectBoundSiteCardProps {
  site: {
    id: string;
    name: string;
    location: string;
    stage: string;
    progress: number;
    acsPlanned: number;
    acsInstalled: number;
    hasDelay: boolean;
    rentStartDate?: string;
    // Project binding
    projectName: string;
    subprojectName?: string;
    configVersion: string;
    configuredRent: number;
    configuredTenure: number;
  };
  onClick: () => void;
}

const stageColors: Record<string, string> = {
  Started: "bg-stage-started",
  WTS: "bg-stage-wts",
  WIP: "bg-stage-wip",
  TIS: "bg-stage-tis",
  Installed: "bg-stage-installed",
  Live: "bg-stage-live",
};

const stageTextColors: Record<string, string> = {
  Started: "text-stage-started",
  WTS: "text-stage-wts",
  WIP: "text-stage-wip",
  TIS: "text-stage-tis",
  Installed: "text-stage-installed",
  Live: "text-stage-live",
};

export function ProjectBoundSiteCard({ site, onClick }: ProjectBoundSiteCardProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left data-card hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      {/* Project Badge */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/60">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-xs font-medium text-primary cursor-help">
              <FolderKanban className="w-3 h-3" />
              <span>{site.projectName}</span>
              {site.subprojectName && (
                <>
                  <span className="text-primary/50">/</span>
                  <span>{site.subprojectName}</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                <span>Bound Configuration v{site.configVersion}</span>
              </div>
              <div>Rent: ₹{site.configuredRent.toLocaleString("en-IN")}/mo</div>
              <div>Tenure: {site.configuredTenure} months</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {site.name}
            </h3>
            {site.hasDelay && (
              <AlertTriangle className="w-4 h-4 text-status-warning shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{site.location}</span>
          </div>
        </div>
        <div
          className={cn(
            "status-badge shrink-0",
            stageColors[site.stage] ? `bg-opacity-15 ${stageTextColors[site.stage]}` : "status-neutral"
          )}
          style={{
            backgroundColor: `hsl(var(--stage-${site.stage.toLowerCase()}) / 0.15)`,
          }}
        >
          <span
            className={cn("w-1.5 h-1.5 rounded-full", stageColors[site.stage])}
          />
          {site.stage}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground font-medium">Progress</span>
          <span className="font-semibold text-foreground">{site.progress}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              stageColors[site.stage]
            )}
            style={{ width: `${site.progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Box className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-semibold text-foreground">{site.acsInstalled}</span>
              <span className="text-muted-foreground">/{site.acsPlanned}</span>
            </span>
          </div>
          {site.rentStartDate && (
            <span className="text-xs text-muted-foreground">
              Rent: {site.rentStartDate}
            </span>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}
