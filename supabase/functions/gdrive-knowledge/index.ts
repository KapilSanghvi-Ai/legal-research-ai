import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KNOWLEDGE_FOLDER_ID = "1zdKcTaFQnXAwEqwM_wlf7n3SOwMqtaEs";

interface KnowledgeRequest {
  action: "search" | "index" | "list";
  query?: string;
  limit?: number;
  threshold?: number;
  fileId?: string;
}

async function getAccessToken(serviceAccountKey: string): Promise<string> {
  const key = JSON.parse(serviceAccountKey);
  
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "");
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = key.private_key
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const jwt = `${unsignedToken}.${signatureB64}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function getEmbedding(text: string, openaiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: text.substring(0, 8000), // Limit input size
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}

async function searchKnowledge(
  supabase: any,
  query: string,
  openaiKey: string,
  limit = 10,
  threshold = 0.7
) {
  const queryEmbedding = await getEmbedding(query, openaiKey);

  const { data, error } = await supabase.rpc("match_knowledge_fragments", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return data || [];
}

async function indexFile(
  accessToken: string,
  supabase: any,
  fileId: string,
  openaiKey: string
) {
  // Get file metadata
  const metaResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const metadata = await metaResponse.json();

  // Download file content
  let content: string;
  
  if (metadata.mimeType === "application/vnd.google-apps.document") {
    // Export Google Doc as plain text
    const exportResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    content = await exportResponse.text();
  } else if (metadata.mimeType === "text/plain" || metadata.mimeType.includes("text")) {
    // Download text file directly
    const downloadResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    content = await downloadResponse.text();
  } else {
    throw new Error(`Unsupported file type for indexing: ${metadata.mimeType}`);
  }

  // Split content into chunks
  const chunkSize = 1000;
  const overlap = 200;
  const chunks: string[] = [];
  
  for (let i = 0; i < content.length; i += chunkSize - overlap) {
    chunks.push(content.slice(i, i + chunkSize));
  }

  // Delete existing fragments for this file
  await supabase
    .from("knowledge_fragments")
    .delete()
    .eq("gdrive_file_id", fileId);

  // Index each chunk
  let indexed = 0;
  for (const chunk of chunks) {
    if (chunk.trim().length < 50) continue; // Skip very short chunks
    
    const embedding = await getEmbedding(chunk, openaiKey);
    
    const { error } = await supabase.from("knowledge_fragments").insert({
      gdrive_file_id: fileId,
      file_name: metadata.name,
      content: chunk,
      embedding,
    });

    if (error) {
      console.error("Failed to index chunk:", error);
    } else {
      indexed++;
    }
  }

  return { success: true, chunks: indexed };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!serviceAccountKey) {
      throw new Error("Google Service Account Key not configured");
    }
    if (!openaiKey) {
      throw new Error("OpenAI API Key not configured");
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const body: KnowledgeRequest = await req.json();

    if (body.action === "search") {
      if (!body.query) {
        throw new Error("Query is required for search action");
      }

      const results = await searchKnowledge(
        supabase,
        body.query,
        openaiKey,
        body.limit,
        body.threshold
      );

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "index") {
      if (!body.fileId) {
        throw new Error("fileId is required for index action");
      }

      const accessToken = await getAccessToken(serviceAccountKey);
      const result = await indexFile(accessToken, supabase, body.fileId, openaiKey);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "list") {
      const accessToken = await getAccessToken(serviceAccountKey);
      
      const params = new URLSearchParams({
        q: `'${KNOWLEDGE_FOLDER_ID}' in parents and trashed = false`,
        pageSize: "100",
        orderBy: "name",
        fields: "files(id,name,mimeType,modifiedTime)",
      });

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const data = await response.json();
      return new Response(JSON.stringify({ files: data.files || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action. Use 'search', 'index', or 'list'");
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
