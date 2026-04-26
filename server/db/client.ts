/**
 * Database Client Initialization
 * Supports Cloudflare D1 and PostgreSQL (Supabase, Railway, etc.)
 */

import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type DatabaseClient = ReturnType<typeof drizzlePostgres> | ReturnType<typeof drizzleD1>;
type DatabaseEnv = {
  DB?: D1Database;
  DATABASE_URL?: string;
  SUPABASE_URL?: string;
};

/**
 * Initialize database client from Cloudflare D1 binding
 * @param env Cloudflare environment with DB binding
 * @returns Drizzle ORM client
 */
export function initializeCloudflareDatabase(env: { DB: D1Database }): DatabaseClient {
  return drizzleD1(env.DB, { schema });
}

/**
 * Initialize database client for PostgreSQL (Supabase, Railway, etc.)
 * @param connectionString PostgreSQL connection string
 * @returns Drizzle ORM client
 */
export function initializePostgresDatabase(connectionString: string): DatabaseClient {
  const client = postgres(connectionString, {
    max: 20,
    idle_timeout: 30,
  });
  return drizzlePostgres(client, { schema });
}

/**
 * Auto-detect and initialize database based on environment
 */
export function initializeDatabase(env: DatabaseEnv): DatabaseClient {
  // If Cloudflare D1 binding exists, use it
  if (env.DB) {
    console.log("Using Cloudflare D1 database");
    return initializeCloudflareDatabase(env);
  }

  // If PostgreSQL connection string exists, use it
  if (env.DATABASE_URL || env.SUPABASE_URL) {
    const connectionString = env.DATABASE_URL || env.SUPABASE_URL;
    console.log("Using PostgreSQL database");
    return initializePostgresDatabase(connectionString);
  }

  throw new Error("No database configured. Set DB (Cloudflare D1) or DATABASE_URL (PostgreSQL)");
}

export { schema };
