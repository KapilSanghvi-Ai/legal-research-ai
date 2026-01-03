import { Scale, ExternalLink, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecentSourceCardProps {
  citation: string;
  title: string;
  court: string;
  date: string;
  relevance: "high" | "medium" | "low";
  isBookmarked?: boolean;
}

const relevanceColors = {
  high: "text-success",
  medium: "text-warning",
  low: "text-muted-foreground",
};

export function RecentSourceCard({
  citation,
  title,
  court,
  date,
  relevance,
  isBookmarked,
}: RecentSourceCardProps) {
  return (
    <div className="group p-3 rounded-lg border border-border/50 hover:border-primary/20 hover:bg-secondary/30 transition-all cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-primary/10">
          <Scale className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {citation}
            </p>
            {isBookmarked && (
              <Star className="w-3.5 h-3.5 text-accent fill-accent flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{title}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs py-0">
              {court}
            </Badge>
            <span className="text-xs text-muted-foreground">{date}</span>
            <span className={`text-xs font-medium ${relevanceColors[relevance]}`}>
              {relevance.charAt(0).toUpperCase() + relevance.slice(1)} relevance
            </span>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </div>
  );
}
