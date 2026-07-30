import crypto from 'crypto';

// ============================================
// QR TOKEN SERVICE
// ============================================
// Generates the unguessable tokens embedded in beneficiary QR codes.
// Base32 (RFC 4648 alphabet) keeps tokens short, case-insensitive friendly
// and free of ambiguous characters like 0/O and 1/I.

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOKEN_LENGTH = 12; // 12 chars × 5 bits = 60 bits of entropy

// Return a random 12-character uppercase base32 string.
// 256 % 32 === 0, so a simple modulo over crypto bytes is bias-free.
export function generateToken(length = TOKEN_LENGTH) {
  const bytes = crypto.randomBytes(length);
  let token = '';
  for (let i = 0; i < length; i++) {
    token += BASE32_ALPHABET[bytes[i] % 32];
  }
  return token;
}

// Mint a token guaranteed (at write time) not to collide with an existing
// row. Checks the column first and retries on the off chance of a clash;
// the DB's UNIQUE constraint remains the final arbiter under races.
export async function unique(model, field = 'qrToken', attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    const token = generateToken();
    const existing = await model.findOne({ where: { [field]: token }, attributes: ['id'] });
    if (!existing) return token;
  }
  throw new Error(`Could not generate a unique ${field} after ${attempts} attempts`);
}
