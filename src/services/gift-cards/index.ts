import { reloadlyGiftCardProvider } from "./reloadly";
import type { GiftCardProvider } from "./types";

export function getGiftCardProvider(): GiftCardProvider {
  const provider = process.env.GIFT_CARD_PROVIDER?.trim().toLowerCase();

  if (provider !== "reloadly") {
    throw new Error(
      "Gift-card provider integration is required. Set GIFT_CARD_PROVIDER=reloadly and configure Reloadly credentials.",
    );
  }

  return reloadlyGiftCardProvider;
}
