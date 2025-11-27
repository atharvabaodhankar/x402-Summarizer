import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { summarizeText } from "./gemini.js";
import dotenv from "dotenv";

dotenv.config();

const app = new Hono();

app.use("/*", cors());

app.get("/", (c) => {
  return c.json({ 
    status: "running",
    message: "x402 Summarizer API",
    endpoints: {
      health: "GET /",
      summarize: "POST /summarize"
    }
  });
});

// Simplified endpoint without x402 for now - will add payment later
app.post("/summarize", async (c) => {
  try {
    const body = await c.req.json();
    const { text } = body;

    if (!text) {
      return c.json({ error: "Text is required" }, 400);
    }

    if (!process.env.GEMINI_API_KEY) {
      return c.json({ 
        error: "Gemini API key not configured",
        summary: "This is a demo summary. Please configure GEMINI_API_KEY in .env to use AI summarization."
      }, 200);
    }

    const summary = await summarizeText(text);
    return c.json({ summary });
  } catch (error) {
    console.error("Summarization error:", error);
    return c.json({ error: "Failed to summarize text", details: error.message }, 500);
  }
});

const port = 3000;
console.log(`✅ Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
