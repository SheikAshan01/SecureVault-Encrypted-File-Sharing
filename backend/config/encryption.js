import crypto from 'crypto';

// AES-256-GCM Configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a consistent 32-byte (256-bit) encryption key from the environment variable
 */
function getMasterKey() {
  const envKey = process.env.FILE_ENCRYPTION_KEY || 'default_super_secure_master_key_32_bytes!';
  // Hash to 32 bytes via SHA-256 to guarantee exact length
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Encrypt a buffer using AES-256-GCM
 * @param {Buffer} buffer - Plaintext file data
 * @returns {Object} { encryptedBuffer, iv, authTag, sha256 }
 */
export function encryptBuffer(buffer) {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Compute SHA-256 checksum of the original plaintext for verification
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  const encryptedPart1 = cipher.update(buffer);
  const encryptedPart2 = cipher.final();
  const encryptedBuffer = Buffer.concat([encryptedPart1, encryptedPart2]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedBuffer,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    sha256,
  };
}

/**
 * Decrypt an AES-256-GCM encrypted buffer
 * @param {Buffer} encryptedBuffer - Ciphertext data
 * @param {string} ivHex - Hex string of 16-byte IV
 * @param {string} authTagHex - Hex string of 16-byte GCM Auth Tag
 * @returns {Buffer} Decrypted plaintext buffer
 */
export function decryptBuffer(encryptedBuffer, ivHex, authTagHex) {
  const key = getMasterKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decryptedPart1 = decipher.update(encryptedBuffer);
  const decryptedPart2 = decipher.final(); // Will throw an error if authTag verification fails (data tampered)
  
  return Buffer.concat([decryptedPart1, decryptedPart2]);
}

/**
 * Generate a cryptographically secure random sharing token
 */
export function generateShareToken() {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Generate a 6-digit numeric PIN for link protection
 */
export function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
