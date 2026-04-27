/**
 * Netlify Serverless API Handler
 * Catch-all function for /api/* routes
 */

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { createApp } from "../server/index";
import type { Env } from "../server/index";

const env: Env = {
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  ENVIRONMENT: process.env.ENVIRONMENT || "production",
};

const app = createApp(env);

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  try {
    // Extract the actual path by removing /.netlify/functions/catch-all prefix
    const path = event.rawUrl?.replace(/^[^?]+\/\.netlify\/functions\/catch-all/, "") || event.path || "/";
    
    const url = new URL(path, `https://${event.headers.host || "localhost"}`);
    
    // Parse request body
    let body: string | undefined;
    if (event.body && !["GET", "HEAD"].includes(event.httpMethod.toUpperCase())) {
      body = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString() : event.body;
    }

    const request = new Request(url, {
      method: event.httpMethod,
      headers: event.headers as Record<string, string>,
      body: body,
    });

    const response = await app.fetch(request, env);

    const responseBody = await response.text();
    const headers: Record<string, string> = {};
    
    response.headers.forEach((value: string, key: string) => {
      headers[key] = value;
    });

    return {
      statusCode: response.status,
      headers,
      body: responseBody,
      isBase64Encoded: false,
    };
  } catch (error) {
    console.error("API Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal Server Error", message: error instanceof Error ? error.message : "Unknown error" }),
    };
  }
};

export { handler };
