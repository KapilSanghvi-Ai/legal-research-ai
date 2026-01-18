import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  X,
  CheckCircle,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { useUploadFile } from "@/hooks/use-gdrive";
import { GDRIVE_FOLDERS } from "@/lib/gdrive";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface FileWithProgress {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  gdriveFileId?: string;
}

interface CaseDocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  caseName: string;
  gdriveFolderId?: string | null;
}

const documentTypes = [
  { value: "memo", label: "Memo" },
  { value: "sof", label: "Statement of Facts" },
  { value: "goa", label: "Grounds of Appeal" },
  { value: "submission", label: "Submission" },
  { value: "reply", label: "Reply" },
  { value: "brief", label: "Brief" },
  { value: "toa", label: "Table of Authorities" },
];

function getFileIcon(mimeType: string) {
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
  }
  if (mimeType.includes("image")) {
    return <FileImage className="w-5 h-5 text-purple-600" />;
  }
  if (mimeType.includes("pdf") || mimeType.includes("document")) {
    return <FileText className="w-5 h-5 text-primary" />;
  }
  return <File className="w-5 h-5 text-muted-foreground" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CaseDocumentUpload({
  open,
  onOpenChange,
  caseId,
  caseName,
  gdriveFolderId,
}: CaseDocumentUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [documentType, setDocumentType] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  const uploadMutation = useUploadFile();
  const queryClient = useQueryClient();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const fileItems: FileWithProgress[] = newFiles.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      progress: 0,
      status: "pending",
    }));
    
    setFiles((prev) => [...prev, ...fileItems]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadSingleFile = async (fileItem: FileWithProgress): Promise<string | null> => {
    // Update file status to uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileItem.id ? { ...f, status: "uploading", progress: 30 } : f
      )
    );

    try {
      // Determine folder - use case folder if available, otherwise use Client Data folder
      const targetFolderId = gdriveFolderId || GDRIVE_FOLDERS.CLIENT_DATA;
      
      const result = await uploadMutation.mutateAsync({
        file: fileItem.file,
        folderId: targetFolderId,
        fileName: `${caseName}_${fileItem.file.name}`,
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id 
            ? { ...f, status: "success", progress: 100, gdriveFileId: result.id } 
            : f
        )
      );

      return result.id;
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? {
                ...f,
                status: "error",
                progress: 0,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
      return null;
    }
  };

  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    try {
      for (const fileItem of pendingFiles) {
        const gdriveFileId = await uploadSingleFile(fileItem);
        
        if (gdriveFileId) {
          // Create document record in database
          const { error: docError } = await supabase.from("documents").insert([{
            case_id: caseId,
            title: fileItem.file.name,
            document_type: (documentType as "memo" | "sof" | "goa" | "submission" | "reply" | "brief" | "toa") || null,
            gdrive_file_id: gdriveFileId,
            mime_type: fileItem.file.type,
            file_size: fileItem.file.size,
            notes: notes || null,
            status: "draft",
            version: 1,
            is_latest: true,
          }]);

          if (docError) {
            console.error("Failed to create document record:", docError);
            toast.error(`Failed to save document record for ${fileItem.file.name}`);
          }
        }
      }

      // Invalidate queries to refresh document list
      queryClient.invalidateQueries({ queryKey: ["case-documents", caseId] });
      
      toast.success("Documents uploaded successfully");
      
      // Reset form after successful upload
      setTimeout(() => {
        setFiles([]);
        setDocumentType("");
        setNotes("");
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload documents");
    } finally {
      setIsUploading(false);
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;

  const handleClose = () => {
    if (!isUploading) {
      setFiles([]);
      setDocumentType("");
      setNotes("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Case Documents
          </DialogTitle>
          <DialogDescription>
            Upload documents for <span className="font-medium">{caseName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Document Type Selection */}
          <div className="space-y-2">
            <Label>Document Type (Optional)</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
            )}
            onClick={() => document.getElementById("case-file-input")?.click()}
          >
            <input
              id="case-file-input"
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png"
            />
            <Upload
              className={cn(
                "w-8 h-8 mx-auto mb-2",
                isDragging ? "text-primary" : "text-muted-foreground"
              )}
            />
            <p className="text-sm font-medium text-foreground">
              {isDragging ? "Drop files here" : "Drag and drop files here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse • PDF, DOC, XLS, Images
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Files ({files.length})
                </Label>
                {successCount > 0 && (
                  <Badge variant="secondary" className="bg-green-500/15 text-green-600">
                    {successCount} uploaded
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((fileItem) => (
                  <div
                    key={fileItem.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      fileItem.status === "success"
                        ? "bg-green-500/5 border-green-500/20"
                        : fileItem.status === "error"
                        ? "bg-destructive/5 border-destructive/20"
                        : "bg-card border-border/60"
                    )}
                  >
                    {getFileIcon(fileItem.file.type)}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {fileItem.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                      
                      {fileItem.status === "uploading" && (
                        <Progress value={fileItem.progress} className="h-1 mt-2" />
                      )}
                      
                      {fileItem.status === "error" && (
                        <p className="text-xs text-destructive mt-1">
                          {fileItem.error}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {fileItem.status === "success" && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {fileItem.status === "error" && (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      )}
                      {(fileItem.status === "pending" || fileItem.status === "error") && !isUploading && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(fileItem.id);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Add any notes about these documents..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Folder Info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
            <FolderOpen className="w-4 h-4" />
            <span>
              Uploading to: {gdriveFolderId ? "Case Folder" : "Client Data Folder"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={pendingCount === 0 || isUploading}
            >
              {isUploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {pendingCount > 0 ? `${pendingCount} File${pendingCount > 1 ? "s" : ""}` : "Files"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
