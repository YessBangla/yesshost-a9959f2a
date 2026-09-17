export type GatewayId = "sslcommerz" | "bkash" | "nagad";

export type GatewayField = {
  key: string;
  en: string;
  bn: string;
  secret: boolean;
  textarea?: boolean;
};

export type GatewayDef = {
  id: GatewayId;
  en: string;
  bn: string;
  descEn: string;
  descBn: string;
  fields: GatewayField[];
};

export const GATEWAYS: GatewayDef[] = [
  {
    id: "sslcommerz",
    en: "SSLCommerz",
    bn: "SSLCommerz",
    descEn: "Cards, mobile banking and net banking in Bangladesh",
    descBn: "কার্ড, মোবাইল ব্যাংকিং ও নেট ব্যাংকিং",
    fields: [
      { key: "store_id", en: "Store ID", bn: "স্টোর আইডি", secret: false },
      { key: "store_pass", en: "Store password", bn: "স্টোর পাসওয়ার্ড", secret: true },
    ],
  },
  {
    id: "bkash",
    en: "bKash",
    bn: "বিকাশ",
    descEn: "bKash tokenized checkout",
    descBn: "বিকাশ টোকেনাইজড চেকআউট",
    fields: [
      { key: "app_key", en: "App key", bn: "অ্যাপ কী", secret: false },
      { key: "app_secret", en: "App secret", bn: "অ্যাপ সিক্রেট", secret: true },
      { key: "username", en: "Username", bn: "ইউজারনেম", secret: false },
      { key: "password", en: "Password", bn: "পাসওয়ার্ড", secret: true },
    ],
  },
  {
    id: "nagad",
    en: "Nagad",
    bn: "নগদ",
    descEn: "Nagad merchant payment gateway",
    descBn: "নগদ মার্চেন্ট পেমেন্ট গেটওয়ে",
    fields: [
      { key: "merchant_id", en: "Merchant ID", bn: "মার্চেন্ট আইডি", secret: false },
      { key: "merchant_private_key", en: "Merchant private key", bn: "মার্চেন্ট প্রাইভেট কী", secret: true, textarea: true },
      { key: "pg_public_key", en: "PG public key", bn: "পিজি পাবলিক কী", secret: true, textarea: true },
    ],
  },
];

/** What the browser is allowed to know about a saved gateway. */
export type GatewayStatus = {
  gateway: GatewayId;
  enabled: boolean;
  isSandbox: boolean;
  /** field key -> masked hint (e.g. "••••3f2a") or null when not set */
  configured: Record<string, string | null>;
  updatedAt: string | null;
};
