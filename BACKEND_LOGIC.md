# Creator Commerce Hub - Backend Logic Specification

## 1. DATA MODELS

### 1.1 IP (Intellectual Property)

```typescript
interface IP {
  id: string (UUID)
  creator_id: string (User ID who created/listed)
  title: string
  description: string
  category: string

  // Liquidity & Finance
  initial_liquidity: number (decimal, locked amount)
  current_liquidity: number (running balance from fees)
  market_cap: number (total value of all tokens sold)
  total_supply: number (total tokens created)

  // Pricing
  current_price: number (calculated: current_liquidity / total_supply)
  floor_price: number (locked during LAUNCH_PHASE)

  // Status & Timeline
  status: IPStatus (CREATED | LAUNCH_PHASE | PUBLIC_TRADING | MATURE)
  launch_start_date: timestamp
  launch_end_date: timestamp

  // Tokens
  circulating_supply: number (total - burned)
  burned_supply: number (tokens removed via burn mechanism)

  // Metadata
  created_at: timestamp
  updated_at: timestamp
}

enum IPStatus {
  CREATED = "CREATED"                    // Awaiting liquidity
  LAUNCH_PHASE = "LAUNCH_PHASE"          // Buyback disabled, floor locked
  PUBLIC_TRADING = "PUBLIC_TRADING"      // After launch, full trading
  MATURE = "MATURE"                      // Stable state
}
```

### 1.2 Token Holdings

```typescript
interface TokenHolder {
  id: string (UUID)
  ip_id: string (FK to IP)
  user_id: string (FK to User)

  active_balance: number (tokens currently held)
  burned_balance: number (tokens burned in liquidity events)
  liquidity_claimed: number (value received from burns)

  average_buy_price: number
  total_invested: number

  created_at: timestamp
  updated_at: timestamp

  // Unique constraint: (ip_id, user_id)
}
```

### 1.3 Transaction

```typescript
interface Transaction {
  id: string (UUID)
  ip_id: string (FK to IP)

  type: TransactionType
  status: TransactionStatus (PENDING | COMPLETED | FAILED)

  // For BUY/SELL
  buyer_id: string
  seller_id: string
  amount_tokens: number (quantity of tokens)
  amount_value: number (USD value)

  // Fee calculation
  fee_to_liquidity: number (30% of amount_value on sales)
  seller_proceeds: number (70% of amount_value)

  price_per_token: number (amount_value / amount_tokens)

  // Metadata
  created_at: timestamp
  completed_at: timestamp
}

enum TransactionType {
  BUY = "BUY"                    // Buyer purchases tokens
  SELL = "SELL"                  // Holder sells tokens
  BURN_SHARE = "BURN_SHARE"      // Holder burns tokens for liquidity share
  CREATOR_FORFEIT = "CREATOR_FORFEIT"  // Initial 30% forfeit
}

enum TransactionStatus {
  PENDING = "PENDING"
  COMPLETED = "COMPLETED"
  FAILED = "FAILED"
  CANCELLED = "CANCELLED"
}
```

### 1.4 Liquidity Event

```typescript
interface LiquidityEvent {
  id: string (UUID)
  ip_id: string (FK to IP)

  event_type: LiquidityEventType
  triggered_by: string (user_id or SYSTEM)

  // Event details
  liquidity_before: number
  liquidity_after: number
  liquidity_percentage: number (liquidity_after / initial_liquidity * 100)

  // For BURN_TRIGGERED events
  holders_affected: number (count of affected holders)
  total_tokens_burned: number
  total_liquidity_distributed: number

  created_at: timestamp
  completed_at: timestamp
}

enum LiquidityEventType {
  FEE_COLLECTED = "FEE_COLLECTED"        // 30% fee added
  BURN_TRIGGERED = "BURN_TRIGGERED"      // Hit 5% threshold
  HOLDER_BURNED = "HOLDER_BURNED"        // Individual burn share claim
}
```

---

## 2. BUSINESS LOGIC RULES

### 2.1 IP Lifecycle

```
CREATED
  ├─ Condition: creator_id assigned, initial_liquidity set
  ├─ Action: Waiting for minimum liquidity requirement (≥50%)
  └─ Next: LAUNCH_PHASE (when initial_liquidity ≥ 50% of estimated need)

LAUNCH_PHASE
  ├─ Duration: creator defines launch_end_date
  ├─ Features:
  │  ├─ ✓ Trading ENABLED (BUY/SELL)
  │  ├─ ✗ Buyback DISABLED
  │  ├─ ✗ Floor price LOCKED (no price changes allowed)
  │  └─ ✓ 30% fees collected to liquidity
  ├─ Exit condition: current_time >= launch_end_date
  └─ Next: PUBLIC_TRADING

PUBLIC_TRADING
  ├─ Features:
  │  ├─ ✓ Trading ENABLED (BUY/SELL)
  │  ├─ ✓ Buyback ENABLED (seller_id = PLATFORM_BUYBACK)
  │  ├─ ✓ Floor price = Liquidity / Market Cap (dynamic)
  │  └─ ✓ 30% fees collected to liquidity
  └─ Remains in this state
```

### 2.2 Liquidity Requirements

```
Minimum Liquidity Threshold: 50%
├─ Calculation: current_liquidity / (current_liquidity + initial_capital_needed)
├─ Enforced: Before trading enabled
└─ Purpose: Ensure adequate buyback capacity

Emergency Threshold: 5%
├─ Trigger: current_liquidity / initial_liquidity ≤ 0.05
├─ Action: Burn mechanism activated
└─ Consequence: Holders can burn tokens to claim share
```

### 2.3 Fee Distribution

```
On any SELL transaction:
  Total Sale Value = V

  Creator Receives = V × 0.70 (70%)
  Liquidity Receives = V × 0.30 (30%)

On IP Creation (30% initial forfeit):
  Creator Initial Liquidity = L
  Creator Keeps = L × 0.70 (70% in liquidity)
  Platform Receives = L × 0.30 (30% added to pool immediately)

  Actual Initial Liquidity = L × 0.70
```

### 2.4 Token Supply & Pricing

```
Initial Token Generation (on creation):
  total_supply = (creator_initial_investment) / (desired_initial_price)

  After 30% forfeit:
  effective_liquidity = creator_initial_investment × 0.70
  effective_supply = total_supply

Price Calculation:

  LAUNCH_PHASE:
    current_price = initial_liquidity_after_forfeit / total_supply
    (fixed, no changes)

  PUBLIC_TRADING:
    current_price = current_liquidity / circulating_supply
    (dynamic, changes with each transaction)

Market Cap (always):
  market_cap = current_price × circulating_supply
```

### 2.5 Buy Transaction Flow

```
1. Validation
   ├─ IP.status ∈ [LAUNCH_PHASE, PUBLIC_TRADING]
   ├─ IP.current_liquidity ≥ minimum_liquidity_threshold
   ├─ buyer_id has sufficient funds
   └─ amount_value > 0

2. Calculate Purchase
   ├─ tokens_to_receive = amount_value / current_price
   ├─ Check: tokens_to_receive ≤ available_supply
   └─ Reserve tokens

3. Execute Transaction
   ├─ Create Transaction record (type: BUY)
   ├─ Transfer funds from buyer → seller
   ├─ Update TokenHolder.active_balance for buyer (add tokens)
   ├─ Update TokenHolder.average_buy_price
   └─ Update TokenHolder.total_invested

4. Post-Transaction
   ├─ No fees collected (fee only on SELL)
   └─ market_cap may change if price fluctuates

5. Finalize
   ├─ Set Transaction.status = COMPLETED
   └─ Emit event: "TOKEN_PURCHASED"
```

### 2.6 Sell Transaction Flow

```
1. Validation
   ├─ IP.status ∈ [LAUNCH_PHASE, PUBLIC_TRADING]
   ├─ seller has active_balance ≥ tokens_to_sell
   └─ tokens_to_sell > 0

2. Calculate Sale
   ├─ sale_value = tokens_to_sell × current_price
   ├─ fee_to_liquidity = sale_value × 0.30
   ├─ seller_proceeds = sale_value × 0.70
   └─ fee_to_liquidity must be ≥ 0

3. Execute Transaction
   ├─ Create Transaction record (type: SELL)
   ├─ Deduct tokens from seller.active_balance
   ├─ Transfer seller_proceeds to seller
   └─ Add fee_to_liquidity to IP.current_liquidity

4. Update State
   ├─ Reduce circulating_supply by tokens_to_sell
   ├─ current_price recalculates
   ├─ market_cap recalculates
   └─ Check if liquidity_percentage dropped below 5%

5. Check Emergency Threshold
   ├─ liquidity_percentage = current_liquidity / initial_liquidity
   ├─ IF liquidity_percentage ≤ 0.05
   │  └─ Trigger LiquidityEvent (BURN_TRIGGERED)
   └─ Continue

6. Finalize
   ├─ Set Transaction.status = COMPLETED
   └─ Emit event: "TOKEN_SOLD"
```

### 2.7 Buyback (After Launch Only)

```
Precondition:
  ├─ IP.status = PUBLIC_TRADING
  └─ Buyback is ENABLED

Request:
  seller_id = any holder
  tokens_to_sell = amount

Execution:
  ├─ Same as SELL flow (steps 1-6)
  ├─ Buyer = SYSTEM_BUYBACK (platform treasury)
  └─ Proceeds pulled from accumulated liquidity

Edge Case: Insufficient Liquidity
  ├─ IF current_liquidity < seller_proceeds
  └─ REJECT transaction: "Insufficient liquidity for buyback"
```

### 2.8 Liquidity Burn Mechanism (5% Threshold)

```
Trigger Condition:
  liquidity_percentage = IP.current_liquidity / IP.initial_liquidity
  IF liquidity_percentage ≤ 0.05
    └─ BURN_TRIGGERED event created

Announcement Phase:
  ├─ Notify all TokenHolders of IP
  ├─ Display: current_liquidity, burn_threshold, claim_deadline
  └─ Holders have 30 days to claim

Claim Mechanism:
  1. Holder decides to participate
  2. Specifies: tokens_to_burn
  3. Validation
     ├─ holder.active_balance ≥ tokens_to_burn
     ├─ tokens_to_burn > 0
     ├─ IP still in BURN state
     └─ BURN_TRIGGERED event not expired

  4. Claim Share
     ├─ share_percentage = tokens_to_burn / IP.total_supply
     ├─ liquidity_share = IP.current_liquidity × share_percentage
     ├─ holder.liquidity_claimed += liquidity_share
     └─ holder receives liquidity_share in USD/stablecoin

  5. Update State
     ├─ holder.active_balance -= tokens_to_burn
     ├─ holder.burned_balance += tokens_to_burn
     ├─ IP.burned_supply += tokens_to_burn
     ├─ IP.circulating_supply -= tokens_to_burn
     ├─ IP.current_liquidity -= liquidity_share
     ├─ Create Transaction (type: BURN_SHARE)
     └─ Check if burn triggered again (recursive)

Post-Burn State:
  ├─ IF current_liquidity still ≤ 5%
  │  └─ Maintain BURN state
  ├─ ELSE IF current_liquidity > 5%
  │  ├─ Reset to normal trading
  │  └─ Emit "BURN_RESOLVED" event
  └─ Unclaimed shares: liquidity locked for 30 days, then returned to pool
```

---

## 3. CALCULATIONS & FORMULAS

### 3.1 Price Formula

```
LAUNCH_PHASE Price (Fixed):
  P_launch = initial_liquidity_after_forfeit / total_supply

PUBLIC_TRADING Price (Dynamic):
  P_trading = current_liquidity / circulating_supply

Where:
  initial_liquidity_after_forfeit = creator_initial × 0.70
  circulating_supply = total_supply - burned_supply
```

### 3.2 Liquidity Percentage

```
liquidity_pct = (current_liquidity / initial_liquidity) × 100

Critical Thresholds:
  liquidity_pct ≥ 50%  → Trading enabled
  liquidity_pct ≤ 5%   → Burn mechanism triggered
  liquidity_pct < 0    → Invalid state (should never happen)
```

### 3.3 Market Cap

```
market_cap = current_price × circulating_supply

Note:
  market_cap changes when:
  ├─ Price changes (PUBLIC_TRADING phase)
  ├─ Supply changes (token burn)
  └─ Does NOT change on fee collection (only liquidity changes)
```

### 3.4 Holder Share

```
During Burn Mechanism:
  holder_share = (tokens_burned / total_supply) × current_liquidity

  Example:
    total_supply = 1,000,000
    holder burns = 10,000 (1%)
    current_liquidity = $1,000,000

    holder_share = (10,000 / 1,000,000) × $1,000,000 = $10,000
```

---

## 4. STATE MACHINE

```
                    ┌─────────────────────────────────────┐
                    │ User creates IP with initial_liquidity
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ CREATED                     │
                    │ Waiting: liquidity ≥ 50%   │
                    └──────────────┬──────────────┘
                                   │
                           (30% forfeit applied)
                                   │
                    ┌──────────────▼──────────────┐
                    │ LAUNCH_PHASE                │
                    │ ✓ Trading enabled          │
                    │ ✗ Buyback disabled         │
                    │ ✗ Floor price locked       │
                    └──────────────┬──────────────┘
                                   │
                        (launch_end_date reached)
                                   │
                    ┌──────────────▼──────────────┐
                    │ PUBLIC_TRADING              │
                    │ ✓ Trading enabled          │
                    │ ✓ Buyback enabled          │
                    │ ✓ Dynamic pricing          │
                    └──────────────┬──────────────┘
                                   │
                        (stable, mature state)
                                   │
                    ┌──────────────▼──────────────┐
                    │ MATURE                      │
                    │ (same as PUBLIC_TRADING)    │
                    └─────────────────────────────┘

EMERGENCY PARALLEL STATE: BURN_TRIGGERED
    Triggered when: liquidity ≤ 5% of initial
    ├─ Holders can burn tokens for liquidity share
    └─ Automatically resolves when liquidity > 5%
```

---

## 5. API ENDPOINTS (Backend)

### 5.1 IP Management

```
POST /api/ip/create
  Body: {
    creator_id: string
    title: string
    initial_liquidity: number (USD)
    launch_duration_days: number
  }
  Response: { ip_id, status: CREATED }

GET /api/ip/:id
  Response: full IP object with current state

GET /api/ip/:id/status
  Response: { status, liquidity_pct, current_price, market_cap }

PATCH /api/ip/:id/launch
  Body: {} (activate launch)
  Response: { status: LAUNCH_PHASE }
```

### 5.2 Trading

```
POST /api/ip/:id/buy
  Body: {
    buyer_id: string
    amount_value: number (USD to spend)
  }
  Response: {
    transaction_id,
    tokens_received,
    new_balance,
    new_price
  }

POST /api/ip/:id/sell
  Body: {
    seller_id: string
    amount_tokens: number
  }
  Response: {
    transaction_id,
    proceeds: number (70%)
    new_balance,
    new_price,
    liquidity_pct (check for burn trigger)
  }

POST /api/ip/:id/buyback
  Body: {
    seller_id: string
    amount_tokens: number
  }
  Response: same as /sell (only if PUBLIC_TRADING)
```

### 5.3 Liquidity & Burns

```
GET /api/ip/:id/liquidity
  Response: {
    current_balance,
    initial_balance,
    liquidity_pct,
    status (NORMAL | EMERGENCY_5%)
  }

GET /api/ip/:id/burn-events
  Response: array of LiquidityEvent records

POST /api/ip/:id/burn-share
  Body: {
    holder_id: string
    tokens_to_burn: number
  }
  Precondition: liquidity_pct ≤ 5%
  Response: {
    transaction_id,
    liquidity_share_received: number,
    new_balance,
    new_burned_balance
  }
```

### 5.4 Holdings & History

```
GET /api/holder/:user_id/ip/:id
  Response: TokenHolder object

GET /api/ip/:id/transactions
  Response: array of Transaction records

GET /api/ip/:id/holders
  Response: array of TokenHolder objects (paginated)
```

---

## 6. VALIDATION RULES

### 6.1 Pre-Transaction Checks

```
BUY Transaction:
  ✓ IP exists
  ✓ IP.status ∈ [LAUNCH_PHASE, PUBLIC_TRADING]
  ✓ IP.liquidity_pct ≥ 50%
  ✓ buyer_id exists
  ✓ buyer has sufficient funds
  ✓ amount_value > 0
  ✓ tokens_to_receive ≤ remaining_supply

SELL Transaction:
  ✓ IP exists
  ✓ IP.status ∈ [LAUNCH_PHASE, PUBLIC_TRADING]
  ✓ seller exists
  ✓ seller.active_balance ≥ tokens_to_sell
  ✓ tokens_to_sell > 0
  ✓ sale_value > 0

BURN_SHARE Transaction:
  ✓ IP exists
  ✓ liquidity_pct ≤ 5%
  ✓ BURN_TRIGGERED event exists and not expired
  ✓ holder.active_balance ≥ tokens_to_burn
  ✓ tokens_to_burn > 0
```

### 6.2 Post-Transaction Checks

```
After every SELL:
  ├─ Recalculate: current_price, market_cap, liquidity_pct
  ├─ Check: liquidity_pct ≤ 5%
  │  └─ If yes: Create BURN_TRIGGERED event
  └─ Emit: appropriate event/notification

After every BURN_SHARE:
  ├─ Recalculate: circulating_supply, current_price, liquidity_pct
  ├─ Check: liquidity_pct > 5%
  │  └─ If yes: Resolve BURN_TRIGGERED event
  └─ Emit: event notifications
```

---

## 7. ERROR HANDLING

```
Errors with HTTP Status:

400 Bad Request
  ├─ Invalid IP ID
  ├─ Invalid user ID
  ├─ Invalid amount (negative, zero, exceeds balance)
  └─ Invalid transaction type

403 Forbidden
  ├─ IP not in correct status for operation
  ├─ Buyback requested in LAUNCH_PHASE
  ├─ Trading disabled (liquidity < 50%)
  └─ Burn claim when IP not in BURN state

409 Conflict
  ├─ Insufficient liquidity for buyback
  ├─ Transaction already processed
  └─ Duplicate transaction attempt

500 Internal Server Error
  ├─ Database error
  ├─ Calculation overflow
  └─ Unexpected state inconsistency
```

---

## 8. CONCURRENCY & ATOMICITY

```
All transactions must be ATOMIC:
  ├─ Database transactions wrap entire operation
  ├─ All state updates succeed or all rollback
  └─ No partial updates

Race Condition Prevention:
  ├─ Row-level locking on IP during state updates
  ├─ Optimistic locking on TokenHolder (version field)
  ├─ Queue sells/buys if simultaneous attempts
  └─ Ordered execution: FIFO by timestamp
```

---

## 9. EXAMPLE WALKTHROUGH

### Scenario: Creator Creates IP, Buyer Participates, Liquidity Drops to 5%

```
STEP 1: Creator Creates IP
  creator_id = alice
  initial_liquidity = $10,000

  System applies 30% forfeit:
  liquidity_pool_initial = $10,000 × 0.70 = $7,000

  Create IP:
    total_supply = $7,000 / $1 = 7,000 tokens
    current_price = $7,000 / 7,000 = $1/token
    status = LAUNCH_PHASE

  Result: alice has $3,000 remaining, platform has $7,000 in liquidity

---

STEP 2: Buyer Purchases
  bob buys $500 worth

  Calculation:
    tokens_to_receive = $500 / $1 = 500 tokens
    NO FEES on buy
    bob.active_balance += 500
    circulating_supply = 7,500 (7,000 + 500 new)

  Result: bob holds 500 tokens, liquidity still $7,000

---

STEP 3: Bob Sells
  bob sells 500 tokens

  Calculation:
    current_price = $7,000 / 7,500 = $0.933/token
    sale_value = 500 × $0.933 = $466.50
    fee_to_liquidity = $466.50 × 0.30 = $139.95
    bob_proceeds = $466.50 × 0.70 = $326.55

  Update:
    bob.active_balance -= 500
    circulating_supply = 7,000
    current_liquidity = $7,000 + $139.95 = $7,139.95
    current_price = $7,139.95 / 7,000 = $1.020/token

  Result: Liquidity increased from fee, price slightly recovered

---

STEP 4: Large Sell Triggers Emergency (5% Threshold)
  carol sells 6,500 tokens (most of supply)

  current_price = $7,139.95 / 7,000 = $1.020
  sale_value = 6,500 × $1.020 = $6,630
  fee_to_liquidity = $6,630 × 0.30 = $1,989
  carol_proceeds = $6,630 × 0.70 = $4,641

  After:
    current_liquidity = $7,139.95 + $1,989 = $9,128.95
    circulating_supply = 500
    current_price = $9,128.95 / 500 = $18.26/token

  ⚠️ Wait, liquidity increased so no burn?

  Let me recalculate with more sells:

  Multiple sellers drain to:
    current_liquidity = $450 (dropped from $7,000)
    liquidity_pct = $450 / $7,000 = 6.43%

  Still above 5%. One more sell:
    sale_value = $100
    fee = $30
    current_liquidity = $450 + $30 = $480

    Re-calculate: liquidity_pct = $480 / $7,000 = 6.86%

  Market selling doesn't trigger emergency in this path. Let me use extreme case:

  Extreme: Someone bought at $1, market crashed, sells at $0.001
  sale_value = 7,000 × $0.001 = $7
  fee = $2.10
  current_liquidity = $7,000 + $2.10 = $7,002.10

  Still increases. Emergency only triggers if liquidity extracted faster than fees accumulate.

  Actual Emergency Scenario:
    Suppose circulating_supply is 70,000,000 tokens (typical meme token)
    current_price = $0.0001/token
    current_liquidity = $7,000
    market_cap = $7,000

    Carol sells 50,000,000 tokens at $0.0001:
      sale_value = $5,000
      fee = $1,500
      current_liquidity = $8,500

    But now supply is 20,000,000, price drops:
      new_price = $8,500 / 20,000,000 = $0.000425

    If further dumps happen:
      current_liquidity drops to $400
      liquidity_pct = $400 / $7,000 = 5.71% (still above)

  Liquidity trigger requires EXTRACTION: only happens in buyback or burn claims.

  Correct Scenario: Frequent Buybacks drain liquidity
    Bob buyback request: 10,000 tokens × $1 = $10,000
    But current_liquidity = $8,000
    REJECTED: insufficient liquidity

    Bob buyback: 7,000 tokens × $1.14 = $8,000 (remaining liquidity)
    current_liquidity = $0 (or near-zero)
    liquidity_pct = 0% (EMERGENCY)

  ✓ BURN_TRIGGERED event created
  ✓ Holders notified: "Only 0% liquidity remaining. Burn tokens to claim share."

  Holder D has 500 tokens:
    Chooses to burn all 500
    holder_share = (500 / 20,000,000) × $0 = $0
    (Nothing to claim, burned for emergency recovery)

---

STEP 5: Recovery or Resolution
  Case A: No new funds → Liquidity stays low
    ├─ BURN state persists
    ├─ Remaining holders must decide to burn or hold
    └─ Project fails unless recovered

  Case B: Creator/supporters add funds → Liquidity recovers
    ├─ New buy: $5,000 added
    ├─ current_liquidity = $5,000
    ├─ liquidity_pct = $5,000 / $7,000 = 71.4%
    ├─ BURN state auto-resolves
    └─ Normal trading resumes
```

---

## 10. DATABASE SCHEMA (SQL)

```sql
CREATE TABLE ip (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),

  initial_liquidity DECIMAL(18, 8) NOT NULL,
  current_liquidity DECIMAL(18, 8) NOT NULL DEFAULT 0,
  market_cap DECIMAL(18, 8) NOT NULL DEFAULT 0,

  total_supply DECIMAL(18, 8) NOT NULL,
  circulating_supply DECIMAL(18, 8) NOT NULL,
  burned_supply DECIMAL(18, 8) NOT NULL DEFAULT 0,

  current_price DECIMAL(18, 10) GENERATED ALWAYS AS (current_liquidity / NULLIF(circulating_supply, 0)),
  floor_price DECIMAL(18, 10),

  status VARCHAR(50) NOT NULL CHECK (status IN ('CREATED', 'LAUNCH_PHASE', 'PUBLIC_TRADING', 'MATURE')),

  launch_start_date TIMESTAMP,
  launch_end_date TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (creator_id) REFERENCES users(id),
  INDEX idx_creator_id (creator_id),
  INDEX idx_status (status)
);

CREATE TABLE token_holder (
  id UUID PRIMARY KEY,
  ip_id UUID NOT NULL,
  user_id UUID NOT NULL,

  active_balance DECIMAL(18, 8) NOT NULL DEFAULT 0,
  burned_balance DECIMAL(18, 8) NOT NULL DEFAULT 0,
  liquidity_claimed DECIMAL(18, 8) NOT NULL DEFAULT 0,

  average_buy_price DECIMAL(18, 10),
  total_invested DECIMAL(18, 8),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (ip_id) REFERENCES ip(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_holder (ip_id, user_id),
  INDEX idx_user_id (user_id)
);

CREATE TABLE transaction (
  id UUID PRIMARY KEY,
  ip_id UUID NOT NULL,

  type VARCHAR(50) NOT NULL CHECK (type IN ('BUY', 'SELL', 'BURN_SHARE', 'CREATOR_FORFEIT')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),

  buyer_id UUID,
  seller_id UUID,

  amount_tokens DECIMAL(18, 8) NOT NULL,
  amount_value DECIMAL(18, 8) NOT NULL,

  fee_to_liquidity DECIMAL(18, 8),
  seller_proceeds DECIMAL(18, 8),
  price_per_token DECIMAL(18, 10),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,

  FOREIGN KEY (ip_id) REFERENCES ip(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id),
  INDEX idx_ip_id (ip_id),
  INDEX idx_created_at (created_at)
);

CREATE TABLE liquidity_event (
  id UUID PRIMARY KEY,
  ip_id UUID NOT NULL,

  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('FEE_COLLECTED', 'BURN_TRIGGERED', 'HOLDER_BURNED')),
  triggered_by UUID,

  liquidity_before DECIMAL(18, 8),
  liquidity_after DECIMAL(18, 8),
  liquidity_percentage DECIMAL(5, 2),

  holders_affected INT,
  total_tokens_burned DECIMAL(18, 8),
  total_liquidity_distributed DECIMAL(18, 8),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,

  FOREIGN KEY (ip_id) REFERENCES ip(id) ON DELETE CASCADE,
  FOREIGN KEY (triggered_by) REFERENCES users(id),
  INDEX idx_ip_id (ip_id),
  INDEX idx_event_type (event_type)
);
```

---

## 11. SUMMARY

This backend logic provides:

- ✓ Fair token pricing based on liquidity
- ✓ Creator protection (30% forfeit upfront)
- ✓ Buyer protection (liquidity-backed buyback)
- ✓ Emergency mechanism (5% burn)
- ✓ Clear state transitions
- ✓ Atomic transactions
- ✓ Audit trail (all transactions recorded)
