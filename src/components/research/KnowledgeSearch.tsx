import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  BookOpen,
  FileText,
  ExternalLink,
  Star,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKnowledgeSearch } from "@/hooks/use-gdrive";
import { KnowledgeResult } from "@/lib/gdrive";

export function KnowledgeSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const { data: results = [], isLoading, error } = useKnowledgeSearch({
    query: activeQuery,
    threshold: 0.7,
    limit: 20,
  });

  const handleSearch = () => {
    if (searchQuery.trim().length > 2) {
      setActiveQuery(searchQuery.trim());
    }
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Knowledge Base Search
          </h2>
          <p className="text-sm text-muted-foreground">
            Search through indexed documents using AI-powered semantic search
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base with natural language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-12 h-12 text-base bg-card border-border/60 focus:border-primary/40"
          />
        </div>
        <Button
          onClick={handleSearch}
          className="h-12 px-8"
          disabled={isLoading || searchQuery.trim().length < 3}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {/* Example Queries */}
      {!activeQuery && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Try searching for:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Transfer pricing documentation requirements",
              "Section 68 burden of proof",
              "Penalty proceedings timeline",
              "Assessment reopening grounds",
            ].map((query) => (
              <Button
                key={query}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery(query);
                  setActiveQuery(query);
                }}
                className="text-xs"
              >
                {query}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              Search failed: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Found <span className="font-medium text-foreground">{results.length}</span> relevant
            passages
          </p>

          <div className="space-y-3">
            {results.map((result, index) => (
              <Card
                key={`${result.id}-${index}`}
                className="hover:shadow-elevated transition-all cursor-pointer group border-border/60 hover:border-primary/20"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {result.fileName}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            From Knowledge Base
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "flex-shrink-0",
                            result.similarity >= 0.9
                              ? "bg-success/15 text-success"
                              : result.similarity >= 0.8
                              ? "bg-warning/15 text-warning"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {Math.round(result.similarity * 100)}% match
                        </Badge>
                      </div>

                      <p className="text-sm text-foreground/80 mt-3 line-clamp-3">
                        {result.content}
                      </p>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Knowledge Base</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(result.id);
                            }}
                          >
                            <Star
                              className={cn(
                                "w-4 h-4",
                                bookmarkedIds.has(result.id) && "fill-accent text-accent"
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-muted-foreground hover:text-foreground gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && activeQuery && results.length === 0 && !error && (
        <Card className="border-border/60">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">No results found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              No matching documents found in the knowledge base. Try different search terms or
              index more documents.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
