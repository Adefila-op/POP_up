/**
 * Server Entry Point - Main Hono app setup for Cloudflare Workers
 * Integrates all services and routes
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { initializeDatabase, type D1DatabaseLike } from "./db/client";
import { IPService } from "./services/ip-service";
import { TransactionService } from "./services/transaction-service";
import { LiquidityService } from "./services/liquidity-service";
import { UserService } from "./services/user-service";
import { createIPRoutes } from "./routes/ip-routes";
import { createTransactionRoutes } from "./routes/transaction-routes";
import { createUserRoutes } from "./routes/user-routes";
import { createHTTPResponse, createSuccessResponse, ERROR_CODES } from "./utils/errors";

export interface Env {
  DB?: D1DatabaseLike;
  DATABASE_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  ENVIRONMENT?: string;
}

/**
 * Create Hono app with all services and routes
 */
export function createApp(env: Env): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();

  // Enable CORS
  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Initialize database
  const db = initializeDatabase(env);

  // Initialize services
  const userService = new UserService({ db });
  const ipService = new IPService({ db });
  const liquidityService = new LiquidityService({
    db,
    ipService,
  });
  const transactionService = new TransactionService({
    db,
    ipService,
    liquidityService,
  });

  // Update liquidity service with transaction service (circular dependency resolution)
  liquidityService.setTransactionService(transactionService);

  // Health check
  app.get("/health", (c) => {
    const response = createSuccessResponse({ status: "ok" }, 200);
    return createHTTPResponse(response);
  });

  // API version
  app.get("/api/version", (c) => {
    const response = createSuccessResponse(
      {
        version: "1.0.0",
        environment: env.ENVIRONMENT || "production",
      },
      200,
    );
    return createHTTPResponse(response);
  });

  // Register route handlers
  const ipRoutes = createIPRoutes({
    db,
    ipService,
    transactionService,
    liquidityService,
    userService,
  });

  const transactionRoutes = createTransactionRoutes({
    ipService,
    transactionService,
    liquidityService,
    userService,
  });

  const userRoutes = createUserRoutes({ userService });

  // Mount routes
  app.route("/", ipRoutes);
  app.route("/", transactionRoutes);
  app.route("/", userRoutes);

  // 404 handler
  app.notFound((c) => {
    const response = {
      success: false as const,
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: "Not Found",
        details: {
          path: c.req.path,
          method: c.req.method,
        },
      },
      statusCode: 404,
    };
    return createHTTPResponse(response);
  });

  return app;
}

/**
 * Export handler for Cloudflare Workers
 */
export default {
  fetch: (request: Request, env: Env) => {
    const app = createApp(env);
    return app.fetch(request, env);
  },
};
