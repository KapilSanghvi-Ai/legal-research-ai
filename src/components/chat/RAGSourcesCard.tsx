import { useState } from "react";
import { ChevronDown, ChevronUp, Database, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface RAGSource {
  id: number;
  citation: string;
  court: string;
  content: string;
  similarity: number;
  sourceId: string;
}

interface RAGSourcesCardProps {
  sources: RAGSource[];
}

export function RAGSourcesCard({ sources }: RAGSourcesCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSource, setExpandedSource] = useState<number | null>(null);

  if (sources.length === 0) return null;

  return (
    <div className="my-3 rounded-lg border border-border bg-muted/30 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-4 py-3 h-auto hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">
                {sources.length} RAG Sources Used
              </span>
              <span className="text-xs text-muted-foreground">
                (from database)
              </span>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="rounded-md border border-border/50 bg-background overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedSource(
                      expandedSource === source.id ? null : source.id
                    )
                  }
                  className="w-full px-3 py-2 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-medium flex items-center justify-center">
                    {source.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {source.citation}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {source.court}
                      </span>
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          source.similarity >= 80
                            ? "bg-success/15 text-success"
                            : source.similarity >= 70
                            ? "bg-warning/15 text-warning"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {source.similarity}% match
                      </span>
                    </div>
                  </div>
                  {expandedSource === source.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {expandedSource === source.id && (
                  <div className="px-3 pb-3 pt-1 border-t border-border/50">
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {source.content}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-primary"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Full Judgment
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
