import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CaseDashboard } from "@/components/cases/CaseDashboard";
import { CreateCaseDialog } from "@/components/cases/CreateCaseDialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Filter,
  Upload,
  LayoutGrid,
  List,
  Briefcase,
  AlertTriangle,
  FileEdit,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCases, CaseWithMeta } from "@/hooks/use-cases";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend?: string;
  iconBg: string;
  isLoading?: boolean;
}

function StatCard({ icon, label, value, trend, iconBg, isLoading }: StatCardProps) {
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
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <span className="text-2xl font-semibold text-foreground">{value}</span>
                {trend && (
                  <span className="text-xs text-success flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    {trend}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Transform database case to card-compatible format
function toCaseCardProps(dbCase: CaseWithMeta) {
  return {
    id: dbCase.id,
    clientName: dbCase.client_name,
    clientInitials: dbCase.client_name.split(" ").map((w) => w[0]).join("").slice(0, 2),
    opposingParty: dbCase.opposing_party || "Department",
    assessmentYear: dbCase.assessment_year,
    pan: dbCase.client_pan || undefined,
    itaNumber: dbCase.ita_number || undefined,
    stage: dbCase.stage,
    status: dbCase.status,
    issues: dbCase.issuesList,
    nextDate: dbCase.next_hearing_date 
      ? format(new Date(dbCase.next_hearing_date), "MMM d, yyyy") 
      : undefined,
    daysUntilHearing: dbCase.daysUntilHearing,
    owner: "You", // Will be enhanced with profiles later
    lastActivity: format(new Date(dbCase.updated_at), "MMM d, h:mm a"),
  };
}

function CaseCardSkeleton() {
  return (
    <Card className="border-border/40">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-11 h-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-4 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-1">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-2 w-2 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Cases() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"dashboard" | "grid" | "list">("dashboard");

  // Fetch cases from database
  const { 
    data: allCases = [], 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useCases({
    includeArchived: true,
    stageFilter: stageFilter === "all" ? undefined : stageFilter,
    searchQuery,
  });

  const activeCases = allCases.filter((c) => c.stage !== "closed");
  const archivedCases = allCases.filter((c) => c.stage === "closed");
  const urgentCases = activeCases.filter((c) => c.daysUntilHearing !== undefined && c.daysUntilHearing <= 7);
  const draftingCases = activeCases.filter((c) => c.status === "drafting");
  const myCases = activeCases.filter((c) => c.owner_id === user?.id || c.created_by === user?.id);

  // Transform for card components
  const activeCaseCards = activeCases.map(toCaseCardProps);
  const archivedCaseCards = archivedCases.map(toCaseCardProps);
  const myCaseCards = myCases.map(toCaseCardProps);

  // Transform for dashboard
  const dashboardCases = activeCases.map((c) => ({
    ...toCaseCardProps(c),
    completionPercent: 0,
  }));

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
            isLoading={isLoading}
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5 text-warning" />}
            label="Urgent"
            value={urgentCases.length}
            iconBg="bg-warning/10"
            isLoading={isLoading}
          />
          <StatCard
            icon={<FileEdit className="w-5 h-5 text-info" />}
            label="Drafting"
            value={draftingCases.length}
            iconBg="bg-info/10"
            isLoading={isLoading}
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-success" />}
            label="Closed"
            value={archivedCases.length}
            iconBg="bg-success/10"
            isLoading={isLoading}
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
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="border-border/60 hover:bg-muted"
                  onClick={() => refetch()}
                  disabled={isRefetching}
                >
                  <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
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
                <CreateCaseDialog>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Case
                  </Button>
                </CreateCaseDialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center justify-center py-8 text-center">
              <div>
                <p className="text-destructive font-medium">Failed to load cases</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {error instanceof Error ? error.message : "Please try again"}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && viewMode !== "dashboard" && (
          <Card className="border-border/40">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <CaseCardSkeleton key={i} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard View */}
        {viewMode === "dashboard" && !error && (
          <CaseDashboard
            cases={dashboardCases}
            isLoading={isLoading}
            onNewCase={() => {}}
            onCaseClick={(id) => console.log("Open case:", id)}
          />
        )}

        {/* Grid/List View */}
        {(viewMode === "grid" || viewMode === "list") && !isLoading && !error && (
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
                      <span className="ml-2 px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full font-medium">
                        {myCases.length}
                      </span>
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
                    {activeCaseCards.length > 0 ? (
                      <div className={viewMode === "grid" 
                        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                        : "space-y-4"
                      }>
                        {activeCaseCards.map((caseItem, index) => (
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
                    ) : (
                      <EmptyState 
                        message="No active cases" 
                        description="Create your first case to get started"
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="my-cases" className="mt-0">
                    {myCaseCards.length > 0 ? (
                      <div className={viewMode === "grid" 
                        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                        : "space-y-4"
                      }>
                        {myCaseCards.map((caseItem, index) => (
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
                    ) : (
                      <EmptyState 
                        message="No cases assigned to you" 
                        description="Cases where you are the owner or creator will appear here"
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="pending-review" className="mt-0">
                    <EmptyState 
                      message="No cases pending review" 
                      description="Cases requiring your review will appear here"
                    />
                  </TabsContent>

                  <TabsContent value="archived" className="mt-0">
                    {archivedCaseCards.length > 0 ? (
                      <div className={viewMode === "grid" 
                        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                        : "space-y-4"
                      }>
                        {archivedCaseCards.map((caseItem, index) => (
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
                    ) : (
                      <EmptyState 
                        message="No archived cases" 
                        description="Closed cases will appear here"
                      />
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Empty State when no filter results */}
        {!isLoading && !error && allCases.length === 0 && searchQuery && (
          <Card className="border-border/40">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                No cases found matching "{searchQuery}"
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

function EmptyState({ message, description }: { message: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground font-medium">{message}</p>
      <p className="text-sm text-muted-foreground/70 mt-1">{description}</p>
    </div>
  );
}
