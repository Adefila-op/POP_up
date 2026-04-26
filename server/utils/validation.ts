/**
 * Validation Utilities - Input validation and type checking
 */

/**
 * Validation errors
 */
export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

type ValidationInput = Record<string, unknown>;

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate wallet address (Ethereum format)
 */
export function validateWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate username
 */
export function validateUsername(username: string): boolean {
  return username.length >= 3 && username.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(username);
}

/**
 * Validate USD amount
 */
export function validateUSDAmount(amount: number): boolean {
  return amount > 0 && Number.isFinite(amount);
}

/**
 * Validate token amount
 */
export function validateTokenAmount(amount: number): boolean {
  return amount > 0 && Number.isFinite(amount);
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(value: unknown): value is number {
  return typeof value === "number" && value > 0 && Number.isFinite(value);
}

/**
 * Validate required string
 */
export function validateRequiredString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Create IP input validation
 */
export interface CreateIPValidationInput {
  title: string;
  description?: string;
  category: string;
  coverImageUrl?: string;
  initialLiquidityUSD: number;
  launchDurationDays: number;
}

export function validateCreateIPInput(input: ValidationInput): input is CreateIPValidationInput {
  if (!validateRequiredString(input.title)) {
    throw new ValidationError("title", "Title is required");
  }
  if (!validateRequiredString(input.category)) {
    throw new ValidationError("category", "Category is required");
  }
  if (!validateUSDAmount(input.initialLiquidityUSD)) {
    throw new ValidationError("initialLiquidityUSD", "Initial liquidity must be a positive number");
  }
  if (!Number.isInteger(input.launchDurationDays) || input.launchDurationDays < 1) {
    throw new ValidationError("launchDurationDays", "Launch duration must be a positive integer");
  }
  return true;
}

/**
 * Buy transaction input validation
 */
export interface BuyTransactionValidationInput {
  ipId: string;
  amountUSD: number;
}

export function validateBuyTransactionInput(
  input: ValidationInput,
): input is BuyTransactionValidationInput {
  if (!validateRequiredString(input.ipId)) {
    throw new ValidationError("ipId", "IP ID is required");
  }
  if (!validateUSDAmount(input.amountUSD)) {
    throw new ValidationError("amountUSD", "Amount must be a positive number");
  }
  return true;
}

/**
 * Sell transaction input validation
 */
export interface SellTransactionValidationInput {
  ipId: string;
  amountTokens: number;
}

export function validateSellTransactionInput(
  input: ValidationInput,
): input is SellTransactionValidationInput {
  if (!validateRequiredString(input.ipId)) {
    throw new ValidationError("ipId", "IP ID is required");
  }
  if (!validateTokenAmount(input.amountTokens)) {
    throw new ValidationError("amountTokens", "Token amount must be a positive number");
  }
  return true;
}
