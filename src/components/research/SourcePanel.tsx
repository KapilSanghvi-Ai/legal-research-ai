import { useState } from "react";
import { Scale, Star, Plus, ExternalLink, Copy, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Source {
  id: string;
  citation: string;
  title: string;
  court: string;
  date: string;
  relevance: number;
  isBookmarked?: boolean;
  snippet?: string;
}

interface SourcePanelProps {
  sources: Source[];
  activeSourceId?: string;
  onSourceClick: (source: Source) => void;
}

export function SourcePanel({
  sources,
  activeSourceId,
  onSourceClick,
}: SourcePanelProps) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="p-4 border-b border-border">
        <h3 className="font-heading font-semibold text-foreground">Sources</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {sources.length} judgments found
        </p>
      </div>

      <Tabs defaultValue="ranked" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 grid grid-cols-3">
          <TabsTrigger value="ranked" className="text-xs">
            Ranked
          </TabsTrigger>
          <TabsTrigger value="bookmarked" className="text-xs">
            Saved
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs">
            Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ranked" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="p-2 space-y-1">
              {sources.map((source) => (
                <div
                  key={source.id}
                  onClick={() => onSourceClick(source)}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all group",
                    activeSourceId === source.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Scale className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {source.citation}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {source.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-1.5 py-0.5 bg-secondary rounded text-secondary-foreground">
                          {source.court}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {source.date}
                        </span>
                        <div className="flex-1" />
                        <div className="flex items-center gap-1">
                          <div
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              source.relevance > 80
                                ? "bg-success"
                                : source.relevance > 50
                                ? "bg-warning"
                                : "bg-muted-foreground"
                            )}
                          />
                          <span className="text-xs text-muted-foreground">
                            {source.relevance}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(source.id);
                      }}
                    >
                      <Star
                        className={cn(
                          "w-3.5 h-3.5",
                          bookmarkedIds.has(source.id)
                            ? "fill-accent text-accent"
                            : "text-muted-foreground"
                        )}
                      />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="bookmarked" className="flex-1 mt-0">
          <div className="p-4 text-center text-sm text-muted-foreground">
            <Star className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>Bookmarked sources will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="flex-1 mt-0">
          <div className="p-4 text-center text-sm text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>Research notes will appear here</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-3 border-t border-border">
        <Button variant="outline" size="sm" className="w-full text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add to Case
        </Button>
      </div>
    </div>
  );
}
