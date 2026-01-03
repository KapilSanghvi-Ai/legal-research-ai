import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Search,
  Plus,
  FolderOpen,
  Clock,
  Filter,
} from "lucide-react";

const documents = [
  {
    id: "1",
    title: "Statement of Facts - ABC Industries",
    type: "sof",
    case: "ABC Industries vs DCIT",
    lastModified: "2 hours ago",
    status: "draft",
  },
  {
    id: "2",
    title: "Grounds of Appeal - Section 68 Addition",
    type: "goa",
    case: "XYZ Ltd vs CIT",
    lastModified: "1 day ago",
    status: "final",
  },
  {
    id: "3",
    title: "Written Submissions - Transfer Pricing",
    type: "submission",
    case: "PQR Corp vs ACIT",
    lastModified: "3 days ago",
    status: "review",
  },
  {
    id: "4",
    title: "Legal Memo - Section 271(1)(c) Penalty",
    type: "memo",
    case: "Internal Research",
    lastModified: "1 week ago",
    status: "final",
  },
];

const typeLabels: Record<string, string> = {
  sof: "Statement of Facts",
  goa: "Grounds of Appeal",
  submission: "Written Submission",
  memo: "Legal Memo",
  brief: "Case Brief",
  reply: "Reply",
};

const statusColors: Record<string, string> = {
  draft: "bg-warning/15 text-warning",
  review: "bg-primary/15 text-primary",
  final: "bg-success/15 text-success",
};

export default function Documents() {
  return (
    <AppLayout title="Documents">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Documents
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your legal documents and drafts
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Document
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-10 bg-card border-border/60"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="hover:shadow-elevated transition-all cursor-pointer group border-border/60 hover:border-primary/20"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {typeLabels[doc.type] || doc.type}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge
                        variant="secondary"
                        className={statusColors[doc.status]}
                      >
                        {doc.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FolderOpen className="w-3 h-3" />
                        {doc.case}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {doc.lastModified}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* New Document Card */}
          <Card className="border-dashed border-2 border-border/60 hover:border-primary/40 transition-colors cursor-pointer group">
            <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[180px]">
              <div className="p-3 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Create New Document
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
