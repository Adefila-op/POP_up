/**
 * Authentication Middleware
 * Handles wallet signature verification, JWT token creation, and nonce management
 */

import { verifyMessage } from "ethers";
import { AppError, ERROR_CODES } from "../utils/errors";
import { UserService } from "../services/user-service";
import type { User } from "../db/types";
import { createAuthToken, verifyAuthToken, AuthTokenPayload } from "../utils/jwt";
import { validateAndMarkNonce } from "../utils/nonce";

export interface AuthContext {
  user: User;
  walletAddress: string;
  isAuthenticated: boolean;
}

/**
 * Extract bearer token from authorization header
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}

/**
 * Verify wallet signature using EIP-191 signed message recovery
 */
export async function verifyWalletSignature(
  message: string,
  signature: string,
  walletAddress: string,
): Promise<boolean> {
  try {
    const recoveredAddress = verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Extract wallet address from signed message
 * Message format: "creator-commerce-hub:{timestamp}:{nonce}"
 */
export function parseAuthMessage(message: string): {
  timestamp: number;
  nonce: string;
} | null {
  try {
    const parts = message.split(":");
    if (parts.length !== 3 || parts[0] !== "creator-commerce-hub") {
      return null;
    }

    const timestamp = parseInt(parts[1], 10);
    const nonce = parts[2];

    if (!Number.isFinite(timestamp) || !nonce) {
      return null;
    }

    // Check if message is not older than 5 minutes
    const messageAge = Date.now() - timestamp;
    if (messageAge > 5 * 60 * 1000) {
      throw new AppError(ERROR_CODES.UNAUTHORIZED, "Message signature expired", 401);
    }

    return { timestamp, nonce };
  } catch (error) {
    if (error instanceof AppError) throw error;
    return null;
  }
}

/**
 * Create a new authentication token with nonce validation
 */
export async function createUserAuthToken(
  walletAddress: string,
  signature: string,
  message: string,
  userService: UserService,
): Promise<{ token: string; user: User }> {
  // Verify signature
  const isValid = await verifyWalletSignature(message, signature, walletAddress);
  if (!isValid) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "Invalid signature", 401);
  }

  // Parse and validate message
  const parsed = parseAuthMessage(message);
  if (!parsed) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "Invalid message format", 401);
  }

  // Validate nonce hasn't been used (prevent replay attacks)
  if (!validateAndMarkNonce(parsed.nonce)) {
    throw new AppError(
      ERROR_CODES.NONCE_INVALID,
      "Nonce already used. This message has been replayed.",
      401
    );
  }

  // Get or create user
  const user = await userService.getOrCreateUser({
    walletAddress,
    username: walletAddress.substring(0, 10),
  });

  // Create JWT token
  const token = createAuthToken({
    userId: user.id,
    walletAddress: walletAddress.toLowerCase(),
    nonce: parsed.nonce,
  });

  return { token, user };
}

/**
 * Authenticate request using JWT token
 */
export async function authenticateRequest(
  request: Request,
  userService: UserService,
): Promise<AuthContext> {
  const tokenStr = extractToken(request);
  if (!tokenStr) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "Missing authorization token", 401);
  }

  try {
    // Verify and decode JWT
    const tokenPayload = verifyAuthToken(tokenStr);

    // Get user from database
    const user = await userService.getUserById(tokenPayload.userId);
    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 401);
    }

    // Verify wallet address matches
    if (user.wallet_address.toLowerCase() !== tokenPayload.walletAddress.toLowerCase()) {
      throw new AppError(ERROR_CODES.UNAUTHORIZED, "Wallet address mismatch", 401);
    }

    return {
      user,
      walletAddress: tokenPayload.walletAddress.toLowerCase(),
      isAuthenticated: true,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.message.includes("Token")) {
      throw new AppError(ERROR_CODES.TOKEN_EXPIRED, error.message, 401);
    }
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "Authentication failed", 401);
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export function requireAuth(auth: AuthContext | undefined): AuthContext {
  if (!auth?.isAuthenticated) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "Authentication required", 401);
  }
  return auth;
}

/**
 * Optional authentication - returns undefined if not authenticated
 */
export function optionalAuth(auth: AuthContext | undefined): AuthContext | undefined {
  return auth?.isAuthenticated ? auth : undefined;
}

/**
 * Create authentication middleware for Hono
 */
export function createAuthMiddleware(userService: UserService) {
  return async (request: Request, next: () => Promise<void>) => {
    try {
      const auth = await authenticateRequest(request, userService);
      (request as any).auth = auth;
    } catch {
      (request as any).auth = undefined;
    }
    await next();
  };
}
