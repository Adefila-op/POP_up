/**
 * User Service - Manages user accounts and wallet connections
 */

import { eq } from "drizzle-orm";
import { DatabaseClient, schema } from "@/server/db/client";
import type { User } from "@/server/db/types";
import { generateId } from "@/server/utils/id-generator";

interface CreateUserInput {
  walletAddress: string;
  username: string;
  email?: string;
  profilePictureUrl?: string;
  bio?: string;
  isCreator?: boolean;
}

interface UpdateUserInput {
  username?: string;
  email?: string;
  profilePictureUrl?: string;
  bio?: string;
  isCreator?: boolean;
}

interface UserServiceOptions {
  db: DatabaseClient;
}

export class UserService {
  private db: DatabaseClient;

  constructor(options: UserServiceOptions) {
    this.db = options.db;
  }

  /**
   * Create or get user by wallet address
   */
  async getOrCreateUser(input: CreateUserInput): Promise<User> {
    const existing = await this.getUserByWallet(input.walletAddress);
    if (existing) return existing;

    const userId = generateId("user");
    const now = new Date();

    const user = await this.db
      .insert(schema.users)
      .values({
        id: userId,
        wallet_address: input.walletAddress.toLowerCase(),
        username: input.username,
        email: input.email || null,
        profile_picture_url: input.profilePictureUrl || null,
        bio: input.bio || null,
        is_creator: input.isCreator || false,
        cash_balance: 0,
        created_at: now,
        updated_at: now,
      })
      .returning();

    if (!user || user.length === 0) {
      throw new Error("Failed to create user");
    }

    return user[0];
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get user by wallet address
   */
  async getUserByWallet(walletAddress: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.wallet_address, walletAddress.toLowerCase()))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    const now = new Date();

    const result = await this.db
      .update(schema.users)
      .set({
        username: input.username !== undefined ? input.username : undefined,
        email: input.email !== undefined ? input.email : undefined,
        profile_picture_url:
          input.profilePictureUrl !== undefined
            ? input.profilePictureUrl
            : undefined,
        bio: input.bio !== undefined ? input.bio : undefined,
        is_creator:
          input.isCreator !== undefined ? input.isCreator : undefined,
        updated_at: now,
      })
      .where(eq(schema.users.id, userId))
      .returning();

    if (!result || result.length === 0) {
      throw new Error("Failed to update user");
    }

    return result[0];
  }

  /**
   * Update user cash balance
   */
  async updateCashBalance(
    userId: string,
    amount: number, // in USD cents
    isAddition: boolean = true
  ): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("User not found");

    const newBalance = isAddition
      ? user.cash_balance + amount
      : user.cash_balance - amount;

    if (newBalance < 0) {
      throw new Error("Insufficient cash balance");
    }

    const result = await this.db
      .update(schema.users)
      .set({
        cash_balance: newBalance,
        updated_at: new Date(),
      })
      .where(eq(schema.users.id, userId))
      .returning();

    if (!result || result.length === 0) {
      throw new Error("Failed to update cash balance");
    }

    return result[0];
  }

  /**
   * Deposit cash to user account
   */
  async depositCash(userId: string, amount: number): Promise<User> {
    return this.updateCashBalance(userId, amount, true);
  }

  /**
   * Withdraw cash from user account
   */
  async withdrawCash(userId: string, amount: number): Promise<User> {
    return this.updateCashBalance(userId, amount, false);
  }
}
