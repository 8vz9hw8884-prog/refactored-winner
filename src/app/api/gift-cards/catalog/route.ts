import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGiftCardProvider } from "@/services/gift-cards";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const countryCode = new URL(request.url).searchParams.get("countryCode") ?? "";
    if (!countryCode) {
      return NextResponse.json({ error: "countryCode is required" }, { status: 400 });
    }

    const products = await getGiftCardProvider().catalog(countryCode);
    return NextResponse.json({
      provider: "reloadly",
      countryCode: countryCode.toUpperCase(),
      products,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gift-card catalog unavailable.";
    const status = message.includes("provider integration is required") || message.includes("not configured")
      ? 503
      : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
