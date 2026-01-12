import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FolderOpen,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  X,
  CheckCircle,
  AlertCircle,
  CloudUpload,
} from "lucide-react";
import { useUploadFile } from "@/hooks/use-gdrive";
import { GDRIVE_FOLDERS } from "@/lib/gdrive";
import { cn } from "@/lib/utils";

interface FileWithProgress {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface ClientFileUploadProps {
  folderId?: string;
  clientName?: string;
  onUploadComplete?: (fileId: string) => void;
}

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

export function ClientFileUpload({
  folderId = GDRIVE_FOLDERS.CLIENT_DATA,
  clientName,
  onUploadComplete,
}: ClientFileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const uploadMutation = useUploadFile();

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

  const uploadFile = async (fileItem: FileWithProgress) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileItem.id ? { ...f, status: "uploading", progress: 30 } : f
      )
    );

    try {
      const result = await uploadMutation.mutateAsync({
        file: fileItem.file,
        folderId,
        fileName: clientName
          ? `${clientName}_${fileItem.file.name}`
          : fileItem.file.name,
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: "success", progress: 100 } : f
        )
      );

      onUploadComplete?.(result.id);
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
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    for (const fileItem of pendingFiles) {
      await uploadFile(fileItem);
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CloudUpload className="w-5 h-5 text-primary" />
          Upload Files to Google Drive
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
          )}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png"
          />
          <Upload
            className={cn(
              "w-10 h-10 mx-auto mb-3",
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
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
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
                    {(fileItem.status === "pending" || fileItem.status === "error") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFile(fileItem.id)}
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

        {/* Upload Button */}
        {pendingCount > 0 && (
          <Button
            onClick={uploadAllFiles}
            disabled={uploadMutation.isPending}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload {pendingCount} {pendingCount === 1 ? "File" : "Files"}
          </Button>
        )}

        {/* Folder Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <FolderOpen className="w-4 h-4" />
          <span>
            Uploading to:{" "}
            {clientName ? `Client Data / ${clientName}` : "Client Data"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
