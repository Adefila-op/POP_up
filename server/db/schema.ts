/**
 * Database Schema Definition using Drizzle ORM
 * Configured for PostgreSQL (Supabase, Railway) and Cloudflare D1
 */

import {
  text,
  real,
  integer,
  sqliteTable,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { pgTable } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Auto-detect table type based on environment
const usePostgres = process.env.DATABASE_URL || process.env.SUPABASE_URL;
const tableBuilder = usePostgres ? pgTable : sqliteTable;

/**
 * Users Table
 */
export const users = tableBuilder(
  "users",
  {
    id: text("id").primaryKey().notNull(),
    wallet_address: text("wallet_address").notNull().unique(),
    username: text("username").notNull(),
    email: text("email"),
    profile_picture_url: text("profile_picture_url"),
    bio: text("bio"),
    is_creator: integer("is_creator").notNull().default(0),
    cash_balance: integer("cash_balance").notNull().default(0), // In USD cents
    created_at: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
    updated_at: integer("updated_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (table) => ({
    walletIdx: uniqueIndex("users_wallet_idx").on(table.wallet_address),
    usernameIdx: index("users_username_idx").on(table.username),
  }),
);

/**
 * IP Assets Table
 */
export const ips = tableBuilder(
  "ips",
  {
    id: text("id").primaryKey().notNull(),
    creator_id: text("creator_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    cover_image_url: text("cover_image_url"),

    // Liquidity & Finance
    initial_liquidity: integer("initial_liquidity").notNull(), // USD cents
    current_liquidity: integer("current_liquidity").notNull(), // USD cents
    market_cap: integer("market_cap").notNull(), // USD cents
    total_supply: real("total_supply").notNull(),
    circulating_supply: real("circulating_supply").notNull(),

    // Pricing
    current_price: real("current_price").notNull(), // USD cents per token
    floor_price: real("floor_price").notNull(),

    // Status
    status: text("status", { enum: ["CREATED", "LAUNCH_PHASE", "PUBLIC_TRADING", "MATURE"] })
      .notNull()
      .default("CREATED"),
    launch_start_date: integer("launch_start_date", { mode: "timestamp" }).notNull(),
    launch_end_date: integer("launch_end_date", { mode: "timestamp" }).notNull(),

    // Tokens
    burned_supply: real("burned_supply").notNull().default(0),

    // Metadata
    created_at: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
    updated_at: integer("updated_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (table) => ({
    creatorIdx: index("ips_creator_idx").on(table.creator_id),
    statusIdx: index("ips_status_idx").on(table.status),
  }),
);

/**
 * Token Holders Table
 */
export const tokenHolders = tableBuilder(
  "token_holders",
  {
    id: text("id").primaryKey().notNull(),
    ip_id: text("ip_id")
      .notNull()
      .references(() => ips.id),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),

    active_balance: real("active_balance").notNull().default(0),
    burned_balance: real("burned_balance").notNull().default(0),
    liquidity_claimed: integer("liquidity_claimed").notNull().default(0), // USD cents

    average_buy_price: real("average_buy_price").notNull().default(0), // USD cents per token
    total_invested: integer("total_invested").notNull().default(0), // USD cents

    created_at: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
    updated_at: integer("updated_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueHolder: uniqueIndex("token_holders_unique").on(table.ip_id, table.user_id),
    userIdx: index("token_holders_user_idx").on(table.user_id),
  }),
);

/**
 * Transactions Table
 */
export const transactions = tableBuilder(
  "transactions",
  {
    id: text("id").primaryKey().notNull(),
    ip_id: text("ip_id")
      .notNull()
      .references(() => ips.id),

    type: text("type", { enum: ["BUY", "SELL", "BURN_SHARE", "CREATOR_FORFEIT"] }).notNull(),
    status: text("status", { enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"] })
      .notNull()
      .default("PENDING"),

    buyer_id: text("buyer_id").references(() => users.id),
    seller_id: text("seller_id").references(() => users.id),

    amount_tokens: real("amount_tokens").notNull(),
    amount_value: integer("amount_value").notNull(), // USD cents
    fee_to_liquidity: integer("fee_to_liquidity").notNull(), // USD cents
    seller_proceeds: integer("seller_proceeds").notNull(), // USD cents
    price_per_token: real("price_per_token").notNull(), // USD cents per token

    created_at: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
    completed_at: integer("completed_at", { mode: "timestamp" }),
  },
  (table) => ({
    ipIdx: index("transactions_ip_idx").on(table.ip_id),
    buyerIdx: index("transactions_buyer_idx").on(table.buyer_id),
    sellerIdx: index("transactions_seller_idx").on(table.seller_id),
    statusIdx: index("transactions_status_idx").on(table.status),
  }),
);

/**
 * Liquidity Events Table
 */
export const liquidityEvents = tableBuilder(
  "liquidity_events",
  {
    id: text("id").primaryKey().notNull(),
    ip_id: text("ip_id")
      .notNull()
      .references(() => ips.id),

    event_type: text("event_type", {
      enum: ["FEE_COLLECTED", "BURN_TRIGGERED", "HOLDER_BURNED", "BURN_RESOLVED"],
    }).notNull(),
    triggered_by: text("triggered_by").notNull(),

    liquidity_before: integer("liquidity_before").notNull(), // USD cents
    liquidity_after: integer("liquidity_after").notNull(), // USD cents
    liquidity_percentage: real("liquidity_percentage").notNull(),

    holders_affected: integer("holders_affected").notNull().default(0),
    total_tokens_burned: real("total_tokens_burned").notNull().default(0),
    total_liquidity_distributed: integer("total_liquidity_distributed").notNull().default(0), // USD cents

    created_at: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
    completed_at: integer("completed_at", { mode: "timestamp" }),
  },
  (table) => ({
    ipIdx: index("liquidity_events_ip_idx").on(table.ip_id),
    eventTypeIdx: index("liquidity_events_type_idx").on(table.event_type),
  }),
);

/**
 * Burn Claims Table
 */
export const burnClaims = tableBuilder(
  "burn_claims",
  {
    id: text("id").primaryKey().notNull(),
    ip_id: text("ip_id")
      .notNull()
      .references(() => ips.id),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    liquidity_event_id: text("liquidity_event_id")
      .notNull()
      .references(() => liquidityEvents.id),

    tokens_burned: real("tokens_burned").notNull(),
    liquidity_share: integer("liquidity_share").notNull(), // USD cents
    claim_status: text("claim_status", {
      enum: ["PENDING", "COMPLETED", "CLAIMED"],
    })
      .notNull()
      .default("PENDING"),

    created_at: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
    updated_at: integer("updated_at", { mode: "timestamp" }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueClaim: uniqueIndex("burn_claims_unique").on(
      table.ip_id,
      table.user_id,
      table.liquidity_event_id,
    ),
    userIdx: index("burn_claims_user_idx").on(table.user_id),
  }),
);
