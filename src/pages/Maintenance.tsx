import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateTicketDialog } from "@/components/forms/CreateTicketDialog";
import { ScheduleMaintenanceDialog } from "@/components/forms/ScheduleMaintenanceDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Wrench, AlertCircle, Clock, MapPin, MessageSquare, Paperclip, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppData, type TicketData } from "@/context/AppDataContext";

// Hardcoded fallback removed – all data comes from live API

const statusConfig: Record<string, { color: string; bgColor: string }> = { Open: { color: "text-[hsl(var(--status-info))]", bgColor: "bg-[hsl(var(--status-info)/0.15)]" }, "In Progress": { color: "text-[hsl(var(--status-warning))]", bgColor: "bg-[hsl(var(--status-warning)/0.15)]" }, "Pending Parts": { color: "text-muted-foreground", bgColor: "bg-muted" }, Resolved: { color: "text-[hsl(var(--status-success))]", bgColor: "bg-[hsl(var(--status-success)/0.15)]" } };
const priorityConfig: Record<string, { dot: string }> = { Critical: { dot: "bg-[hsl(var(--status-error))]" }, High: { dot: "bg-[hsl(var(--status-warning))]" }, Medium: { dot: "bg-[hsl(var(--status-info))]" }, Low: { dot: "bg-muted-foreground" } };

export default function Maintenance() {
  const navigate = useNavigate();
  const { data: appData } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [showCreateTicketDialog, setShowCreateTicketDialog] = useState(false);
  const [showScheduleMaintenanceDialog, setShowScheduleMaintenanceDialog] = useState(false);

  // Map backend maintenance tickets to page format
  const statusMap: Record<string, string> = { RAISED: "Open", INSPECTED: "In Progress", QUOTED: "In Progress", APPROVED: "In Progress", REPAIRED: "Resolved", CLOSED: "Resolved" };
  const priorityMap: Record<string, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" };

  const tickets = (appData?.maintenanceTickets ?? []).map((t: TicketData, idx: number) => ({
    id: `TKT-${String(t.id ?? idx + 1).padStart(3, "0")}`,
    title: t.title ?? "Untitled Ticket",
    description: t.description ?? "",
    site: t.siteName ?? "Unknown Site",
    siteId: t.siteId ? String(t.siteId) : "site-000",
    unit: t.acAssetSerial ?? "N/A",
    status: statusMap[t.status] ?? "Open",
    priority: priorityMap[t.priority] ?? "Medium",
    assignee: { name: t.assignedTo ?? "-" },
    createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-",
    updatedAt: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-",
    comments: 0,
    attachments: 0,
  }));

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || ticket.site.toLowerCase().includes(searchQuery.toLowerCase()) || ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const kanbanStatuses = ["Open", "In Progress", "Pending Parts", "Resolved"];

  const TicketCard = ({ ticket, compact = false }: { ticket: typeof tickets[0]; compact?: boolean }) => (
    <Card className={`data-card cursor-pointer ${compact ? "p-3" : ""}`} onClick={() => navigate(`/site/${ticket.siteId}`)}>
      <CardContent className={compact ? "p-0" : "p-4"}>
        <div className="flex items-start justify-between gap-2 mb-2"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${priorityConfig[ticket.priority]?.dot}`} /><span className="text-xs text-muted-foreground">{ticket.id}</span></div><Badge className={`${statusConfig[ticket.status]?.bgColor} ${statusConfig[ticket.status]?.color} border-0 text-xs`}>{ticket.status}</Badge></div>
        <h4 className={`font-medium text-foreground mb-2 ${compact ? "text-sm" : ""} line-clamp-2`}>{ticket.title}</h4>
        {!compact && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{ticket.description}</p>}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3"><div className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span className="truncate max-w-[100px]">{ticket.site}</span></div><div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span>{ticket.updatedAt}</span></div></div>
        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Avatar className="w-6 h-6"><AvatarFallback className="text-xs bg-primary/10 text-primary">{ticket.assignee.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar><span className="text-xs text-muted-foreground">{ticket.assignee.name}</span></div><div className="flex items-center gap-2 text-muted-foreground">{ticket.comments > 0 && <div className="flex items-center gap-1 text-xs"><MessageSquare className="w-3 h-3" />{ticket.comments}</div>}{ticket.attachments > 0 && <div className="flex items-center gap-1 text-xs"><Paperclip className="w-3 h-3" />{ticket.attachments}</div>}</div></div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-semibold text-foreground">Maintenance & Tickets</h1><p className="text-sm text-muted-foreground mt-0.5">Manage service requests and maintenance tasks</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScheduleMaintenanceDialog(true)}><Calendar className="w-4 h-4" />Schedule</Button>
          <Button size="default" onClick={() => setShowCreateTicketDialog(true)}><Plus className="w-4 h-4" />Create Ticket</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-info)/0.15)] flex items-center justify-center"><AlertCircle className="w-5 h-5 text-[hsl(var(--status-info))]" /></div><div><p className="metric-value">{tickets.filter((t) => t.status === "Open").length}</p><p className="metric-label">Open</p></div></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-warning)/0.15)] flex items-center justify-center"><Wrench className="w-5 h-5 text-[hsl(var(--status-warning))]" /></div><div><p className="metric-value">{tickets.filter((t) => t.status === "In Progress").length}</p><p className="metric-label">In Progress</p></div></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-error)/0.15)] flex items-center justify-center"><AlertCircle className="w-5 h-5 text-[hsl(var(--status-error))]" /></div><div><p className="metric-value">{tickets.filter((t) => t.priority === "Critical" && t.status !== "Resolved").length}</p><p className="metric-label">Critical</p></div></div></CardContent></Card>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "kanban")} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <TabsList className="bg-secondary/50"><TabsTrigger value="list">List View</TabsTrigger><TabsTrigger value="kanban">Kanban Board</TabsTrigger></TabsList>
          <div className="flex gap-2 flex-wrap">
            <div className="relative max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="search" placeholder="Search tickets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-[200px]" /></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[140px] bg-secondary/50"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent className="bg-popover border-border">{["all", "Open", "In Progress", "Pending Parts", "Resolved"].map((status) => (<SelectItem key={status} value={status}>{status === "all" ? "All Status" : status}</SelectItem>))}</SelectContent></Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}><SelectTrigger className="w-[130px] bg-secondary/50"><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent className="bg-popover border-border">{["all", "Critical", "High", "Medium", "Low"].map((priority) => (<SelectItem key={priority} value={priority}>{priority === "all" ? "All Priority" : priority}</SelectItem>))}</SelectContent></Select>
          </div>
        </div>

        <TabsContent value="list" className="mt-6"><div className="space-y-3">{filteredTickets.map((ticket) => (<div key={ticket.id}><TicketCard ticket={ticket} /></div>))}</div></TabsContent>

        <TabsContent value="kanban" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {kanbanStatuses.map((status) => {
              const statusTickets = filteredTickets.filter((t) => t.status === status);
              return (
                <div key={status} className="flex flex-col">
                  <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Badge className={`${statusConfig[status]?.bgColor} ${statusConfig[status]?.color} border-0`}>{status}</Badge><span className="text-sm text-muted-foreground">{statusTickets.length}</span></div><Button variant="ghost" size="icon-sm" onClick={() => setShowCreateTicketDialog(true)}><Plus className="w-4 h-4" /></Button></div>
                  <ScrollArea className="flex-1"><div className="space-y-3 pr-2">{statusTickets.map((ticket) => (<TicketCard key={ticket.id} ticket={ticket} compact />))}{statusTickets.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">No tickets</div>}</div></ScrollArea>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {filteredTickets.length === 0 && viewMode === "list" && (<div className="flex flex-col items-center justify-center py-16 text-center"><div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center"><Wrench className="w-7 h-7 text-muted-foreground" /></div><h3 className="text-lg font-medium text-foreground mb-1">No tickets found</h3><p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p></div>)}

      <CreateTicketDialog open={showCreateTicketDialog} onOpenChange={setShowCreateTicketDialog} />
      <ScheduleMaintenanceDialog open={showScheduleMaintenanceDialog} onOpenChange={setShowScheduleMaintenanceDialog} />
    </div>
  );
}
