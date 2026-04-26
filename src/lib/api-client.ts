/**
 * API Client - Centralized API communication layer
 * Handles all requests to backend with authentication
 */

export interface User {
  id: string;
  wallet_address: string;
  username: string;
  email?: string;
  is_creator: boolean;
  cash_balance: number;
  profile_picture_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface IP {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  category: string;
  cover_image_url?: string;
  status: "CREATED" | "LAUNCH_PHASE" | "PUBLIC_TRADING" | "MATURE";
  current_price: number;
  floor_price: number;
  total_supply: number;
  current_liquidity: number;
  circulating_supply: number;
  burned_supply: number;
  initial_liquidity: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  type: "BUY" | "SELL" | "BURN_SHARE";
  status: "PENDING" | "COMPLETED" | "FAILED";
  ip_id: string;
  buyer_id?: string;
  seller_id?: string;
  amount_tokens: number;
  price_per_token: number;
  amount_value: number;
  seller_proceeds: number;
  created_at: string;
  completed_at?: string;
}

export interface TokenHolder {
  id: string;
  ip_id: string;
  user_id: string;
  active_balance: number;
  burned_balance: number;
  average_buy_price: number;
}

type ApiRequestBody = Record<string, unknown>;

export interface BurnClaim {
  id: string;
  ip_id: string;
  user_id: string;
  liquidity_event_id: string;
  tokens_burned: number;
  liquidity_share: number;
  claim_status: "PENDING" | "COMPLETED" | "CLAIMED";
  created_at: string;
  updated_at: string;
}

// API Base URL configuration
const API_BASE = (() => {
  if (typeof window === "undefined") {
    // Server-side rendering
    return import.meta.env.VITE_API_URL || "";
  }

  // Always prefer explicit VITE_API_URL environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl;
  }

  // Local development fallback
  if (window.location.hostname === "localhost") {
    return "http://localhost:3000";
  }

  // Production: must have VITE_API_URL set or requests will fail
  return "";
})();

/**
 * Generic API call wrapper with timeout and error handling
 */
async function apiCall<T>(endpoint: string, method = "GET", body?: ApiRequestBody): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  console.log(`[API] ${method} ${url}`);

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle response based on content type
      const contentType = response.headers.get("content-type");
      let data: any;

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMessage = 
          data?.error?.message || 
          data?.message || 
          `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      return data.data || data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error("Network error: Unable to connect to server. Check your connection and try again.");
      }
      
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Request timeout: The server took too long to respond. Please try again.");
      }

      throw error;
    }
  } catch (error) {
    console.error(`[API Error] ${method} ${endpoint}:`, error);
    throw error;
  }
}

/**
 * User/Authentication API
 */
export const authAPI = {
  /**
   * Login with wallet signature
   */
  login: async (
    walletAddress: string,
    message: string,
    signature: string,
  ): Promise<{ user: User; token: string }> => {
    return apiCall("/api/auth/login", "POST", {
      walletAddress,
      message,
      signature,
    });
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    return apiCall("/api/auth/me", "GET");
  },

  /**
   * Update current user profile
   */
  updateProfile: async (updates: Partial<User>): Promise<User> => {
    return apiCall("/api/auth/me", "PUT", updates);
  },
};

/**
 * User API
 */
export const userAPI = {
  /**
   * Get user by ID
   */
  getById: async (id: string): Promise<User> => {
    return apiCall(`/api/users/${id}`, "GET");
  },

  /**
   * Deposit cash (test endpoint)
   */
  deposit: async (amount: number): Promise<User> => {
    return apiCall("/api/users/deposit", "POST", { amount });
  },

  /**
   * Withdraw cash (test endpoint)
   */
  withdraw: async (amount: number): Promise<User> => {
    return apiCall("/api/users/withdraw", "POST", { amount });
  },
};

/**
 * IP Asset API
 */
export const ipAPI = {
  /**
   * Create new IP asset
   */
  create: async (data: {
    title: string;
    description?: string;
    category?: string;
    coverImageUrl?: string;
    initialLiquidityUSD: number;
    launchDurationDays: number;
  }): Promise<IP> => {
    return apiCall("/api/ips", "POST", data);
  },

  /**
   * Get IP by ID
   */
  getById: async (id: string): Promise<IP> => {
    return apiCall(`/api/ips/${id}`, "GET");
  },

  /**
   * List all IPs
   */
  list: async (status?: string): Promise<IP[]> => {
    const query = status ? `?status=${status}` : "";
    return apiCall(`/api/ips${query}`, "GET");
  },

  /**
   * Get IPs by creator
   */
  getByCreator: async (creatorId: string): Promise<IP[]> => {
    return apiCall(`/api/creators/${creatorId}/ips`, "GET");
  },

  /**
   * Get token holders for an IP
   */
  getHolders: async (ipId: string): Promise<TokenHolder[]> => {
    return apiCall(`/api/ips/${ipId}/holders`, "GET");
  },

  /**
   * Get transactions for an IP
   */
  getTransactions: async (ipId: string): Promise<Transaction[]> => {
    return apiCall(`/api/ips/${ipId}/transactions`, "GET");
  },
};

/**
 * Transaction/Trading API
 */
export const transactionAPI = {
  /**
   * Buy tokens
   */
  buy: async (ipId: string, amountUSD: number): Promise<Transaction> => {
    return apiCall("/api/transactions/buy", "POST", {
      ipId,
      amountUSD,
    });
  },

  /**
   * Sell tokens
   */
  sell: async (ipId: string, amountTokens: number): Promise<Transaction> => {
    return apiCall("/api/transactions/sell", "POST", {
      ipId,
      amountTokens,
    });
  },

  /**
   * Get transaction by ID
   */
  getById: async (id: string): Promise<Transaction> => {
    return apiCall(`/api/transactions/${id}`, "GET");
  },

  /**
   * Get user's transactions
   */
  getUserTransactions: async (userId: string): Promise<Transaction[]> => {
    return apiCall(`/api/users/${userId}/transactions`, "GET");
  },

  /**
   * Claim burn share
   */
  claimBurnShare: async (ipId: string, amountTokens: number): Promise<BurnClaim> => {
    return apiCall("/api/transactions/burn-claim", "POST", {
      ipId,
      amountTokens,
    });
  },
};

/**
 * Health check
 */
export const healthAPI = {
  check: async (): Promise<{ status: string }> => {
    return apiCall("/health", "GET");
  },
};

export default {
  authAPI,
  userAPI,
  ipAPI,
  transactionAPI,
  healthAPI,
};
