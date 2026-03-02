import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = process.env.TOKEN_ENCRYPTION_KEY!;

function getKey(): Buffer {
    if (!KEY_HEX || KEY_HEX.length !== 64) {
        throw new Error(
            'TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
            'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        );
    }
    return Buffer.from(KEY_HEX, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param token - The plaintext string to encrypt (e.g. a LinkedIn access token).
 * @returns A base64-encoded string in the format `iv:authTag:ciphertext`.
 */
export function encryptToken(token: string): string {
    const iv = randomBytes(12); // 96-bit IV for GCM
    const cipher = createCipheriv(ALGORITHM, getKey(), iv);

    const encrypted = Buffer.concat([
        cipher.update(token, 'utf8'),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.from(
        `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
    ).toString('base64');
}

/**
 * Decrypts a token that was previously encrypted with `encryptToken`.
 * @param encryptedToken - The base64-encoded string returned by `encryptToken`.
 * @returns The original plaintext string.
 * @throws A readable error if the token is malformed or decryption fails.
 */
export function decryptToken(encryptedToken: string): string {
    try {
        const decoded = Buffer.from(encryptedToken, 'base64').toString('utf8');
        const parts = decoded.split(':');

        if (parts.length !== 3) {
            throw new Error('Malformed encrypted token — expected 3 colon-separated parts.');
        }

        const [ivB64, authTagB64, ciphertextB64] = parts;
        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');
        const ciphertext = Buffer.from(ciphertextB64, 'base64');

        const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
        decipher.setAuthTag(authTag);

        return Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]).toString('utf8');
    } catch (err) {
        throw new Error(
            `Token decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
    }
}
