/**
 * Creator Commerce Hub - IP Token Simulation Engine
 * Simulates the full lifecycle of IP token creation, trading, and liquidity mechanics
 */

export interface SimulationState {
  ip: IPState;
  holders: Map<string, HolderState>;
  transactions: TransactionRecord[];
  liquidityEvents: LiquidityEventRecord[];
  emergencyBurnActive: boolean;
  burnClaimDeadline: number | null;
}

export interface IPState {
  id: string;
  creatorId: string;
  title: string;
  initialLiquidity: number;
  currentLiquidity: number;
  marketCap: number;
  totalSupply: number;
  circulatingSupply: number;
  burnedSupply: number;
  currentPrice: number;
  floorPrice: number;
  status: IPStatus;
  launchStartDate: number;
  launchEndDate: number;
  createdAt: number;
}

export type IPStatus = "CREATED" | "LAUNCH_PHASE" | "PUBLIC_TRADING" | "MATURE";

export interface HolderState {
  userId: string;
  activeBalance: number;
  burnedBalance: number;
  liquidityClaimed: number;
  averageBuyPrice: number;
  totalInvested: number;
}

export interface TransactionRecord {
  id: string;
  ipId: string;
  type: "BUY" | "SELL" | "BURN_SHARE" | "CREATOR_FORFEIT";
  status: "COMPLETED" | "FAILED";
  buyerId?: string;
  sellerId?: string;
  amountTokens: number;
  amountValue: number;
  feeToLiquidity: number;
  sellerProceeds: number;
  pricePerToken: number;
  timestamp: number;
}

export interface LiquidityEventRecord {
  id: string;
  ipId: string;
  eventType: "FEE_COLLECTED" | "BURN_TRIGGERED" | "HOLDER_BURNED" | "BURN_RESOLVED";
  liquidityBefore: number;
  liquidityAfter: number;
  liquidityPercentage: number;
  holdersAffected: number;
  totalTokensBurned: number;
  totalLiquidityDistributed: number;
  timestamp: number;
}

export interface SimulationEvent {
  type: "TRANSACTION" | "LIQUIDITY_EVENT" | "STATUS_CHANGE" | "EMERGENCY_TRIGGER" | "EMERGENCY_RESOLVE";
  data: TransactionRecord | LiquidityEventRecord | IPState;
  timestamp: number;
}

/**
 * Main Simulation Engine
 */
export class IPTokenSimulation {
  private state: SimulationState;
  private transactionQueue: string[] = [];
  private eventLog: SimulationEvent[] = [];

  constructor() {
    this.state = {
      ip: {} as IPState,
      holders: new Map(),
      transactions: [],
      liquidityEvents: [],
      emergencyBurnActive: false,
      burnClaimDeadline: null,
    };
  }

  /**
   * Create a new IP with initial liquidity
   */
  createIP(
    creatorId: string,
    title: string,
    initialLiquidityUSD: number,
    launchDurationDays: number
  ): SimulationState {
    const now = Date.now();
    const launchEndDate = now + launchDurationDays * 24 * 60 * 60 * 1000;

    // Apply 30% forfeit
    const liquidityAfterForfeit = initialLiquidityUSD * 0.7;
    const creatorForfeit = initialLiquidityUSD * 0.3;

    // Generate initial token supply
    const initialPrice = 1; // $1 per token
    const totalSupply = liquidityAfterForfeit / initialPrice;

    this.state.ip = {
      id: `ip_${Date.now()}`,
      creatorId,
      title,
      initialLiquidity: liquidityAfterForfeit,
      currentLiquidity: liquidityAfterForfeit,
      marketCap: liquidityAfterForfeit, // Initially equal to liquidity
      totalSupply,
      circulatingSupply: totalSupply,
      burnedSupply: 0,
      currentPrice: initialPrice,
      floorPrice: initialPrice,
      status: "CREATED",
      launchStartDate: now,
      launchEndDate,
      createdAt: now,
    };

    // Creator gets their 70% as holder
    this.state.holders.set(creatorId, {
      userId: creatorId,
      activeBalance: totalSupply,
      burnedBalance: 0,
      liquidityClaimed: 0,
      averageBuyPrice: initialPrice,
      totalInvested: liquidityAfterForfeit,
    });

    // Record forfeit transaction
    this.state.transactions.push({
      id: `tx_${Date.now()}`,
      ipId: this.state.ip.id,
      type: "CREATOR_FORFEIT",
      status: "COMPLETED",
      buyerId: creatorId,
      amountTokens: totalSupply,
      amountValue: liquidityAfterForfeit,
      feeToLiquidity: creatorForfeit,
      sellerProceeds: liquidityAfterForfeit,
      pricePerToken: initialPrice,
      timestamp: now,
    });

    // Activate launch phase if liquidity >= 50%
    if (this.calculateLiquidityPercentage() >= 50) {
      this.state.ip.status = "LAUNCH_PHASE";
    }

    this.emitEvent({
      type: "STATUS_CHANGE",
      data: this.state.ip,
      timestamp: now,
    });

    return this.getState();
  }

  /**
   * Advance to public trading phase
   */
  endLaunchPhase(): void {
    if (this.state.ip.status !== "LAUNCH_PHASE") {
      throw new Error("IP not in LAUNCH_PHASE");
    }

    this.state.ip.status = "PUBLIC_TRADING";
    this.state.ip.launchEndDate = Date.now();

    this.emitEvent({
      type: "STATUS_CHANGE",
      data: this.state.ip,
      timestamp: Date.now(),
    });
  }

  /**
   * Execute a buy transaction
   */
  executeBuy(buyerId: string, amountUSD: number): TransactionRecord {
    const now = Date.now();

    // Validation
    if (this.state.ip.status !== "LAUNCH_PHASE" && this.state.ip.status !== "PUBLIC_TRADING") {
      throw new Error("IP not available for trading");
    }

    if (this.calculateLiquidityPercentage() < 50) {
      throw new Error("Insufficient liquidity (< 50%)");
    }

    if (amountUSD <= 0) {
      throw new Error("Amount must be positive");
    }

    const tokensToReceive = amountUSD / this.state.ip.currentPrice;

    if (tokensToReceive > this.state.ip.circulatingSupply - this.state.ip.totalSupply) {
      throw new Error("Insufficient tokens available");
    }

    // Execute
    const tx: TransactionRecord = {
      id: `tx_${now}`,
      ipId: this.state.ip.id,
      type: "BUY",
      status: "COMPLETED",
      buyerId,
      amountTokens: tokensToReceive,
      amountValue: amountUSD,
      feeToLiquidity: 0, // No fees on buy
      sellerProceeds: 0,
      pricePerToken: this.state.ip.currentPrice,
      timestamp: now,
    };

    // Update holder
    if (!this.state.holders.has(buyerId)) {
      this.state.holders.set(buyerId, {
        userId: buyerId,
        activeBalance: 0,
        burnedBalance: 0,
        liquidityClaimed: 0,
        averageBuyPrice: this.state.ip.currentPrice,
        totalInvested: 0,
      });
    }

    const holder = this.state.holders.get(buyerId)!;
    holder.activeBalance += tokensToReceive;
    holder.totalInvested += amountUSD;
    holder.averageBuyPrice = holder.totalInvested / holder.activeBalance;

    this.state.transactions.push(tx);
    this.emitEvent({ type: "TRANSACTION", data: tx, timestamp: now });

    return tx;
  }

  /**
   * Execute a sell transaction
   */
  executeSell(sellerId: string, tokensToSell: number): TransactionRecord {
    const now = Date.now();

    // Validation
    if (this.state.ip.status !== "LAUNCH_PHASE" && this.state.ip.status !== "PUBLIC_TRADING") {
      throw new Error("IP not available for trading");
    }

    const holder = this.state.holders.get(sellerId);
    if (!holder || holder.activeBalance < tokensToSell) {
      throw new Error("Insufficient token balance");
    }

    if (tokensToSell <= 0) {
      throw new Error("Tokens must be positive");
    }

    // Calculate values
    const saleValue = tokensToSell * this.state.ip.currentPrice;
    const feeToLiquidity = saleValue * 0.3;
    const sellerProceeds = saleValue * 0.7;

    // Execute
    const tx: TransactionRecord = {
      id: `tx_${now}`,
      ipId: this.state.ip.id,
      type: "SELL",
      status: "COMPLETED",
      sellerId,
      amountTokens: tokensToSell,
      amountValue: saleValue,
      feeToLiquidity,
      sellerProceeds,
      pricePerToken: this.state.ip.currentPrice,
      timestamp: now,
    };

    // Update state
    holder.activeBalance -= tokensToSell;
    this.state.ip.currentLiquidity += feeToLiquidity;
    this.state.ip.circulatingSupply -= tokensToSell;

    // Recalculate price
    this.updatePrice();

    // Record liquidity event
    const liquidityPct = this.calculateLiquidityPercentage();
    this.state.liquidityEvents.push({
      id: `ev_${now}`,
      ipId: this.state.ip.id,
      eventType: "FEE_COLLECTED",
      liquidityBefore: this.state.ip.currentLiquidity - feeToLiquidity,
      liquidityAfter: this.state.ip.currentLiquidity,
      liquidityPercentage: liquidityPct,
      holdersAffected: this.state.holders.size,
      totalTokensBurned: 0,
      totalLiquidityDistributed: 0,
      timestamp: now,
    });

    this.state.transactions.push(tx);
    this.emitEvent({ type: "TRANSACTION", data: tx, timestamp: now });

    // Check emergency threshold
    if (liquidityPct <= 5 && !this.state.emergencyBurnActive) {
      this.triggerEmergencyBurn();
    }

    return tx;
  }

  /**
   * Trigger emergency burn mechanism (5% threshold)
   */
  private triggerEmergencyBurn(): void {
    const now = Date.now();

    this.state.emergencyBurnActive = true;
    this.state.burnClaimDeadline = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    const event: LiquidityEventRecord = {
      id: `ev_${now}`,
      ipId: this.state.ip.id,
      eventType: "BURN_TRIGGERED",
      liquidityBefore: 0,
      liquidityAfter: this.state.ip.currentLiquidity,
      liquidityPercentage: this.calculateLiquidityPercentage(),
      holdersAffected: this.state.holders.size,
      totalTokensBurned: 0,
      totalLiquidityDistributed: 0,
      timestamp: now,
    };

    this.state.liquidityEvents.push(event);
    this.emitEvent({ type: "EMERGENCY_TRIGGER", data: event, timestamp: now });
  }

  /**
   * Holder claims liquidity share via token burn
   */
  claimBurnShare(holderId: string, tokensToBurn: number): TransactionRecord {
    const now = Date.now();

    if (!this.state.emergencyBurnActive) {
      throw new Error("Emergency burn not active");
    }

    if (this.state.burnClaimDeadline && now > this.state.burnClaimDeadline) {
      throw new Error("Burn claim period expired");
    }

    const holder = this.state.holders.get(holderId);
    if (!holder || holder.activeBalance < tokensToBurn) {
      throw new Error("Insufficient token balance");
    }

    if (tokensToBurn <= 0) {
      throw new Error("Tokens must be positive");
    }

    // Calculate share
    const sharePercentage = tokensToBurn / this.state.ip.totalSupply;
    const liquidityShare = this.state.ip.currentLiquidity * sharePercentage;

    // Execute
    const tx: TransactionRecord = {
      id: `tx_${now}`,
      ipId: this.state.ip.id,
      type: "BURN_SHARE",
      status: "COMPLETED",
      sellerId: holderId,
      amountTokens: tokensToBurn,
      amountValue: liquidityShare,
      feeToLiquidity: 0,
      sellerProceeds: liquidityShare,
      pricePerToken: 0,
      timestamp: now,
    };

    // Update state
    holder.activeBalance -= tokensToBurn;
    holder.burnedBalance += tokensToBurn;
    holder.liquidityClaimed += liquidityShare;

    this.state.ip.burnedSupply += tokensToBurn;
    this.state.ip.circulatingSupply -= tokensToBurn;
    this.state.ip.currentLiquidity -= liquidityShare;

    // Recalculate price
    this.updatePrice();

    this.state.transactions.push(tx);
    this.emitEvent({ type: "TRANSACTION", data: tx, timestamp: now });

    // Record burn event
    this.state.liquidityEvents.push({
      id: `ev_${now}`,
      ipId: this.state.ip.id,
      eventType: "HOLDER_BURNED",
      liquidityBefore: this.state.ip.currentLiquidity + liquidityShare,
      liquidityAfter: this.state.ip.currentLiquidity,
      liquidityPercentage: this.calculateLiquidityPercentage(),
      holdersAffected: 1,
      totalTokensBurned: tokensToBurn,
      totalLiquidityDistributed: liquidityShare,
      timestamp: now,
    });

    // Check if emergency resolved
    if (this.calculateLiquidityPercentage() > 5) {
      this.resolveEmergencyBurn();
    }

    return tx;
  }

  /**
   * Resolve emergency burn when liquidity recovers
   */
  private resolveEmergencyBurn(): void {
    const now = Date.now();

    this.state.emergencyBurnActive = false;
    this.state.burnClaimDeadline = null;

    this.state.liquidityEvents.push({
      id: `ev_${now}`,
      ipId: this.state.ip.id,
      eventType: "BURN_RESOLVED",
      liquidityBefore: this.state.ip.currentLiquidity,
      liquidityAfter: this.state.ip.currentLiquidity,
      liquidityPercentage: this.calculateLiquidityPercentage(),
      holdersAffected: this.state.holders.size,
      totalTokensBurned: 0,
      totalLiquidityDistributed: 0,
      timestamp: now,
    });

    this.emitEvent({
      type: "EMERGENCY_RESOLVE",
      data: this.state.liquidityEvents[this.state.liquidityEvents.length - 1],
      timestamp: now,
    });
  }

  /**
   * Simulate market crash (holders panic sell)
   */
  simulateMarketCrash(percentageToSell: number = 0.5): void {
    const holders = Array.from(this.state.holders.values());

    for (const holder of holders) {
      const tokensToSell = holder.activeBalance * percentageToSell;
      if (tokensToSell > 0) {
        try {
          this.executeSell(holder.userId, tokensToSell);
        } catch (e) {
          // Skip if sell fails
        }
      }
    }
  }

  /**
   * Simulate market recovery (new buy pressure)
   */
  simulateMarketRecovery(buyerId: string, amountUSD: number): TransactionRecord {
    return this.executeBuy(buyerId, amountUSD);
  }

  /**
   * Add new investor/buyer
   */
  addNewInvestor(investorId: string, investmentUSD: number): TransactionRecord {
    return this.executeBuy(investorId, investmentUSD);
  }

  // ====== Calculations ======

  private calculateLiquidityPercentage(): number {
    if (this.state.ip.initialLiquidity === 0) return 0;
    return (this.state.ip.currentLiquidity / this.state.ip.initialLiquidity) * 100;
  }

  private updatePrice(): void {
    if (this.state.ip.circulatingSupply === 0) {
      this.state.ip.currentPrice = 0;
    } else {
      this.state.ip.currentPrice = this.state.ip.currentLiquidity / this.state.ip.circulatingSupply;
    }
  }

  // ====== Getters ======

  getState(): SimulationState {
    return this.state;
  }

  getIP(): IPState {
    return this.state.ip;
  }

  getHolder(userId: string): HolderState | undefined {
    return this.state.holders.get(userId);
  }

  getAllHolders(): HolderState[] {
    return Array.from(this.state.holders.values());
  }

  getTransactions(): TransactionRecord[] {
    return this.state.transactions;
  }

  getLiquidityEvents(): LiquidityEventRecord[] {
    return this.state.liquidityEvents;
  }

  getEventLog(): SimulationEvent[] {
    return this.eventLog;
  }

  isEmergencyBurnActive(): boolean {
    return this.state.emergencyBurnActive;
  }

  getLiquidityPercentage(): number {
    return this.calculateLiquidityPercentage();
  }

  // ====== Helpers ======

  private emitEvent(event: SimulationEvent): void {
    this.eventLog.push(event);
  }

  reset(): void {
    this.state = {
      ip: {} as IPState,
      holders: new Map(),
      transactions: [],
      liquidityEvents: [],
      emergencyBurnActive: false,
      burnClaimDeadline: null,
    };
    this.eventLog = [];
  }
}
