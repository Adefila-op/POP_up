-- Supabase/PostgreSQL Migrations for Creator Commerce Hub

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  email TEXT,
  profile_picture_url TEXT,
  bio TEXT,
  is_creator BOOLEAN NOT NULL DEFAULT FALSE,
  cash_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_wallet_idx ON users(wallet_address);
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);

-- IPs table
CREATE TABLE IF NOT EXISTS ips (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  cover_image_url TEXT,
  initial_liquidity INTEGER NOT NULL,
  current_liquidity INTEGER NOT NULL,
  market_cap INTEGER NOT NULL,
  total_supply NUMERIC NOT NULL,
  circulating_supply NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  floor_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK(status IN ('CREATED', 'LAUNCH_PHASE', 'PUBLIC_TRADING', 'MATURE')),
  launch_start_date TIMESTAMP NOT NULL,
  launch_end_date TIMESTAMP NOT NULL,
  burned_supply NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ips_creator_idx ON ips(creator_id);
CREATE INDEX IF NOT EXISTS ips_status_idx ON ips(status);

-- Token Holders table
CREATE TABLE IF NOT EXISTS token_holders (
  id TEXT PRIMARY KEY,
  ip_id TEXT NOT NULL REFERENCES ips(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  active_balance NUMERIC NOT NULL DEFAULT 0,
  burned_balance NUMERIC NOT NULL DEFAULT 0,
  liquidity_claimed INTEGER NOT NULL DEFAULT 0,
  average_buy_price NUMERIC NOT NULL DEFAULT 0,
  total_invested INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(ip_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS token_holders_unique ON token_holders(ip_id, user_id);
CREATE INDEX IF NOT EXISTS token_holders_user_idx ON token_holders(user_id);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  ip_id TEXT NOT NULL REFERENCES ips(id),
  type TEXT NOT NULL CHECK(type IN ('BUY', 'SELL', 'BURN_SHARE', 'CREATOR_FORFEIT')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  buyer_id TEXT REFERENCES users(id),
  seller_id TEXT REFERENCES users(id),
  amount_tokens NUMERIC NOT NULL,
  amount_value INTEGER NOT NULL,
  fee_to_liquidity INTEGER NOT NULL,
  seller_proceeds INTEGER NOT NULL,
  price_per_token NUMERIC NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS transactions_ip_idx ON transactions(ip_id);
CREATE INDEX IF NOT EXISTS transactions_buyer_idx ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS transactions_seller_idx ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);

-- Liquidity Events table
CREATE TABLE IF NOT EXISTS liquidity_events (
  id TEXT PRIMARY KEY,
  ip_id TEXT NOT NULL REFERENCES ips(id),
  event_type TEXT NOT NULL CHECK(event_type IN ('FEE_COLLECTED', 'BURN_TRIGGERED', 'HOLDER_BURNED', 'BURN_RESOLVED')),
  triggered_by TEXT NOT NULL,
  liquidity_before INTEGER NOT NULL,
  liquidity_after INTEGER NOT NULL,
  liquidity_percentage NUMERIC NOT NULL,
  holders_affected INTEGER NOT NULL DEFAULT 0,
  total_tokens_burned NUMERIC NOT NULL DEFAULT 0,
  total_liquidity_distributed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS liquidity_events_ip_idx ON liquidity_events(ip_id);
CREATE INDEX IF NOT EXISTS liquidity_events_type_idx ON liquidity_events(event_type);

-- Burn Claims table
CREATE TABLE IF NOT EXISTS burn_claims (
  id TEXT PRIMARY KEY,
  ip_id TEXT NOT NULL REFERENCES ips(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  liquidity_event_id TEXT NOT NULL REFERENCES liquidity_events(id),
  tokens_burned NUMERIC NOT NULL,
  liquidity_share INTEGER NOT NULL,
  claim_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(claim_status IN ('PENDING', 'COMPLETED', 'CLAIMED')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(ip_id, user_id, liquidity_event_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS burn_claims_unique ON burn_claims(ip_id, user_id, liquidity_event_id);
CREATE INDEX IF NOT EXISTS burn_claims_user_idx ON burn_claims(user_id);
