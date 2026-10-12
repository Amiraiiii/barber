// Supabase Edge Function: notifications
// Triggered by Supabase Cron (pg_net / pg_cron) every 5 minutes

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const API_URL = Deno.env.get("API_URL") || "http://localhost:4000";
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "blackline_cron_secret";

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Call API cron processing endpoint
    const response = await fetch(`${API_URL}/api/v1/cron/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CRON_SECRET}`,
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify({ success: true, processed: data }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
