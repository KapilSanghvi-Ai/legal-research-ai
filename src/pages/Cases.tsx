import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CaseDashboard } from "@/components/cases/CaseDashboard";
import { EnhancedCaseCard } from "@/components/dashboard/EnhancedCaseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Search,
  Filter,
  Upload,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Briefcase,
  AlertTriangle,
  FileEdit,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const allCases = [
  {
    id: "1",
    clientName: "Reliance Industries Ltd",
    clientInitials: "RI",
    opposingParty: "DCIT, Circle 1(1), Mumbai",
    assessmentYear: "2021-22",
    pan: "AAACR5765M",
    itaNumber: "ITA No. 1234/Mum/2024",
    stage: "itat" as const,
    status: "hearing" as const,
    issues: ["Sec 68", "Sec 69", "Transfer Pricing"],
    nextDate: "Jan 15, 2026",
    daysUntilHearing: 3,
    owner: "Rajesh K.",
    lastActivity: "2 hours ago",
  },
  {
    id: "2",
    clientName: "Tata Steel Ltd",
    opposingParty: "DCIT, Mumbai",
    assessmentYear: "2020-21",
    stage: "cita" as const,
    status: "drafting" as const,
    issues: ["Sec 40A(3)", "Depreciation"],
    nextDate: "Jan 22, 2026",
    daysUntilHearing: 10,
    owner: "Priya M.",
    lastActivity: "1 day ago",
  },
  {
    id: "3",
    clientName: "Infosys Technologies",
    opposingParty: "ACIT, Bangalore",
    assessmentYear: "2022-23",
    stage: "assessment" as const,
    status: "research" as const,
    issues: ["Sec 80-IA", "Software Exports"],
    owner: "Amit S.",
    lastActivity: "3 hours ago",
  },
  {
    id: "4",
    clientName: "HDFC Bank Ltd",
    opposingParty: "DCIT, Mumbai",
    assessmentYear: "2019-20",
    stage: "itat" as const,
    status: "hearing" as const,
    issues: ["Sec 14A", "Disallowance"],
    nextDate: "Jan 18, 2026",
    daysUntilHearing: 6,
    owner: "Rajesh K.",
    lastActivity: "5 hours ago",
  },
  {
    id: "5",
    clientName: "Wipro Ltd",
    opposingParty: "DCIT, Bangalore",
    assessmentYear: "2021-22",
    stage: "cita" as const,
    status: "drafting" as const,
    issues: ["Transfer Pricing", "ALP"],
    nextDate: "Jan 30, 2026",
    daysUntilHearing: 18,
    owner: "Priya M.",
    lastActivity: "Yesterday",
  },
  {
    id: "6",
    clientName: "Bajaj Auto Ltd",
    opposingParty: "ITO, Pune",
    assessmentYear: "2020-21",
    stage: "closed" as const,
    status: "archived" as const,
    issues: ["Sec 37", "Business Expenditure"],
    owner: "Amit S.",
    lastActivity: "1 week ago",
  },
  {
    id: "7",
    clientName: "Sun Pharma Industries",
    opposingParty: "DCIT, Mumbai",
    assessmentYear: "2022-23",
    stage: "assessment" as const,
    status: "research" as const,
    issues: ["Sec 35", "R&D Expenditure"],
    nextDate: "Feb 10, 2026",
    daysUntilHearing: 29,
    owner: "Rajesh K.",
    lastActivity: "4 hours ago",
  },
  {
    id: "8",
    clientName: "Mahindra & Mahindra",
    opposingParty: "DCIT, Mumbai",
    assessmentYear: "2021-22",
    stage: "cita" as const,
    status: "hearing" as const,
    issues: ["Sec 32", "Additional Depreciation"],
    nextDate: "Jan 25, 2026",
    daysUntilHearing: 13,
    owner: "Priya M.",
    lastActivity: "6 hours ago",
  },
];

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend?: string;
  iconBg: string;
}

function StatCard({ icon, label, value, trend, iconBg }: StatCardProps) {
  return (
    <Card className="border-border/40 hover:border-border/60 transition-colors">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("p-2.5 rounded-lg", iconBg)}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">{value}</span>
            {trend && (
              <span className="text-xs text-success flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Cases() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"dashboard" | "grid" | "list">("dashboard");

  const filteredCases = allCases.filter((c) => {
    const matchesSearch =
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.issues.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStage = stageFilter === "all" || c.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const activeCases = filteredCases.filter((c) => c.stage !== "closed");
  const archivedCases = filteredCases.filter((c) => c.stage === "closed");
  const urgentCases = activeCases.filter((c) => c.daysUntilHearing && c.daysUntilHearing <= 7);
  const draftingCases = activeCases.filter((c) => c.status === "drafting");

  return (
    <AppLayout title="Cases">
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            Case Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Track and manage all your tax litigation matters in one place
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Briefcase className="w-5 h-5 text-primary" />}
            label="Active Cases"
            value={activeCases.length}
            iconBg="bg-primary/10"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5 text-warning" />}
            label="Urgent"
            value={urgentCases.length}
            iconBg="bg-warning/10"
          />
          <StatCard
            icon={<FileEdit className="w-5 h-5 text-info" />}
            label="Drafting"
            value={draftingCases.length}
            iconBg="bg-info/10"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-success" />}
            label="Closed"
            value={archivedCases.length}
            trend="+2 this month"
            iconBg="bg-success/10"
          />
        </div>

        {/* Search & Filters Bar */}
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by client, issue, or section..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-border/60 focus:border-primary/50 transition-colors"
                  />
                </div>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-44 bg-background border-border/60">
                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filter by Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="cita">CIT(A)</SelectItem>
                    <SelectItem value="itat">ITAT</SelectItem>
                    <SelectItem value="hc">High Court</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="border-border/60 hover:bg-muted">
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center bg-muted/50 border border-border/40 rounded-lg p-1">
                  <Button
                    variant={viewMode === "dashboard" ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 px-3 text-xs font-medium transition-all",
                      viewMode === "dashboard" && "shadow-sm"
                    )}
                    onClick={() => setViewMode("dashboard")}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 px-3 transition-all",
                      viewMode === "grid" && "shadow-sm"
                    )}
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 px-3 transition-all",
                      viewMode === "list" && "shadow-sm"
                    )}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {/* Action Buttons */}
                <Button variant="outline" size="sm" className="border-border/60 hover:bg-muted">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Case
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard View */}
        {viewMode === "dashboard" && (
          <CaseDashboard
            cases={activeCases}
            onNewCase={() => {}}
            onCaseClick={(id) => console.log("Open case:", id)}
          />
        )}

        {/* Grid/List View */}
        {(viewMode === "grid" || viewMode === "list") && (
          <Card className="border-border/40">
            <CardContent className="p-0">
              <Tabs defaultValue="active" className="w-full">
                <div className="border-b border-border/40 px-4">
                  <TabsList className="h-12 bg-transparent p-0 gap-6">
                    <TabsTrigger 
                      value="active"
                      className="h-12 px-0 pb-3 pt-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium"
                    >
                      Active Cases
                      <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-semibold">
                        {activeCases.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="my-cases"
                      className="h-12 px-0 pb-3 pt-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium"
                    >
                      My Cases
                    </TabsTrigger>
                    <TabsTrigger 
                      value="pending-review"
                      className="h-12 px-0 pb-3 pt-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium"
                    >
                      Pending Review
                    </TabsTrigger>
                    <TabsTrigger 
                      value="archived"
                      className="h-12 px-0 pb-3 pt-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium"
                    >
                      Archived
                      <span className="ml-2 px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full font-medium">
                        {archivedCases.length}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="active" className="mt-0">
                    <div className={viewMode === "grid" 
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                      : "space-y-4"
                    }>
                      {activeCases.map((caseItem, index) => (
                        <div 
                          key={caseItem.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <EnhancedCaseCard
                            {...caseItem}
                            onOpen={() => console.log("Open:", caseItem.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="my-cases" className="mt-0">
                    <div className={viewMode === "grid" 
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                      : "space-y-4"
                    }>
                      {activeCases.filter(c => c.owner === "Rajesh K.").map((caseItem, index) => (
                        <div 
                          key={caseItem.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <EnhancedCaseCard
                            {...caseItem}
                            onOpen={() => console.log("Open:", caseItem.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="pending-review" className="mt-0">
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No cases pending review</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Cases requiring your review will appear here
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="archived" className="mt-0">
                    <div className={viewMode === "grid" 
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                      : "space-y-4"
                    }>
                      {archivedCases.map((caseItem, index) => (
                        <div 
                          key={caseItem.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <EnhancedCaseCard
                            {...caseItem}
                            onOpen={() => console.log("Open:", caseItem.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {filteredCases.length === 0 && viewMode !== "dashboard" && (
          <Card className="border-border/40">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                No cases found matching your criteria
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Try adjusting your search or filter settings
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => {
                setSearchQuery("");
                setStageFilter("all");
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
