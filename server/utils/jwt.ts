/**
 * JWT Authentication Utilities
 * Handles secure token creation, verification, and management
 */

import jwt from 'jsonwebtoken';

export interface AuthTokenPayload {
  userId: string;
  walletAddress: string;
  nonce: string; // Unique identifier to prevent replay attacks
  iat?: number; // Issued at
  exp?: number; // Expiration
}

// Get JWT secrets from environment
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

/**
 * Create a new JWT token with expiration and nonce
 */
export function createAuthToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
      algorithm: 'HS256',
    });
  } catch (error) {
    console.error('Failed to create auth token:', error);
    throw new Error('Failed to create authentication token');
  }
}

/**
 * Verify and decode a JWT token
 */
export function verifyAuthToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });

    return decoded as AuthTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.InvalidTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return false;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return true;
    }
    return false;
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.decode(token);
    return decoded as AuthTokenPayload | null;
  } catch {
    return null;
  }
}

/**
 * Generate a unique nonce for replay attack prevention
 */
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
