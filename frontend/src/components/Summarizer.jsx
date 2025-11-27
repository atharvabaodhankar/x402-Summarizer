import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Wallet, CheckCircle } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Sei Testnet EVM Configuration
const SEI_TESTNET_EVM = {
  chainId: '0x531', // 1329 in hex (Sei Atlantic-2 Testnet)
  chainName: 'Sei Testnet',
  nativeCurrency: {
    name: 'SEI',
    symbol: 'SEI',
    decimals: 18
  },
  rpcUrls: ['https://evm-rpc-testnet.sei-apis.com'],
  blockExplorerUrls: ['https://seitrace.com']
};

export default function Summarizer() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [walletStatus, setWalletStatus] = useState('');

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please enter some text to summarize');
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');
    setPaymentRequired(false);
    setWalletStatus('');

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
    setWalletStatus('Detecting MetaMask...');

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('Please install MetaMask wallet extension');
      }

      setWalletStatus('Connecting to MetaMask...');

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      const senderAddress = accounts[0];

      setWalletStatus(`Connected: ${senderAddress.slice(0, 10)}...`);

      // Try to switch to Sei Testnet, or add it if not present
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SEI_TESTNET_EVM.chainId }],
        });
      } catch (switchError) {
        // Chain not added, let's add it
        if (switchError.code === 4902) {
          setWalletStatus('Adding Sei Testnet to MetaMask...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEI_TESTNET_EVM],
          });
        } else {
          throw switchError;
        }
      }

      setWalletStatus('Preparing payment transaction...');

      const recipient = paymentInfo.walletAddress;
      // 0.01 SEI in wei (18 decimals)
      const amountWei = '0x2386F26FC10000'; // 0.01 SEI

      setWalletStatus('Please approve transaction in MetaMask...');

      // Send transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: senderAddress,
          to: recipient,
          value: amountWei,
          gas: '0x5208', // 21000 in hex
        }],
      });

      setWalletStatus(`Payment sent! Transaction: ${txHash.slice(0, 10)}...`);

      // Wait a moment for transaction to be included
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Retry summary request with payment proof
      setWalletStatus('Verifying payment and getting summary...');
      
      const response = await fetch(`${BACKEND_URL}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment-TxHash': txHash,
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to summarize after payment');
      }

      // Success!
      setPaymentRequired(false);
      setSummary(data.summary);
      setWalletStatus('✅ Payment verified and summary received!');
      setTimeout(() => setWalletStatus(''), 3000);
      
    } catch (err) {
      setError('Wallet error: ' + err.message);
      setWalletStatus('');
    } finally {
      setLoading(false);
    }
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
          ⚡ Pay-per-use with x402 Protocol via MetaMask
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
        {/* Wallet Status */}
        {walletStatus && (
          <div className="mb-4 bg-blue-500/20 backdrop-blur border border-blue-500/50 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-300" />
            <p className="text-blue-100 text-sm">{walletStatus}</p>
          </div>
        )}

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
          {loading && !paymentRequired ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
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
            <p className="text-yellow-100 mb-2">
              Price: <strong>{paymentInfo?.price || '$0.01'}</strong> (0.01 SEI)
            </p>
            <p className="text-yellow-100 mb-4 text-sm">
              Recipient: <code className="bg-black/30 px-2 py-1 rounded">{paymentInfo?.walletAddress}</code>
            </p>
            <button
              onClick={handleWalletConnect}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-orange-500 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing payment...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  <span>Connect MetaMask & Pay</span>
                </>
              )}
            </button>
            <p className="text-yellow-200 text-xs mt-3 text-center">
              🦊 MetaMask will prompt you to add Sei Testnet and approve the transaction
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
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
        <p className="text-purple-300 text-xs mt-1">Pay with MetaMask on Sei Testnet EVM</p>
      </div>
    </div>
  );
}
