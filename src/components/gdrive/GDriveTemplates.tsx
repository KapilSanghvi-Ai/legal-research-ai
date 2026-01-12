import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Search,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileImage,
  File,
  RefreshCw,
} from "lucide-react";
import { useTemplateFiles, useGenerateFromTemplate, useDownloadFile } from "@/hooks/use-gdrive";
import type { GDriveFile } from "@/lib/gdrive";

interface TemplateVariablesDialogProps {
  template: GDriveFile;
  onGenerate: (variables: Record<string, string>) => void;
  isGenerating: boolean;
}

function TemplateVariablesDialog({ template, onGenerate, isGenerating }: TemplateVariablesDialogProps) {
  const [variables, setVariables] = useState<Record<string, string>>({
    ClientName: "",
    AY: "",
    PAN: "",
    CaseNumber: "",
    Amount: "",
    AO: "",
    Date: new Date().toLocaleDateString("en-IN"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(variables);
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Generate from "{template.name}"</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ClientName">Client Name</Label>
            <Input
              id="ClientName"
              value={variables.ClientName}
              onChange={(e) => setVariables({ ...variables, ClientName: e.target.value })}
              placeholder="e.g., Reliance Industries"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="AY">Assessment Year</Label>
            <Input
              id="AY"
              value={variables.AY}
              onChange={(e) => setVariables({ ...variables, AY: e.target.value })}
              placeholder="e.g., 2021-22"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="PAN">PAN</Label>
            <Input
              id="PAN"
              value={variables.PAN}
              onChange={(e) => setVariables({ ...variables, PAN: e.target.value })}
              placeholder="e.g., AAACR5765M"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="CaseNumber">Case Number</Label>
            <Input
              id="CaseNumber"
              value={variables.CaseNumber}
              onChange={(e) => setVariables({ ...variables, CaseNumber: e.target.value })}
              placeholder="e.g., ITA 1234/Mum/2024"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="Amount">Amount (₹)</Label>
            <Input
              id="Amount"
              value={variables.Amount}
              onChange={(e) => setVariables({ ...variables, Amount: e.target.value })}
              placeholder="e.g., 5,00,00,000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="AO">Assessing Officer</Label>
            <Input
              id="AO"
              value={variables.AO}
              onChange={(e) => setVariables({ ...variables, AO: e.target.value })}
              placeholder="e.g., DCIT, Circle 1(1)"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Generate Document
              </>
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
  }
  if (mimeType.includes("image")) {
    return <FileImage className="w-5 h-5 text-purple-600" />;
  }
  if (mimeType.includes("document") || mimeType.includes("word")) {
    return <FileText className="w-5 h-5 text-primary" />;
  }
  return <File className="w-5 h-5 text-muted-foreground" />;
}

function getFileCategory(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("grounds") || lowerName.includes("goa")) return "Appeal";
  if (lowerName.includes("sof") || lowerName.includes("statement")) return "ITAT";
  if (lowerName.includes("penalty") || lowerName.includes("271")) return "Penalty";
  if (lowerName.includes("memo")) return "Memo";
  if (lowerName.includes("reply") || lowerName.includes("response")) return "Reply";
  return "General";
}

const categoryColors: Record<string, string> = {
  Appeal: "bg-primary/15 text-primary",
  ITAT: "bg-accent/15 text-accent",
  Penalty: "bg-orange-500/15 text-orange-600",
  Memo: "bg-secondary text-secondary-foreground",
  Reply: "bg-muted text-muted-foreground",
  General: "bg-muted text-muted-foreground",
};

export function GDriveTemplates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<GDriveFile | null>(null);
  
  const { data: templates, isLoading, refetch } = useTemplateFiles();
  const generateMutation = useGenerateFromTemplate();
  const downloadMutation = useDownloadFile();

  const filteredTemplates = templates?.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = (variables: Record<string, string>) => {
    if (!selectedTemplate) return;
    
    generateMutation.mutate(
      {
        templateId: selectedTemplate.id,
        variables,
        outputFileName: `${variables.ClientName || "Document"}_${selectedTemplate.name}`,
      },
      {
        onSuccess: () => {
          setSelectedTemplate(null);
        },
      }
    );
  };

  const handleDownload = (file: GDriveFile) => {
    downloadMutation.mutate({ fileId: file.id, fileName: file.name });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Google Drive Templates
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pre-built templates synced from Google Drive
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border/60"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates?.map((template) => {
          const category = getFileCategory(template.name);
          
          return (
            <Card
              key={template.id}
              className="hover:shadow-elevated transition-all cursor-pointer group border-border/60 hover:border-primary/20"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
                    {getFileIcon(template.mimeType)}
                  </div>
                  {template.webViewLink && (
                    <a
                      href={template.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.modifiedTime
                      ? `Updated ${new Date(template.modifiedTime).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Badge variant="secondary" className={categoryColors[category]}>
                    {category}
                  </Badge>
                  {template.size && (
                    <span className="text-xs text-muted-foreground">
                      {(parseInt(template.size) / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Use
                      </Button>
                    </DialogTrigger>
                    {selectedTemplate?.id === template.id && (
                      <TemplateVariablesDialog
                        template={template}
                        onGenerate={handleGenerate}
                        isGenerating={generateMutation.isPending}
                      />
                    )}
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleDownload(template)}
                    disabled={downloadMutation.isPending}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No templates found</p>
          {searchQuery && (
            <p className="text-sm mt-1">Try adjusting your search query</p>
          )}
        </div>
      )}
    </div>
  );
}
