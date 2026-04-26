# Smart Contracts - Creator Commerce Hub

This directory contains the Solidity smart contracts for on-chain IP tokenization, trading, and creator verification on **Base/Sepolia**.

## Contracts Overview

### 1. **IPTokenization.sol** - ERC-20 Token

Represents fractional ownership of a creator's intellectual property.

**Key Features:**

- ERC-20 standard token (burnable)
- IP metadata storage (title, description, creator)
- Automatic status transitions (CREATED → LAUNCH_PHASE → PUBLIC_TRADING → MATURE)
- Liquidity pool management
- Emergency burn mechanism for failing IPs

**Status Timeline:**

```
CREATED (0-1 day) → LAUNCH_PHASE (1-14 days) → PUBLIC_TRADING (14-44 days) → MATURE (44+ days)
```

**Functions:**

- `updateStatus()` - Update IP status based on elapsed time
- `getPricePerToken()` - Calculate current token price
- `addLiquidity(usdAmount)` - Add emergency liquidity
- `emergencyBurn(tokensToBurn)` - Pro-rata distribution during crisis

---

### 2. **IPMarketplace.sol** - Automated Market Maker (AMM)

Handles all trading of IP tokens using constant product formula (x\*y=k).

**Key Features:**

- Create trading pools for each IP token
- Buy/sell operations with 0.3% fee
- On-chain transaction recording for full audit trail
- Constant product formula: `(x + dx) × (y - dy) = x × y`

**Trading Flow:**

```
User sends USD → Marketplace calculates tokens owed
Tokens = (USD * 0.997) * TokenReserve / (USDReserve + (USD * 0.997))
30 basis points (0.3%) collected as fee
Transaction recorded on-chain permanently
```

**Functions:**

- `createPool(ipToken, creator, initialTokens, initialUSD)` - Initialize trading pool
- `buyTokens(ipToken, usdAmount)` - Buy IP tokens
- `sellTokens(ipToken, tokenAmount)` - Sell IP tokens
- `calculateOutputAmount(input, inputReserve, outputReserve)` - Price calculation
- `getUserTransactions(user)` - Get on-chain transaction history

---

### 3. **CreatorRegistry.sol** - ERC-721 NFT

On-chain verification and profile storage for creators.

**Key Features:**

- ERC-721 NFT badge (minted once per creator)
- Creator profile metadata (username, bio, profile image)
- IP launch tracking
- Creator status (active/inactive)
- Username uniqueness enforcement

**Creator Profile Struct:**

```solidity
{
  walletAddress,     // Creator's wallet
  username,          // Unique on-chain username
  bio,              // Profile bio
  profileImageURI,  // IPFS/HTTP image URL
  createdAt,        // Registration timestamp
  ipLaunchCount,    // Total IPs launched
  isActive          // Creator status
}
```

**Functions:**

- `mintCreator(address, username, bio, profileImageURI)` - Register as creator
- `updateProfile(address, newBio, newImage)` - Update profile
- `recordIPLaunch(creatorAddress)` - Increment IP count
- `getCreator(address)` - Fetch profile
- `isCreator(address)` - Check creator status
- `deactivateCreator(address)` - Pause account

---

## Deployment

### Prerequisites

```bash
# Install dependencies
npm install

# Set up environment variables (.env.contracts)
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### Deploy to Base/Sepolia

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to Base Sepolia testnet (recommended for testing)
npx hardhat run scripts/deploy.js --network baseSepolia

# Deploy to Base mainnet (production)
npx hardhat run scripts/deploy.js --network base
```

### Save Deployment Info

After deployment, update `.env.local`:

```
VITE_CREATOR_REGISTRY_ADDRESS=0x...
VITE_IP_MARKETPLACE_ADDRESS=0x...
VITE_BLOCKCHAIN_NETWORK=baseSepolia
```

---

## Integration with Frontend

### 1. Connect to Contracts

```typescript
import blockchain from "@/lib/blockchain";

// Get user's wallet
const userAddress = await blockchain.connectWallet();

// Switch to Base Sepolia (84532)
await blockchain.switchNetwork(84532);
```

### 2. Mint Creator NFT

```typescript
const txHash = await blockchain.mintCreatorNFT(
  userAddress,
  "username",
  "My bio",
  "https://ipfs.io/...",
);
```

### 3. Buy IP Tokens (On-Chain)

```typescript
const txHash = await blockchain.buyIPTokens(
  ipTokenAddress,
  100, // 100 USD worth
);
// Transaction recorded on-chain automatically
```

### 4. Sell IP Tokens (On-Chain)

```typescript
const txHash = await blockchain.sellIPTokens(
  ipTokenAddress,
  50, // Sell 50 tokens
);
// Transaction recorded on-chain automatically
```

### 5. View On-Chain Transaction History

```typescript
const transactions = await blockchain.getUserTransactionHistory(userAddress);
// Returns array of all buys/sells recorded on blockchain
```

---

## On-Chain Transaction Recording

Every trading operation is permanently recorded on-chain:

```solidity
struct Transaction {
  address trader,       // Who made the trade
  address ipToken,      // Which IP was traded
  bool isBuy,           // Buy (true) or Sell (false)
  uint256 tokenAmount,  // Tokens involved
  uint256 usdAmount,    // USD value
  uint256 feeAmount,    // 0.3% fee
  uint256 timestamp     // When it happened
}
```

**View History:**

```typescript
// Get all user's transactions from blockchain
const txs = await blockchain.getUserTransactionHistory(userAddress);

txs.forEach((tx) => {
  console.log(`${tx.isBuy ? "BUY" : "SELL"} ${tx.tokenAmount} tokens for $${tx.usdAmount}`);
  console.log(`Fee: $${tx.feeAmount} | Timestamp: ${new Date(tx.timestamp * 1000)}`);
});
```

---

## Gas Costs (Base/Sepolia)

| Operation           | Est. Gas | Cost (Base) |
| ------------------- | -------- | ----------- |
| Mint Creator NFT    | 150,000  | $0.01-0.05  |
| Create Trading Pool | 200,000  | $0.01-0.08  |
| Buy IP Tokens       | 100,000  | $0.01-0.03  |
| Sell IP Tokens      | 100,000  | $0.01-0.03  |
| Record Transaction  | Included | Included    |

---

## Testing

```bash
# Run Hardhat tests
npx hardhat test

# Test on local network
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

---

## Security Considerations

1. **ReentrancyGuard** - Protects against reentrancy attacks in trading
2. **Access Control** - Only owner can create pools and mint creators
3. **Input Validation** - All amounts and addresses verified
4. **Emergency Pause** - Can deactivate creators if compromised
5. **Immutable History** - On-chain transactions can't be modified

---

## Future Enhancements

- [ ] ERC-4626 Vault for staking
- [ ] Governance token (DAO)
- [ ] Cross-chain bridging
- [ ] Liquidity mining rewards
- [ ] Options/derivatives on IP tokens
- [ ] Escrow for large trades

---

## Network Details

### Base Sepolia (Recommended for Testing)

- **Chain ID:** 84532
- **RPC:** https://sepolia.base.org
- **Block Explorer:** https://sepolia.basescan.org
- **Faucet:** https://faucet.circle.com

### Sepolia

- **Chain ID:** 11155111
- **RPC:** https://sepolia.infura.io
- **Block Explorer:** https://sepolia.etherscan.io
- **Faucet:** https://www.sepoliaether.com

### Base Mainnet

- **Chain ID:** 8453
- **RPC:** https://base.infura.io
- **Block Explorer:** https://basescan.org

---

## Support

For issues with smart contract deployment or integration:

1. Check deployment logs in `deployments/` folder
2. Verify contract addresses in `.env.local`
3. Test on Base Sepolia testnet first
4. Review transaction history at https://sepolia.basescan.org
