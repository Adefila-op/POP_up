/**
 * Liquidity Service - Manages liquidity events and emergency burn mechanism
 * Handles emergency burn triggers, liquidity tracking, and distribution
 */

import { eq, and, gte, lt } from "drizzle-orm";
import { DatabaseClient, schema } from "../db/client";
import type { LiquidityEvent, BurnClaim } from "../db/types";
import { generateId } from "../utils/id-generator";
import { IPService } from "./ip-service";
import { TransactionService } from "./transaction-service";

interface LiquidityServiceOptions {
  db: DatabaseClient;
  ipService: IPService;
  transactionService?: TransactionService;
}

export class LiquidityService {
  private db: DatabaseClient;
  private ipService: IPService;
  private transactionService?: TransactionService;

  constructor(options: LiquidityServiceOptions) {
    this.db = options.db;
    this.ipService = options.ipService;
    this.transactionService = options.transactionService;
  }

  setTransactionService(transactionService: TransactionService): void {
    this.transactionService = transactionService;
  }

  /**
   * Trigger emergency burn when liquidity falls below 5%
   * Creates liquidity event and prepares burn claims for all holders
   */
  async triggerEmergencyBurn(ipId: string): Promise<LiquidityEvent> {
    const ip = await this.ipService.getIPById(ipId);
    if (!ip) throw new Error("IP not found");

    const now = new Date();
    const liquidityPercentage = (ip.current_liquidity / ip.initial_liquidity) * 100;

    // Create liquidity event
    const eventId = generateId("event");
    const event = await this.db
      .insert(schema.liquidityEvents)
      .values({
        id: eventId,
        ip_id: ipId,
        event_type: "BURN_TRIGGERED",
        triggered_by: "SYSTEM",
        liquidity_before: ip.current_liquidity,
        liquidity_after: ip.current_liquidity,
        liquidity_percentage: liquidityPercentage,
        holders_affected: 0,
        total_tokens_burned: 0,
        total_liquidity_distributed: 0,
        created_at: now,
      })
      .returning();

    if (!event || event.length === 0) {
      throw new Error("Failed to create liquidity event");
    }

    // Get all token holders
    if (this.transactionService) {
      const holders = await this.transactionService.getIPTokenHolders(ipId);
      const holdersWithBalance = holders.filter((h) => h.active_balance > 0);

      // Create burn claims for each holder
      for (const holder of holdersWithBalance) {
        const claimId = generateId("claim");
        await this.db.insert(schema.burnClaims).values({
          id: claimId,
          ip_id: ipId,
          user_id: holder.user_id,
          liquidity_event_id: eventId,
          tokens_burned: 0, // Will be updated when holder claims
          liquidity_share: 0, // Will be calculated when holder claims
          claim_status: "PENDING",
          created_at: now,
          updated_at: now,
        });
      }

      // Update event with holder count
      await this.db
        .update(schema.liquidityEvents)
        .set({
          holders_affected: holdersWithBalance.length,
        })
        .where(eq(schema.liquidityEvents.id, eventId));

      event[0].holders_affected = holdersWithBalance.length;
    }

    return event[0];
  }

  /**
   * Claim burn share - holder burns tokens to claim liquidity
   */
  async claimBurnShare(ipId: string, userId: string, amountTokens: number): Promise<BurnClaim> {
    const ip = await this.ipService.getIPById(ipId);
    if (!ip) throw new Error("IP not found");

    // Find active burn event
    const burnEvents = await this.db
      .select()
      .from(schema.liquidityEvents)
      .where(
        and(
          eq(schema.liquidityEvents.ip_id, ipId),
          eq(schema.liquidityEvents.event_type, "BURN_TRIGGERED"),
        ),
      )
      .orderBy((t) => t.created_at)
      .limit(1);

    if (burnEvents.length === 0) {
      throw new Error("No active burn event for this IP");
    }

    const burnEvent = burnEvents[0];

    // Get or create burn claim
    const burnClaim = await this.db
      .select()
      .from(schema.burnClaims)
      .where(
        and(
          eq(schema.burnClaims.ip_id, ipId),
          eq(schema.burnClaims.user_id, userId),
          eq(schema.burnClaims.liquidity_event_id, burnEvent.id),
        ),
      )
      .limit(1);

    if (burnClaim.length === 0) {
      throw new Error("No burn claim found for this user");
    }

    const claim = burnClaim[0];

    // Calculate share (pro-rata based on tokens burned)
    const holder = await this.transactionService?.getTokenHolder(ipId, userId);
    if (!holder) {
      throw new Error("Token holder not found");
    }

    if (holder.active_balance < amountTokens) {
      throw new Error("Insufficient tokens to burn");
    }

    // Calculate liquidity share
    const totalTokensToDistribute = ip.current_liquidity;
    const userShare = Math.round(
      (amountTokens / (ip.total_supply - ip.burned_supply)) * totalTokensToDistribute,
    );

    // Update holder - burn tokens
    await this.db
      .update(schema.tokenHolders)
      .set({
        active_balance: holder.active_balance - amountTokens,
        burned_balance: holder.burned_balance + amountTokens,
        liquidity_claimed: holder.liquidity_claimed + userShare,
        updated_at: new Date(),
      })
      .where(and(eq(schema.tokenHolders.ip_id, ipId), eq(schema.tokenHolders.user_id, userId)));

    // Update burn claim
    const result = await this.db
      .update(schema.burnClaims)
      .set({
        tokens_burned: amountTokens,
        liquidity_share: userShare,
        claim_status: "COMPLETED",
        updated_at: new Date(),
      })
      .where(eq(schema.burnClaims.id, claim.id))
      .returning();

    if (!result || result.length === 0) {
      throw new Error("Failed to update burn claim");
    }

    // Update IP burned supply
    const newBurnedSupply = ip.burned_supply + amountTokens;
    const newCirculatingSupply = ip.total_supply - newBurnedSupply;
    const newLiquidity = Math.max(0, ip.current_liquidity - userShare);
    const newCurrentPrice = newCirculatingSupply > 0 ? newLiquidity / newCirculatingSupply : 0;

    await this.db
      .update(schema.ips)
      .set({
        current_liquidity: newLiquidity,
        burned_supply: newBurnedSupply,
        circulating_supply: newCirculatingSupply,
        current_price: newCurrentPrice,
        updated_at: new Date(),
      })
      .where(eq(schema.ips.id, ipId));

    return result[0];
  }

  /**
   * Get liquidity events for an IP
   */
  async getLiquidityEvents(ipId: string): Promise<LiquidityEvent[]> {
    return await this.db
      .select()
      .from(schema.liquidityEvents)
      .where(eq(schema.liquidityEvents.ip_id, ipId))
      .orderBy((t) => t.created_at);
  }

  /**
   * Get burn claims for a user on an IP
   */
  async getUserBurnClaims(ipId: string, userId: string): Promise<BurnClaim[]> {
    return await this.db
      .select()
      .from(schema.burnClaims)
      .where(and(eq(schema.burnClaims.ip_id, ipId), eq(schema.burnClaims.user_id, userId)));
  }

  /**
   * Record fee collected to liquidity
   */
  async recordFeeCollection(
    ipId: string,
    feeAmount: number,
    triggeredBy: string,
  ): Promise<LiquidityEvent> {
    const ip = await this.ipService.getIPById(ipId);
    if (!ip) throw new Error("IP not found");

    const now = new Date();
    const eventId = generateId("event");

    const newLiquidity = ip.current_liquidity + feeAmount;
    const liquidityPercentage = (newLiquidity / ip.initial_liquidity) * 100;

    const event = await this.db
      .insert(schema.liquidityEvents)
      .values({
        id: eventId,
        ip_id: ipId,
        event_type: "FEE_COLLECTED",
        triggered_by: triggeredBy,
        liquidity_before: ip.current_liquidity,
        liquidity_after: newLiquidity,
        liquidity_percentage: liquidityPercentage,
        holders_affected: 0,
        total_tokens_burned: 0,
        total_liquidity_distributed: 0,
        created_at: now,
        completed_at: now,
      })
      .returning();

    if (!event || event.length === 0) {
      throw new Error("Failed to create fee collection event");
    }

    // Update IP liquidity
    await this.ipService.updateIPLiquidity(
      ipId,
      newLiquidity,
      ip.circulating_supply,
      ip.burned_supply,
    );

    return event[0];
  }

  /**
   * Resolve emergency burn - finalize distribution
   */
  async resolveEmergencyBurn(eventId: string): Promise<LiquidityEvent> {
    const now = new Date();

    // Get the event
    const events = await this.db
      .select()
      .from(schema.liquidityEvents)
      .where(eq(schema.liquidityEvents.id, eventId))
      .limit(1);

    if (events.length === 0) {
      throw new Error("Liquidity event not found");
    }

    const event = events[0];

    // Get all completed claims for this event
    const claims = await this.db
      .select()
      .from(schema.burnClaims)
      .where(
        and(
          eq(schema.burnClaims.liquidity_event_id, eventId),
          eq(schema.burnClaims.claim_status, "COMPLETED"),
        ),
      );

    const totalTokensBurned = claims.reduce((sum, c) => sum + c.tokens_burned, 0);
    const totalLiquidityDistributed = claims.reduce((sum, c) => sum + c.liquidity_share, 0);

    // Update event to resolved
    const result = await this.db
      .update(schema.liquidityEvents)
      .set({
        event_type: "BURN_RESOLVED",
        total_tokens_burned: totalTokensBurned,
        total_liquidity_distributed: totalLiquidityDistributed,
        completed_at: now,
      })
      .where(eq(schema.liquidityEvents.id, eventId))
      .returning();

    if (!result || result.length === 0) {
      throw new Error("Failed to resolve emergency burn");
    }

    return result[0];
  }
}
