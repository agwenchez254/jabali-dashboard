/** KRA PINs: a letter (A personal, P company), nine digits and a letter. */
export const KRA_PIN = /^[AP]\d{9}[A-Z]$/;

export interface VatForm {
  enabled: boolean;
  ratePercent: string;
  businessName: string;
  kraPin: string;
  address: string;
}

export const EMPTY_VAT: VatForm = { enabled: false, ratePercent: "16", businessName: "", kraPin: "", address: "" };

/** Reads the stored setting, tolerating a missing or partial value. */
export function toVatForm(value: unknown): VatForm {
  const v = (value ?? {}) as Partial<{ enabled: boolean; ratePercent: number; businessName: string; kraPin: string; address: string }>;
  return {
    enabled: v.enabled === true,
    ratePercent: v.ratePercent != null ? String(v.ratePercent) : EMPTY_VAT.ratePercent,
    businessName: v.businessName ?? "",
    kraPin: v.kraPin ?? "",
    address: v.address ?? "",
  };
}

/** Field errors, matching what the API enforces. Empty when the form can be saved. */
export function vatErrors(f: VatForm): Partial<Record<keyof VatForm, string>> {
  const errors: Partial<Record<keyof VatForm, string>> = {};
  const rate = Number(f.ratePercent);
  if (!f.ratePercent.trim() || !Number.isFinite(rate) || rate <= 0 || rate > 30) errors.ratePercent = "Enter a rate above 0 and up to 30";
  else if (Math.round(rate * 100) / 100 !== rate) errors.ratePercent = "At most two decimals";
  if (f.enabled) {
    if (!f.businessName.trim()) errors.businessName = "Required to enable VAT";
    if (!KRA_PIN.test(f.kraPin.trim())) errors.kraPin = "Enter a valid KRA PIN, e.g. P051234567Z";
  }
  return errors;
}

export function toVatValue(f: VatForm) {
  return { enabled: f.enabled, ratePercent: Number(f.ratePercent), businessName: f.businessName.trim(), kraPin: f.kraPin.trim().toUpperCase(), address: f.address.trim() };
}
