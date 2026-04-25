/**
 * User Routes - API endpoints for user management and authentication
 */

import { Hono } from "hono";
import { UserService } from "../services/user-service";
import { authenticateRequest, requireAuth, optionalAuthenticate } from "../middleware/auth";
import {
  validateEmail,
  validateUsername,
  ValidationError,
} from "../utils/validation";
import {
  createSuccessResponse,
  createHTTPResponse,
  handleError,
  AppError,
  ERROR_CODES,
} from "../utils/errors";

export interface UserRoutesOptions {
  userService: UserService;
}

export function createUserRoutes(options: UserRoutesOptions): Hono {
  const router = new Hono();
  const { userService } = options;

  /**
   * POST /api/auth/login - Authenticate with wallet signature
   * Body: { walletAddress, signature, message }
   */
  router.post("/api/auth/login", async (c) => {
    try {
      const body = await c.req.json();

      if (!body.walletAddress || !body.signature || !body.message) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "walletAddress, signature, and message are required",
          400
        );
      }

      // Get or create user
      const user = await userService.getOrCreateUser({
        walletAddress: body.walletAddress,
        username: body.username || body.walletAddress.substring(0, 10),
        email: body.email,
      });

      // TODO: In production, verify signature before returning token
      // const isValid = await verifyWalletSignature(
      //   body.message,
      //   body.signature,
      //   body.walletAddress
      // );
      // if (!isValid) throw new AppError(...);

      const response = createSuccessResponse({
        user,
        token: `${body.walletAddress}:${body.signature}:${body.message}`,
      }, 200);
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
   * GET /api/users/:id - Get user profile
   */
  router.get("/api/users/:id", async (c) => {
    try {
      const userId = c.req.param("id");
      const user = await userService.getUserById(userId);

      if (!user) {
        throw new AppError(
          ERROR_CODES.USER_NOT_FOUND,
          "User not found",
          404
        );
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
          throw new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            "Invalid username format",
            400
          );
        }
      }

      if (body.email) {
        if (!validateEmail(body.email)) {
          throw new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            "Invalid email format",
            400
          );
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
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "Amount must be positive",
          400
        );
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
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "Amount must be positive",
          400
        );
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
