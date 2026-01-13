import { EnhancedCaseCard } from "@/components/dashboard/EnhancedCaseCard";
import { AlertTriangle, FileEdit, Search, Plus, Gavel, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  isLoading?: boolean;
  onNewCase?: () => void;
  onCaseClick?: (caseId: string) => void;
}

interface CaseSectionProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  cases: CaseData[];
  iconClass?: string;
  borderColor?: string;
  onCaseClick?: (caseId: string) => void;
  emptyMessage?: string;
  isLoading?: boolean;
}

function CaseSectionSkeleton() {
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/40">
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
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CaseSection({ 
  title, 
  description,
  icon, 
  cases, 
  iconClass, 
  borderColor,
  onCaseClick,
  emptyMessage,
  isLoading 
}: CaseSectionProps) {
  if (isLoading) {
    return <CaseSectionSkeleton />;
  }

  return (
    <Card className={cn("border-border/40", borderColor)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              iconClass
            )}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                {title}
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {cases.length}
                </span>
              </CardTitle>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {cases.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {cases.map((caseItem, index) => (
              <div 
                key={caseItem.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <EnhancedCaseCard
                  {...caseItem}
                  onOpen={() => onCaseClick?.(caseItem.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {emptyMessage || "No cases in this category"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CaseDashboard({ cases, isLoading, onNewCase, onCaseClick }: CaseDashboardProps) {
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CaseSectionSkeleton />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CaseSectionSkeleton />
          <CaseSectionSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Urgent Section */}
      {urgentCases.length > 0 && (
        <CaseSection
          title="Urgent Attention Required"
          description="Cases with hearings scheduled within the next 7 days"
          icon={<AlertTriangle className="w-5 h-5 text-warning" />}
          iconClass="bg-warning/10"
          borderColor="border-l-4 border-l-warning"
          cases={urgentCases}
          onCaseClick={onCaseClick}
        />
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CaseSection
          title="Drafting in Progress"
          description="Documents being prepared"
          icon={<FileEdit className="w-5 h-5 text-info" />}
          iconClass="bg-info/10"
          cases={draftingCases}
          onCaseClick={onCaseClick}
          emptyMessage="No cases currently in drafting stage"
        />

        <CaseSection
          title="Research Phase"
          description="Legal research ongoing"
          icon={<BookOpen className="w-5 h-5 text-purple-500" />}
          iconClass="bg-purple-500/10"
          cases={researchCases}
          onCaseClick={onCaseClick}
          emptyMessage="No cases in research phase"
        />
      </div>

      {/* Hearing Cases */}
      {hearingCases.length > 0 && (
        <CaseSection
          title="Hearing Phase"
          description="Cases currently being heard"
          icon={<Gavel className="w-5 h-5 text-accent" />}
          iconClass="bg-accent/10"
          cases={hearingCases}
          onCaseClick={onCaseClick}
        />
      )}

      {/* Empty State */}
      {cases.length === 0 && (
        <Card className="border-border/40 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
              No cases yet
            </h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Get started by creating your first case. All your litigation matters will be organized here.
            </p>
            <Button onClick={onNewCase} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Case
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
