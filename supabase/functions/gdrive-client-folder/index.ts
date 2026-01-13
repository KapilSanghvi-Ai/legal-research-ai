import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const CLIENT_DATA_FOLDER_ID = "1P5nEAwpxZagdu2y1wmlzFe7VNlaCo5lF";

async function authenticateRequest(req: Request): Promise<{ user: any; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return { user: null, error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (error || !data?.user) return { user: null, error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
  return { user: data.user, error: null };
}

async function getAccessToken(serviceAccountKey: string): Promise<string> {
  const key = JSON.parse(serviceAccountKey);
  const now = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/=/g, "");
  const payloadB64 = btoa(JSON.stringify({ iss: key.client_email, scope: "https://www.googleapis.com/auth/drive", aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now })).replace(/=/g, "");
  const unsignedToken = `${headerB64}.${payloadB64}`;
  const pemContents = key.private_key.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, "");
  const cryptoKey = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0)), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(unsignedToken));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${unsignedToken}.${signatureB64}` });
  return (await tokenResponse.json()).access_token;
}

async function createFolder(accessToken: string, name: string, parentId?: string) {
  const response = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name,createdTime", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", ...(parentId && { parents: [parentId] }) }) });
  if (!response.ok) throw new Error(`Failed to create folder: ${await response.text()}`);
  return response.json();
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
    if (body.action === "create") {
      if (!body.name) throw new Error("Folder name is required");
      return new Response(JSON.stringify(await createFolder(accessToken, body.name, body.parentId || CLIENT_DATA_FOLDER_ID)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (body.action === "createClientStructure") {
      if (!body.clientName || !body.clientId) throw new Error("clientName and clientId are required");
      const clientFolder = await createFolder(accessToken, `${body.clientName} (${body.clientId})`, CLIENT_DATA_FOLDER_ID);
      const subfolders: Record<string, string> = {};
      for (const name of ["Assessment Orders", "Appeals (CIT-A)", "ITAT Proceedings", "High Court", "Correspondence", "Evidence & Annexures", "Submissions", "Notices", "Memos & Research", "Miscellaneous"]) {
        subfolders[name] = (await createFolder(accessToken, name, clientFolder.id)).id;
      }
      return new Response(JSON.stringify({ id: clientFolder.id, name: clientFolder.name, subfolders }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    throw new Error("Invalid action");
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
