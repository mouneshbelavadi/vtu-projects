import crypto from "node:crypto";

const ORDER_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generates a cryptographically secure order code matching:
 * ^VPH-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$
 */
export function generateOrderCode(): string {
  const bytes = crypto.randomBytes(8);
  let code = "VPH-";
  for (let i = 0; i < 8; i++) {
    const byte = bytes[i] ?? 0;
    const index = byte % ORDER_CODE_ALPHABET.length;
    code += ORDER_CODE_ALPHABET[index];
  }
  return code;
}

export function isValidOrderCode(code: string): boolean {
  return /^VPH-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(code);
}
