import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, AlertCircle, Wallet, CheckCircle, Network, Zap } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const QUOTES = [
  "Connecting to blockchain...",
  "Securing transaction...",
  "Processing with AI...",
  "Almost there...",
  "Verifying payment...",
  "Creating summary..."
];

const NETWORKS = {
  sei: {
    chainId: '0x531',
    chainName: 'Sei Testnet',
    nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
    rpcUrls: ['https://evm-rpc-testnet.sei-apis.com'],
    blockExplorerUrls: ['https://seitrace.com'],
    faucet: 'https://atlantic-2.app.sei.io/faucet',
    paymentAmount: '0x2386F26FC10000',
  },
  sepolia: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    faucet: 'https://sepoliafaucet.com',
    paymentAmount: '0x2386F26FC10000',
  }
};

export default function Summarizer() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState('sei');
  const [currentQuote, setCurrentQuote] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const currentNetwork = NETWORKS[selectedNetwork];

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCurrentQuote(prev => (prev + 1) % QUOTES.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => prev >= 90 ? prev : prev + Math.random() * 10);
      }, 400);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please enter text');
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');
    setPaymentRequired(false);
    setStatus('Sending request...');

    try {
      const response = await fetch(`${BACKEND_URL}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (response.status === 402) {
        setPaymentRequired(true);
        setPaymentInfo(data);
        setProgress(100);
        return;
      }

      if (!response.ok) throw new Error(data.error || 'Failed');

      setProgress(100);
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setStatus('');
      }, 300);
    }
  };

  const handleWalletConnect = async () => {
    setLoading(true);
    setError('');
    setProgress(0);

    try {
      if (!window.ethereum) throw new Error('Install MetaMask');

      setStatus('Connecting MetaMask...');
      setProgress(10);
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setProgress(25);

      setStatus(`Switching to ${currentNetwork.chainName}...`);
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: currentNetwork.chainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [currentNetwork],
          });
        } else throw switchError;
      }
      setProgress(50);

      setStatus('Approve transaction in MetaMask...');
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: paymentInfo.walletAddress,
          value: currentNetwork.paymentAmount,
          gas: '0x5208',
        }],
      });
      setProgress(75);

      setStatus('Getting summary...');
      await new Promise(r => setTimeout(r, 1500));

      const response = await fetch(`${BACKEND_URL}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment-TxHash': txHash,
          'X-Payment-Network': selectedNetwork,
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');

      setProgress(100);
      setPaymentRequired(false);
      setSummary(data.summary);
      setStatus('Success! ✨');
      setTimeout(() => setStatus(''), 2000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <Sparkles className="w-12 h-12 text-yellow-300" />
          <h1 className="text-6xl font-black text-white">x402</h1>
        </div>
        <p className="text-purple-200">AI Summarization • Pay-per-use</p>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
      >
        {/* Network Selector */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-white text-sm font-medium mb-3">
            <Network className="w-4 h-4" />
            Payment Network
          </label>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(NETWORKS).map(key => (
              <button
                key={key}
                onClick={() => setSelectedNetwork(key)}
                disabled={loading}
                className={`p-4 rounded-xl font-semibold transition-all ${
                  selectedNetwork === key
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {NETWORKS[key].chainName.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Progress */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="bg-blue-500/20 backdrop-blur rounded-xl p-5 border border-blue-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <motion.p
                    key={currentQuote}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white font-medium"
                  >
                    {QUOTES[currentQuote]}
                  </motion.p>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                {status && (
                  <p className="text-gray-300 text-sm mt-2">{status}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text Area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here..."
          disabled={loading}
          className="w-full h-48 px-4 py-3 mb-4 bg-white/10 text-white placeholder-gray-400 border-2 border-white/20 rounded-xl focus:border-purple-400 focus:outline-none resize-none"
        />

        {/* Submit Button */}
        <button
          onClick={handleSummarize}
          disabled={loading || !text.trim()}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Zap className="w-5 h-5" />
          Summarize with AI
        </button>

        {/* Payment Required */}
        <AnimatePresence>
          {paymentRequired && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-yellow-500/20 backdrop-blur rounded-xl p-6 border border-yellow-500/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Payment Required</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Amount: <span className="text-yellow-400 font-bold">0.01 {currentNetwork.nativeCurrency.symbol}</span>
              </p>
              <button
                onClick={handleWalletConnect}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                Connect MetaMask & Pay
              </button>
              <a
                href={currentNetwork.faucet}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 text-sm mt-3 block text-center"
              >
                Need tokens? Get them here →
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 bg-red-500/20 rounded-xl p-4 border border-red-500/30 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-200">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary */}
        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-green-500/20 backdrop-blur rounded-xl p-6 border border-green-500/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-bold text-white">Summary</h3>
              </div>
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                {summary}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <p className="text-center mt-6 text-purple-200 text-sm">
        Powered by Gemini AI + x402 Protocol
      </p>
    </div>
  );
}
