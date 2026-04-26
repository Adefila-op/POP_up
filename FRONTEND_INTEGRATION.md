# Frontend-Backend Integration Guide

## Overview

This guide explains how to connect the frontend React app to the backend API server.

## API Base URLs

### Development

```
http://localhost:8787
```

### Production (Cloudflare Workers)

```
https://creator-commerce-hub.{your-subdomain}.workers.dev
```

## Authentication Flow

### 1. Get Authentication Message

The user wallet needs to sign a message to authenticate:

```typescript
// In frontend
const generateAuthMessage = () => {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(7);
  return `creator-commerce-hub:${timestamp}:${nonce}`;
};
```

### 2. Sign Message with Wallet

```typescript
// Using ethers.js
import { BrowserProvider } from "ethers";

async function signMessage(message: string) {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const signature = await signer.signMessage(message);
  const walletAddress = await signer.getAddress();

  return { walletAddress, signature, message };
}
```

### 3. Login to Backend

```typescript
async function loginWithBackend(walletAddress: string, signature: string, message: string) {
  const response = await fetch("http://localhost:8787/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, signature, message }),
  });

  const data = await response.json();
  if (data.success) {
    localStorage.setItem("token", data.data.token);
    return data.data.user;
  }
  throw new Error(data.error.message);
}
```

### 4. Use Token in Requests

```typescript
const apiCall = async (endpoint: string, method = "GET", body?: any) => {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`http://localhost:8787${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.json();
};
```

## Updating Frontend Services

### User Service Integration

Replace the mock user service with actual API calls:

```typescript
// src/lib/api-client.ts (new file)
import type { User, IP, Transaction } from "@/server/db/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

const apiCall = async <T>(endpoint: string, method = "GET", body?: any): Promise<T> => {
  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "API request failed");
  }

  return data.data;
};

// User endpoints
export const userAPI = {
  login: (walletAddress: string, signature: string, message: string) =>
    apiCall<{ user: User; token: string }>("/api/auth/login", "POST", {
      walletAddress,
      signature,
      message,
    }),

  getProfile: () => apiCall<User>("/api/auth/me"),

  updateProfile: (updates: Partial<User>) => apiCall<User>("/api/auth/me", "PUT", updates),

  deposit: (amount: number) => apiCall<User>("/api/users/deposit", "POST", { amount }),

  withdraw: (amount: number) => apiCall<User>("/api/users/withdraw", "POST", { amount }),
};

// IP endpoints
export const ipAPI = {
  create: (data: {
    title: string;
    description?: string;
    category: string;
    coverImageUrl?: string;
    initialLiquidityUSD: number;
    launchDurationDays: number;
  }) => apiCall<IP>("/api/ips", "POST", data),

  getById: (id: string) => apiCall<IP>(`/api/ips/${id}`),

  list: (status?: string) => {
    const query = status ? `?status=${status}` : "";
    return apiCall<IP[]>(`/api/ips${query}`);
  },

  getByCreator: (creatorId: string) => apiCall<IP[]>(`/api/creators/${creatorId}/ips`),

  getHolders: (ipId: string) => apiCall(`/api/ips/${ipId}/holders`),

  getTransactions: (ipId: string) => apiCall<Transaction[]>(`/api/ips/${ipId}/transactions`),

  getLiquidityEvents: (ipId: string) => apiCall(`/api/ips/${ipId}/liquidity-events`),
};

// Transaction endpoints
export const transactionAPI = {
  buy: (ipId: string, amountUSD: number) =>
    apiCall<Transaction>("/api/transactions/buy", "POST", {
      ipId,
      amountUSD,
    }),

  sell: (ipId: string, amountTokens: number) =>
    apiCall<Transaction>("/api/transactions/sell", "POST", {
      ipId,
      amountTokens,
    }),

  getById: (id: string) => apiCall<Transaction>(`/api/transactions/${id}`),

  getUserTransactions: (userId: string) =>
    apiCall<Transaction[]>(`/api/users/${userId}/transactions`),

  claimBurnShare: (ipId: string, amountTokens: number) =>
    apiCall("/api/transactions/burn-claim", "POST", {
      ipId,
      amountTokens,
    }),
};
```

### Update App State

Modify `src/lib/app-state.tsx` to use real API:

```typescript
// src/lib/app-state.tsx
import { userAPI, ipAPI, transactionAPI } from "./api-client";

export class AppStateProvider {
  async connectWallet() {
    // Get signer and wallet address
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Generate and sign message
    const message = `creator-commerce-hub:${Date.now()}:${Math.random().toString(36).substring(7)}`;
    const signature = await signer.signMessage(message);

    // Login to backend
    const { user, token } = await userAPI.login(address, signature, message);
    localStorage.setItem("auth_token", token);

    this.updateState("walletConnected", true);
    return user;
  }

  async publishContent(content: any) {
    // Call backend to create IP
    const ip = await ipAPI.create({
      title: content.title,
      description: content.description,
      category: content.category,
      initialLiquidityUSD: content.initialLiquidity,
      launchDurationDays: 14,
    });

    return ip;
  }

  async purchaseContent(ipId: string, amountUSD: number) {
    // Execute buy transaction
    const transaction = await transactionAPI.buy(ipId, amountUSD);

    // Update state
    const holdings = await ipAPI.getHolders(ipId);
    this.updateState("ipHoldings", holdings);

    return transaction;
  }

  async sellToken(ipId: string, amountTokens: number) {
    // Execute sell transaction
    const transaction = await transactionAPI.sell(ipId, amountTokens);

    // Update state
    const ip = await ipAPI.getById(ipId);
    this.updateState("currentPrice", ip.current_price);

    return transaction;
  }
}
```

### Update Components

Example: Update portfolio component to fetch real data:

```typescript
// src/routes/portfolio.tsx
import { useQuery } from "@tanstack/react-query";
import { userAPI, ipAPI, transactionAPI } from "@/lib/api-client";

export function Portfolio() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => userAPI.getProfile(),
  });

  const { data: createdIPs } = useQuery({
    queryKey: ["user", user?.id, "ips"],
    queryFn: () => (user ? ipAPI.getByCreator(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  const { data: transactions } = useQuery({
    queryKey: ["user", user?.id, "transactions"],
    queryFn: () => (user ? transactionAPI.getUserTransactions(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  return (
    <div>
      <h1>Portfolio</h1>
      <p>Cash Balance: ${(user?.cash_balance || 0) / 100}</p>

      <h2>Created IPs</h2>
      {createdIPs?.map((ip) => (
        <div key={ip.id}>
          <h3>{ip.title}</h3>
          <p>Status: {ip.status}</p>
          <p>Current Price: ${ip.current_price / 100}</p>
        </div>
      ))}

      <h2>Transactions</h2>
      {transactions?.map((tx) => (
        <div key={tx.id}>
          <p>{tx.type}: {tx.amount_tokens} tokens @ ${tx.price_per_token / 100}</p>
          <p>Date: {new Date(tx.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

## Environment Variables

Create `.env` file:

```env
# Backend API
VITE_API_URL=http://localhost:8787

# Wallet/Web3
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_CHAIN_ID=11155111  # Sepolia testnet
```

## Testing Integration

1. Start backend locally:

```bash
wrangler dev
```

2. Start frontend:

```bash
npm run dev
```

3. Test flow:
   - Connect wallet
   - Create IP
   - Buy tokens
   - Sell tokens
   - Check portfolio

## Common Issues

### CORS Errors

Backend is configured with CORS. If still having issues, check:

- Backend running on correct port (8787)
- VITE_API_URL matches backend URL
- Browser console for specific error

### Authentication Failing

- Ensure wallet is connected
- Message format correct: `creator-commerce-hub:{timestamp}:{nonce}`
- Token stored in localStorage
- Token included in Authorization header

### API Returns 404

- Check endpoint path matches exactly
- Verify resource IDs are correct
- Check HTTP method (GET vs POST)

## Performance Optimization

### Add Request Caching

```typescript
import { useQuery } from "@tanstack/react-query";

// Automatically cached with React Query
const { data } = useQuery({
  queryKey: ["ip", ipId],
  queryFn: () => ipAPI.getById(ipId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Implement Request Batching

```typescript
// Group multiple requests
const [ips, holders, transactions] = await Promise.all([
  ipAPI.list(),
  ipAPI.getHolders(ipId),
  ipAPI.getTransactions(ipId),
]);
```

## Migration Checklist

- [ ] Update `.env` files with API URL
- [ ] Create `api-client.ts` file
- [ ] Update `app-state.tsx` to use API
- [ ] Update components to use useQuery
- [ ] Remove mock data from `data.ts`
- [ ] Test authentication flow
- [ ] Test create IP flow
- [ ] Test buy/sell flows
- [ ] Test portfolio/holdings
- [ ] Deploy backend to Cloudflare
- [ ] Update frontend API_URL for production
