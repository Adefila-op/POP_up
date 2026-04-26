/**
 * Nonce Management for Replay Attack Prevention
 * Tracks used nonces to prevent message replay attacks
 */

import { generateNonce } from './jwt';

// In-memory store for used nonces (consider Redis for production)
const usedNonces = new Map<string, number>();

// Clean up old nonces every 5 minutes (default expiration is 5 minutes)
const NONCE_EXPIRATION_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [nonce, timestamp] of usedNonces.entries()) {
    if (now - timestamp > NONCE_EXPIRATION_MS) {
      usedNonces.delete(nonce);
    }
  }
}, NONCE_EXPIRATION_MS);

/**
 * Generate a new unique nonce
 */
export function generateNewNonce(): string {
  return generateNonce();
}

/**
 * Check if a nonce has been used (and mark it as used)
 * Returns true if nonce is valid (not used before)
 * Returns false if nonce was already used (replay attempt)
 */
export function validateAndMarkNonce(nonce: string): boolean {
  if (usedNonces.has(nonce)) {
    // Nonce already used - this is a replay attack!
    return false;
  }

  // Mark nonce as used
  usedNonces.set(nonce, Date.now());
  return true;
}

/**
 * Check if a nonce is valid without marking it
 */
export function isNonceValid(nonce: string): boolean {
  return !usedNonces.has(nonce);
}

/**
 * Clear a specific nonce (for testing)
 */
export function clearNonce(nonce: string): void {
  usedNonces.delete(nonce);
}

/**
 * Clear all nonces (for testing)
 */
export function clearAllNonces(): void {
  usedNonces.clear();
}

/**
 * Get nonce stats (for monitoring)
 */
export function getNonceStats(): {
  totalNoncesTracked: number;
  oldestNonceAge: number | null;
} {
  if (usedNonces.size === 0) {
    return {
      totalNoncesTracked: 0,
      oldestNonceAge: null,
    };
  }

  const now = Date.now();
  let oldestAge = 0;
  for (const timestamp of usedNonces.values()) {
    const age = now - timestamp;
    if (age > oldestAge) {
      oldestAge = age;
    }
  }

  return {
    totalNoncesTracked: usedNonces.size,
    oldestNonceAge: oldestAge,
  };
}
