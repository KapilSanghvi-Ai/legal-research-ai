import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

async function authenticateRequest(req: Request): Promise<{ user: any; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return { user: null, error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (error || !data?.user) return { user: null, error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
  return { user: data.user, error: null };
}

const KNOWLEDGE_FOLDER_ID = "1zdKcTaFQnXAwEqwM_wlf7n3SOwMqtaEs";

async function getAccessToken(serviceAccountKey: string): Promise<string> {
  const key = JSON.parse(serviceAccountKey);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = { iss: key.client_email, scope: "https://www.googleapis.com/auth/drive", aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now };
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "");
  const unsignedToken = `${headerB64}.${payloadB64}`;
  const pemContents = key.private_key.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(unsignedToken));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${unsignedToken}.${signatureB64}` });
  return (await tokenResponse.json()).access_token;
}

async function getEmbedding(text: string, openaiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", { method: "POST", headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "text-embedding-ada-002", input: text.substring(0, 8000) }) });
  return (await response.json()).data[0].embedding;
}

async function searchKnowledge(supabase: any, query: string, openaiKey: string, limit = 10, threshold = 0.7) {
  const queryEmbedding = await getEmbedding(query, openaiKey);
  const { data, error } = await supabase.rpc("match_knowledge_fragments", { query_embedding: queryEmbedding, match_threshold: threshold, match_count: limit });
  if (error) throw new Error(`Search failed: ${error.message}`);
  return data || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { user, error: authError } = await authenticateRequest(req);
    if (authError) return authError;
    const serviceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!serviceAccountKey) throw new Error("Google Service Account Key not configured");
    if (!openaiKey) throw new Error("OpenAI API Key not configured");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json();
    if (body.action === "search") {
      if (!body.query) throw new Error("Query is required");
      return new Response(JSON.stringify({ results: await searchKnowledge(supabase, body.query, openaiKey, body.limit, body.threshold) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (body.action === "list") {
      const accessToken = await getAccessToken(serviceAccountKey);
      const params = new URLSearchParams({ q: `'${KNOWLEDGE_FOLDER_ID}' in parents and trashed = false`, pageSize: "100", orderBy: "name", fields: "files(id,name,mimeType,modifiedTime)" });
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      return new Response(JSON.stringify({ files: (await response.json()).files || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    throw new Error("Invalid action");
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
