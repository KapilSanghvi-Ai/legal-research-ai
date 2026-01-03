import { Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  title: string;
  caseRef: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  isOverdue?: boolean;
}

const priorityStyles = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-muted-foreground",
};

export function TaskItem({
  title,
  caseRef,
  dueDate,
  priority,
  isOverdue,
}: TaskItemProps) {
  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
      <div className={cn("w-1.5 h-8 rounded-full", priorityStyles[priority])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {title}
        </p>
        <p className="text-xs text-muted-foreground">{caseRef}</p>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <Clock className={cn("w-3.5 h-3.5", isOverdue ? "text-destructive" : "text-muted-foreground")} />
        <span className={cn(isOverdue ? "text-destructive font-medium" : "text-muted-foreground")}>
          {dueDate}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
