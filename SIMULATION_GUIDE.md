# IP Token Simulation - User Guide

## Overview

The **IP Token Simulation** is an interactive tool that demonstrates the complete mechanics of the Creator Commerce Hub's token system. It allows you to test scenarios, understand liquidity dynamics, and see the emergency burn mechanism in action.

**Access at:** `/simulation`

---

## Getting Started

### Step 1: Initialize IP
Click **"Create New IP"** to create a test IP with:
- Creator: `creator_alice`
- Title: `AI Art NFT Collection`
- Initial Liquidity: `$10,000`
- Launch Duration: `30 days`

**What happens:**
1. 30% creator forfeit is applied: `$10,000 × 0.70 = $7,000` liquidity pool
2. Creator receives 7,000 tokens (at $1 initial price)
3. IP transitions to `LAUNCH_PHASE` (since liquidity ≥ 50%)

---

## Dashboard Sections

### KPI Metrics (Top Row)
- **Current Price:** Token value calculated as `Liquidity / Circulating Supply`
- **Liquidity:** Available pool balance (increases with 30% fees from sells)
- **Market Cap:** Total value of all tokens
- **Circulating Supply:** Total tokens not burned

### Liquidity Status (Meter)
Visual indicator showing:
- **Green Zone:** > 50% (Healthy)
- **Yellow Zone:** 5%-50% (Caution)
- **Red Zone:** < 5% (Emergency - Burn mechanism active)

---

## Trading Tab

### Buy Action
1. Enter an **Investor ID** (e.g., `investor_bob`)
2. Enter **Amount in USD** (e.g., `$1,000`)
3. Click **Execute Buy**

**What happens:**
- Tokens calculated: `$1,000 ÷ current_price`
- NO fees charged on buy
- New investor added to holders list
- Investor's average buy price tracked

**Example:**
```
Price = $7,000 ÷ 7,000 = $1/token
Investor buys $1,000
→ Receives 1,000 tokens
→ Price stays $1/token (only circulating supply increases)
```

### Sell Action
1. Enter **Tokens to Sell** (max: creator's balance)
2. Click **Execute Sell**

**What happens:**
- Sale value calculated: `tokens × current_price`
- 30% fee added to liquidity pool (auto-increases)
- 70% proceeds sent to seller
- Circulating supply decreases (seller exits position)
- Price recalculates: `new_liquidity ÷ new_supply`
- ⚠️ Checked if liquidity dropped below 5%

**Example:**
```
Current state: 7,000 tokens, $7,000 liquidity, $1/token
Creator sells 1,000 tokens
→ Sale value: 1,000 × $1 = $1,000
→ Fee to liquidity: $300 (30%)
→ Creator receives: $700 (70%)
→ New liquidity: $7,300
→ New supply: 6,000
→ New price: $7,300 ÷ 6,000 = $1.217/token
```

### Phase Control Buttons
- **End Launch Phase:** Transition to `PUBLIC_TRADING` (enables buyback)
- **Market Crash:** Simulates 30% sell pressure
- **Market Recovery:** New $5k buy to boost liquidity

---

## Burn Mechanism Tab

### When It Activates
Emergency burn is triggered automatically when:
- **Liquidity drops to ≤ 5%** of initial amount
- Example: Initial $10,000 → Alert when liquidity hits $500

### How to Claim
1. Enter **Tokens to Burn** (from your active balance)
2. See estimated liquidity share (calculated as `tokens ÷ total_supply × current_liquidity`)
3. Click **Claim Burn Share**

**What happens:**
- Tokens are burned (removed from circulation)
- Pro-rata share of remaining liquidity paid to holder
- Burned tokens tracked separately
- Circulating supply decreases
- Price recalculates

**Example:**
```
Emergency triggered: $500 liquidity remaining
You have: 1,000 tokens out of 7,000 total
You burn: 500 tokens (50% of your holdings)

Your share = (500 ÷ 7,000) × $500 = $35.71
→ You receive $35.71 in USD
→ Your 500 tokens burned forever
→ New circulating supply: 6,500 tokens
```

### Emergency Resolution
When liquidity recovers above 5% (through new buys or recovery events):
- Burn mechanism automatically deactivates
- Normal trading resumes
- Unclaimed burn shares remain reserved

---

## Events Tab

Shows complete transaction history:
- **Type:** BUY, SELL, BURN_SHARE, CREATOR_FORFEIT
- **Amount:** USD value transacted
- **Price:** Token price at time of transaction
- **Fee/Share:** 30% fee collected (buys) or liquidity share (burns)
- **Time:** Timestamp of transaction

Useful for auditing and understanding price movements.

---

## Holders Tab

Table showing all token holders:
- **User:** Investor ID
- **Active:** Tokens currently held
- **Burned:** Tokens burned in emergency mechanism
- **Avg Price:** Average buy-in price
- **Invested:** Total USD invested
- **Claimed:** Liquidity USD claimed from emergency burns

---

## Scenario Walkthrough: Complete Lifecycle

### Scenario: Successful Launch → Crisis → Recovery

**Phase 1: Creation**
```
✓ Create IP: $10,000 liquidity
  Status: LAUNCH_PHASE
  Price: $1/token
  Liquidity: 100%
```

**Phase 2: Early Adoption**
```
✓ investor_bob buys $2,000
  Price now: $7,000 ÷ 8,000 = $0.875/token
✓ investor_carol buys $3,000
  Price now: $7,000 ÷ 11,428 = $0.613/token
```

**Phase 3: Market Shift**
```
✓ Creator sells $2,000 of tokens
  → Fee: $600 to liquidity
  → Proceeds: $1,400
  → New liquidity: $7,600
  → New price: $7,600 ÷ 8,700 = $0.874/token
```

**Phase 4: Panic Sell (Crash)**
```
✓ Click "Market Crash (-30%)"
  → All holders sell 30% of positions
  → Large fees still collected
  → Circulating supply drops
  → BUT: If dumps happen too fast, liquidity could drop
```

**Phase 5: Emergency Triggered** ⚠️
```
✓ Liquidity hits $450 (4.5% threshold)
  → EMERGENCY BURN ACTIVATED
  → Burn Mechanism Tab becomes active
```

**Phase 6: Holders React**
```
✓ investor_bob burns 500 tokens
  → Receives: (500 ÷ total) × $450
✓ investor_carol burns 300 tokens
  → Receives: (300 ÷ total) × $450
✓ Remaining liquidity recovers above 5%
  → Emergency auto-resolves
```

**Phase 7: Recovery**
```
✓ New investor deposits $5,000
  → Large fee collected
  → Liquidity recovers to 60%+
  → Normal trading resumes
```

---

## Key Insights to Test

1. **Price Discovery:** Watch how price moves with supply/liquidity changes
2. **Fee Impact:** Notice how 30% fees on sells boost liquidity
3. **Emergency Mechanics:** Trigger burn when liquidity is low
4. **Holder Protection:** Early holders benefit from burn resolution
5. **Market Dynamics:** Observe crash vs. recovery scenarios

---

## Common Questions

**Q: Why does price go down when liquidity increases?**
A: Price = Liquidity ÷ Supply. If many people buy, supply increases faster than liquidity grows from fees.

**Q: Can I trade during emergency burn?**
A: YES. Normal trading continues. Burn is just an additional option for claiming liquidity.

**Q: What happens if no one claims their burn share?**
A: Liquidity stays locked for 30 days (simulated), then would return to platform.

**Q: Can price go negative?**
A: No. If liquidity reaches $0, trading would halt (not simulated as "invalid state").

**Q: Is the simulation deterministic?**
A: Yes! Same inputs produce same outputs. State is fully traceable.

---

## Tips for Testing

✓ Start with small amounts to understand mechanics  
✓ Use market crash to see emergency burn in action  
✓ Test extreme scenarios (large sells, rapid dumps)  
✓ Watch transaction history to trace state changes  
✓ Compare holder metrics before/after burns  
✓ Try different burn percentages in emergency  

---

## What This Validates

✅ 30% creator forfeit on launch  
✅ 50% minimum liquidity threshold  
✅ 5% emergency burn threshold  
✅ Pro-rata liquidity sharing  
✅ Price mechanics (Liquidity ÷ Supply)  
✅ Fee collection and distribution  
✅ State transitions and status changes  
✅ Multi-holder scenarios  
✅ Emergency resolution  

---

## Next Steps

After validating the simulation, this logic will be:
1. Implemented as backend API endpoints (Node.js / Python / Go)
2. Connected to database (PostgreSQL/MongoDB)
3. Integrated with frontend components
4. Deployed to production
5. Accessible to real creators and investors

---

**Ready to test?** Go to `/simulation` and click "Create New IP"!
