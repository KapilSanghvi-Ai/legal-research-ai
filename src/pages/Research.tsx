import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  citation: string;
  title: string;
  court: string;
  bench?: string;
  date: string;
  snippet: string;
  relevance: number;
  sections: string[];
  isBookmarked?: boolean;
}

const mockResults: SearchResult[] = [
  {
    id: "1",
    citation: "CIT vs. Lovely Exports (P) Ltd [2008] 216 CTR 195 (SC)",
    title:
      "Share Application Money - Section 68 - Identity of Shareholders - Burden of Proof",
    court: "Supreme Court",
    date: "January 15, 2008",
    snippet:
      "Where the assessee has received subscriptions to share capital and has furnished complete particulars of the share applicants including their PAN, the initial onus to prove the identity of creditors stands discharged...",
    relevance: 98,
    sections: ["Section 68", "Section 69"],
    isBookmarked: true,
  },
  {
    id: "2",
    citation: "Pr. CIT vs. NRA Iron & Steel [2019] 412 ITR 161 (SC)",
    title:
      "Section 68 - Three Ingredients - Identity, Creditworthiness, Genuineness",
    court: "Supreme Court",
    bench: "Justice R.F. Nariman, Justice Vineet Saran",
    date: "March 5, 2019",
    snippet:
      "The assessee is under a legal obligation to prove the receipt of share capital/premium to the satisfaction of the AO, failure of which, the AO is entitled to treat the same as income of the assessee...",
    relevance: 95,
    sections: ["Section 68"],
  },
  {
    id: "3",
    citation: "CIT vs. Orissa Corporation (P) Ltd [1986] 159 ITR 78 (SC)",
    title: "Burden of Proof in Income Tax - Foundational Principles",
    court: "Supreme Court",
    date: "August 12, 1986",
    snippet:
      "The onus of proving that a particular receipt is not taxable or is exempt from tax rests on the assessee who claims exemption. This principle has been consistently followed...",
    relevance: 88,
    sections: ["General Principles"],
  },
  {
    id: "4",
    citation: "DCIT vs. Rohini Builders [2023] 152 ITD 234 (Mum)",
    title: "Bogus Purchases - Estimation of Profit - 12.5% GP Rate",
    court: "ITAT Mumbai",
    bench: "Shri Vikas Awasthy, JM & Shri M. Balaganesh, AM",
    date: "July 20, 2023",
    snippet:
      "Where purchases are found to be from non-genuine parties but corresponding sales are not disputed, the entire purchase amount cannot be disallowed. Only profit element embedded in such purchases can be added...",
    relevance: 85,
    sections: ["Section 69C", "Bogus Purchases"],
  },
];

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
  const [isSearching, setIsSearching] = useState(false);
  const [courtFilter, setCourtFilter] = useState("all");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    new Set(["1"])
  );

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    // Simulate search
    setTimeout(() => {
      setResults(mockResults);
      setIsSearching(false);
    }, 1000);
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
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Filters */}
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
            <Select>
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
        </div>

        {/* Results or Suggestions */}
        {results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found <span className="font-medium text-foreground">{results.length}</span> relevant judgments
              </p>
              <Tabs defaultValue="relevance">
                <TabsList className="h-8">
                  <TabsTrigger value="relevance" className="text-xs h-7">
                    Relevance
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
              {results.map((result) => (
                <Card
                  key={result.id}
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
                            <Button variant="outline" size="sm" className="h-8">
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
