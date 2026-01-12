import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gdriveApi, GDRIVE_FOLDERS, ListFilesParams, UploadFileParams, TemplateParams, KnowledgeSearchParams } from "@/lib/gdrive";
import { toast } from "sonner";

// Query keys
export const gdriveKeys = {
  all: ["gdrive"] as const,
  files: (params?: ListFilesParams) => [...gdriveKeys.all, "files", params] as const,
  file: (id: string) => [...gdriveKeys.all, "file", id] as const,
  templates: () => [...gdriveKeys.all, "templates"] as const,
  knowledge: (query: string) => [...gdriveKeys.all, "knowledge", query] as const,
  clientFolders: () => [...gdriveKeys.all, "clientFolders"] as const,
};

// Hook to list files in a folder
export function useGDriveFiles(params?: ListFilesParams) {
  return useQuery({
    queryKey: gdriveKeys.files(params),
    queryFn: () => gdriveApi.listFiles(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to list client data files
export function useClientDataFiles(query?: string) {
  return useGDriveFiles({
    folderId: GDRIVE_FOLDERS.CLIENT_DATA,
    query,
  });
}

// Hook to list template files
export function useTemplateFiles() {
  return useQuery({
    queryKey: gdriveKeys.templates(),
    queryFn: () => gdriveApi.listTemplates(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hook to get file metadata
export function useGDriveFile(fileId: string) {
  return useQuery({
    queryKey: gdriveKeys.file(fileId),
    queryFn: () => gdriveApi.getFileMetadata(fileId),
    enabled: !!fileId,
  });
}

// Hook to upload files
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UploadFileParams) => gdriveApi.uploadFile(params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: gdriveKeys.files({ folderId: variables.folderId }) });
      toast.success(`File "${data.name}" uploaded successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

// Hook to download files
export function useDownloadFile() {
  return useMutation({
    mutationFn: async ({ fileId, fileName }: { fileId: string; fileName: string }) => {
      const blob = await gdriveApi.downloadFile(fileId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return blob;
    },
    onSuccess: (_, variables) => {
      toast.success(`Downloaded "${variables.fileName}"`);
    },
    onError: (error: Error) => {
      toast.error(`Download failed: ${error.message}`);
    },
  });
}

// Hook to delete files
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => gdriveApi.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gdriveKeys.all });
      toast.success("File deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });
}

// Hook to create folders
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) => 
      gdriveApi.createFolder(name, parentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gdriveKeys.all });
      toast.success(`Folder "${data.name}" created`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create folder: ${error.message}`);
    },
  });
}

// Hook to create client folder structure
export function useCreateClientFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientName, clientId }: { clientName: string; clientId: string }) =>
      gdriveApi.createClientFolder(clientName, clientId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gdriveKeys.clientFolders() });
      toast.success(`Client folder structure created for "${data.name}"`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create client folder: ${error.message}`);
    },
  });
}

// Hook to generate document from template
export function useGenerateFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: TemplateParams) => gdriveApi.generateFromTemplate(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gdriveKeys.all });
      toast.success(`Document "${data.name}" generated from template`);
    },
    onError: (error: Error) => {
      toast.error(`Template generation failed: ${error.message}`);
    },
  });
}

// Hook to search knowledge base
export function useKnowledgeSearch(params: KnowledgeSearchParams) {
  return useQuery({
    queryKey: gdriveKeys.knowledge(params.query),
    queryFn: () => gdriveApi.searchKnowledge(params),
    enabled: !!params.query && params.query.length > 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to index file into knowledge base
export function useIndexFile() {
  return useMutation({
    mutationFn: (fileId: string) => gdriveApi.indexFile(fileId),
    onSuccess: (data) => {
      toast.success(`File indexed successfully (${data.chunks} chunks)`);
    },
    onError: (error: Error) => {
      toast.error(`Indexing failed: ${error.message}`);
    },
  });
}

// Hook to move files
export function useMoveFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId, newFolderId }: { fileId: string; newFolderId: string }) =>
      gdriveApi.moveFile(fileId, newFolderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gdriveKeys.all });
      toast.success("File moved successfully");
    },
    onError: (error: Error) => {
      toast.error(`Move failed: ${error.message}`);
    },
  });
}
