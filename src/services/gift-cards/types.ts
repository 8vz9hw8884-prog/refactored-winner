export type GiftCardEnvironment = "sandbox" | "production";

export type GiftCardProduct = {
  productId: number;
  productName: string;
  countryCode?: string;
  status?: string;
  denominationType?: "FIXED" | "RANGE" | string;
  recipientCurrencyCode?: string;
  senderCurrencyCode?: string;
  discountPercentage?: number;
  senderFee?: number;
  minRecipientDenomination?: number | null;
  maxRecipientDenomination?: number | null;
  fixedRecipientDenominations?: number[];
  fixedSenderDenominations?: number[];
  fixedRecipientToSenderDenominationsMap?: Record<string, number>;
  logoUrls?: string[];
  brand?: Record<string, unknown>;
  country?: Record<string, unknown>;
  redeemInstruction?: Record<string, unknown>;
};

export type GiftCardPurchaseInput = {
  productId: number;
  unitPrice: number;
  countryCode: string;
  quantity?: number;
  recipientEmail?: string;
  recipientPhoneCountryCode?: string;
  recipientPhoneNumber?: string;
  customIdentifier: string;
  senderName?: string;
};

export type GiftCardPurchaseResult = {
  provider: "reloadly";
  transactionId: number;
  status: string;
  amount: number;
  currencyCode: string;
  totalFee?: number;
  discount?: number;
  recipientEmail?: string;
  recipientPhone?: string;
  customIdentifier: string;
  raw: Record<string, unknown>;
};

export interface GiftCardProvider {
  readonly name: "reloadly";
  catalog(countryCode: string): Promise<GiftCardProduct[]>;
  product(productId: number): Promise<GiftCardProduct>;
  purchase(input: GiftCardPurchaseInput): Promise<GiftCardPurchaseResult>;
}
