import { Lock, IndianRupee, Calendar, Wrench, Package } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ConfigurationBadgeProps {
  projectName: string;
  subprojectName?: string;
  configVersion: string;
  baseRent: number;
  tenure: number;
  installationIncluded: boolean;
  maintenanceIncluded: boolean;
  compact?: boolean;
}

export function ConfigurationBadge({
  projectName,
  subprojectName,
  configVersion,
  baseRent,
  tenure,
  installationIncluded,
  maintenanceIncluded,
  compact = false,
}: ConfigurationBadgeProps) {
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary cursor-help">
            <Lock className="w-3 h-3" />
            <span>{projectName}</span>
            {subprojectName && (
              <>
                <span className="text-primary/50">/</span>
                <span>{subprojectName}</span>
              </>
            )}
            <span className="text-primary/50">v{configVersion}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-3">
          <div className="space-y-2">
            <div className="font-medium text-sm">Bound Configuration</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Base Rent:</span>
                <span className="ml-1 font-medium">₹{baseRent.toLocaleString("en-IN")}/mo</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tenure:</span>
                <span className="ml-1 font-medium">{tenure} months</span>
              </div>
              <div>
                <span className="text-muted-foreground">Installation:</span>
                <span className={cn("ml-1 font-medium", installationIncluded ? "text-status-success" : "text-foreground")}>
                  {installationIncluded ? "Included" : "Chargeable"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Maintenance:</span>
                <span className={cn("ml-1 font-medium", maintenanceIncluded ? "text-status-success" : "text-foreground")}>
                  {maintenanceIncluded ? "Included" : "Chargeable"}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground pt-1 border-t border-border">
              Configuration is immutable and locked at site creation
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Lock className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-medium text-foreground flex items-center gap-2">
            {projectName}
            {subprojectName && (
              <>
                <span className="text-muted-foreground">/</span>
                <span>{subprojectName}</span>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Configuration v{configVersion} • Immutable
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <IndianRupee className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="font-medium text-foreground">₹{baseRent.toLocaleString("en-IN")}</div>
            <div className="text-xs text-muted-foreground">Base Rent/mo</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="font-medium text-foreground">{tenure} months</div>
            <div className="text-xs text-muted-foreground">Tenure</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className={cn("font-medium", installationIncluded ? "text-status-success" : "text-foreground")}>
              {installationIncluded ? "Included" : "Chargeable"}
            </div>
            <div className="text-xs text-muted-foreground">Installation</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Wrench className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className={cn("font-medium", maintenanceIncluded ? "text-status-success" : "text-foreground")}>
              {maintenanceIncluded ? "Included" : "Chargeable"}
            </div>
            <div className="text-xs text-muted-foreground">Maintenance</div>
          </div>
        </div>
      </div>
    </div>
  );
}
