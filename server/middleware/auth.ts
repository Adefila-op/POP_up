/**
 * Authentication Middleware
 * Handles wallet signature verification and user authentication
 */

import { AppError, ERROR_CODES } from "../utils/errors";
import { UserService } from "../services/user-service";
import type { User } from "../db/types";

export interface AuthContext {
  user: User;
  walletAddress: string;
  isAuthenticated: boolean;
}

export interface AuthRequest extends Request {
  auth?: AuthContext;
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
 * Verify wallet signature (mock implementation)
 * In production, use ethers.js to verify EIP-191 signatures
 */
export async function verifyWalletSignature(
  message: string,
  signature: string,
  walletAddress: string
): Promise<boolean> {
  // TODO: Implement real signature verification using ethers.js
  // This is a placeholder that should be replaced with:
  // import { verifyMessage } from "ethers";
  // return verifyMessage(message, signature) === walletAddress;

  console.warn(
    "Using mock signature verification. Implement real verification in production."
  );
  return walletAddress.toLowerCase().startsWith("0x");
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
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        "Message signature expired",
        401
      );
    }

    return { timestamp, nonce };
  } catch (error) {
    return null;
  }
}

/**
 * Authenticate request using wallet signature
 */
export async function authenticateRequest(
  request: Request,
  userService: UserService
): Promise<AuthContext> {
  const token = extractToken(request);
  if (!token) {
    throw new AppError(
      ERROR_CODES.UNAUTHORIZED,
      "Missing authorization token",
      401
    );
  }

  try {
    // Parse JWT or signed message
    // For now, using signed message format: {walletAddress}:{signature}:{message}
    const parts = token.split(":");
    if (parts.length !== 3) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        "Invalid token format",
        401
      );
    }

    const [walletAddress, signature, message] = parts;

    // Verify signature
    const isValid = await verifyWalletSignature(message, signature, walletAddress);
    if (!isValid) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        "Invalid signature",
        401
      );
    }

    // Parse message
    const parsed = parseAuthMessage(message);
    if (!parsed) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        "Invalid message format",
        401
      );
    }

    // Get or create user
    const user = await userService.getOrCreateUser({
      walletAddress,
      username: walletAddress.substring(0, 10),
    });

    return {
      user,
      walletAddress: walletAddress.toLowerCase(),
      isAuthenticated: true,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      ERROR_CODES.UNAUTHORIZED,
      "Authentication failed",
      401
    );
  }
}

/**
 * Optional authentication - returns null if not authenticated
 */
export async function optionalAuthenticate(
  request: Request,
  userService: UserService
): Promise<AuthContext | null> {
  try {
    return await authenticateRequest(request, userService);
  } catch {
    return null;
  }
}

/**
 * Middleware to attach auth context to request
 */
export function createAuthMiddleware(userService: UserService) {
  return async (request: AuthRequest): Promise<AuthRequest> => {
    try {
      request.auth = await authenticateRequest(request, userService);
    } catch {
      request.auth = undefined;
    }
    return request;
  };
}

/**
 * Require authentication
 */
export function requireAuth(auth: AuthContext | undefined): AuthContext {
  if (!auth?.isAuthenticated) {
    throw new AppError(
      ERROR_CODES.UNAUTHORIZED,
      "Authentication required",
      401
    );
  }
  return auth;
}
