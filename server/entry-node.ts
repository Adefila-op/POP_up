/**
 * Server Entry Point for Node.js (Supabase, Railway, etc.)
 * Not for Cloudflare Workers
 */

import { createApp } from "@/server/index";
import { initializeDatabase } from "@/server/db/client";

const PORT = process.env.PORT || 3000;

// Initialize with environment variables
const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  ENVIRONMENT: process.env.ENVIRONMENT || "development",
};

const app = createApp(env);

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${env.ENVIRONMENT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
