// Supabase Edge Function: sync-world-cup
//
// Pulls match results from football-data.org and upserts them into the
// `matches` table. Skips any rows where `manual_override = true` so admin
// hand-edits are never clobbered.
//
// Status: SCAFFOLD — returns a placeholder response. The fetch + write logic
// will land in subsequent commits so each piece can be reviewed in isolation.
//
// See README.md in this folder for setup + deploy instructions.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { mapTeam, mapStage } from "./team-map.ts";

serve(async (_req: Request) => {
    const apiKey = Deno.env.get("FOOTBALL_DATA_API_KEY") || "";

    return new Response(
        JSON.stringify({
            ok: true,
            message: "scaffold — fetch + upsert not implemented yet",
            apiKeyConfigured: Boolean(apiKey),
            mappersLoaded: typeof mapTeam === "function" && typeof mapStage === "function",
        }),
        {
            status: 200,
            headers: { "Content-Type": "application/json" },
        },
    );
});
