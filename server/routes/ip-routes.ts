/**
 * IP Routes - API endpoints for IP management
 */

import { Hono } from "hono";
import { DatabaseClient } from "../db/client";
import { IPService } from "../services/ip-service";
import { TransactionService } from "../services/transaction-service";
import { LiquidityService } from "../services/liquidity-service";
import { UserService } from "../services/user-service";
import { authenticateRequest, requireAuth } from "../middleware/auth";
import { validateCreateIPInput } from "../utils/validation";
import {
  createSuccessResponse,
  createHTTPResponse,
  handleError,
  AppError,
  ERROR_CODES,
} from "../utils/errors";
import type { IPStatus } from "../db/types";

function isIPStatus(value: string): value is IPStatus {
  return ["CREATED", "LAUNCH_PHASE", "PUBLIC_TRADING", "MATURE"].includes(value);
}

export interface IPRoutesOptions {
  db: DatabaseClient;
  ipService: IPService;
  transactionService: TransactionService;
  liquidityService: LiquidityService;
  userService: UserService;
}

export function createIPRoutes(options: IPRoutesOptions): Hono {
  const router = new Hono();
  const { db, ipService, transactionService, liquidityService, userService } = options;

  /**
   * POST /api/ips - Create new IP
   */
  router.post("/api/ips", async (c) => {
    try {
      const auth = await authenticateRequest(c.req.raw, userService);
      requireAuth(auth);

      const body = await c.req.json();
      validateCreateIPInput(body);

      const ip = await ipService.createIP({
        creatorId: auth.user.id,
        title: body.title,
        description: body.description,
        category: body.category,
        coverImageUrl: body.coverImageUrl,
        initialLiquidityUSD: body.initialLiquidityUSD,
        launchDurationDays: body.launchDurationDays,
      });

      // Create initial token holder for creator with the minted supply
      await transactionService.ensureTokenHolder(ip.id, auth.user.id, ip.total_supply);

      const response = createSuccessResponse(ip, 201);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * GET /api/ips/:id - Get IP by ID
   */
  router.get("/api/ips/:id", async (c) => {
    try {
      const ipId = c.req.param("id");
      const ip = await ipService.getIPById(ipId);

      if (!ip) {
        throw new AppError(ERROR_CODES.IP_NOT_FOUND, "IP not found", 404);
      }

      const response = createSuccessResponse(ip, 200);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * GET /api/ips - List all IPs
   */
  router.get("/api/ips", async (c) => {
    try {
      const status = c.req.query("status");
      const creatorId = c.req.query("creatorId");

      let ips;
      if (creatorId) {
        ips = await ipService.getIPsByCreator(creatorId);
      } else if (status) {
        if (!isIPStatus(status)) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid IP status", 400);
        }
        ips = await ipService.getIPsByStatus(status);
      } else {
        // Get all IPs (could be paginated)
        ips = await (db.query.ips ? db.query.ips.findMany() : []);
      }

      const response = createSuccessResponse(ips, 200);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * GET /api/ips/:id/holders - Get token holders for IP
   */
  router.get("/api/ips/:id/holders", async (c) => {
    try {
      const ipId = c.req.param("id");

      const ip = await ipService.getIPById(ipId);
      if (!ip) {
        throw new AppError(ERROR_CODES.IP_NOT_FOUND, "IP not found", 404);
      }

      const holders = await transactionService.getIPTokenHolders(ipId);
      const response = createSuccessResponse(holders, 200);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * GET /api/ips/:id/transactions - Get transactions for IP
   */
  router.get("/api/ips/:id/transactions", async (c) => {
    try {
      const ipId = c.req.param("id");

      const ip = await ipService.getIPById(ipId);
      if (!ip) {
        throw new AppError(ERROR_CODES.IP_NOT_FOUND, "IP not found", 404);
      }

      const transactions = await transactionService.getTransactionsByIP(ipId);
      const response = createSuccessResponse(transactions, 200);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * GET /api/ips/:id/liquidity-events - Get liquidity events for IP
   */
  router.get("/api/ips/:id/liquidity-events", async (c) => {
    try {
      const ipId = c.req.param("id");

      const ip = await ipService.getIPById(ipId);
      if (!ip) {
        throw new AppError(ERROR_CODES.IP_NOT_FOUND, "IP not found", 404);
      }

      const events = await liquidityService.getLiquidityEvents(ipId);
      const response = createSuccessResponse(events, 200);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  /**
   * GET /api/creators/:creatorId/ips - Get all IPs by creator
   */
  router.get("/api/creators/:creatorId/ips", async (c) => {
    try {
      const creatorId = c.req.param("creatorId");

      const ips = await ipService.getIPsByCreator(creatorId);
      const response = createSuccessResponse(ips, 200);
      return createHTTPResponse(response);
    } catch (error) {
      const errorResponse = handleError(error);
      return createHTTPResponse(errorResponse);
    }
  });

  return router;
}
