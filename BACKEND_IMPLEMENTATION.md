# Creator Commerce Hub - Backend Implementation Guide

## Overview

This backend implements the complete Creator Commerce Hub system with:

- IP (Intellectual Property) asset management
- Token trading and marketplace
- Liquidity management and emergency burn mechanism
- User authentication and wallet integration
- Transaction processing and history

## Architecture

### Stack

- **Framework**: Hono (lightweight HTTP framework)
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Workers
- **ORM**: Drizzle ORM
- **Language**: TypeScript

### Directory Structure

```
server/
├── db/
│   ├── types.ts           # Database type definitions
│   ├── schema.ts          # Drizzle ORM schema
│   ├── client.ts          # Database initialization
│   └── migrations.ts      # SQL migrations
├── services/
│   ├── user-service.ts    # User management
│   ├── ip-service.ts      # IP asset management
│   ├── transaction-service.ts  # Trading logic
│   └── liquidity-service.ts    # Liquidity & burn mechanics
├── routes/
│   ├── user-routes.ts     # User endpoints
│   ├── ip-routes.ts       # IP endpoints
│   └── transaction-routes.ts   # Transaction endpoints
├── middleware/
│   └── auth.ts            # Authentication & authorization
├── utils/
│   ├── validation.ts      # Input validation
│   ├── errors.ts          # Error handling
│   └── id-generator.ts    # ID generation
└── index.ts               # Main server entry point
```

## Core Services

### 1. User Service (`user-service.ts`)

Manages user accounts and wallet connections.

**Key Methods:**

- `getOrCreateUser()` - Create or retrieve user by wallet
- `getUserById()` - Get user profile
- `updateUser()` - Update profile information
- `updateCashBalance()` - Add/subtract cash balance

### 2. IP Service (`ip-service.ts`)

Manages IP asset lifecycle and status transitions.

**Key Methods:**

- `createIP()` - Create new IP with initial liquidity
- `getIPById()` - Get IP details
- `updateIPStatus()` - Transition between states
- `autoTransitionStatus()` - Auto-advance based on time/conditions

**IP Status Flow:**

```
CREATED → LAUNCH_PHASE → PUBLIC_TRADING → MATURE
```

### 3. Transaction Service (`transaction-service.ts`)

Handles all trading operations with fee calculation and validation.

**Key Methods:**

- `executeBuy()` - Process token purchase
- `executeSell()` - Process token sale with 30% fee
- `getTokenHolder()` - Get user's holdings
- `getIPTokenHolders()` - Get all holders for IP

**Buy Flow:**

1. Validate IP is trading
2. Check minimum liquidity (50%)
3. Calculate tokens to receive
4. Update holder balance
5. Update IP supply and price

**Sell Flow:**

1. Validate seller has tokens
2. Calculate sale value and fees (70% seller, 30% to liquidity)
3. Update holder balance
4. Update IP liquidity and price
5. Check emergency burn threshold (5%)

### 4. Liquidity Service (`liquidity-service.ts`)

Manages liquidity events and emergency burn mechanism.

**Key Methods:**

- `triggerEmergencyBurn()` - Activate burn when liquidity ≤ 5%
- `claimBurnShare()` - Holder burns tokens to claim liquidity
- `resolveEmergencyBurn()` - Finalize burn distribution
- `recordFeeCollection()` - Track fee revenue

**Emergency Burn Mechanism:**

- Triggered when liquidity falls to ≤5% of initial
- Holders can burn tokens to claim pro-rata share
- Preserves value for remaining investors

## API Endpoints

### Authentication

```
POST /api/auth/login
- Body: { walletAddress, signature, message }
- Returns: { user, token }

GET /api/auth/me
- Headers: Authorization: Bearer {token}
- Returns: { user }

PUT /api/auth/me
- Headers: Authorization: Bearer {token}
- Body: { username?, email?, profilePictureUrl?, bio?, isCreator? }
- Returns: { user }
```

### User Management

```
GET /api/users/:id
- Returns: { user }

POST /api/users/deposit
- Headers: Authorization: Bearer {token}
- Body: { amount }
- Returns: { user }

POST /api/users/withdraw
- Headers: Authorization: Bearer {token}
- Body: { amount }
- Returns: { user }
```

### IP Management

```
POST /api/ips
- Headers: Authorization: Bearer {token}
- Body: {
    title, description?, category, coverImageUrl?,
    initialLiquidityUSD, launchDurationDays
  }
- Returns: { ip }

GET /api/ips/:id
- Returns: { ip }

GET /api/ips
- Query: status? (CREATED|LAUNCH_PHASE|PUBLIC_TRADING|MATURE)
- Returns: { ips[] }

GET /api/creators/:creatorId/ips
- Returns: { ips[] }

GET /api/ips/:id/holders
- Returns: { holders[] }

GET /api/ips/:id/transactions
- Returns: { transactions[] }

GET /api/ips/:id/liquidity-events
- Returns: { liquidityEvents[] }
```

### Trading

```
POST /api/transactions/buy
- Headers: Authorization: Bearer {token}
- Body: { ipId, amountUSD }
- Returns: { transaction }

POST /api/transactions/sell
- Headers: Authorization: Bearer {token}
- Body: { ipId, amountTokens }
- Returns: { transaction }

GET /api/transactions/:id
- Returns: { transaction }

GET /api/users/:userId/transactions
- Returns: { transactions[] }

POST /api/transactions/burn-claim
- Headers: Authorization: Bearer {token}
- Body: { ipId, amountTokens }
- Returns: { burnClaim }
```

## Database Schema

### Key Tables

- **users**: User accounts and wallets
- **ips**: IP assets with liquidity tracking
- **token_holders**: User holdings per IP
- **transactions**: Buy/sell/burn history
- **liquidity_events**: Fee and burn events
- **burn_claims**: Individual burn claim records

### Data Types

- **USD amounts**: Stored in cents (integer)
- **Token amounts**: Stored as decimal (float)
- **Prices**: Per-token price in USD cents (float)

## Deployment

### 1. Setup Cloudflare D1 Database

```bash
# Install Wrangler CLI
npm install -g wrangler

# Create D1 database
wrangler d1 create creator-commerce-hub

# Run migrations
wrangler d1 execute creator-commerce-hub --file server/db/migrations.ts
```

### 2. Update wrangler.jsonc

```json
{
  "name": "creator-commerce-hub",
  "main": "server/index.ts",
  "compatibility_date": "2025-09-24",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "creator-commerce-hub",
      "database_id": "your-database-id"
    }
  ]
}
```

### 3. Build and Deploy

```bash
# Development
npm run dev

# Build
npm run build

# Deploy to Cloudflare
wrangler deploy
```

## Error Handling

The API uses standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field validation failed",
    "details": { "field": "reason" }
  },
  "statusCode": 400
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `INSUFFICIENT_FUNDS` - Not enough cash balance
- `INSUFFICIENT_BALANCE` - Not enough tokens
- `IP_NOT_FOUND` - IP doesn't exist
- `INVALID_STATE` - IP not in correct status
- `TRANSACTION_FAILED` - Transaction execution failed

## Security Considerations

### Authentication

- Uses EIP-191 message signing for wallet verification
- Store token in secure HTTP-only cookies (recommended)
- Validate signatures server-side before processing

### Authorization

- Users can only modify their own resources
- Creators can only modify their own IPs
- Enforce ownership checks in all mutations

### Input Validation

- Validate all inputs server-side
- Check numeric bounds and types
- Sanitize string inputs
- Prevent SQL injection (using Drizzle ORM)

### Audit Trail

- Log all transactions
- Track fee distributions
- Monitor emergency burn events
- Maintain transaction history

## Testing

### Manual API Testing

```bash
# Login with wallet
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234...",
    "message": "creator-commerce-hub:1234567890:nonce123",
    "signature": "0xsig..."
  }'

# Create IP
curl -X POST http://localhost:8787/api/ips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "title": "My NFT",
    "category": "Art",
    "initialLiquidityUSD": 1000,
    "launchDurationDays": 14
  }'
```

## Monitoring

### Key Metrics to Track

- Active users and creators
- IP assets created/trading
- Daily trading volume
- Fee revenue collected
- Emergency burn activations
- Average token price per IP

### Performance Targets

- API response time: < 200ms
- Database query time: < 100ms
- Transaction processing: < 1s
- Concurrent connections: Cloudflare Workers handles auto-scaling

## Future Enhancements

1. **Payment Integration**
   - Stripe for fiat deposits/withdrawals
   - Crypto payment support (USDC/USDT)
   - Invoice generation

2. **Smart Contracts**
   - Deploy buyback contract on blockchain
   - Automated liquidity distribution
   - On-chain transaction verification

3. **Advanced Features**
   - Multiple creator support (splits)
   - Royalty tracking
   - Secondary marketplace
   - Fractional IP ownership

4. **Analytics**
   - Trading analytics dashboard
   - Price history charts
   - Portfolio performance tracking
   - Creator insights

## Support & Documentation

- Backend API Documentation: This file
- Frontend Integration Guide: See frontend README
- Database Schema: server/db/schema.ts
- Type Definitions: server/db/types.ts
