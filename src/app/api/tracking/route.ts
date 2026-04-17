import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, eventName, properties } = body;

    if (!sessionId || !eventName) {
      return NextResponse.json(
        { error: "Missing sessionId or eventName" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // First ensure we have a web_session for this sessionId
    // Check if one exists, otherwise create it
    const { data: existingSession } = await supabase
      .from("web_sessions")
      .select("id")
      .eq("anonymous_id", sessionId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    let webSessionId = existingSession?.id;

    if (!webSessionId) {
      const pagePath = properties?.page_section || "/landing";
      const { data: newSession, error: sessionError } = await supabase
        .from("web_sessions")
        .insert({
          anonymous_id: sessionId,
          page_path: pagePath,
          source: properties?.utm_source || null,
          medium: properties?.utm_medium || null,
          campaign: properties?.utm_campaign || null,
          duration_seconds: 0,
          timestamp: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (sessionError) {
        console.error("Session create error:", sessionError);
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
      }
      webSessionId = newSession?.id;
    }

    // Insert the event into web_events (matches schema: session_id UUID FK, event_name, page_path, metadata JSONB, timestamp)
    const { data, error } = await supabase
      .from("web_events")
      .insert({
        session_id: webSessionId,
        event_name: eventName,
        page_path: properties?.page_section || "/landing",
        metadata: properties || {},
        timestamp: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase tracking insert error:", error);
      return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
    }

    return NextResponse.json({ success: true, eventId: data?.id });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}
