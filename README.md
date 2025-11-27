# x402 Summarizer

A demonstration of the **HTTP 402 Payment Required** protocol using blockchain-based micropayments for AI-powered text summarization.

## What is HTTP 402?

HTTP 402 is a reserved HTTP status code originally intended for digital payment systems. While it has been part of the HTTP specification since 1997, it was never fully implemented or standardized.

This project demonstrates a modern implementation of HTTP 402 using the **x402 protocol**, which enables seamless blockchain-based micropayments for API access.

## What This Project Does

x402 Summarizer is a pay-per-use AI text summarization service that showcases:

- **HTTP 402 Payment Flow**: When you request a summary, the server responds with `402 Payment Required`
- **Automatic Wallet Integration**: Your crypto wallet handles the payment automatically
- **Proof of Payment**: The request is retried with cryptographic proof of payment
- **AI Summarization**: Once payment is verified, Gemini AI generates your summary

## How It Works

1. **User submits text** for summarization through the web interface
2. **Server responds with 402** including payment details (amount, wallet address, network)
3. **Frontend detects 402** and prompts the user's crypto wallet (MetaMask, etc.)
4. **User approves payment** on Sei or Sepolia testnet
5. **Payment is broadcast** to the blockchain
6. **Request is retried** with transaction hash as proof
7. **Backend verifies payment** via the x402 facilitator
8. **AI generates summary** using Gemini 2.5 Flash
9. **Summary is returned** to the user

## Technology Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **x402 Client** - Handles 402 responses and wallet integration

### Backend
- **Hono** - Lightweight web framework
- **x402-hono** - Middleware for payment verification
- **Google Gemini AI** - Text summarization (gemini-2.5-flash model)
- **Node.js** - Runtime environment

### Blockchain
- **Sei Testnet** - Primary payment network
- **Sepolia Testnet** - Alternative Ethereum testnet
- **MetaMask** - Wallet integration

## Features

- ✅ Pay-per-use model (no subscriptions or accounts)
- ✅ Multi-network support (Sei & Sepolia testnets)
- ✅ Real-time payment verification
- ✅ AI-powered text summarization
- ✅ Clean, minimal black & white UI
- ✅ Automatic wallet connection and payment flow
- ✅ Character counter and progress indicators

## Project Structure

```
x402-summarizer/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Summarizer.jsx    # Main component
│   │   │   └── Summarizer.css    # Styling
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
├── backend/            # Hono backend server
│   ├── src/
│   │   ├── index.js              # Main server file
│   │   └── gemini.js             # Gemini AI integration
│   ├── .env                      # Environment variables
│   └── package.json
│
└── DESIGN.md          # Detailed design documentation
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MetaMask or compatible Web3 wallet
- Testnet tokens (SEI or ETH)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the example environment file and configure it:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:5173

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# x402 Payment Configuration
SERVER_ADDRESS=your_wallet_address_here
PRICE_USD=0.01
FACILITATOR_URL=https://facilitator.x402.org
NETWORK_NAME=sei-testnet
```

Get your Gemini API key from: https://ai.google.dev/

4. Start the server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the example environment file and configure it:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
VITE_BACKEND_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

## Usage

1. **Connect your wallet** - Make sure MetaMask is installed and connected
2. **Select a network** - Choose Sei Testnet or Sepolia Testnet
3. **Get testnet tokens** - Use the faucet links if you need tokens
4. **Paste your text** - Enter the text you want to summarize
5. **Click "Summarize with AI"** - The app will request payment
6. **Approve the payment** - Confirm the transaction in your wallet
7. **Receive your summary** - AI-generated summary appears instantly

## Payment Details

- **Cost**: 0.01 SEI or 0.01 ETH (testnet tokens)
- **Networks**: Sei Testnet, Sepolia Testnet
- **Payment Method**: Direct blockchain transaction
- **Verification**: Automatic via x402 facilitator

## Testnet Faucets

- **Sei Testnet**: https://atlantic-2.app.sei.io/faucet
- **Sepolia Testnet**: https://sepoliafaucet.com

## Troubleshooting

### CORS Issues

If you encounter CORS errors:

1. **Check backend .env**: Ensure `FRONTEND_URL` matches your frontend URL
   ```env
   FRONTEND_URL=http://localhost:5173
   ```

2. **Check frontend .env**: Ensure `VITE_BACKEND_URL` matches your backend URL
   ```env
   VITE_BACKEND_URL=http://localhost:3000
   ```

3. **Restart both servers** after changing environment variables

4. **For production**: Update `FRONTEND_URL` to your deployed frontend domain
   ```env
   FRONTEND_URL=https://your-app.vercel.app
   ```

### Payment Issues

- Make sure you have testnet tokens in your wallet
- Check that you're connected to the correct network (Sei or Sepolia)
- Verify your wallet is unlocked and connected to the site

## API Endpoints

### `POST /summarize`

Generates an AI summary of the provided text (requires payment).

**Request Body:**
```json
{
  "text": "Your text to summarize..."
}
```

**Response (Success):**
```json
{
  "summary": "AI-generated summary..."
}
```

**Response (Payment Required):**
```json
{
  "error": "Payment required",
  "walletAddress": "0x...",
  "amount": "0.01",
  "network": "sei-testnet"
}
```

### `GET /`

Health check endpoint.

## Why x402?

The x402 protocol solves several problems with traditional payment systems:

- **No accounts or authentication** - Pay directly without signing up
- **Micropayments** - Enable pay-per-use for small amounts
- **Instant verification** - Blockchain provides immediate proof of payment
- **Decentralized** - No payment processor middleman
- **Global** - Works anywhere with crypto wallet access

## Future Enhancements

- [ ] Support for more blockchain networks
- [ ] Additional AI features (translation, rewriting, grammar check)
- [ ] Usage dashboard and analytics
- [ ] Subscription plans alongside pay-per-use
- [ ] Multi-language support
- [ ] Custom pricing tiers

## Contributing

This is a demonstration project. Feel free to fork and experiment with your own x402 implementations!

## License

MIT

## Resources

- [HTTP 402 Specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402)
- [x402 Protocol Documentation](https://x402.org)
- [Gemini AI](https://ai.google.dev/)
- [Sei Network](https://www.sei.io/)
- [Hono Framework](https://hono.dev/)

---

**Built with ❤️ to demonstrate the future of web payments**
