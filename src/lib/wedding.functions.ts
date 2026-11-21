import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { weddingRsvpSchema, weddingWishSchema } from "@/lib/wedding-validation";

function createPublicDatabaseClient(url: string, publishableKey: string) {
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (publishableKey.startsWith("sb_") && headers.get("Authorization") === `Bearer ${publishableKey}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", publishableKey);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const submitWeddingRsvp = createServerFn({ method: "POST" })
  .inputValidator((input) => weddingRsvpSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.website?.trim()) {
      return { ok: false, error: "We couldn't send that response. Please try again." };
    }

    const databaseUrl = process.env["SUPABASE_URL"];
    const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!databaseUrl || !publishableKey) {
      return { ok: false, error: "RSVP is temporarily unavailable. Please try again soon." };
    }

    const database = createPublicDatabaseClient(databaseUrl, publishableKey);
    const { error } = await database.from("wedding_rsvps").insert({
      guest_name: data.guestName,
      phone: data.phone,
      attendance: data.attendance,
      guest_count: data.guestCount,
      message: data.message?.trim() || null,
    });

    if (error) {
      return { ok: false, error: "We couldn't send your RSVP just now. Please try again." };
    }

    return { ok: true };
  });

export const submitWeddingWish = createServerFn({ method: "POST" })
  .inputValidator((input) => weddingWishSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.website?.trim()) {
      return { ok: false, error: "We couldn't send that wish. Please try again." };
    }

    const databaseUrl = process.env["SUPABASE_URL"];
    const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!databaseUrl || !publishableKey) {
      return { ok: false, error: "Wishes are temporarily unavailable. Please try again soon." };
    }

    const database = createPublicDatabaseClient(databaseUrl, publishableKey);
    const { error } = await database.from("wedding_wishes").insert({
      guest_name: data.guestName,
      message: data.message,
    });

    if (error) {
      return { ok: false, error: "We couldn't send your wish just now. Please try again." };
    }

    return { ok: true };
  });

export const getApprovedWeddingWishes = createServerFn({ method: "GET" }).handler(async () => {
  const databaseUrl = process.env["SUPABASE_URL"];
  const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!databaseUrl || !publishableKey) {
    return { ok: false, wishes: [] as { guest_name: string; message: string; submitted_at: string }[] };
  }

  const database = createPublicDatabaseClient(databaseUrl, publishableKey);
  const { data, error } = await database
    .from("wedding_wishes")
    .select("guest_name, message, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(8);

  if (error || !data) {
    return { ok: false, wishes: [] as { guest_name: string; message: string; submitted_at: string }[] };
  }

  return { ok: true, wishes: data };
});