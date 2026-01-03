import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CaseCard } from "@/components/dashboard/CaseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    clientName: "Reliance Industries Ltd",
    assessmentYear: "2021-22",
    stage: "itat" as const,
    status: "hearing" as const,
    issues: ["Sec 68", "Sec 69", "Transfer Pricing"],
    nextDate: "Jan 15, 2026",
    owner: "Rajesh K.",
  },
  {
    clientName: "Tata Steel Ltd",
    assessmentYear: "2020-21",
    stage: "cita" as const,
    status: "drafting" as const,
    issues: ["Sec 40A(3)", "Depreciation"],
    nextDate: "Jan 22, 2026",
    owner: "Priya M.",
  },
  {
    clientName: "Infosys Technologies",
    assessmentYear: "2022-23",
    stage: "assessment" as const,
    status: "research" as const,
    issues: ["Sec 80-IA", "Software Exports"],
    owner: "Amit S.",
  },
  {
    clientName: "HDFC Bank Ltd",
    assessmentYear: "2019-20",
    stage: "itat" as const,
    status: "hearing" as const,
    issues: ["Sec 14A", "Disallowance"],
    nextDate: "Feb 5, 2026",
    owner: "Rajesh K.",
  },
  {
    clientName: "Wipro Ltd",
    assessmentYear: "2021-22",
    stage: "cita" as const,
    status: "drafting" as const,
    issues: ["Transfer Pricing", "ALP"],
    nextDate: "Jan 30, 2026",
    owner: "Priya M.",
  },
  {
    clientName: "Bajaj Auto Ltd",
    assessmentYear: "2020-21",
    stage: "closed" as const,
    status: "archived" as const,
    issues: ["Sec 37", "Business Expenditure"],
    owner: "Amit S.",
  },
  {
    clientName: "Sun Pharma Industries",
    assessmentYear: "2022-23",
    stage: "assessment" as const,
    status: "research" as const,
    issues: ["Sec 35", "R&D Expenditure"],
    nextDate: "Feb 10, 2026",
    owner: "Rajesh K.",
  },
  {
    clientName: "Mahindra & Mahindra",
    assessmentYear: "2021-22",
    stage: "cita" as const,
    status: "hearing" as const,
    issues: ["Sec 32", "Additional Depreciation"],
    nextDate: "Jan 25, 2026",
    owner: "Priya M.",
  },
];

export default function Cases() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredCases = allCases.filter((c) => {
    const matchesSearch =
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.issues.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStage = stageFilter === "all" || c.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

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

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              Active
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/10 rounded">
                {allCases.filter((c) => c.stage !== "closed").length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="my-cases">My Cases</TabsTrigger>
            <TabsTrigger value="pending-review">Pending Review</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCases.map((caseItem, index) => (
            <CaseCard key={index} {...caseItem} />
          ))}
        </div>

        {filteredCases.length === 0 && (
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
