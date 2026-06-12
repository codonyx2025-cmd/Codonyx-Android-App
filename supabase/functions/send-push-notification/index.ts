import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const signingInput = `${encode(header)}.${encode(payload)}`;
  const pemKey = privateKey.replace(/\\n/g, "\n");
  const keyData = pemKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const jwt = `${signingInput}.${btoa(
    String.fromCharCode(...new Uint8Array(signature))
  )
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function sendFCMNotification(
  accessToken: string,
  projectId: string,
  token: string,
  title: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId: "codonyx_notifications",
            },
          },
        },
      }),
    }
  );

  const result = await res.json();
  console.log("FCM result:", JSON.stringify(result));

  if (result.error) {
    return { success: false, error: result.error.message };
  }
  return { success: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { profile_id, title, body } = await req.json();
    console.log(`Sending notification to profile: ${profile_id}`);

    if (!profile_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tokens, error: tokenError } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("profile_id", profile_id)

    if (tokenError) {
      console.error("Error fetching token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch token" }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log(`No token found for profile: ${profile_id}`);
      return new Response(
        JSON.stringify({ message: "No token found" }),
        { headers: corsHeaders }
      );
    }

    const projectId = Deno.env.get("FCM_PROJECT_ID")!;
    const clientEmail = Deno.env.get("FCM_CLIENT_EMAIL")!;
    const privateKey = Deno.env.get("FCM_PRIVATE_KEY")!;

const accessToken = await getAccessToken(clientEmail, privateKey);

let successCount = 0;

for (const item of tokens) {
  const result = await sendFCMNotification(
    accessToken,
    projectId,
    item.token,
    title,
    body
  );

  if (result.success) {
    successCount++;
  } else {
    if (
      result.error?.includes("UNREGISTERED") ||
      result.error?.includes("INVALID_ARGUMENT")
    ) {
      await supabase
        .from("push_tokens")
        .delete()
        .eq("token", item.token);

      console.log("Removed invalid token:", item.token);
    }
  }
}

return new Response(
  JSON.stringify({
    success: true,
    notifications_sent: successCount,
  }),
  {
    headers: corsHeaders,
  }
);

} catch (err) {
  console.error("Error:", err.message);

  return new Response(
    JSON.stringify({
      error: err.message,
    }),
    {
      status: 500,
      headers: corsHeaders,
    }
  );
}
});