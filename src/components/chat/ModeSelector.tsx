import { cn } from "@/lib/utils";
import { AlertTriangle, BookOpen, Sparkles, FileText, Scale } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type ResponseMode = "sources-only" | "balanced" | "creative" | "tribunal";

interface ModeSelectorProps {
  value: ResponseMode;
  onChange: (value: ResponseMode) => void;
  className?: string;
}

const modes = [
  {
    id: "sources-only" as ResponseMode,
    label: "Sources Only",
    description: "Quick list of relevant judgments with citations only",
    icon: BookOpen,
  },
  {
    id: "balanced" as ResponseMode,
    label: "Balanced",
    description: "Analysis with citations, explanations, and legal principles",
    icon: Scale,
    recommended: true,
  },
  {
    id: "creative" as ResponseMode,
    label: "Creative",
    description: "Novel arguments, analogies, and alternative interpretations",
    icon: Sparkles,
    warning: "Requires verification before use in submissions",
  },
  {
    id: "tribunal" as ResponseMode,
    label: "Tribunal Ready",
    description: "Formal language, numbered paragraphs, ready for submissions",
    subtext: "Formatted for direct use in appeal documents",
    icon: FileText,
  },
];

export function ModeSelector({ value, onChange, className }: ModeSelectorProps) {
  return (
    <div className={cn("p-4 rounded-lg bg-card border border-border", className)}>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Response Mode
      </h4>
      
      <RadioGroup value={value} onValueChange={(v) => onChange(v as ResponseMode)} className="space-y-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = value === mode.id;
          
          return (
            <Label
              key={mode.id}
              htmlFor={mode.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              <RadioGroupItem value={mode.id} id={mode.id} className="mt-0.5" />
              <Icon className={cn(
                "w-4 h-4 mt-0.5 flex-shrink-0",
                isSelected ? "text-primary" : "text-muted-foreground"
              )} />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium text-sm",
                    isSelected ? "text-foreground" : "text-foreground/80"
                  )}>
                    {mode.label}
                  </span>
                  {mode.recommended && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {mode.description}
                </p>
                {mode.subtext && (
                  <p className="text-xs text-muted-foreground/80">
                    {mode.subtext}
                  </p>
                )}
                {mode.warning && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <AlertTriangle className="w-3 h-3 text-warning" />
                    <span className="text-[10px] text-warning">
                      {mode.warning}
                    </span>
                  </div>
                )}
              </div>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
