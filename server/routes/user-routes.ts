/**
 * User Routes - API endpoints for user management and authentication
 */

import { Hono } from "hono";
import { UserService } from "../services/user-service";
import {
  authenticateRequest,
  createUserAuthToken,
  optionalAuth,
  requireAuth,
} from "../middleware/auth";
import { validateEmail, validateUsername, validateWalletAddress } from "../utils/validation";
import { createSuccessResponse, createHTTPResponse, handleError, AppError, ERROR_CODES } from "../utils/errors";
import { rateLimitAuth, rateLimitAPI } from "../utils/rate-limit";
import { generateNewNonce } from "../utils/nonce";

export interface UserRoutesOptions {
  userService: UserService;
}

export function createUserRoutes(options: UserRoutesOptions): Hono {
  const router = new Hono();
  const { userService } = options;

  /**
   * GET /api/auth/nonce - Get a nonce for signing
   */
  router.get("/api/auth/nonce", (c) => {
    try {
      const nonce = generateNewNonce();
      const message = `creator-commerce-hub:${Date.now()}:${nonce}`;

      const response = createSuccessResponse(
        {
          nonce,
          message,
          expiresIn: 300, // 5 minutes
        },
        200
      );
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * POST /api/auth/login - Authenticate with wallet signature
   * Body: { walletAddress, signature, message }
   */
  router.post("/api/auth/login", async (c) => {
    try {
      // Apply rate limiting
      await rateLimitAuth(c, async () => {});

      const body = await c.req.json();

      if (!body.walletAddress || !body.signature || !body.message) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "walletAddress, signature, and message are required",
          400
        );
      }

      if (!validateWalletAddress(body.walletAddress)) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid wallet address", 400);
      }

      // Create JWT token with nonce validation
      const { token, user } = await createUserAuthToken(
        body.walletAddress,
        body.signature,
        body.message,
        userService
      );

      const response = createSuccessResponse(
        {
          user,
          token,
        },
        200
      );
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * GET /api/auth/me - Get current user profile
   */
  router.get("/api/auth/me", async (c) => {
    try {
      await rateLimitAPI(c, async () => {});

      const auth = await authenticateRequest(c.req.raw, userService);
      requireAuth(auth);

      const response = createSuccessResponse(auth.user, 200);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * PUT /api/auth/me - Update current user profile
   */
  router.put("/api/auth/me", async (c) => {
    try {
      await rateLimitAPI(c, async () => {});

      const auth = await authenticateRequest(c.req.raw, userService);
      requireAuth(auth);

      const body = await c.req.json();

      // Validate and sanitize inputs
      if (body.username && !validateUsername(body.username)) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid username", 400);
      }

      if (body.email && !validateEmail(body.email)) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid email", 400);
      }

      // Add length validation
      if (body.username && body.username.length > 50) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Username too long (max 50 chars)", 400);
      }

      if (body.bio && body.bio.length > 500) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Bio too long (max 500 chars)", 400);
      }

      const updatedUser = await userService.updateUser(auth.user.id, body);

      const response = createSuccessResponse(updatedUser, 200);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * GET /api/users/:id - Get user profile
   */
  router.get("/api/users/:id", async (c) => {
    try {
      const userId = c.req.param("id");
      const user = await userService.getUserById(userId);

      if (!user) {
        throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
      }

      // Hide sensitive info from non-owner requests
      const auth = await optionalAuthenticate(c.req.raw, userService);
      if (!auth || auth.user.id !== userId) {
        const { cash_balance, ...publicUser } = user;
        const response = createSuccessResponse(publicUser, 200);
        return createHTTPResponse(response);
      }

      const response = createSuccessResponse(user, 200);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * PUT /api/auth/me - Update current user profile
   */
  router.put("/api/auth/me", async (c) => {
    try {
      const auth = await authenticateRequest(c.req.raw, userService);
      requireAuth(auth);

      const body = await c.req.json();

      // Validate inputs
      if (body.username) {
        if (!validateUsername(body.username)) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid username format", 400);
        }
      }

      if (body.email) {
        if (!validateEmail(body.email)) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid email format", 400);
        }
      }

      const updated = await userService.updateUser(auth.user.id, {
        username: body.username,
        email: body.email,
        profilePictureUrl: body.profilePictureUrl,
        bio: body.bio,
        isCreator: body.isCreator,
      });

      const response = createSuccessResponse(updated, 200);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * POST /api/users/deposit - Deposit cash (test endpoint)
   * In production, this would be connected to payment processor
   */
  router.post("/api/users/deposit", async (c) => {
    try {
      const auth = await authenticateRequest(c.req.raw, userService);
      requireAuth(auth);

      const body = await c.req.json();

      if (!body.amount || body.amount <= 0) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Amount must be positive", 400);
      }

      const amountInCents = Math.round(body.amount * 100);
      const updated = await userService.depositCash(auth.user.id, amountInCents);

      const response = createSuccessResponse(updated, 200);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * POST /api/users/withdraw - Withdraw cash
   * In production, this would be connected to payment processor
   */
  router.post("/api/users/withdraw", async (c) => {
    try {
      const auth = await authenticateRequest(c.req.raw, userService);
      requireAuth(auth);

      const body = await c.req.json();

      if (!body.amount || body.amount <= 0) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Amount must be positive", 400);
      }

      const amountInCents = Math.round(body.amount * 100);
      const updated = await userService.withdrawCash(auth.user.id, amountInCents);

      const response = createSuccessResponse(updated, 200);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  return router;
}
