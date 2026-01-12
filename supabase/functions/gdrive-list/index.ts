import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ListRequest {
  folderId?: string;
  query?: string;
  pageSize?: number;
  pageToken?: string;
  orderBy?: string;
  fileId?: string;
  metadata?: boolean;
  action?: "delete" | "move";
  newFolderId?: string;
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

  // Create JWT
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "");
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key and sign
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

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
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
    const body: ListRequest = await req.json();

    // Handle delete action
    if (body.action === "delete" && body.fileId) {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${body.fileId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle move action
    if (body.action === "move" && body.fileId && body.newFolderId) {
      // Get current parents
      const metaResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${body.fileId}?fields=parents`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const metaData = await metaResponse.json();
      const previousParents = metaData.parents?.join(",") || "";

      // Move file
      const moveResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${body.fileId}?addParents=${body.newFolderId}&removeParents=${previousParents}&fields=id,name,mimeType`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const moveData = await moveResponse.json();
      return new Response(JSON.stringify(moveData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle metadata request
    if (body.metadata && body.fileId) {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${body.fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents,thumbnailLink`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build query for listing files
    let q = "trashed = false";
    if (body.folderId) {
      q += ` and '${body.folderId}' in parents`;
    }
    if (body.query) {
      q += ` and name contains '${body.query}'`;
    }

    const params = new URLSearchParams({
      q,
      pageSize: String(body.pageSize || 50),
      orderBy: body.orderBy || "modifiedTime desc",
      fields: "nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents,thumbnailLink)",
    });

    if (body.pageToken) {
      params.set("pageToken", body.pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
