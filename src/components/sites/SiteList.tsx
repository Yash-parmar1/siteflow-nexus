import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteCard } from "./SiteCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Filter, Grid3X3, List } from "lucide-react";

// Mock data
const mockSites = [
  {
    id: "site-001",
    name: "Metro Tower - Block A",
    location: "Mumbai, Maharashtra",
    stage: "WIP",
    progress: 65,
    acsPlanned: 12,
    acsInstalled: 8,
    hasDelay: true,
    rentStartDate: "Jan 15, 2024",
  },
  {
    id: "site-002",
    name: "Phoenix Mall Expansion",
    location: "Pune, Maharashtra",
    stage: "TIS",
    progress: 88,
    acsPlanned: 24,
    acsInstalled: 21,
    hasDelay: false,
    rentStartDate: "Feb 01, 2024",
  },
  {
    id: "site-003",
    name: "Cyber Hub Tower 5",
    location: "Gurugram, Haryana",
    stage: "Live",
    progress: 100,
    acsPlanned: 18,
    acsInstalled: 18,
    hasDelay: false,
    rentStartDate: "Dec 10, 2023",
  },
  {
    id: "site-004",
    name: "Prestige Tech Park",
    location: "Bangalore, Karnataka",
    stage: "Installed",
    progress: 95,
    acsPlanned: 32,
    acsInstalled: 30,
    hasDelay: false,
    rentStartDate: "Mar 01, 2024",
  },
  {
    id: "site-005",
    name: "DLF Cyber City Phase 3",
    location: "Gurugram, Haryana",
    stage: "WTS",
    progress: 35,
    acsPlanned: 16,
    acsInstalled: 5,
    hasDelay: true,
  },
  {
    id: "site-006",
    name: "Mindspace IT Park",
    location: "Hyderabad, Telangana",
    stage: "Started",
    progress: 10,
    acsPlanned: 20,
    acsInstalled: 0,
    hasDelay: false,
  },
];

export function SiteList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredSites = mockSites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === "all" || site.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const stages = ["all", "Started", "WTS", "WIP", "TIS", "Installed", "Live"];

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Sites</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredSites.length} sites across all locations
          </p>
        </div>
        <Button size="default" className="shrink-0">
          <Plus className="w-4 h-4" />
          Add Site
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search sites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[140px] bg-secondary/50">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {stages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage === "all" ? "All Stages" : stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex border border-border rounded-lg p-0.5 bg-secondary/30">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Site Grid */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            : "flex flex-col gap-3"
        }
      >
        {filteredSites.map((site, index) => (
          <div
            key={site.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <SiteCard site={site} onClick={() => navigate(`/site/${site.id}`)} />
          </div>
        ))}
      </div>

      {filteredSites.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No sites found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
