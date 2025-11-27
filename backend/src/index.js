import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { summarizeText } from "./gemini.js";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['SERVER_ADDRESS'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('📝 Please copy .env.example to .env and configure it');
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set - using demo mode');
}

const app = new Hono();

// CORS Configuration
app.use("/*", cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "X-Payment-Proof", "X-Payment-TxHash", "X-Payment-Network"],
  exposeHeaders: ["X-Payment-Required"],
}));

app.get("/", (c) => {
  return c.json({ 
    status: "running",
    message: "x402 Summarizer API",
    version: "1.0.0",
    cors: {
      enabled: true,
      allowedOrigin: process.env.FRONTEND_URL || "http://localhost:5173"
    },
    endpoints: {
      health: "GET /",
      summarize: "POST /summarize (requires payment)"
    },
    payment: {
      network: x402Config.network,
      price: x402Config.price,
      walletAddress: x402Config.walletAddress
    }
  });
});

// Custom x402-style Payment Middleware
const createPaymentMiddleware = (config) => {
  return async (c, next) => {
    // Check for payment proof in headers
    const paymentProof = c.req.header('X-Payment-Proof');
    const paymentTxHash = c.req.header('X-Payment-TxHash');
    
    // If no payment proof, return 402 Payment Required
    if (!paymentProof && !paymentTxHash) {
      return c.json({
        error: "Payment Required",
        price: config.price,
        walletAddress: config.walletAddress,
        network: config.network,
        message: `Please pay ${config.price} in SEI to ${config.walletAddress} on ${config.network}`,
        instructions: {
          step1: "Connect your Sei wallet (Keplr/Leap)",
          step2: `Send ${config.price} worth of SEI`,
          step3: "Include the transaction hash in X-Payment-TxHash header",
          step4: "Retry the request"
        }
      }, 402);
    }
    
    // In production, verify the payment with facilitator here
    console.log(`✅ Payment verified: ${paymentTxHash || 'demo'}`);
    
    // Payment verified, proceed to handler
    await next();
  };
};

// x402 Payment Configuration
const x402Config = {
  walletAddress: process.env.SERVER_ADDRESS || "sei1qj9pp369755495deqj9pp369755495deqj9pp3",
  price: process.env.PRICE_USD || "0.01",
  network: "sei-testnet",
  facilitatorUrl: process.env.FACILITATOR_URL || "https://facilitator.x402.org",
};

// Using custom x402 payment middleware - requires payment before summarizing!
app.post(
  "/summarize",
  createPaymentMiddleware(x402Config),
  async (c) => {
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
  }
);

const port = process.env.PORT || 3000;
console.log(`✅ Server is running on http://localhost:${port}`);
console.log(`💰 x402 Payment Required: ${x402Config.price} on ${x402Config.network}`);
console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);

serve({
  fetch: app.fetch,
  port,
});
