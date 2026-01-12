# Google Drive Integration Setup Guide

This document provides complete setup instructions for the Google Drive integration in the Tax Litigation Management System.

## Overview

The integration provides:
- **Client Data Management**: Upload and organize client documents
- **Document Templates**: Generate documents from Google Docs templates with variable substitution
- **Knowledge Base**: Semantic search across legal documents using embeddings

## Folder Structure

| Folder | ID | Purpose |
|--------|-----|---------|
| Client Data | `1P5nEAwpxZagdu2y1wmlzFe7VNlaCo5lF` | Client documents organized by client |
| Templates | `13DUOGS4oczXIyXmt_n_HfhlgibpYOHdB` | Document templates (GOA, SOF, etc.) |
| Knowledge Base | `1zdKcTaFQnXAwEqwM_wlf7n3SOwMqtaEs` | Legal knowledge documents for RAG |

## Prerequisites

1. Google Cloud Project with Drive API enabled
2. Service Account with appropriate permissions
3. Lovable Cloud backend enabled

## Setup Instructions

### 1. Create Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the **Google Drive API** and **Google Docs API**
4. Navigate to **IAM & Admin > Service Accounts**
5. Click **Create Service Account**
   - Name: `tax-litigation-gdrive`
   - Role: No role needed (we'll share folders directly)
6. Create a JSON key and download it

### 2. Share Google Drive Folders

Share each folder with the service account email (found in the JSON key as `client_email`):

1. Open Google Drive
2. Right-click each folder → **Share**
3. Add the service account email with **Editor** access
4. Uncheck "Notify people"

### 3. Configure Secrets

Add the following secret to Lovable Cloud:

| Secret Name | Value |
|-------------|-------|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | The entire JSON key file content |

For knowledge base semantic search, also add:
| `OPENAI_API_KEY` | Your OpenAI API key |

### 4. Database Migration

Run the following migration to create the knowledge base table:

```sql
-- Create knowledge_fragments table for semantic search
CREATE TABLE IF NOT EXISTS public.knowledge_fragments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gdrive_file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for similarity search
CREATE INDEX IF NOT EXISTS knowledge_fragments_embedding_idx 
ON public.knowledge_fragments 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for file lookups
CREATE INDEX IF NOT EXISTS knowledge_fragments_file_id_idx 
ON public.knowledge_fragments (gdrive_file_id);

-- Create similarity search function
CREATE OR REPLACE FUNCTION match_knowledge_fragments(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  gdrive_file_id TEXT,
  file_name TEXT,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kf.id,
    kf.gdrive_file_id,
    kf.file_name,
    kf.content,
    1 - (kf.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_fragments kf
  WHERE 1 - (kf.embedding <=> query_embedding) > match_threshold
  ORDER BY kf.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## Usage

### Client File Upload

```tsx
import { ClientFileUpload } from "@/components/gdrive/ClientFileUpload";

<ClientFileUpload 
  clientName="Reliance Industries"
  onUploadComplete={(fileId) => console.log("Uploaded:", fileId)}
/>
```

### Templates

```tsx
import { GDriveTemplates } from "@/components/gdrive/GDriveTemplates";

<GDriveTemplates />
```

### API Client

```typescript
import { gdriveApi, GDRIVE_FOLDERS } from "@/lib/gdrive";

// List files
const { files } = await gdriveApi.listFiles({ 
  folderId: GDRIVE_FOLDERS.CLIENT_DATA 
});

// Upload file
const result = await gdriveApi.uploadFile({
  file: fileObject,
  folderId: GDRIVE_FOLDERS.CLIENT_DATA,
  fileName: "Custom_Name.pdf"
});

// Generate from template
const doc = await gdriveApi.generateFromTemplate({
  templateId: "template-file-id",
  variables: {
    ClientName: "Reliance Industries",
    AY: "2021-22",
    Amount: "5,00,00,000"
  }
});

// Search knowledge base
const results = await gdriveApi.searchKnowledge({
  query: "Section 68 burden of proof",
  limit: 10
});
```

### React Query Hooks

```typescript
import { 
  useGDriveFiles, 
  useUploadFile, 
  useKnowledgeSearch 
} from "@/hooks/use-gdrive";

// List files
const { data, isLoading } = useGDriveFiles({ 
  folderId: GDRIVE_FOLDERS.CLIENT_DATA 
});

// Upload mutation
const uploadMutation = useUploadFile();
uploadMutation.mutate({ file, folderId });

// Search knowledge
const { data: results } = useKnowledgeSearch({ 
  query: "Section 68" 
});
```

## Template Variables

Templates should use `{VariableName}` syntax for placeholders:

| Variable | Description |
|----------|-------------|
| `{ClientName}` | Client/assessee name |
| `{AY}` | Assessment year |
| `{PAN}` | PAN number |
| `{CaseNumber}` | ITA/case number |
| `{Amount}` | Disputed amount |
| `{AO}` | Assessing Officer |
| `{Date}` | Current date |

## Edge Functions

| Function | Purpose |
|----------|---------|
| `gdrive-list` | List files, get metadata, delete, move |
| `gdrive-upload` | Upload files to Drive |
| `gdrive-download` | Download files (handles Google Docs export) |
| `gdrive-templates` | List templates, generate documents |
| `gdrive-knowledge` | Semantic search, index files |
| `gdrive-client-folder` | Create client folder structure |

## Client Folder Structure

When creating a new client folder, the following subfolders are automatically created:

- Assessment Orders
- Appeals (CIT-A)
- ITAT Proceedings
- High Court
- Correspondence
- Evidence & Annexures
- Submissions
- Notices
- Memos & Research
- Miscellaneous

## Troubleshooting

### "Google Service Account Key not configured"
Add the `GOOGLE_SERVICE_ACCOUNT_KEY` secret in Lovable Cloud.

### "Permission denied" errors
Ensure the Google Drive folders are shared with the service account email.

### Files not appearing
Check that files are in the correct folder and not in trash.

### Template variables not replaced
Ensure templates use `{VariableName}` format and are Google Docs (not uploaded .docx).

## Security Notes

1. Service account key should never be exposed in client-side code
2. All API calls go through edge functions
3. Folder IDs are constants but access requires service account authentication
4. Consider implementing user-level access control for sensitive documents
