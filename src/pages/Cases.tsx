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
import {
  Plus,
  Search,
  Filter,
  Upload,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";

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

  return (
    <AppLayout title="Cases">
      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search cases, clients, issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="cita">CIT(A)</SelectItem>
                <SelectItem value="itat">ITAT</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border rounded-lg p-0.5">
              <Button
                variant={viewMode === "dashboard" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => setViewMode("dashboard")}
              >
                Dashboard
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </Button>
          </div>
        </div>

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
          <>
            {/* Tabs */}
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">
                  Active
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/10 rounded">
                    {activeCases.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="my-cases">My Cases</TabsTrigger>
                <TabsTrigger value="pending-review">Pending Review</TabsTrigger>
                <TabsTrigger value="archived">
                  Archived
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">
                    {archivedCases.length}
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-6">
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-4"
                }>
                  {activeCases.map((caseItem) => (
                    <EnhancedCaseCard
                      key={caseItem.id}
                      {...caseItem}
                      onOpen={() => console.log("Open:", caseItem.id)}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="my-cases" className="mt-6">
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-4"
                }>
                  {activeCases.filter(c => c.owner === "Rajesh K.").map((caseItem) => (
                    <EnhancedCaseCard
                      key={caseItem.id}
                      {...caseItem}
                      onOpen={() => console.log("Open:", caseItem.id)}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="pending-review" className="mt-6">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No cases pending review</p>
                </div>
              </TabsContent>

              <TabsContent value="archived" className="mt-6">
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-4"
                }>
                  {archivedCases.map((caseItem) => (
                    <EnhancedCaseCard
                      key={caseItem.id}
                      {...caseItem}
                      onOpen={() => console.log("Open:", caseItem.id)}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {filteredCases.length === 0 && viewMode !== "dashboard" && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No cases found matching your criteria
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
