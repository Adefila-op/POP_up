/**
 * Validation Utilities - Input validation and type checking
 * Includes length limits to prevent abuse and data consistency issues
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

// Maximum field lengths to prevent abuse
export const MAX_LENGTHS = {
  USERNAME: 50,
  EMAIL: 100,
  BIO: 500,
  DESCRIPTION: 5000,
  TITLE: 200,
  CATEGORY: 100,
  URL: 2000,
  NONCE: 100,
  SIGNATURE: 200,
  MESSAGE: 1000,
};

type ValidationInput = Record<string, unknown>;

/**
 * Validate email with length limits
 */
export function validateEmail(email: string): boolean {
  if (email.length > MAX_LENGTHS.EMAIL) {
    throw new ValidationError("email", `Email too long (max ${MAX_LENGTHS.EMAIL} characters)`);
  }
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
 * Validate username with length limits
 */
export function validateUsername(username: string): boolean {
  if (username.length < 3) {
    throw new ValidationError("username", "Username must be at least 3 characters");
  }
  if (username.length > MAX_LENGTHS.USERNAME) {
    throw new ValidationError("username", `Username too long (max ${MAX_LENGTHS.USERNAME} characters)`);
  }
  return /^[a-zA-Z0-9_-]+$/.test(username);
}

/**
 * Validate bio with length limits
 */
export function validateBio(bio: string): boolean {
  if (bio.length > MAX_LENGTHS.BIO) {
    throw new ValidationError("bio", `Bio too long (max ${MAX_LENGTHS.BIO} characters)`);
  }
  return true;
}

/**
 * Validate title with length limits
 */
export function validateTitle(title: string): boolean {
  if (title.length < 1) {
    throw new ValidationError("title", "Title is required");
  }
  if (title.length > MAX_LENGTHS.TITLE) {
    throw new ValidationError("title", `Title too long (max ${MAX_LENGTHS.TITLE} characters)`);
  }
  return true;
}

/**
 * Validate description with length limits
 */
export function validateDescription(description: string): boolean {
  if (description.length > MAX_LENGTHS.DESCRIPTION) {
    throw new ValidationError("description", `Description too long (max ${MAX_LENGTHS.DESCRIPTION} characters)`);
  }
  return true;
}

/**
 * Validate category with length limits
 */
export function validateCategory(category: string): boolean {
  if (category.length < 1) {
    throw new ValidationError("category", "Category is required");
  }
  if (category.length > MAX_LENGTHS.CATEGORY) {
    throw new ValidationError("category", `Category too long (max ${MAX_LENGTHS.CATEGORY} characters)`);
  }
  return true;
}

/**
 * Validate URL with length limits
 */
export function validateURL(url: string): boolean {
  if (url.length > MAX_LENGTHS.URL) {
    throw new ValidationError("url", `URL too long (max ${MAX_LENGTHS.URL} characters)`);
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
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

export function validateCreateIPInput(input: ValidationInput): boolean {
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

export function validateBuyTransactionInput(input: ValidationInput): boolean {
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

export function validateSellTransactionInput(input: ValidationInput): boolean {
  if (!validateRequiredString(input.ipId)) {
    throw new ValidationError("ipId", "IP ID is required");
  }
  if (!validateTokenAmount(input.amountTokens)) {
    throw new ValidationError("amountTokens", "Token amount must be a positive number");
  }
  return true;
}
