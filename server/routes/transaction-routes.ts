/**
 * Transaction Routes - API endpoints for trading operations
 */

import { Hono } from "hono";
import { IPService } from "../services/ip-service";
import { TransactionService } from "../services/transaction-service";
import { LiquidityService } from "../services/liquidity-service";
import { UserService } from "../services/user-service";
import { authenticateRequest, requireAuth } from "../middleware/auth";
import {
  validateBuyTransactionInput,
  validateSellTransactionInput,
} from "../utils/validation";
import {
  createSuccessResponse,
  createHTTPResponse,
  handleError,
  AppError,
  ERROR_CODES,
} from "../utils/errors";

export interface TransactionRoutesOptions {
  ipService: IPService;
  transactionService: TransactionService;
  liquidityService: LiquidityService;
  userService: UserService;
}

export function createTransactionRoutes(
  options: TransactionRoutesOptions
): Hono {
  const router = new Hono();
  const {
    ipService,
    transactionService,
    liquidityService,
    userService,
  } = options;

  /**
   * POST /api/transactions/buy - Execute buy transaction
   */
  router.post("/api/transactions/buy", async (c) => {
    try {
      const auth = await authenticateRequest(c.req.raw, userService);
      requireAuth(auth);

      const body = await c.req.json();
      validateBuyTransactionInput(body);

      // Check user has sufficient cash balance
      if (auth.user.cash_balance < Math.round(body.amountUSD * 100)) {
        throw new AppError(
          ERROR_CODES.INSUFFICIENT_FUNDS,
          "Insufficient cash balance",
          400
        );
      }

      // Execute transaction
      const transaction = await transactionService.executeBuy({
        ipId: body.ipId,
        buyerId: auth.user.id,
        amountUSD: body.amountUSD,
      });

      // Deduct cash from buyer
      await userService.withdrawCash(
        auth.user.id,
        Math.round(body.amountUSD * 100)
      );

      const response = createSuccessResponse(transaction, 201);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * POST /api/transactions/sell - Execute sell transaction
   */
  router.post("/api/transactions/sell", async (c) => {
    try {
      const auth = await authenticateRequest(c.req.raw, userService);
      requireAuth(auth);

      const body = await c.req.json();
      validateSellTransactionInput(body);

      // Execute transaction
      const transaction = await transactionService.executeSell({
        ipId: body.ipId,
        sellerId: auth.user.id,
        amountTokens: body.amountTokens,
      });

      // Add proceeds to seller's cash balance
      if (transaction.seller_proceeds > 0) {
        await userService.depositCash(auth.user.id, transaction.seller_proceeds);
      }

      const response = createSuccessResponse(transaction, 201);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * GET /api/transactions/:id - Get transaction details
   */
  router.get("/api/transactions/:id", async (c) => {
    try {
      const transactionId = c.req.param("id");
      const transaction = await transactionService.getTransactionById(
        transactionId
      );

      if (!transaction) {
        throw new AppError(
          ERROR_CODES.NOT_FOUND,
          "Transaction not found",
          404
        );
      }

      const response = createSuccessResponse(transaction, 200);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * GET /api/users/:userId/transactions - Get user's transactions
   */
  router.get("/api/users/:userId/transactions", async (c) => {
    try {
      const userId = c.req.param("userId");

      // Verify user exists
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new AppError(
          ERROR_CODES.USER_NOT_FOUND,
          "User not found",
          404
        );
      }

      const transactions = await transactionService.getUserTransactions(userId);
      const response = createSuccessResponse(transactions, 200);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * POST /api/transactions/burn-claim - Claim burn share
   */
  router.post("/api/transactions/burn-claim", async (c) => {
    try {
      const auth = await authenticateRequest(c.req.raw, userService);
      requireAuth(auth);

      const body = await c.req.json();

      if (!body.ipId || !body.amountTokens) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "ipId and amountTokens are required",
          400
        );
      }

      const burnClaim = await liquidityService.claimBurnShare(
        body.ipId,
        auth.user.id,
        body.amountTokens
      );

      // Add liquidity share to cash balance
      if (burnClaim.liquidity_share > 0) {
        await userService.depositCash(auth.user.id, burnClaim.liquidity_share);
      }

      const response = createSuccessResponse(burnClaim, 201);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  return router;
}
