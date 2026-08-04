import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ENABLE_POSTHOG: process.env.ENABLE_POSTHOG || "0",
      POSTHOG_KEY: process.env.POSTHOG_KEY || "",
      POSTHOG_HOST: process.env.POSTHOG_HOST || "",
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
