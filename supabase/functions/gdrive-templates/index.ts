import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Authentication helper
async function authenticateRequest(req: Request): Promise<{ user: any; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
  }
  return { user: data.user, error: null };
}

const TEMPLATES_FOLDER_ID = "13DUOGS4oczXIyXmt_n_HfhlgibpYOHdB";

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
  const jwt = `${unsignedToken}.${signatureB64}`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` });
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function listTemplates(accessToken: string) {
  const params = new URLSearchParams({ q: `'${TEMPLATES_FOLDER_ID}' in parents and trashed = false`, pageSize: "100", orderBy: "name", fields: "files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,description)" });
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await response.json();
  return data.files || [];
}

async function generateFromTemplate(accessToken: string, templateId: string, variables: Record<string, string>, outputFolderId?: string, outputFileName?: string) {
  const copyResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateId}/copy`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: outputFileName || `Generated_${Date.now()}`, parents: outputFolderId ? [outputFolderId] : undefined }) });
  if (!copyResponse.ok) throw new Error(`Failed to copy template: ${copyResponse.statusText}`);
  const copiedFile = await copyResponse.json();
  const metaResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${copiedFile.id}?fields=mimeType`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const metadata = await metaResponse.json();
  if (metadata.mimeType === "application/vnd.google-apps.document") {
    const requests = Object.entries(variables).map(([key, value]) => ({ replaceAllText: { containsText: { text: `{${key}}`, matchCase: true }, replaceText: value } }));
    if (requests.length > 0) await fetch(`https://docs.googleapis.com/v1/documents/${copiedFile.id}:batchUpdate`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ requests }) });
  }
  const finalResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${copiedFile.id}?fields=id,name,mimeType,webViewLink,webContentLink`, { headers: { Authorization: `Bearer ${accessToken}` } });
  return finalResponse.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { user, error: authError } = await authenticateRequest(req);
    if (authError) return authError;
    const serviceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountKey) throw new Error("Google Service Account Key not configured");
    const accessToken = await getAccessToken(serviceAccountKey);
    const body = await req.json();
    if (body.action === "list") return new Response(JSON.stringify({ templates: await listTemplates(accessToken) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (body.action === "generate") {
      if (!body.templateId || !body.variables) throw new Error("templateId and variables are required");
      return new Response(JSON.stringify(await generateFromTemplate(accessToken, body.templateId, body.variables, body.outputFolderId, body.outputFileName)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    throw new Error("Invalid action");
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
