import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGiftCardProvider } from "@/services/gift-cards";

type PurchaseBody = {
  productId?: unknown;
  unitPrice?: unknown;
  countryCode?: unknown;
  quantity?: unknown;
  recipientEmail?: unknown;
  recipientPhoneCountryCode?: unknown;
  recipientPhoneNumber?: unknown;
  customIdentifier?: unknown;
  senderName?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as PurchaseBody;
    const productId = Number(body.productId);
    const unitPrice = Number(body.unitPrice);
    const countryCode = String(body.countryCode ?? "").trim().toUpperCase();
    const quantity = body.quantity == null ? 1 : Number(body.quantity);
    const customIdentifier = String(body.customIdentifier ?? "").trim();

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "productId must be a positive integer" }, { status: 400 });
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return NextResponse.json({ error: "unitPrice must be a positive number" }, { status: 400 });
    }
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      return NextResponse.json({ error: "countryCode must be a two-letter ISO code" }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return NextResponse.json({ error: "quantity must be an integer between 1 and 100" }, { status: 400 });
    }
    if (!customIdentifier) {
      return NextResponse.json({ error: "customIdentifier is required" }, { status: 400 });
    }

    const provider = getGiftCardProvider();

    // Never trust client-supplied pricing. Reloadly is the source of truth.
    const product = await provider.product(productId);
    const allowed = product.fixedRecipientDenominations?.some(
      (value) => Math.abs(Number(value) - unitPrice) < 0.000001,
    );

    if (product.denominationType === "FIXED" && !allowed) {
      return NextResponse.json(
        { error: "The requested denomination is not currently offered by the provider." },
        { status: 409 },
      );
    }

    if (
      product.denominationType === "RANGE" &&
      ((product.minRecipientDenomination != null && unitPrice < product.minRecipientDenomination) ||
        (product.maxRecipientDenomination != null && unitPrice > product.maxRecipientDenomination))
    ) {
      return NextResponse.json(
        { error: "The requested denomination is outside the provider's current range." },
        { status: 409 },
      );
    }

    const result = await provider.purchase({
      productId,
      unitPrice,
      countryCode,
      quantity,
      recipientEmail: typeof body.recipientEmail === "string" ? body.recipientEmail : undefined,
      recipientPhoneCountryCode:
        typeof body.recipientPhoneCountryCode === "string" ? body.recipientPhoneCountryCode : undefined,
      recipientPhoneNumber:
        typeof body.recipientPhoneNumber === "string" ? body.recipientPhoneNumber : undefined,
      senderName: typeof body.senderName === "string" ? body.senderName : undefined,
      customIdentifier,
    });

    // The provider response is authoritative. No card code or balance is generated locally.
    return NextResponse.json({
      provider: result.provider,
      transactionId: result.transactionId,
      status: result.status,
      amount: result.amount,
      currencyCode: result.currencyCode,
      totalFee: result.totalFee,
      discount: result.discount,
      customIdentifier: result.customIdentifier,
      delivery: {
        email: result.recipientEmail ?? null,
        phone: result.recipientPhone ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gift-card purchase failed.";
    const status = message.includes("provider integration is required") || message.includes("not configured")
      ? 503
      : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
