/**
 * Vercel Serverless API Handler
 * Exports Hono app for Vercel's /api routes
 */

import { createApp } from '../server/index';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  ENVIRONMENT: process.env.ENVIRONMENT || 'production',
};

const app = createApp(env);

export default async (req: VercelRequest, res: VercelResponse) => {
  // Convert Vercel request to Web API Request
  const url = new URL(req.url || '/', `https://${req.headers.host}`);
  const request = new Request(url, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: ['GET', 'HEAD'].includes(req.method?.toUpperCase() || 'GET')
      ? undefined
      : JSON.stringify(req.body),
  });

  try {
    // Handle with Hono app
    const response = await app.fetch(request, env, { waitUntil: (p) => p });
    
    // Copy response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Set status and send body
    res.status(response.status);
    res.send(await response.text());
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
