import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Search,
  Plus,
  Copy,
  Download,
  Star,
} from "lucide-react";

const templates = [
  {
    id: "1",
    title: "Grounds of Appeal - Section 68",
    description: "Standard template for challenging Section 68 additions with citations",
    category: "Appeal",
    downloads: 245,
    starred: true,
  },
  {
    id: "2",
    title: "Statement of Facts - General",
    description: "Comprehensive SoF template covering chronological facts",
    category: "ITAT",
    downloads: 189,
    starred: false,
  },
  {
    id: "3",
    title: "Written Submissions - Penalty 271(1)(c)",
    description: "Arguments against penalty for concealment of income",
    category: "Penalty",
    downloads: 156,
    starred: true,
  },
  {
    id: "4",
    title: "Legal Memo - Transfer Pricing",
    description: "Internal memo format for TP matters analysis",
    category: "Memo",
    downloads: 98,
    starred: false,
  },
  {
    id: "5",
    title: "Reply to Show Cause Notice",
    description: "Standard reply format for SCN under various sections",
    category: "Reply",
    downloads: 312,
    starred: false,
  },
  {
    id: "6",
    title: "Table of Authorities",
    description: "Format for listing judicial precedents with citations",
    category: "General",
    downloads: 178,
    starred: true,
  },
];

const categoryColors: Record<string, string> = {
  Appeal: "bg-primary/15 text-primary",
  ITAT: "bg-accent/15 text-accent",
  Penalty: "bg-warning/15 text-warning",
  Memo: "bg-secondary text-secondary-foreground",
  Reply: "bg-muted text-muted-foreground",
  General: "bg-muted text-muted-foreground",
};

export default function Templates() {
  return (
    <AppLayout title="Templates">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Document Templates
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pre-built templates for common legal documents
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Template
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-10 bg-card border-border/60"
          />
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-elevated transition-all cursor-pointer group border-border/60 hover:border-primary/20"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-accent"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        template.starred ? "fill-accent text-accent" : ""
                      }`}
                    />
                  </Button>
                </div>
                <div className="mt-4">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {template.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Badge
                    variant="secondary"
                    className={categoryColors[template.category]}
                  >
                    {template.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {template.downloads} uses
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <Copy className="w-3.5 h-3.5" />
                    Use
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
