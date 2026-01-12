import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Scale } from "lucide-react";

interface ConfidenceMeterProps {
  level: "high" | "medium" | "low";
  sourceCount: number;
  primarySources?: number;   // SC judgments
  secondarySources?: number; // HC/ITAT
  hasConflicts?: boolean;
}

const levelConfig = {
  high: {
    label: "HIGH CONFIDENCE",
    fillPercentage: 80,
    barClass: "bg-success",
    icon: CheckCircle,
    iconClass: "text-success",
  },
  medium: {
    label: "MEDIUM CONFIDENCE",
    fillPercentage: 55,
    barClass: "bg-warning",
    icon: Scale,
    iconClass: "text-warning",
  },
  low: {
    label: "LOW CONFIDENCE",
    fillPercentage: 30,
    barClass: "bg-destructive",
    icon: AlertTriangle,
    iconClass: "text-destructive",
  },
};

export function ConfidenceMeter({
  level,
  sourceCount,
  primarySources = 0,
  secondarySources = 0,
  hasConflicts = false,
}: ConfidenceMeterProps) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <div className="p-4 rounded-lg bg-card border border-border space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", config.iconClass)} />
        <span className="text-xs font-semibold tracking-wide text-foreground">
          {config.label}
        </span>
        <span className="text-xs text-muted-foreground">
          ({sourceCount} sources)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", config.barClass)}
          style={{ width: `${config.fillPercentage}%` }}
        />
      </div>

      {/* Source Breakdown */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        {primarySources > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>{primarySources} Supreme Court judgment{primarySources !== 1 ? 's' : ''}</span>
          </div>
        )}
        {secondarySources > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>{secondarySources} High Court/ITAT decision{secondarySources !== 1 ? 's' : ''}</span>
          </div>
        )}
        {sourceCount - primarySources - secondarySources > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            <span>{sourceCount - primarySources - secondarySources} other source{(sourceCount - primarySources - secondarySources) !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Conflict Warning */}
      {!hasConflicts && level === "high" && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            No conflicting precedents found
          </span>
        </div>
      )}
      {hasConflicts && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <AlertTriangle className="w-3.5 h-3.5 text-warning" />
          <span className="text-xs text-warning">
            Conflicting precedents detected - review carefully
          </span>
        </div>
      )}
    </div>
  );
}
