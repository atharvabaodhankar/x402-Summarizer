import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { paymentMiddleware } from "x402-hono";
import { summarizeText } from "./gemini.js";
import dotenv from "dotenv";

dotenv.config();

const app = new Hono();

app.use("/*", cors());

app.get("/", (c) => {
  return c.text("x402 Summarizer API is running!");
});

// x402 Middleware Configuration
const x402Config = {
  walletAddress: process.env.SERVER_ADDRESS || "sei1qj9pp369755495deqj9pp369755495deqj9pp3", 
  price: process.env.PRICE_USD || "0.01",
  network: "sei-testnet",
  facilitatorUrl: process.env.FACILITATOR_URL || "https://facilitator.x402.org",
};

app.post(
  "/summarize",
  // paymentMiddleware(x402Config),
  async (c) => {
    try {
      const body = await c.req.json();
      const { text } = body;

      if (!text) {
        return c.json({ error: "Text is required" }, 400);
      }

      const summary = await summarizeText(text);
      return c.json({ summary });
    } catch (error) {
      console.error("Summarization error:", error);
      return c.json({ error: "Failed to summarize text" }, 500);
    }
  }
);

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
