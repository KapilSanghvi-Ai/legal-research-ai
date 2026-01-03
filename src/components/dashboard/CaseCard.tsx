import { Calendar, User, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CaseCardProps {
  clientName: string;
  assessmentYear: string;
  stage: "assessment" | "cita" | "itat" | "closed";
  status: "drafting" | "research" | "hearing" | "archived";
  issues: string[];
  nextDate?: string;
  owner: string;
}

const stageLabels = {
  assessment: "Assessment",
  cita: "CIT(A)",
  itat: "ITAT",
  closed: "Closed",
};

const statusStyles = {
  drafting: "status-drafting",
  research: "status-research",
  hearing: "status-hearing",
  archived: "status-closed",
};

export function CaseCard({
  clientName,
  assessmentYear,
  stage,
  status,
  issues,
  nextDate,
  owner,
}: CaseCardProps) {
  return (
    <Card className="group hover:shadow-elevated transition-all duration-200 cursor-pointer border-border/60 hover:border-primary/20">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
              {clientName}
            </h3>
            <p className="text-sm text-muted-foreground">AY {assessmentYear}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stageLabels[stage]}
            </Badge>
            <span className={cn("status-chip", statusStyles[status])}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>

        {/* Issues */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {issues.slice(0, 3).map((issue, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-md"
            >
              {issue}
            </span>
          ))}
          {issues.length > 3 && (
            <span className="px-2 py-0.5 text-muted-foreground text-xs">
              +{issues.length - 3} more
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {nextDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {nextDate}
              </span>
            )}
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {owner}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}
