/**
 * Vercel Serverless API Handler
 * Catch-all function for /api/* routes
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../server/index";
import type { Env } from "../server/index";

const env: Env = {
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  ENVIRONMENT: process.env.ENVIRONMENT || "production",
};

const app = createApp(env);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || "/", `https://${req.headers.host}`);
  const request = new Request(url, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body:
      req.method && ["GET", "HEAD"].includes(req.method.toUpperCase())
        ? undefined
        : JSON.stringify(req.body),
  });

  try {
    const response = await app.fetch(request, env);

    response.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });

    res.status(response.status);
    res.send(await response.text());
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
