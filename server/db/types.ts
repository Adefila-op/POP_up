/**
 * Creator Commerce Hub - Database Type Definitions
 * Core types for all database entities
 */

export type IPStatus = "CREATED" | "LAUNCH_PHASE" | "PUBLIC_TRADING" | "MATURE";
export type TransactionType = "BUY" | "SELL" | "BURN_SHARE" | "CREATOR_FORFEIT";
export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type LiquidityEventType =
  | "FEE_COLLECTED"
  | "BURN_TRIGGERED"
  | "HOLDER_BURNED"
  | "BURN_RESOLVED";

/**
 * User Entity
 */
export interface User {
  id: string; // UUID
  wallet_address: string;
  username: string;
  email?: string;
  profile_picture_url?: string;
  bio?: string;
  is_creator: boolean;
  cash_balance: number; // In USD cents
  created_at: Date;
  updated_at: Date;
}

/**
 * IP (Intellectual Property) Entity
 */
export interface IP {
  id: string; // UUID
  creator_id: string; // FK to User
  title: string;
  description: string;
  category: string;
  cover_image_url?: string;

  // Liquidity & Finance
  initial_liquidity: number; // Decimal, locked amount (in USD cents)
  current_liquidity: number; // Running balance from fees (in USD cents)
  market_cap: number; // Total value of all tokens sold (in USD cents)
  total_supply: number; // Total tokens created (as decimal)
  circulating_supply: number; // Total - burned

  // Pricing
  current_price: number; // Calculated: current_liquidity / total_supply (in USD cents per token)
  floor_price: number; // Locked during LAUNCH_PHASE

  // Status & Timeline
  status: IPStatus;
  launch_start_date: Date;
  launch_end_date: Date;

  // Tokens
  burned_supply: number; // Tokens removed via burn mechanism

  // Metadata
  created_at: Date;
  updated_at: Date;
}

/**
 * Token Holder - tracks user holdings of specific IP tokens
 */
export interface TokenHolder {
  id: string; // UUID
  ip_id: string; // FK to IP
  user_id: string; // FK to User

  active_balance: number; // Tokens currently held (as decimal)
  burned_balance: number; // Tokens burned in liquidity events
  liquidity_claimed: number; // Value received from burns (in USD cents)

  average_buy_price: number; // Average price paid per token (in USD cents)
  total_invested: number; // Total USD invested (in cents)

  created_at: Date;
  updated_at: Date;

  // Unique constraint: (ip_id, user_id)
}

/**
 * Transaction - all buy/sell/burn operations
 */
export interface Transaction {
  id: string; // UUID
  ip_id: string; // FK to IP

  type: TransactionType;
  status: TransactionStatus;

  // Participants
  buyer_id?: string; // FK to User (for BUY/CREATOR_FORFEIT)
  seller_id?: string; // FK to User (for SELL/BURN_SHARE)

  // Amount details
  amount_tokens: number; // Quantity of tokens (as decimal)
  amount_value: number; // USD value in cents

  // Fee calculation
  fee_to_liquidity: number; // 30% of amount_value on sales (in cents)
  seller_proceeds: number; // 70% of amount_value on sales (in cents)

  price_per_token: number; // amount_value / amount_tokens (in USD cents)

  // Metadata
  created_at: Date;
  completed_at?: Date;
}

/**
 * Liquidity Event - tracks significant liquidity state changes
 */
export interface LiquidityEvent {
  id: string; // UUID
  ip_id: string; // FK to IP

  event_type: LiquidityEventType;
  triggered_by: string; // user_id or "SYSTEM"

  // Event state
  liquidity_before: number; // (in USD cents)
  liquidity_after: number; // (in USD cents)
  liquidity_percentage: number; // liquidity_after / initial_liquidity * 100

  // For BURN_TRIGGERED events
  holders_affected: number; // Count of affected holders
  total_tokens_burned: number; // Total tokens burned (as decimal)
  total_liquidity_distributed: number; // Total liquidity shared (in cents)

  created_at: Date;
  completed_at?: Date;
}

/**
 * Burn Claim - tracks individual claims during emergency burn
 */
export interface BurnClaim {
  id: string; // UUID
  ip_id: string; // FK to IP
  user_id: string; // FK to User
  liquidity_event_id: string; // FK to LiquidityEvent

  tokens_burned: number; // Tokens burned by user (as decimal)
  liquidity_share: number; // Share of distributed liquidity (in cents)
  claim_status: "PENDING" | "COMPLETED" | "CLAIMED";

  created_at: Date;
  updated_at: Date;
}

/**
 * Database schema export
 */
export interface Database {
  users: User;
  ips: IP;
  token_holders: TokenHolder;
  transactions: Transaction;
  liquidity_events: LiquidityEvent;
  burn_claims: BurnClaim;
}
