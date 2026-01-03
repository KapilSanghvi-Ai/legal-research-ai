import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { CaseCard } from "@/components/dashboard/CaseCard";
import { TaskItem } from "@/components/dashboard/TaskItem";
import { RecentSourceCard } from "@/components/dashboard/RecentSourceCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FolderOpen,
  Clock,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data
const stats = [
  {
    title: "Active Cases",
    value: 24,
    subtitle: "Across 12 clients",
    icon: FolderOpen,
    variant: "default" as const,
    trend: { value: 8, isPositive: true },
  },
  {
    title: "Pending Deadlines",
    value: 7,
    subtitle: "Next 14 days",
    icon: Clock,
    variant: "warning" as const,
  },
  {
    title: "Drafts in Progress",
    value: 12,
    subtitle: "4 pending review",
    icon: FileText,
    variant: "accent" as const,
  },
  {
    title: "Research Sessions",
    value: 156,
    subtitle: "This month",
    icon: TrendingUp,
    variant: "success" as const,
    trend: { value: 23, isPositive: true },
  },
];

const recentCases = [
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
];

const tasks = [
  {
    title: "Prepare Written Submissions",
    caseRef: "Reliance Industries - AY 2021-22",
    dueDate: "Tomorrow",
    priority: "high" as const,
    isOverdue: false,
  },
  {
    title: "Review SOF Draft",
    caseRef: "Tata Steel - AY 2020-21",
    dueDate: "Jan 10",
    priority: "medium" as const,
    isOverdue: false,
  },
  {
    title: "Reply to SCN u/s 148A",
    caseRef: "ABC Pvt Ltd - AY 2019-20",
    dueDate: "Overdue",
    priority: "high" as const,
    isOverdue: true,
  },
  {
    title: "Compile Paper Book Annexures",
    caseRef: "XYZ Corp - AY 2021-22",
    dueDate: "Jan 18",
    priority: "low" as const,
    isOverdue: false,
  },
];

const recentSources = [
  {
    citation: "CIT vs. Lovely Exports (P) Ltd",
    title: "Supreme Court on Cash Credits u/s 68 - Identity of Creditors",
    court: "SC",
    date: "2008",
    relevance: "high" as const,
    isBookmarked: true,
  },
  {
    citation: "DCIT vs. Rohini Builders",
    title: "ITAT Mumbai on Bogus Purchases - Estimation of Profit",
    court: "ITAT Mumbai",
    date: "2023",
    relevance: "high" as const,
  },
  {
    citation: "Pr. CIT vs. NRA Iron & Steel",
    title: "Delhi HC on Section 68 - Burden of Proof on Assessee",
    court: "Delhi HC",
    date: "2019",
    relevance: "medium" as const,
    isBookmarked: true,
  },
];

export default function Dashboard() {
  return (
    <AppLayout title="Dashboard">
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cases Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Recent Cases
              </h2>
              <Link to="/cases">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentCases.map((caseItem, index) => (
                <CaseCard key={index} {...caseItem} />
              ))}
              <Card className="border-dashed border-2 border-border/60 hover:border-primary/30 transition-colors cursor-pointer flex items-center justify-center min-h-[160px]">
                <CardContent className="flex flex-col items-center text-muted-foreground">
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">New Case</span>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Upcoming Tasks
              </h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <Card>
              <CardContent className="p-2">
                <ScrollArea className="h-[320px]">
                  {tasks.map((task, index) => (
                    <TaskItem key={index} {...task} />
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Research Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Recent Research
            </h2>
            <Link to="/research">
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                New Research
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentSources.map((source, index) => (
              <RecentSourceCard key={index} {...source} />
            ))}
          </div>
        </div>

        {/* Footer Attribution */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/50">
          Powered by{" "}
          <a
            href="https://indiankanoon.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            India Kanoon
          </a>{" "}
          • Legal research made intelligent
        </div>
      </div>
    </AppLayout>
  );
}
