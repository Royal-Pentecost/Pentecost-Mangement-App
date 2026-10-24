import { Linking } from "react-native";

/**
 * Call, SMS and WhatsApp links for a phone number, the same on every profile.
 *
 * The roll stores Ghanaian numbers in local form, `0XXXXXXXXX`. A phone dials
 * that as it is, but WhatsApp's link wants the international form with no
 * leading zero — `wa.me/233XXXXXXXXX`. The leader profile sent the local form,
 * so its WhatsApp button opened a chat with nobody.
 */

/** "0537096725" / "+233 53 709 6725" -> "233537096725"; "" when there is no usable number. */
export function internationalNumber(phone: string | undefined | null): string {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("233") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `233${digits.slice(1)}`;
  return digits.length >= 9 ? digits : "";
}

export interface ContactLinks {
  call: string;
  sms: string;
  whatsapp: string;
}

/** Null when there is no number to reach them on — say so rather than offer dead buttons. */
export function contactLinks(phone: string | undefined | null): ContactLinks | null {
  const intl = internationalNumber(phone);
  if (!intl) return null;
  const dial = `+${intl}`;
  return {
    call: `tel:${dial}`,
    sms: `sms:${dial}`,
    whatsapp: `https://wa.me/${intl}`,
  };
}

/** Opens a contact link; a phone with no SMS or WhatsApp app simply does nothing. */
export function openContact(url: string) {
  Linking.openURL(url).catch(() => {});
}
