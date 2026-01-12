import { supabase } from "@/integrations/supabase/client";

// Google Drive Folder IDs
export const GDRIVE_FOLDERS = {
  CLIENT_DATA: "1P5nEAwpxZagdu2y1wmlzFe7VNlaCo5lF",
  TEMPLATES: "13DUOGS4oczXIyXmt_n_HfhlgibpYOHdB",
  KNOWLEDGE_BASE: "1zdKcTaFQnXAwEqwM_wlf7n3SOwMqtaEs",
} as const;

export interface GDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
  thumbnailLink?: string;
}

export interface GDriveFolder {
  id: string;
  name: string;
  createdTime?: string;
}

export interface ListFilesParams {
  folderId?: string;
  query?: string;
  pageSize?: number;
  pageToken?: string;
  orderBy?: string;
}

export interface UploadFileParams {
  file: File;
  folderId: string;
  fileName?: string;
  description?: string;
}

export interface TemplateParams {
  templateId: string;
  variables: Record<string, string>;
  outputFolderId?: string;
  outputFileName?: string;
}

export interface KnowledgeSearchParams {
  query: string;
  limit?: number;
  threshold?: number;
}

export interface KnowledgeResult {
  id: string;
  fileName: string;
  content: string;
  similarity: number;
  fileId: string;
}

// API Client for Google Drive operations
export const gdriveApi = {
  // List files in a folder
  async listFiles(params: ListFilesParams = {}): Promise<{ files: GDriveFile[]; nextPageToken?: string }> {
    const { data, error } = await supabase.functions.invoke("gdrive-list", {
      body: params,
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // Upload a file to Google Drive
  async uploadFile(params: UploadFileParams): Promise<GDriveFile> {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("folderId", params.folderId);
    if (params.fileName) formData.append("fileName", params.fileName);
    if (params.description) formData.append("description", params.description);

    const { data, error } = await supabase.functions.invoke("gdrive-upload", {
      body: formData,
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // Download a file from Google Drive
  async downloadFile(fileId: string): Promise<Blob> {
    const { data, error } = await supabase.functions.invoke("gdrive-download", {
      body: { fileId },
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // Get file metadata
  async getFileMetadata(fileId: string): Promise<GDriveFile> {
    const { data, error } = await supabase.functions.invoke("gdrive-list", {
      body: { fileId, metadata: true },
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // Create a folder
  async createFolder(name: string, parentId?: string): Promise<GDriveFolder> {
    const { data, error } = await supabase.functions.invoke("gdrive-client-folder", {
      body: { action: "create", name, parentId },
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // Create client folder structure
  async createClientFolder(clientName: string, clientId: string): Promise<GDriveFolder> {
    const { data, error } = await supabase.functions.invoke("gdrive-client-folder", {
      body: { 
        action: "createClientStructure", 
        clientName, 
        clientId,
        parentId: GDRIVE_FOLDERS.CLIENT_DATA 
      },
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // List templates
  async listTemplates(): Promise<GDriveFile[]> {
    const { data, error } = await supabase.functions.invoke("gdrive-templates", {
      body: { action: "list" },
    });

    if (error) throw new Error(error.message);
    return data.templates;
  },

  // Generate document from template
  async generateFromTemplate(params: TemplateParams): Promise<GDriveFile> {
    const { data, error } = await supabase.functions.invoke("gdrive-templates", {
      body: { action: "generate", ...params },
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // Search knowledge base
  async searchKnowledge(params: KnowledgeSearchParams): Promise<KnowledgeResult[]> {
    const { data, error } = await supabase.functions.invoke("gdrive-knowledge", {
      body: { action: "search", ...params },
    });

    if (error) throw new Error(error.message);
    return data.results;
  },

  // Index a file into the knowledge base
  async indexFile(fileId: string): Promise<{ success: boolean; chunks: number }> {
    const { data, error } = await supabase.functions.invoke("gdrive-knowledge", {
      body: { action: "index", fileId },
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // Delete a file
  async deleteFile(fileId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke("gdrive-list", {
      body: { action: "delete", fileId },
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // Move a file to a different folder
  async moveFile(fileId: string, newFolderId: string): Promise<GDriveFile> {
    const { data, error } = await supabase.functions.invoke("gdrive-list", {
      body: { action: "move", fileId, newFolderId },
    });

    if (error) throw new Error(error.message);
    return data;
  },
};

export default gdriveApi;
