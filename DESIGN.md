Here is the **full DESIGN.md** — clean, complete, and ready for you to copy.

---

# **DESIGN.md – x402 Summarizer (Sei Testnet)**

## **1. Overview**

x402 Summarizer is a pay-per-use AI text summarization web application.

* Users paste text into a React frontend.
* A paid API endpoint (`POST /summarize`) returns a summary generated using **Gemini 2.5 Flash**.
* Access is protected using the **x402** payment protocol.
* Payments occur on the **Sei Testnet**, using **SEI tokens**.
* The backend uses **Hono** + `x402-hono` middleware.
* The frontend uses an x402-aware fetch wrapper that handles:

  * 402 responses
  * Wallet payment flow
  * Automatic retry with proof

This project is built to be:

* Simple to implement
* Useful as a real x402 demo project
* Perfect for portfolio / dev showcase

---

## **2. Goals and Non-Goals**

### **Goals**

* Implement a real working x402 pay-per-use flow.
* Demonstrate payments on Sei Testnet.
* Provide a clean architecture using React + Hono.
* Summarize text using Gemini 2.5 Flash.
* Keep system simple and production-readable.

### **Non-Goals**

* No user login or accounts.
* No subscriptions.
* No complex pricing models.
* No custom smart contracts (use facilitator instead).
* No database-required features in v1.

---

## **3. High-Level Architecture**

### **Components**

#### **1. Frontend (React)**

* Input box for text.
* Button to request summary.
* Wallet connection (OKX, Leap, Keplr).
* Uses an x402-compatible fetch wrapper:

  * Detects 402 Payment Required.
  * Prompts wallet for SEI payment.
  * Retries request with proof.

#### **2. Backend (Hono + x402-hono)**

* Endpoint: `POST /summarize`
* Protected by x402’s payment middleware.
* After verified payment:

  * Calls Gemini 2.5 Flash.
  * Returns summary.

#### **3. x402 Middleware & Facilitator**

* Ensures required SEI payment.
* Verifies proof with on-chain data.
* Works with Sei Testnet.

#### **4. Blockchain (Sei Testnet)**

* User pays in SEI.
* Wallet signs + broadcasts payment.
* Facilitator verifies the transaction.

#### **5. Gemini API**

* Receives input text.
* Generates summary via `gemini-2.5-flash`.

---

## **4. Data Flow**

### **4.1 First Request (Before Payment)**

1. User clicks “Summarize”.
2. Frontend sends POST `/summarize` with `{ text }`.
3. Backend middleware sees no payment → returns:

   ```
   402 Payment Required
   + payment instructions
   ```
4. Frontend’s x402 client:

   * Detects 402
   * Opens wallet popup
   * Requests SEI payment on Sei Testnet

### **4.2 Payment Transaction**

5. Wallet sends SEI transaction.
6. Frontend gets transaction reference.
7. Frontend **automatically retries** request with payment proof.

### **4.3 Verified Request**

8. Backend `x402-hono` middleware:

   * Validates payment via facilitator
   * Confirms price, timestamp, recipient
9. Backend handler:

   * Sends text to Gemini 2.5 Flash
   * Receives concise summary
10. Backend responds with:

```json
{ "summary": "..." }
```

---

## **5. API Design**

### **POST /summarize**

**Description:** Paid endpoint that summarizes text.

**Request Body:**

```json
{
  "text": "..."
}
```

**Success Response:**

```json
{
  "summary": "..."
}
```

**Errors:**

* `400`: missing text
* `402`: payment required (x402 payload)
* `500`: internal error

### **GET /**

Health check endpoint.

---

## **6. Frontend Design**

### **UI Components**

* Large text area
* “Summarize (x402 pay-per-use)” button
* Status text (connecting wallet, confirming payment, generating summary)
* Error display
* Summary output panel

### **Client Responsibilities**

* Connect compatible Sei wallet
* Wrap fetch:

  * Detect 402
  * Initiate payment
  * Retry with proof
* Display summary or errors

---

## **7. Backend Design**

### **Key Modules**

#### **1. Hono Server**

* Handles all routing
* Exposes:

  * `/` (health)
  * `/summarize` (paid endpoint)

#### **2. x402-hono Middleware**

Configuration example:

* `price: "$0.01"`
* `network: "sei-testnet"`
* `SERVER_ADDRESS`: Sei address
* `FACILITATOR_URL`: x402 facilitator endpoint

#### **3. Summarizer Module**

* Function `summarizeText()`
* Uses Gemini 2.5 Flash
* Returns 3-5 bullet points summary

---

## **8. Payment Layer (x402 + Sei)**

### **Payment Flow**

* Client receives 402 with:

  * Price in USD
  * Target address
  * Network = sei-testnet
* x402 client converts USD → SEI
* Wallet pays in SEI
* Facilitator verifies payment

### **Rules**

* Payment must:

  * Match correct price
  * Go to correct address
  * Be on correct network
  * Be recent (within validity window)

---

## **9. Security**

* Gemini API key stored in backend `.env`
* No API keys on frontend
* Optional:

  * CORS restrictions
  * Basic rate limiting
  * Input length validation

---

## **10. Deployment**

### **Backend**

* Deploy to:

  * Railway
  * Render
  * Fly.io
* Set env variables:

  * GEMINI_API_KEY
  * SERVER_ADDRESS
  * FACILITATOR_URL
  * PRICE_USD
  * NETWORK_NAME=sei-testnet

### **Frontend**

* Deploy to:

  * Vercel
  * Netlify
* Set:

  * VITE_BACKEND_URL
  * VITE_THIRDWEB_CLIENT_ID

---

## **11. Extensibility**

Future additions:

* More AI endpoints (rewrite, translate, grammar)
* Usage dashboard
* Subscription plans
* Multi-chain x402 support
* User profiles and credit system

---

