import type {
  GiftCardProduct,
  GiftCardProvider,
  GiftCardPurchaseInput,
  GiftCardPurchaseResult,
} from "./types";

const AUTH_URL = "https://auth.reloadly.com/oauth/token";
const PRODUCTION_API = "https://giftcards.reloadly.com";
const SANDBOX_API = "https://giftcards-sandbox.reloadly.com";

type TokenResponse = {
  access_token: string;
  expires_in: number;
};

type ReloadlyConfig = {
  clientId: string;
  clientSecret: string;
  sandbox: boolean;
};

let tokenCache:
  | { accessToken: string; expiresAt: number; apiBase: string }
  | undefined;

function getConfig(): ReloadlyConfig {
  const clientId = process.env.RELOADLY_CLIENT_ID?.trim();
  const clientSecret = process.env.RELOADLY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Gift-card provider is not configured. Set RELOADLY_CLIENT_ID and RELOADLY_CLIENT_SECRET.",
    );
  }

  return {
    clientId,
    clientSecret,
    sandbox: process.env.RELOADLY_SANDBOX === "true",
  };
}

async function accessToken(): Promise<{ token: string; apiBase: string }> {
  const config = getConfig();
  const apiBase = config.sandbox ? SANDBOX_API : PRODUCTION_API;

  if (
    tokenCache &&
    tokenCache.apiBase === apiBase &&
    tokenCache.expiresAt > Date.now() + 60_000
  ) {
    return { token: tokenCache.accessToken, apiBase };
  }

  const response = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "client_credentials",
      audience: apiBase,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Reloadly authentication failed (${response.status}): ${body.slice(0, 500)}`);
  }

  const data = (await response.json()) as TokenResponse;
  if (!data.access_token || !data.expires_in) {
    throw new Error("Reloadly returned an invalid access-token response.");
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    apiBase,
  };

  return { token: data.access_token, apiBase };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { token, apiBase } = await accessToken();
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Accept: "application/com.reloadly.giftcards-v1+json",
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Reloadly request failed (${response.status}): ${body.slice(0, 1000)}`);
  }

  return (await response.json()) as T;
}

export class ReloadlyGiftCardProvider implements GiftCardProvider {
  readonly name = "reloadly" as const;

  async catalog(countryCode: string): Promise<GiftCardProduct[]> {
    const code = countryCode.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) {
      throw new Error("countryCode must be a two-letter ISO country code.");
    }
    return request<GiftCardProduct[]>(`/countries/${encodeURIComponent(code)}/products`);
  }

  async product(productId: number): Promise<GiftCardProduct> {
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error("productId must be a positive integer.");
    }
    return request<GiftCardProduct>(`/products/${productId}`);
  }

  async purchase(input: GiftCardPurchaseInput): Promise<GiftCardPurchaseResult> {
    if (!Number.isInteger(input.productId) || input.productId <= 0) {
      throw new Error("productId must be a positive integer.");
    }
    if (!Number.isFinite(input.unitPrice) || input.unitPrice <= 0) {
      throw new Error("unitPrice must be a positive number.");
    }
    if (!/^[A-Z]{2}$/.test(input.countryCode)) {
      throw new Error("countryCode must be a two-letter ISO country code.");
    }
    if (!input.customIdentifier.trim()) {
      throw new Error("customIdentifier is required for idempotent order tracking.");
    }

    const quantity = input.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new Error("quantity must be an integer between 1 and 100.");
    }

    const payload: Record<string, unknown> = {
      productId: input.productId,
      countryCode: input.countryCode.toUpperCase(),
      quantity,
      unitPrice: input.unitPrice,
      customIdentifier: input.customIdentifier,
    };

    if (input.senderName) payload.senderName = input.senderName;
    if (input.recipientEmail) payload.recipientEmail = input.recipientEmail;
    if (input.recipientPhoneCountryCode && input.recipientPhoneNumber) {
      payload.recipientPhoneDetails = {
        countryCode: input.recipientPhoneCountryCode.toUpperCase(),
        phoneNumber: input.recipientPhoneNumber,
      };
    }

    const raw = await request<Record<string, unknown>>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const transactionId = Number(raw.transactionId);
    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      throw new Error("Reloadly returned an invalid transaction ID.");
    }

    return {
      provider: "reloadly",
      transactionId,
      status: String(raw.status ?? "UNKNOWN"),
      amount: Number(raw.amount ?? 0),
      currencyCode: String(raw.currencyCode ?? ""),
      totalFee: raw.totalFee == null ? undefined : Number(raw.totalFee),
      discount: raw.discount == null ? undefined : Number(raw.discount),
      recipientEmail: raw.recipientEmail == null ? undefined : String(raw.recipientEmail),
      recipientPhone: raw.recipientPhone == null ? undefined : String(raw.recipientPhone),
      customIdentifier: String(raw.customIdentifier ?? input.customIdentifier),
      raw,
    };
  }
}

export const reloadlyGiftCardProvider = new ReloadlyGiftCardProvider();
