import { Calendar, User, MoreVertical, FileText, Clock, AlertTriangle, Scale, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  assessment: { label: "Assessment", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  cita: { label: "CIT(A)", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  itat: { label: "ITAT", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  hc: { label: "High Court", color: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  closed: { label: "Closed", color: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

const statusConfig = {
  drafting: { label: "Drafting", dotColor: "bg-info" },
  research: { label: "Research", dotColor: "bg-purple-500" },
  hearing: { label: "Hearing", dotColor: "bg-warning" },
  archived: { label: "Archived", dotColor: "bg-muted-foreground" },
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
  const currentStageIndex = allStages.indexOf(stage as typeof allStages[number]);

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 cursor-pointer",
      "border-border/50 hover:border-primary/30 hover:shadow-lg",
      "bg-card hover:bg-card/80",
      isUrgent && "ring-1 ring-warning/30 border-warning/40"
    )}>
      {/* Urgent indicator stripe */}
      {isUrgent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning to-warning/60" />
      )}

      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Client Avatar */}
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-transform group-hover:scale-105",
              "bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/10"
            )}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors truncate text-base">
                {clientName}
              </h3>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                vs. {opposingParty}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onOpen} className="gap-2">
                <FileText className="w-4 h-4" />
                Open Case
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onQuickNote} className="gap-2">
                <Scale className="w-4 h-4" />
                Add Note
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onUpdateDeadline} className="gap-2">
                <Calendar className="w-4 h-4" />
                Update Deadline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Case Reference */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">AY {assessmentYear}</span>
          {itaNumber && (
            <>
              <span className="text-border">•</span>
              <span className="truncate">{itaNumber}</span>
            </>
          )}
        </div>

        {/* Stage & Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant="secondary" 
            className={cn("text-xs font-medium px-2.5 py-0.5 rounded-md", stageConfig[stage].color)}
          >
            {stageConfig[stage].label}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig[status].dotColor)} />
            {statusConfig[status].label}
          </div>
        </div>

        {/* Issues */}
        <div className="flex flex-wrap gap-1.5">
          {issues.slice(0, 3).map((issue, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-secondary/60 text-secondary-foreground text-xs rounded-md font-medium"
            >
              {issue}
            </span>
          ))}
          {issues.length > 3 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="px-2 py-1 text-muted-foreground text-xs cursor-help">
                    +{issues.length - 3} more
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>{issues.slice(3).join(", ")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Next Hearing Alert */}
        {nextDate && (
          <div className={cn(
            "flex items-center gap-2.5 text-sm p-3 rounded-lg transition-colors",
            isUrgent 
              ? "bg-warning/10 text-warning border border-warning/20" 
              : "bg-muted/50 text-foreground"
          )}>
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Next Hearing</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-medium">{nextDate}</span>
                {daysUntilHearing !== undefined && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-md",
                    isUrgent ? "bg-warning/20" : "bg-muted"
                  )}>
                    {daysUntilHearing === 0 ? "Today" : daysUntilHearing === 1 ? "Tomorrow" : `${daysUntilHearing} days`}
                  </span>
                )}
              </div>
            </div>
            {isUrgent && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          </div>
        )}

        {/* Owner & Activity Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {owner}
            </span>
            {lastActivity && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {lastActivity}
              </span>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {allStages.map((s, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = s === stage;
              const isClosed = stage === "closed";
              
              return (
                <TooltipProvider key={s}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-colors cursor-help",
                        isClosed || isCompleted ? "bg-success" : isCurrent ? "bg-primary" : "bg-border"
                      )} />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {stageConfig[s].label}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* Hover Action */}
        <div className="absolute inset-x-0 bottom-0 p-4 pt-8 bg-gradient-to-t from-card via-card/95 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            onClick={onOpen} 
            className="w-full gap-2 shadow-md"
            size="sm"
          >
            Open Case
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
