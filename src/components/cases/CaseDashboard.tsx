import { EnhancedCaseCard } from "@/components/dashboard/EnhancedCaseCard";
import { AlertTriangle, FileEdit, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CaseData {
  id: string;
  clientName: string;
  clientInitials?: string;
  opposingParty: string;
  assessmentYear: string;
  pan?: string;
  itaNumber?: string;
  stage: "assessment" | "cita" | "itat" | "hc" | "closed";
  status: "drafting" | "research" | "hearing" | "archived";
  issues: string[];
  nextDate?: string;
  daysUntilHearing?: number;
  owner: string;
  lastActivity?: string;
  completionPercent?: number;
}

interface CaseDashboardProps {
  cases: CaseData[];
  onNewCase?: () => void;
  onCaseClick?: (caseId: string) => void;
}

interface CaseSectionProps {
  title: string;
  icon: React.ReactNode;
  cases: CaseData[];
  iconClass?: string;
  onCaseClick?: (caseId: string) => void;
}

function CaseSection({ title, icon, cases, iconClass, onCaseClick }: CaseSectionProps) {
  if (cases.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={cn("flex items-center justify-center", iconClass)}>
          {icon}
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {title}
        </h3>
        <span className="text-xs text-muted-foreground">({cases.length})</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {cases.map((caseItem) => (
          <EnhancedCaseCard
            key={caseItem.id}
            {...caseItem}
            onOpen={() => onCaseClick?.(caseItem.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function CaseDashboard({ cases, onNewCase, onCaseClick }: CaseDashboardProps) {
  // Categorize cases
  const urgentCases = cases.filter(
    (c) => c.daysUntilHearing !== undefined && c.daysUntilHearing <= 7 && c.stage !== "closed"
  );
  
  const draftingCases = cases.filter(
    (c) => c.status === "drafting" && !urgentCases.includes(c)
  );
  
  const researchCases = cases.filter(
    (c) => c.status === "research" && !urgentCases.includes(c)
  );

  const hearingCases = cases.filter(
    (c) => c.status === "hearing" && !urgentCases.includes(c)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-semibold">My Cases</h2>
        <Button onClick={onNewCase} className="gap-2">
          <Plus className="w-4 h-4" />
          New Case
        </Button>
      </div>

      {/* Case Sections */}
      <div className="space-y-8">
        <CaseSection
          title="Urgent (Hearings in 7 days)"
          icon={<AlertTriangle className="w-4 h-4" />}
          iconClass="text-warning"
          cases={urgentCases}
          onCaseClick={onCaseClick}
        />

        <CaseSection
          title="Drafting in Progress"
          icon={<FileEdit className="w-4 h-4" />}
          iconClass="text-info"
          cases={draftingCases}
          onCaseClick={onCaseClick}
        />

        <CaseSection
          title="Research Phase"
          icon={<Search className="w-4 h-4" />}
          iconClass="text-purple-500"
          cases={researchCases}
          onCaseClick={onCaseClick}
        />

        <CaseSection
          title="Hearing Phase"
          icon={<AlertTriangle className="w-4 h-4" />}
          iconClass="text-accent"
          cases={hearingCases}
          onCaseClick={onCaseClick}
        />
      </div>

      {cases.length === 0 && (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground mb-4">No cases found</p>
          <Button onClick={onNewCase} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create your first case
          </Button>
        </div>
      )}
    </div>
  );
}
