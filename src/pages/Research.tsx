import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Scale,
  Calendar,
  Building2,
  Star,
  ExternalLink,
  Plus,
  FileText,
  Clock,
  Filter,
  Loader2,
  Brain,
  Globe,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  searchLegalCases, 
  semanticSearch, 
  type SearchResult, 
  type SemanticSearchResult 
} from "@/lib/api/search";
import { useToast } from "@/hooks/use-toast";
import { KnowledgeSearch } from "@/components/research/KnowledgeSearch";

const recentSearches = [
  "Section 68 cash credits burden of proof",
  "Bogus purchases addition estimation",
  "Reassessment notice validity 148A",
  "Transfer pricing arm's length determination",
];

const suggestedQueries = [
  "What constitutes sufficient proof for Section 68?",
  "Distinction between Section 68 and 69",
  "Penalty proceedings under Section 270A",
];

export default function Research() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [semanticResults, setSemanticResults] = useState<SemanticSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [courtFilter, setCourtFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic" | "knowledge">("keyword");
  const { toast } = useToast();

  const buildFilters = (pagenum: number = 0) => {
    const filters: { court?: string; fromYear?: number; toYear?: number; pagenum?: number } = { pagenum };
    
    if (courtFilter !== "all") {
      filters.court = courtFilter;
    }
    
    if (yearFilter !== "all") {
      switch (yearFilter) {
        case "2024":
          filters.fromYear = 2024;
          filters.toYear = 2024;
          break;
        case "2023":
          filters.fromYear = 2023;
          filters.toYear = 2023;
          break;
        case "2022":
          filters.fromYear = 2022;
          filters.toYear = 2022;
          break;
        case "2020-2021":
          filters.fromYear = 2020;
          filters.toYear = 2021;
          break;
        case "2015-2019":
          filters.fromYear = 2015;
          filters.toYear = 2019;
          break;
        case "older":
          filters.toYear = 2014;
          break;
      }
    }
    return filters;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setCurrentPage(0);
    setResults([]);
    setSemanticResults([]);
    
    try {
      if (searchMode === "semantic") {
        const response = await semanticSearch(searchQuery, 0.75, 20);
        setSemanticResults(response.results);
        setTotalResults(response.totalResults);
        setHasMore(false); // Semantic search doesn't support pagination
        
        if (response.results.length === 0) {
          toast({
            title: "No cached documents found",
            description: "Semantic search requires documents to be cached. Try keyword search first.",
          });
        }
      } else {
        const response = await searchLegalCases(searchQuery, buildFilters(0));
        setResults(response.results);
        setTotalResults(response.totalResults);
        setHasMore(response.results.length === 10 && response.totalResults > 10);
        
        if (response.results.length === 0) {
          toast({
            title: "No results found",
            description: "Try broadening your search terms or adjusting filters.",
          });
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    setIsLoadingMore(true);
    try {
      const response = await searchLegalCases(searchQuery, buildFilters(nextPage));
      setResults(prev => [...prev, ...response.results]);
      setCurrentPage(nextPage);
      setHasMore(response.results.length === 10);
    } catch (error) {
      console.error('Load more failed:', error);
      toast({
        title: "Failed to load more",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
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
    <AppLayout title="Legal Research">
      <div className="p-6 space-y-6">
        {/* Search Section */}
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="text-center mb-8">
            <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
              Research Indian Tax Case Law
            </h1>
            <p className="text-muted-foreground">
              Search through judgments from Supreme Court, High Courts, and ITAT
            </p>
          </div>

          {/* Search Mode Toggle */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Button
              variant={searchMode === "keyword" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("keyword")}
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              Keyword Search
            </Button>
            <Button
              variant={searchMode === "semantic" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("semantic")}
              className="gap-2"
            >
              <Brain className="w-4 h-4" />
              Semantic Search
            </Button>
            <Button
              variant={searchMode === "knowledge" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("knowledge")}
              className="gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Knowledge Base
            </Button>
            {searchMode === "semantic" && (
              <span className="text-xs text-muted-foreground ml-2">
                Searches cached documents using AI embeddings
              </span>
            )}
            {searchMode === "knowledge" && (
              <span className="text-xs text-muted-foreground ml-2">
                Search Google Drive knowledge base
              </span>
            )}
          </div>

          {/* Knowledge Base Mode */}
          {searchMode === "knowledge" ? (
            <KnowledgeSearch />
          ) : (
            <>
              {/* Search Bar */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by keywords, section, citation, or case name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-12 h-12 text-base bg-card border-border/60 focus:border-primary/40"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="h-12 px-8 bg-primary hover:bg-primary/90"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>

              {/* Filters - Only show for keyword search */}
              {searchMode === "keyword" && (
                <div className="flex items-center gap-3 flex-wrap">
                  <Select value={courtFilter} onValueChange={setCourtFilter}>
                    <SelectTrigger className="w-36">
                      <Building2 className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Court" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courts</SelectItem>
                      <SelectItem value="sc">Supreme Court</SelectItem>
                      <SelectItem value="hc">High Courts</SelectItem>
                      <SelectItem value="itat">ITAT</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-36">
                      <Calendar className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2020-2021">2020-2021</SelectItem>
                      <SelectItem value="2015-2019">2015-2019</SelectItem>
                      <SelectItem value="older">Before 2015</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    More Filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Results or Suggestions - Only show for non-knowledge modes */}
        {searchMode !== "knowledge" && (results.length > 0 || semanticResults.length > 0) ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {searchMode === "semantic" ? (
                  <>Found <span className="font-medium text-foreground">{semanticResults.length}</span> cached documents</>
                ) : (
                  <>Showing <span className="font-medium text-foreground">{results.length}</span> of{" "}
                  <span className="font-medium text-foreground">{totalResults.toLocaleString()}</span> judgments</>
                )}
              </p>
              <Tabs defaultValue="relevance">
                <TabsList className="h-8">
                  <TabsTrigger value="relevance" className="text-xs h-7">
                    {searchMode === "semantic" ? "Similarity" : "Relevance"}
                  </TabsTrigger>
                  <TabsTrigger value="date" className="text-xs h-7">
                    Date
                  </TabsTrigger>
                  <TabsTrigger value="court" className="text-xs h-7">
                    Court Level
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-3">
              {/* Semantic Search Results */}
              {searchMode === "semantic" && semanticResults.map((result, index) => (
                <Card
                  key={`${result.id}-${index}`}
                  className="hover:shadow-elevated transition-all cursor-pointer group border-border/60 hover:border-primary/20"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
                        <Brain className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
                              {result.citation}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Paragraph {result.paragraphNum} • {result.court}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                result.similarity >= 90
                                  ? "bg-success/15 text-success"
                                  : result.similarity >= 80
                                  ? "bg-warning/15 text-warning"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {result.similarity}% similar
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-foreground/80 mt-3 line-clamp-3">
                          {result.content}
                        </p>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5" />
                              {result.court}
                            </span>
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
                                  bookmarkedIds.has(result.id) &&
                                    "fill-accent text-accent"
                                )}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-muted-foreground hover:text-foreground"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add to Case
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Keyword Search Results */}
              {searchMode === "keyword" && results.map((result, index) => (
                <Card
                  key={`${result.docId}-${index}`}
                  className="hover:shadow-elevated transition-all cursor-pointer group border-border/60 hover:border-primary/20"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
                        <Scale className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
                              {result.citation}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {result.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                result.relevance >= 90
                                  ? "bg-success/15 text-success"
                                  : result.relevance >= 80
                                  ? "bg-warning/15 text-warning"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {result.relevance}% match
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-foreground/80 mt-3 line-clamp-2">
                          {result.snippet}
                        </p>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5" />
                              {result.court}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {result.date}
                            </span>
                            <div className="flex gap-1.5">
                              {result.sections.slice(0, 2).map((section, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs py-0"
                                >
                                  {section}
                                </Badge>
                              ))}
                            </div>
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
                                  bookmarkedIds.has(result.id) &&
                                    "fill-accent text-accent"
                                )}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-muted-foreground hover:text-foreground"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add to Case
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-muted-foreground hover:text-foreground"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Brief
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8"
                              onClick={() => window.open(result.url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
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

            {/* Load More Button - Only for keyword search */}
            {searchMode === "keyword" && hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="min-w-[200px]"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Results"
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Searches */}
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium text-foreground">
                    Recent Searches
                  </h3>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(search)}
                      className="w-full text-left text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 px-3 py-2 rounded-lg transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Suggested Queries */}
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium text-foreground">
                    Suggested Queries
                  </h3>
                </div>
                <div className="space-y-2">
                  {suggestedQueries.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(query)}
                      className="w-full text-left text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 px-3 py-2 rounded-lg transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attribution */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/50">
          Powered by{" "}
          <a
            href="https://indiankanoon.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            India Kanoon
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
