import crypto from 'crypto';
import bcrypt from 'bcrypt';

const SCRYPT_SALT_LEN = 16;
const IV_LEN = 12;
const KEY_LEN = 32;
const BCRYPT_ROUNDS = 12;

/**
 * @param {string} password
 * @param {Buffer} kdfSalt
 * @returns {Buffer}
 */
function deriveKey(password, kdfSalt) {
  return crypto.scryptSync(password, kdfSalt, KEY_LEN, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
}

/**
 * @param {string} plainText
 * @param {string} password
 * @returns {Promise<{
 *   passwordHash: string,
 *   kdfSalt: Buffer,
 *   iv: Buffer,
 *   ciphertext: Buffer,
 *   authTag: Buffer
 * }>}
 */
export async function encryptSecretPayload(plainText, password) {
  const kdfSalt = crypto.randomBytes(SCRYPT_SALT_LEN);
  const key = deriveKey(password, kdfSalt);
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return { passwordHash, kdfSalt, iv, ciphertext: encrypted, authTag };
}

/**
 * @param {string} password
 * @param {import('pg').QueryResult['rows'][0]} row
 * @returns {Promise<string>} decrypted UTF-8 text
 */
export async function decryptSecretPayload(password, row) {
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) {
    const err = new Error('INVALID_PASSWORD');
    err.code = 'INVALID_PASSWORD';
    throw err;
  }
  const key = deriveKey(password, row.kdf_salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, row.iv, { authTagLength: 16 });
  decipher.setAuthTag(row.auth_tag);
  return Buffer.concat([decipher.update(row.ciphertext), decipher.final()]).toString('utf8');
}
