/**
 * Transaction Service - Core business logic for trading
 * Handles buy, sell, and burn transactions with validation and state updates
 */

import { and, eq } from "drizzle-orm";
import { DatabaseClient, schema } from "@/server/db/client";
import type { Transaction, TransactionType, TokenHolder } from "@/server/db/types";
import { generateId } from "@/server/utils/id-generator";
import { IPService } from "./ip-service";
import { LiquidityService } from "./liquidity-service";

interface BuyTransactionInput {
  ipId: string;
  buyerId: string;
  amountUSD: number; // In USD dollars
}

interface SellTransactionInput {
  ipId: string;
  sellerId: string;
  amountTokens: number;
}

interface BurnShareInput {
  ipId: string;
  userId: string;
  amountTokens: number;
}

interface TransactionServiceOptions {
  db: DatabaseClient;
  ipService: IPService;
  liquidityService: LiquidityService;
}

export class TransactionService {
  private db: DatabaseClient;
  private ipService: IPService;
  private liquidityService: LiquidityService;

  constructor(options: TransactionServiceOptions) {
    this.db = options.db;
    this.ipService = options.ipService;
    this.liquidityService = options.liquidityService;
  }

  /**
   * Execute a BUY transaction
   */
  async executeBuy(input: BuyTransactionInput): Promise<Transaction> {
    const transactionId = generateId("tx");
    const now = new Date();
    const amountInCents = Math.round(input.amountUSD * 100);

    // Validation
    const ip = await this.ipService.validateIPForTrading(input.ipId);
    const minLiquidityValid = await this.ipService.validateMinimumLiquidity(input.ipId);
    if (!minLiquidityValid) {
      throw new Error("IP does not meet minimum liquidity requirement");
    }

    // Calculate tokens to receive
    const tokensToReceive = amountInCents / ip.current_price;
    if (tokensToReceive > ip.circulating_supply) {
      throw new Error("Not enough tokens available");
    }

    // Create transaction record
    const transaction = await this.db
      .insert(schema.transactions)
      .values({
        id: transactionId,
        ip_id: input.ipId,
        type: "BUY" as TransactionType,
        status: "COMPLETED",
        buyer_id: input.buyerId,
        amount_tokens: tokensToReceive,
        amount_value: amountInCents,
        fee_to_liquidity: 0, // No fee on buy
        seller_proceeds: amountInCents,
        price_per_token: ip.current_price,
        completed_at: now,
        created_at: now,
      })
      .returning();

    if (!transaction || transaction.length === 0) {
      throw new Error("Failed to create buy transaction");
    }

    // Update token holder
    await this.updateTokenHolder(
      input.ipId,
      input.buyerId,
      tokensToReceive,
      ip.current_price,
      amountInCents
    );

    // Update IP circulating supply
    const newCirculatingSupply = ip.circulating_supply - tokensToReceive;
    await this.ipService.updateIPLiquidity(
      input.ipId,
      ip.current_liquidity,
      newCirculatingSupply,
      ip.burned_supply
    );

    return transaction[0];
  }

  /**
   * Execute a SELL transaction
   * Includes fee distribution and emergency burn check
   */
  async executeSell(input: SellTransactionInput): Promise<Transaction> {
    const transactionId = generateId("tx");
    const now = new Date();

    // Validation
    const ip = await this.ipService.validateIPForTrading(input.ipId);

    // Check seller has sufficient balance
    const holder = await this.getTokenHolder(input.ipId, input.sellerId);
    if (!holder || holder.active_balance < input.amountTokens) {
      throw new Error("Insufficient token balance");
    }

    // Calculate sale value and fees
    const saleValueInCents = Math.round(input.amountTokens * ip.current_price);
    const feeToLiquidityInCents = Math.round(saleValueInCents * 0.3);
    const sellerProceedsInCents = saleValueInCents - feeToLiquidityInCents;

    // Create transaction
    const transaction = await this.db
      .insert(schema.transactions)
      .values({
        id: transactionId,
        ip_id: input.ipId,
        type: "SELL" as TransactionType,
        status: "COMPLETED",
        seller_id: input.sellerId,
        amount_tokens: input.amountTokens,
        amount_value: saleValueInCents,
        fee_to_liquidity: feeToLiquidityInCents,
        seller_proceeds: sellerProceedsInCents,
        price_per_token: ip.current_price,
        completed_at: now,
        created_at: now,
      })
      .returning();

    if (!transaction || transaction.length === 0) {
      throw new Error("Failed to create sell transaction");
    }

    // Update seller token balance
    await this.db
      .update(schema.tokenHolders)
      .set({
        active_balance: holder.active_balance - input.amountTokens,
        updated_at: now,
      })
      .where(
        and(
          eq(schema.tokenHolders.ip_id, input.ipId),
          eq(schema.tokenHolders.user_id, input.sellerId)
        )
      );

    // Update IP liquidity and supply
    const newLiquidity = ip.current_liquidity + feeToLiquidityInCents;
    const newCirculatingSupply = ip.circulating_supply + input.amountTokens;

    await this.ipService.updateIPLiquidity(
      input.ipId,
      newLiquidity,
      newCirculatingSupply,
      ip.burned_supply
    );

    // Check for emergency burn threshold
    if (this.ipService.isEmergencyBurnTriggered(newLiquidity, ip.initial_liquidity)) {
      await this.liquidityService.triggerEmergencyBurn(input.ipId);
    }

    return transaction[0];
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    const result = await this.db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, transactionId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get transactions for IP
   */
  async getTransactionsByIP(ipId: string): Promise<Transaction[]> {
    return await this.db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.ip_id, ipId));
  }

  /**
   * Get transactions for user
   */
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    const buyTransactions = await this.db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.buyer_id, userId));

    const sellTransactions = await this.db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.seller_id, userId));

    return [...buyTransactions, ...sellTransactions].sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime()
    );
  }

  /**
   * Get or create token holder
   */
  private async getOrCreateTokenHolder(
    ipId: string,
    userId: string
  ): Promise<TokenHolder> {
    const existing = await this.getTokenHolder(ipId, userId);
    if (existing) return existing;

    const holderId = generateId("holder");
    const now = new Date();

    await this.db.insert(schema.tokenHolders).values({
      id: holderId,
      ip_id: ipId,
      user_id: userId,
      active_balance: 0,
      burned_balance: 0,
      liquidity_claimed: 0,
      average_buy_price: 0,
      total_invested: 0,
      created_at: now,
      updated_at: now,
    });

    const result = await this.db
      .select()
      .from(schema.tokenHolders)
      .where(eq(schema.tokenHolders.id, holderId))
      .limit(1);

    if (!result || result.length === 0) {
      throw new Error("Failed to create token holder");
    }

    return result[0];
  }

  /**
   * Get token holder
   */
  async getTokenHolder(ipId: string, userId: string): Promise<TokenHolder | null> {
    const result = await this.db
      .select()
      .from(schema.tokenHolders)
      .where(
        and(
          eq(schema.tokenHolders.ip_id, ipId),
          eq(schema.tokenHolders.user_id, userId)
        )
      )
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Update token holder after buy
   */
  private async updateTokenHolder(
    ipId: string,
    userId: string,
    tokensAdded: number,
    pricePerToken: number,
    investmentAmount: number
  ): Promise<void> {
    const holder = await this.getOrCreateTokenHolder(ipId, userId);
    const now = new Date();

    // Calculate new average buy price
    const totalTokens = holder.active_balance + tokensAdded;
    const totalInvested = holder.total_invested + investmentAmount;
    const newAverageBuyPrice = totalTokens > 0 ? totalInvested / totalTokens : 0;

    await this.db
      .update(schema.tokenHolders)
      .set({
        active_balance: totalTokens,
        average_buy_price: newAverageBuyPrice,
        total_invested: totalInvested,
        updated_at: now,
      })
      .where(
        and(
          eq(schema.tokenHolders.ip_id, ipId),
          eq(schema.tokenHolders.user_id, userId)
        )
      );
  }

  /**
   * Get all token holders for an IP
   */
  async getIPTokenHolders(ipId: string): Promise<TokenHolder[]> {
    return await this.db
      .select()
      .from(schema.tokenHolders)
      .where(eq(schema.tokenHolders.ip_id, ipId));
  }
}
