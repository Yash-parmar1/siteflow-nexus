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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Plus,
  Filter,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  MoreHorizontal,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data for vendors
const mockVendors = [
  {
    id: "VND-001",
    name: "TechServe Solutions",
    type: "Installer",
    status: "Active",
    rating: 4.8,
    totalJobs: 156,
    completedJobs: 148,
    activeJobs: 8,
    avgResponseTime: "2.5 hrs",
    contactPerson: "Rahul Sharma",
    phone: "+91 98765 43210",
    email: "rahul@techserve.com",
    location: "Mumbai, Maharashtra",
    contractExpiry: "Mar 2025",
    specializations: ["Installation", "Repairs", "Maintenance"],
  },
  {
    id: "VND-002",
    name: "AirCool Installers",
    type: "Installer",
    status: "Active",
    rating: 4.5,
    totalJobs: 89,
    completedJobs: 85,
    activeJobs: 4,
    avgResponseTime: "3.2 hrs",
    contactPerson: "Vikram Patel",
    phone: "+91 98765 12345",
    email: "vikram@aircool.in",
    location: "Pune, Maharashtra",
    contractExpiry: "Jun 2025",
    specializations: ["Installation", "Maintenance"],
  },
  {
    id: "VND-003",
    name: "ProInstall Inc.",
    type: "Installer",
    status: "Active",
    rating: 4.2,
    totalJobs: 67,
    completedJobs: 62,
    activeJobs: 5,
    avgResponseTime: "4.1 hrs",
    contactPerson: "Suresh Kumar",
    phone: "+91 87654 32109",
    email: "suresh@proinstall.com",
    location: "Delhi NCR",
    contractExpiry: "Dec 2024",
    specializations: ["Installation", "Emergency Repairs"],
  },
  {
    id: "VND-004",
    name: "CoolTech Parts",
    type: "Supplier",
    status: "Active",
    rating: 4.6,
    totalJobs: 234,
    completedJobs: 230,
    activeJobs: 4,
    avgResponseTime: "1.5 hrs",
    contactPerson: "Anita Desai",
    phone: "+91 99887 76655",
    email: "anita@cooltech.com",
    location: "Bangalore, Karnataka",
    contractExpiry: "Sep 2025",
    specializations: ["Compressors", "Filters", "Refrigerants"],
  },
  {
    id: "VND-005",
    name: "FastFix Services",
    type: "Maintenance",
    status: "Inactive",
    rating: 3.9,
    totalJobs: 45,
    completedJobs: 42,
    activeJobs: 0,
    avgResponseTime: "5.8 hrs",
    contactPerson: "Kiran Reddy",
    phone: "+91 91234 56789",
    email: "kiran@fastfix.in",
    location: "Hyderabad, Telangana",
    contractExpiry: "Expired",
    specializations: ["Preventive Maintenance"],
  },
  {
    id: "VND-006",
    name: "Elite Logistics",
    type: "Logistics",
    status: "Active",
    rating: 4.7,
    totalJobs: 312,
    completedJobs: 308,
    activeJobs: 4,
    avgResponseTime: "1.2 hrs",
    contactPerson: "Deepak Joshi",
    phone: "+91 88776 65544",
    email: "deepak@elitelogistics.com",
    location: "Mumbai, Maharashtra",
    contractExpiry: "Jan 2026",
    specializations: ["Shipping", "Last-mile Delivery"],
  },
];

const typeColors: Record<string, string> = {
  Installer: "bg-[hsl(var(--status-info)/0.15)] text-[hsl(var(--status-info))]",
  Supplier: "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]",
  Maintenance: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]",
  Logistics: "bg-primary/10 text-primary",
};

export default function Vendors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredVendors = mockVendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || vendor.type === typeFilter;
    const matchesStatus = statusFilter === "all" || vendor.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const types = ["all", "Installer", "Supplier", "Maintenance", "Logistics"];
  const statuses = ["all", "Active", "Inactive"];

  // Stats
  const activeVendors = mockVendors.filter((v) => v.status === "Active").length;
  const avgRating = (mockVendors.reduce((sum, v) => sum + v.rating, 0) / mockVendors.length).toFixed(1);
  const totalActiveJobs = mockVendors.reduce((sum, v) => sum + v.activeJobs, 0);

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage installers, suppliers, and service providers
          </p>
        </div>
        <Button size="default">
          <Plus className="w-4 h-4" />
          Add Vendor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="metric-value">{mockVendors.length}</p>
                <p className="metric-label">Total Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-success)/0.15)] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--status-success))]" />
              </div>
              <div>
                <p className="metric-value">{activeVendors}</p>
                <p className="metric-label">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-warning)/0.15)] flex items-center justify-center">
                <Star className="w-5 h-5 text-[hsl(var(--status-warning))]" />
              </div>
              <div>
                <p className="metric-value">{avgRating}</p>
                <p className="metric-label">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-info)/0.15)] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[hsl(var(--status-info))]" />
              </div>
              <div>
                <p className="metric-value">{totalActiveJobs}</p>
                <p className="metric-label">Active Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] bg-secondary/50">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === "all" ? "All Types" : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] bg-secondary/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "All Status" : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vendor Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredVendors.map((vendor, index) => (
          <Card
            key={vendor.id}
            className="data-card animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {vendor.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{vendor.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={`${typeColors[vendor.type]} border-0 text-xs`}>
                        {vendor.type}
                      </Badge>
                      <Badge variant={vendor.status === "Active" ? "default" : "secondary"} className="text-xs">
                        {vendor.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Vendor</DropdownMenuItem>
                    <DropdownMenuItem>View Jobs</DropdownMenuItem>
                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{vendor.contactPerson}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{vendor.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{vendor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{vendor.location}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-muted/50 rounded-lg mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-[hsl(var(--status-warning))]">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-semibold">{vendor.rating}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{vendor.totalJobs}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[hsl(var(--status-success))]">{vendor.completedJobs}</p>
                  <p className="text-xs text-muted-foreground">Done</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[hsl(var(--status-info))]">{vendor.activeJobs}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-medium">
                    {Math.round((vendor.completedJobs / vendor.totalJobs) * 100)}%
                  </span>
                </div>
                <Progress
                  value={(vendor.completedJobs / vendor.totalJobs) * 100}
                  className="h-1.5"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Avg response: {vendor.avgResponseTime}</span>
                </div>
                <span className={`text-xs ${vendor.contractExpiry === "Expired" ? "text-[hsl(var(--status-error))]" : "text-muted-foreground"}`}>
                  Contract: {vendor.contractExpiry}
                </span>
              </div>

              {/* Specializations */}
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
                {vendor.specializations.map((spec) => (
                  <Badge key={spec} variant="outline" className="text-xs font-normal">
                    {spec}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
            <Building2 className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No vendors found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
