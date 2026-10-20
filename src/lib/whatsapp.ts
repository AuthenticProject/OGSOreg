/**
 * WhatsApp Helper Utilities for OGSO Public Website
 */

export const DEFAULT_WA_MESSAGE =
  "Assalamu'alaikum ustadz maaf mengganggu, izin bertanya terkait OGSO 2026"

/**
 * Builds a direct WhatsApp chat URL with pre-filled message text.
 * Strips non-digit characters from the phone number and safely URL-encodes the message.
 */
export function getWhatsAppLink(phone: string, message: string = DEFAULT_WA_MESSAGE): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}
