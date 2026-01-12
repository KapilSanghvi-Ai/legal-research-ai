import { Calendar, User, ArrowRight, MoreVertical, FileText, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface EnhancedCaseCardProps {
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
  onOpen?: () => void;
  onQuickNote?: () => void;
  onUpdateDeadline?: () => void;
}

const stageConfig = {
  assessment: { label: "Assessment", order: 0 },
  cita: { label: "CIT(A)", order: 1 },
  itat: { label: "ITAT", order: 2 },
  hc: { label: "HC", order: 3 },
  closed: { label: "Closed", order: 4 },
};

const statusStyles = {
  drafting: "status-drafting",
  research: "status-research",
  hearing: "status-hearing",
  archived: "status-closed",
};

const allStages = ["assessment", "cita", "itat", "hc"] as const;

export function EnhancedCaseCard({
  id,
  clientName,
  clientInitials,
  opposingParty,
  assessmentYear,
  pan,
  itaNumber,
  stage,
  status,
  issues,
  nextDate,
  daysUntilHearing,
  owner,
  lastActivity,
  onOpen,
  onQuickNote,
  onUpdateDeadline,
}: EnhancedCaseCardProps) {
  const initials = clientInitials || clientName.split(' ').map(w => w[0]).join('').slice(0, 2);
  const isUrgent = daysUntilHearing !== undefined && daysUntilHearing <= 7;
  const currentStageOrder = stageConfig[stage].order;

  return (
    <Card className={cn(
      "group hover:shadow-elevated transition-all duration-200 cursor-pointer border-border/60 hover:border-primary/20",
      isUrgent && "border-warning/50"
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Client Initials Badge */}
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {clientName}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                vs. {opposingParty}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpen}>Open Case</DropdownMenuItem>
              <DropdownMenuItem onClick={onQuickNote}>Add Note</DropdownMenuItem>
              <DropdownMenuItem onClick={onUpdateDeadline}>Update Deadline</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Case Details */}
        <div className="text-xs text-muted-foreground space-x-2">
          <span>AY {assessmentYear}</span>
          {pan && <span>• PAN: {pan.slice(0, 5)}****{pan.slice(-1)}</span>}
          {itaNumber && <span>• {itaNumber}</span>}
        </div>

        {/* Stage, Status, Issues */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {stageConfig[stage].label}
          </Badge>
          <span className={cn("status-chip", statusStyles[status])}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          <Badge variant="secondary" className="text-xs">
            {issues.length} Issue{issues.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Issues List */}
        <div className="flex flex-wrap gap-1.5">
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

        {/* Next Hearing */}
        {nextDate && (
          <div className={cn(
            "flex items-center gap-2 text-sm p-2 rounded-md",
            isUrgent ? "bg-warning/10 text-warning" : "bg-muted"
          )}>
            <Calendar className="w-4 h-4" />
            <span className="font-medium">NEXT HEARING:</span>
            <span>{nextDate}</span>
            {daysUntilHearing !== undefined && (
              <span className="text-xs">
                ({daysUntilHearing} day{daysUntilHearing !== 1 ? 's' : ''})
              </span>
            )}
            {isUrgent && <AlertTriangle className="w-4 h-4 ml-auto" />}
          </div>
        )}

        {/* Owner & Activity */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {owner}
          </span>
          {lastActivity && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {lastActivity}
            </span>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-1 pt-2 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground mr-2">PROGRESS:</span>
          {allStages.map((s, index) => {
            const stageOrder = stageConfig[s].order;
            const isCurrent = s === stage;
            const isCompleted = stageOrder < currentStageOrder;
            const isClosed = stage === "closed";
            
            return (
              <div key={s} className="flex items-center">
                {index > 0 && (
                  <div className={cn(
                    "w-4 h-0.5 mx-0.5",
                    isCompleted || isClosed ? "bg-success" : "bg-border"
                  )} />
                )}
                <div className={cn(
                  "flex items-center justify-center text-[9px] font-medium",
                  isCurrent && !isClosed && "text-primary",
                  isCompleted || isClosed ? "text-success" : "text-muted-foreground"
                )}>
                  {isCompleted || isClosed ? "✓" : isCurrent ? "●" : "○"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={onOpen}>
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Open Case
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={onQuickNote}>
            Quick Note
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={onUpdateDeadline}>
            <Calendar className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
