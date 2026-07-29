import { NextResponse } from "next/server";
import { getSettings } from "@/lib/data";
import { buildScheduledNotifications } from "@/lib/prayer";
import { sendPushToAll } from "@/lib/push";
import { getSupabase } from "@/lib/supabase";

const WINDOW_MS = 60_000;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getSettings();
    if (settings.latitude == null || settings.longitude == null) {
      return NextResponse.json({
        ok: true,
        skipped: "No location configured",
      });
    }

    const now = new Date();
    const scheduled = buildScheduledNotifications(settings, now);
    const due = scheduled.filter(
      (n) => Math.abs(n.at.getTime() - now.getTime()) <= WINDOW_MS,
    );

    if (!due.length) {
      return NextResponse.json({ ok: true, sent: 0, due: 0 });
    }

    const supabase = getSupabase();
    let sentCount = 0;

    for (const item of due) {
      const { error: insertError } = await supabase
        .from("notification_sends")
        .insert({
          prayer: item.prayer,
          kind: item.kind,
          scheduled_for: item.at.toISOString(),
        });

      // Unique violation → already sent
      if (insertError) {
        continue;
      }

      const result = await sendPushToAll({
        title: item.title,
        body: item.body,
        url: "/",
      });
      sentCount += result.sent;
    }

    return NextResponse.json({
      ok: true,
      due: due.length,
      sent: sentCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
