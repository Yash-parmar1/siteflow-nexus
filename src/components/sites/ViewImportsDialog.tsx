import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Eye, FileText, Inbox, Loader2, Settings2, MapPin, Box, Wrench, Package, IndianRupee } from "lucide-react";
import api from "@/lib/api";
import UploadResultDialog from "./UploadResultDialog";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

type TabKey = "sites" | "assets" | "installations" | "extra-materials" | "financial" | "config";

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  /** fileType values that belong to this tab */
  fileTypes: string[];
}

const TABS: TabDef[] = [
  { key: "sites",          label: "Sites",           icon: <MapPin  className="w-3.5 h-3.5" />, fileTypes: ["SITE_IMPORT"] },
  { key: "assets",         label: "Assets",          icon: <Box     className="w-3.5 h-3.5" />, fileTypes: ["ASSET_IMPORT"] },
  { key: "installations",  label: "Installations",   icon: <Wrench  className="w-3.5 h-3.5" />, fileTypes: ["INSTALLATION_IMPORT"] },
  { key: "extra-materials", label: "Extra Materials", icon: <Package className="w-3.5 h-3.5" />, fileTypes: ["SITE_EXTRA_MATERIALS"] },
  { key: "financial",      label: "Financial",       icon: <IndianRupee className="w-3.5 h-3.5" />, fileTypes: ["INSTALLATION_INVOICES", "FINAL_INVOICE", "MONTHLY_RENT_BILLS"] },
  { key: "config",         label: "Config",          icon: <Settings2 className="w-3.5 h-3.5" />, fileTypes: ["SELL_PRICE", "COST_PRICE", "ASSET_VALUES", "RENT_SCHEDULE"] },
];

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  subprojectId: string;
  onProcessed?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ViewImportsDialog({ open, onOpenChange, projectId, subprojectId, onProcessed }: Props) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("sites");
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  /* ---- Config data (no sessions — fetch summaries) ---- */
  const [configData, setConfigData] = useState<Record<string, any>>({});
  const [configLoading, setConfigLoading] = useState(false);

  /* ---- Fetch all upload sessions ---- */
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get(`/projects/${projectId}/subprojects/${subprojectId}/uploads`)
      .then((res) => setSessions(res.data))
      .catch(() => toast.error("Failed to list imports"))
      .finally(() => setLoading(false));
  }, [open, projectId, subprojectId]);

  /* ---- Fetch config summaries when config tab opened ---- */
  useEffect(() => {
    if (!open || activeTab !== "config") return;
    setConfigLoading(true);
    const base = `/subproject/${subprojectId}/config`;
    Promise.allSettled([
      api.get(`${base}/sell-price`),
      api.get(`${base}/cost-price`),
      api.get(`${base}/asset-values`),
      api.get(`${base}/rent-schedule`),
    ]).then(([sp, cp, av, rs]) => {
      setConfigData({
        "sell-price":    sp.status === "fulfilled" ? sp.value.data : null,
        "cost-price":    cp.status === "fulfilled" ? cp.value.data : null,
        "asset-values":  av.status === "fulfilled" ? av.value.data : null,
        "rent-schedule": rs.status === "fulfilled" ? rs.value.data : null,
      });
    }).finally(() => setConfigLoading(false));
  }, [open, activeTab, subprojectId]);

  /* ---- Filter sessions by active tab ---- */
  const filteredSessions = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab) return [];
    return sessions.filter((s) => tab.fileTypes.includes(s.fileType));
  }, [sessions, activeTab]);

  /* ---- Latest (active) session per tab for yellow highlight ---- */
  const latestSessionId = useMemo(() => {
    if (filteredSessions.length === 0) return null;
    // Sort by uploadTimestamp descending, pick first
    const sorted = [...filteredSessions].sort(
      (a, b) => new Date(b.uploadTimestamp).getTime() - new Date(a.uploadTimestamp).getTime()
    );
    return sorted[0]?.id ?? null;
  }, [filteredSessions]);

  const openResult = (id: number) => {
    setSelectedSession(id);
    setResultOpen(true);
  };

  /* ---- Config tab content ---- */
  const renderConfigTab = () => {
    if (configLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading config…</span>
        </div>
      );
    }
    const configs = [
      { key: "sell-price",    label: "Sell Price" },
      { key: "cost-price",    label: "Cost Price" },
      { key: "asset-values",  label: "Asset Value Breakdown" },
      { key: "rent-schedule", label: "Rent Schedule" },
    ];
    return (
      <div className="space-y-2">
        {configs.map((cfg) => {
          const data = configData[cfg.key];
          const hasData = data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0);
          return (
            <div
              key={cfg.key}
              className={`p-3 rounded-lg border transition-colors ${
                hasData
                  ? "border-yellow-400 bg-yellow-400/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    hasData ? "bg-yellow-400/10" : "bg-muted"
                  }`}>
                    <Settings2 className={`w-4 h-4 ${hasData ? "text-yellow-600" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{cfg.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {hasData
                        ? `${Array.isArray(data) ? data.length : Object.keys(data).length} entries loaded`
                        : "Not uploaded yet"}
                    </p>
                  </div>
                </div>
                <Badge variant={hasData ? "default" : "secondary"} className={`text-xs ${hasData ? "bg-yellow-500 text-white" : ""}`}>
                  {hasData ? "Active" : "Empty"}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ---- Session list content (for non-config tabs) ---- */
  const renderSessionList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading…</span>
        </div>
      );
    }
    if (filteredSessions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 mb-3 rounded-full bg-muted flex items-center justify-center">
            <Inbox className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No imports found for this category.</p>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {filteredSessions
          .sort((a: any, b: any) => new Date(b.uploadTimestamp).getTime() - new Date(a.uploadTimestamp).getTime())
          .map((s: any) => {
            const isLatest = s.id === latestSessionId;
            return (
              <div
                key={s.id}
                className={`p-3 rounded-lg border transition-colors ${
                  isLatest
                    ? "border-yellow-400 bg-yellow-400/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isLatest ? "bg-yellow-400/10" : "bg-muted"
                    }`}>
                      <FileText className={`w-4 h-4 ${isLatest ? "text-yellow-600" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{s.originalFilename}</p>
                        {isLatest && (
                          <Badge variant="default" className="text-[10px] bg-yellow-500 text-white px-1.5 py-0">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(s.uploadTimestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button onClick={() => openResult(s.id)} variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs h-7">
                      <a href={`/api/projects/${projectId}/subprojects/${subprojectId}/uploads/${s.id}/download`} target="_blank">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Import History
            </DialogTitle>
            <DialogDescription>
              View all file imports for this subproject. The latest import in each category is highlighted as the active source of truth.
            </DialogDescription>
          </DialogHeader>

          {/* ---- Tab bar ---- */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = sessions.filter((s) =>
                tab.fileTypes.includes(s.fileType)
              ).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-yellow-400 bg-yellow-400/10 text-yellow-700 dark:text-yellow-400"
                      : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.key !== "config" && count > 0 && (
                    <span className={`ml-1 px-1.5 py-0 rounded-full text-[10px] ${
                      isActive ? "bg-yellow-400/20 text-yellow-700 dark:text-yellow-400" : "bg-muted-foreground/10 text-muted-foreground"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ---- Tab content ---- */}
          <ScrollArea className="max-h-[400px] pr-2">
            <div className="py-2">
              {activeTab === "config" ? renderConfigTab() : renderSessionList()}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button size="sm" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UploadResultDialog open={resultOpen} onOpenChange={setResultOpen} projectId={projectId} subprojectId={subprojectId} sessionId={selectedSession} onProcessed={onProcessed} />
    </>
  );
}
