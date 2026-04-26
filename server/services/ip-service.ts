/**
 * IP Service - Core business logic for IP management
 * Handles IP creation, status transitions, and validation
 */

import { eq, and } from "drizzle-orm";
import { DatabaseClient, schema } from "../db/client";
import type { IP, IPStatus } from "../db/types";
import { generateId } from "../utils/id-generator";

interface CreateIPInput {
  creatorId: string;
  title: string;
  description?: string;
  category: string;
  coverImageUrl?: string;
  initialLiquidityUSD: number; // In USD dollars
  launchDurationDays: number;
}

interface IPServiceOptions {
  db: DatabaseClient;
}

export class IPService {
  private db: DatabaseClient;

  constructor(options: IPServiceOptions) {
    this.db = options.db;
  }

  /**
   * Create a new IP asset
   * Applies 30% creator forfeit and initializes token supply
   */
  async createIP(input: CreateIPInput): Promise<IP> {
    const now = new Date();
    const ipId = generateId("ip");

    // Convert USD to cents for storage
    const initialLiquidityInCents = Math.round(input.initialLiquidityUSD * 100);

    // Apply 30% creator forfeit
    const liquidityAfterForfeit = Math.round(initialLiquidityInCents * 0.7);
    // const creatorForfeit = Math.round(initialLiquidityInCents * 0.3);

    // Generate initial token supply at $1 per token
    const initialPriceInCents = 100; // $1.00
    const totalSupply = liquidityAfterForfeit / initialPriceInCents;

    // Calculate launch end date
    const launchEndDate = new Date(now);
    launchEndDate.setDate(launchEndDate.getDate() + input.launchDurationDays);

    // Insert into database
    const result = await this.db
      .insert(schema.ips)
      .values({
        id: ipId,
        creator_id: input.creatorId,
        title: input.title,
        description: input.description || null,
        category: input.category,
        cover_image_url: input.coverImageUrl || null,
        initial_liquidity: liquidityAfterForfeit,
        current_liquidity: liquidityAfterForfeit,
        market_cap: liquidityAfterForfeit,
        total_supply: totalSupply,
        circulating_supply: totalSupply,
        current_price: initialPriceInCents,
        floor_price: initialPriceInCents,
        status: "CREATED",
        launch_start_date: now,
        launch_end_date: launchEndDate,
        burned_supply: 0,
        created_at: now,
        updated_at: now,
      })
      .returning();

    if (!result || result.length === 0) {
      throw new Error("Failed to create IP");
    }

    // Activate launch phase if liquidity >= 50%
    const ip = result[0];
    if (this.calculateLiquidityPercentage(ip.current_liquidity, ip.initial_liquidity) >= 50) {
      await this.updateIPStatus(ipId, "LAUNCH_PHASE");
      ip.status = "LAUNCH_PHASE";
    }

    return ip;
  }

  /**
   * Get IP by ID
   */
  async getIPById(ipId: string): Promise<IP | null> {
    const result = await this.db.select().from(schema.ips).where(eq(schema.ips.id, ipId)).limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get all IPs by creator
   */
  async getIPsByCreator(creatorId: string): Promise<IP[]> {
    return await this.db.select().from(schema.ips).where(eq(schema.ips.creator_id, creatorId));
  }

  /**
   * Get all IPs with specific status
   */
  async getIPsByStatus(status: IPStatus): Promise<IP[]> {
    return await this.db.select().from(schema.ips).where(eq(schema.ips.status, status));
  }

  /**
   * Update IP status
   */
  async updateIPStatus(ipId: string, status: IPStatus): Promise<void> {
    await this.db
      .update(schema.ips)
      .set({ status, updated_at: new Date() })
      .where(eq(schema.ips.id, ipId));
  }

  /**
   * Update IP liquidity and related fields
   */
  async updateIPLiquidity(
    ipId: string,
    newLiquidity: number,
    newCirculatingSupply?: number,
    newBurnedSupply?: number,
  ): Promise<void> {
    const ip = await this.getIPById(ipId);
    if (!ip) throw new Error("IP not found");

    const currentPrice = newCirculatingSupply
      ? newLiquidity / newCirculatingSupply
      : ip.current_price;

    const marketCap = currentPrice * (newCirculatingSupply || ip.circulating_supply);

    await this.db
      .update(schema.ips)
      .set({
        current_liquidity: newLiquidity,
        current_price: currentPrice,
        market_cap: marketCap,
        circulating_supply:
          newCirculatingSupply !== undefined ? newCirculatingSupply : ip.circulating_supply,
        burned_supply: newBurnedSupply !== undefined ? newBurnedSupply : ip.burned_supply,
        updated_at: new Date(),
      })
      .where(eq(schema.ips.id, ipId));
  }

  /**
   * Validate IP is in trading state
   */
  async validateIPForTrading(ipId: string): Promise<IP> {
    const ip = await this.getIPById(ipId);
    if (!ip) {
      throw new Error("IP not found");
    }

    if (!["LAUNCH_PHASE", "PUBLIC_TRADING"].includes(ip.status)) {
      throw new Error(`IP is not available for trading. Current status: ${ip.status}`);
    }

    return ip;
  }

  /**
   * Check if IP meets minimum liquidity requirement
   */
  async validateMinimumLiquidity(ipId: string): Promise<boolean> {
    const ip = await this.getIPById(ipId);
    if (!ip) {
      throw new Error("IP not found");
    }

    const percentage = this.calculateLiquidityPercentage(
      ip.current_liquidity,
      ip.initial_liquidity,
    );
    return percentage >= 50;
  }

  /**
   * Calculate liquidity percentage
   */
  private calculateLiquidityPercentage(currentLiquidity: number, initialLiquidity: number): number {
    if (initialLiquidity === 0) return 0;
    return (currentLiquidity / initialLiquidity) * 100;
  }

  /**
   * Check if emergency burn threshold is triggered (5%)
   */
  isEmergencyBurnTriggered(currentLiquidity: number, initialLiquidity: number): boolean {
    return this.calculateLiquidityPercentage(currentLiquidity, initialLiquidity) <= 5;
  }

  /**
   * Transition IP to next status if conditions met
   */
  async autoTransitionStatus(ipId: string): Promise<void> {
    const ip = await this.getIPById(ipId);
    if (!ip) throw new Error("IP not found");

    const now = new Date();

    // CREATED -> LAUNCH_PHASE (if liquidity >= 50%)
    if (ip.status === "CREATED") {
      const liquidityPercentage = this.calculateLiquidityPercentage(
        ip.current_liquidity,
        ip.initial_liquidity,
      );
      if (liquidityPercentage >= 50) {
        await this.updateIPStatus(ipId, "LAUNCH_PHASE");
      }
    }

    // LAUNCH_PHASE -> PUBLIC_TRADING (if launch ended)
    if (ip.status === "LAUNCH_PHASE" && now >= ip.launch_end_date) {
      await this.updateIPStatus(ipId, "PUBLIC_TRADING");
    }
  }
}
