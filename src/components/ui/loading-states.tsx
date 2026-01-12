import { cn } from "@/lib/utils";
import { Scale, Check, Loader2, Search, Sparkles } from "lucide-react";

interface SearchLoadingProps {
  progress?: number;
  resultsFound?: number;
  className?: string;
}

export function SearchLoading({ progress = 0, resultsFound, className }: SearchLoadingProps) {
  return (
    <div className={cn("p-4 rounded-lg bg-card border border-border space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Scale className="w-4 h-4 text-primary animate-pulse" />
        <span className="text-sm font-medium">Searching India Kanoon...</span>
      </div>
      
      <div className="space-y-1.5">
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progress}%</span>
          {resultsFound !== undefined && (
            <span>Found {resultsFound} results, ranking by relevance</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface AIResponseLoadingProps {
  steps?: {
    label: string;
    status: "pending" | "active" | "done";
  }[];
  className?: string;
}

const defaultSteps = [
  { label: "Retrieving relevant sources", status: "done" as const },
  { label: "Analyzing legal principles", status: "active" as const },
  { label: "Generating response", status: "pending" as const },
  { label: "Verifying citations", status: "pending" as const },
];

export function AIResponseLoading({ steps = defaultSteps, className }: AIResponseLoadingProps) {
  return (
    <div className={cn("p-4 rounded-lg bg-card border border-border space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent animate-pulse" />
        <span className="text-sm font-medium">Researching your query...</span>
      </div>
      
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {step.status === "done" && (
              <Check className="w-4 h-4 text-success flex-shrink-0" />
            )}
            {step.status === "active" && (
              <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
            )}
            {step.status === "pending" && (
              <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex-shrink-0" />
            )}
            <span className={cn(
              step.status === "done" && "text-muted-foreground line-through",
              step.status === "active" && "text-foreground font-medium",
              step.status === "pending" && "text-muted-foreground"
            )}>
              {step.label}
              {step.status === "done" && step.label.includes("sources") && " (8)"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProcessingStepLoadingProps {
  title: string;
  description?: string;
  className?: string;
}

export function ProcessingStepLoading({ title, description, className }: ProcessingStepLoadingProps) {
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-card/50", className)}>
      <Loader2 className="w-5 h-5 text-primary animate-spin" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("p-4 rounded-lg bg-card border border-border space-y-3 animate-pulse", className)}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="h-3 w-1/2 bg-muted rounded" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-muted rounded" />
        <div className="h-5 w-20 bg-muted rounded" />
      </div>
      <div className="h-8 w-full bg-muted rounded" />
      <div className="flex gap-2">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
    </div>
  );
}
