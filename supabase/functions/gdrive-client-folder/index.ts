import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLIENT_DATA_FOLDER_ID = "1P5nEAwpxZagdu2y1wmlzFe7VNlaCo5lF";

interface FolderRequest {
  action: "create" | "createClientStructure";
  name: string;
  parentId?: string;
  clientName?: string;
  clientId?: string;
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

async function createFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<{ id: string; name: string; createdTime: string }> {
  const metadata: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };

  if (parentId) {
    metadata.parents = [parentId];
  }

  const response = await fetch(
    "https://www.googleapis.com/drive/v3/files?fields=id,name,createdTime",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create folder: ${error}`);
  }

  return response.json();
}

async function createClientStructure(
  accessToken: string,
  clientName: string,
  clientId: string
): Promise<{ id: string; name: string; subfolders: Record<string, string> }> {
  // Create main client folder
  const clientFolder = await createFolder(
    accessToken,
    `${clientName} (${clientId})`,
    CLIENT_DATA_FOLDER_ID
  );

  // Create standard subfolders for a tax litigation client
  const subfolderNames = [
    "Assessment Orders",
    "Appeals (CIT-A)",
    "ITAT Proceedings",
    "High Court",
    "Correspondence",
    "Evidence & Annexures",
    "Submissions",
    "Notices",
    "Memos & Research",
    "Miscellaneous",
  ];

  const subfolders: Record<string, string> = {};

  for (const folderName of subfolderNames) {
    const subfolder = await createFolder(accessToken, folderName, clientFolder.id);
    subfolders[folderName] = subfolder.id;
  }

  return {
    id: clientFolder.id,
    name: clientFolder.name,
    subfolders,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountKey) {
      throw new Error("Google Service Account Key not configured");
    }

    const accessToken = await getAccessToken(serviceAccountKey);
    const body: FolderRequest = await req.json();

    if (body.action === "create") {
      if (!body.name) {
        throw new Error("Folder name is required");
      }

      const folder = await createFolder(
        accessToken,
        body.name,
        body.parentId || CLIENT_DATA_FOLDER_ID
      );

      return new Response(JSON.stringify(folder), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "createClientStructure") {
      if (!body.clientName || !body.clientId) {
        throw new Error("clientName and clientId are required");
      }

      const result = await createClientStructure(
        accessToken,
        body.clientName,
        body.clientId
      );

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action. Use 'create' or 'createClientStructure'");
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
