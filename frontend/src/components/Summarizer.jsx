import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Wallet } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export default function Summarizer() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please enter some text to summarize');
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');
    setPaymentRequired(false);

    try {
      const response = await fetch(`${BACKEND_URL}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      // Check for 402 Payment Required
      if (response.status === 402) {
        setPaymentRequired(true);
        setPaymentInfo(data);
        setError(`💰 Payment Required: ${data.price || '$0.01'} on Sei Testnet. Please connect your wallet to continue.`);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to summarize');
      }

      setSummary(data.summary);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnect = async () => {
    setLoading(true);
    setError('');
    
    // Simulate wallet connection and payment
    setTimeout(async () => {
      try {
        // Simulate payment by including a demo payment header
        const response = await fetch(`${BACKEND_URL}/summarize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Payment-TxHash': 'demo-payment-' + Date.now(), // Demo payment proof
          },
          body: JSON.stringify({ text }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to summarize');
        }

        // Payment successful!
        setPaymentRequired(false);
        setSummary(data.summary);
        setError('');
      } catch (err) {
        setError('Payment failed: ' + err.message);
      } finally {
        setLoading(false);
      }
    }, 2000); // 2 second delay to simulate wallet transaction
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-10 h-10 text-yellow-300" />
          <h1 className="text-5xl font-bold text-white">
            x402 Summarizer
          </h1>
        </div>
        <p className="text-purple-200 text-lg">
          Powered by Gemini AI on Sei Testnet
        </p>
        <p className="text-purple-300 text-sm mt-2">
          ⚡ Pay-per-use with x402 Protocol
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
        {/* Input Section */}
        <div className="mb-6">
          <label htmlFor="text-input" className="block text-white text-lg font-semibold mb-3">
            Enter Text to Summarize
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here..."
            className="w-full h-48 px-4 py-3 rounded-xl bg-white/20 backdrop-blur text-white placeholder-purple-200 border-2 border-white/30 focus:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300/50 transition-all resize-none"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSummarize}
          disabled={loading || !text.trim()}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-4 px-6 rounded-xl hover:from-yellow-500 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Summarizing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Summarize (x402 pay-per-use)</span>
            </>
          )}
        </button>

        {/* Payment Required Notice */}
        {paymentRequired && (
          <div className="mt-6 bg-yellow-500/20 backdrop-blur border border-yellow-500/50 rounded-xl p-6">
            <h3 className="text-yellow-200 text-xl font-semibold mb-3 flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              Payment Required on Sei Testnet
            </h3>
            <p className="text-yellow-100 mb-4">
              Price: <strong>{paymentInfo?.price || '$0.01'}</strong>
            </p>
            <button
              onClick={handleWalletConnect}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-3 px-6 rounded-xl hover:from-green-500 hover:to-blue-600 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet & Pay
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && !paymentRequired && (
          <div className="mt-6 bg-red-500/20 backdrop-blur border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
            <p className="text-red-100">{error}</p>
          </div>
        )}

        {/* Summary Output */}
        {summary && (
          <div className="mt-6 bg-white/20 backdrop-blur rounded-xl p-6 border border-white/30">
            <h3 className="text-white text-xl font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              Summary
            </h3>
            <div className="text-purple-100 leading-relaxed whitespace-pre-wrap">
              {summary}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-purple-200 text-sm">
        <p>Built with React + Hono + Gemini AI + x402 Protocol</p>
      </div>
    </div>
  );
}
