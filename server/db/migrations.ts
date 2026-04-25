/**
 * Database Migrations - SQL schema setup for Cloudflare D1
 */

/**
 * Initial schema creation
 * Run this in Cloudflare D1 to set up all tables
 */
export const createTablesMigration = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  email TEXT,
  profile_picture_url TEXT,
  bio TEXT,
  is_creator INTEGER NOT NULL DEFAULT 0,
  cash_balance INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS users_wallet_idx ON users(wallet_address);
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);

-- IPs (Intellectual Property) table
CREATE TABLE IF NOT EXISTS ips (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  cover_image_url TEXT,
  initial_liquidity INTEGER NOT NULL,
  current_liquidity INTEGER NOT NULL,
  market_cap INTEGER NOT NULL,
  total_supply REAL NOT NULL,
  circulating_supply REAL NOT NULL,
  current_price REAL NOT NULL,
  floor_price REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK(status IN ('CREATED', 'LAUNCH_PHASE', 'PUBLIC_TRADING', 'MATURE')),
  launch_start_date DATETIME NOT NULL,
  launch_end_date DATETIME NOT NULL,
  burned_supply REAL NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS ips_creator_idx ON ips(creator_id);
CREATE INDEX IF NOT EXISTS ips_status_idx ON ips(status);

-- Token Holders table
CREATE TABLE IF NOT EXISTS token_holders (
  id TEXT PRIMARY KEY,
  ip_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  active_balance REAL NOT NULL DEFAULT 0,
  burned_balance REAL NOT NULL DEFAULT 0,
  liquidity_claimed INTEGER NOT NULL DEFAULT 0,
  average_buy_price REAL NOT NULL DEFAULT 0,
  total_invested INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ip_id) REFERENCES ips(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(ip_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS token_holders_unique ON token_holders(ip_id, user_id);
CREATE INDEX IF NOT EXISTS token_holders_user_idx ON token_holders(user_id);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  ip_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('BUY', 'SELL', 'BURN_SHARE', 'CREATOR_FORFEIT')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  buyer_id TEXT,
  seller_id TEXT,
  amount_tokens REAL NOT NULL,
  amount_value INTEGER NOT NULL,
  fee_to_liquidity INTEGER NOT NULL,
  seller_proceeds INTEGER NOT NULL,
  price_per_token REAL NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (ip_id) REFERENCES ips(id),
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS transactions_ip_idx ON transactions(ip_id);
CREATE INDEX IF NOT EXISTS transactions_buyer_idx ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS transactions_seller_idx ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);

-- Liquidity Events table
CREATE TABLE IF NOT EXISTS liquidity_events (
  id TEXT PRIMARY KEY,
  ip_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('FEE_COLLECTED', 'BURN_TRIGGERED', 'HOLDER_BURNED', 'BURN_RESOLVED')),
  triggered_by TEXT NOT NULL,
  liquidity_before INTEGER NOT NULL,
  liquidity_after INTEGER NOT NULL,
  liquidity_percentage REAL NOT NULL,
  holders_affected INTEGER NOT NULL DEFAULT 0,
  total_tokens_burned REAL NOT NULL DEFAULT 0,
  total_liquidity_distributed INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (ip_id) REFERENCES ips(id)
);

CREATE INDEX IF NOT EXISTS liquidity_events_ip_idx ON liquidity_events(ip_id);
CREATE INDEX IF NOT EXISTS liquidity_events_type_idx ON liquidity_events(event_type);

-- Burn Claims table
CREATE TABLE IF NOT EXISTS burn_claims (
  id TEXT PRIMARY KEY,
  ip_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  liquidity_event_id TEXT NOT NULL,
  tokens_burned REAL NOT NULL,
  liquidity_share INTEGER NOT NULL,
  claim_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(claim_status IN ('PENDING', 'COMPLETED', 'CLAIMED')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ip_id) REFERENCES ips(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (liquidity_event_id) REFERENCES liquidity_events(id),
  UNIQUE(ip_id, user_id, liquidity_event_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS burn_claims_unique ON burn_claims(ip_id, user_id, liquidity_event_id);
CREATE INDEX IF NOT EXISTS burn_claims_user_idx ON burn_claims(user_id);
`;

/**
 * Drop all tables (for reset)
 */
export const dropTablesMigration = `
DROP TABLE IF EXISTS burn_claims;
DROP TABLE IF EXISTS liquidity_events;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS token_holders;
DROP TABLE IF EXISTS ips;
DROP TABLE IF EXISTS users;
`;

export default {
  createTablesMigration,
  dropTablesMigration,
};
