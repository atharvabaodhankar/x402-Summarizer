import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Sparkles, Loader2, AlertCircle, Wallet, CheckCircle, Network, Zap, Brain, Lock, Rocket, Stars, TrendingUp } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const LOADING_STAGES = [
  { 
    icon: Network, 
    text: "Establishing secure connection...", 
    subtext: "Encrypting your data with military-grade security",
    progress: 15 
  },
  { 
    icon: Lock, 
    text: "Authenticating blockchain network...", 
    subtext: "Verifying smart contract integrity",
    progress: 30 
  },
  { 
    icon: Brain, 
    text: "AI models warming up...", 
    subtext: "Loading neural networks for optimal processing",
    progress: 45 
  },
  { 
    icon: Sparkles, 
    text: "Analyzing your content...", 
    subtext: "Processing 10,000+ tokens per second",
    progress: 60 
  },
  { 
    icon: TrendingUp, 
    text: "Optimizing summary quality...", 
    subtext: "Applying advanced NLP algorithms",
    progress: 75 
  },
  { 
    icon: Rocket, 
    text: "Finalizing your summary...", 
    subtext: "Almost there! Polishing the results",
    progress: 90 
  },
  { 
    icon: Stars, 
    text: "Complete!", 
    subtext: "Your summary is ready",
    progress: 100 
  }
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
  const [loadingStage, setLoadingStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const currentNetwork = NETWORKS[selectedNetwork];
  const currentStage = LOADING_STAGES[loadingStage];

  // Smooth progress animation
  useEffect(() => {
    if (loading && loadingStage < LOADING_STAGES.length - 1) {
      const targetProgress = LOADING_STAGES[loadingStage].progress;
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= targetProgress) {
            return prev;
          }
          return Math.min(prev + 1, targetProgress);
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [loading, loadingStage]);

  // Stage progression
  useEffect(() => {
    if (loading && loadingStage < LOADING_STAGES.length - 1) {
      const duration = loadingStage === 0 ? 1500 : 2000;
      const timer = setTimeout(() => {
        setLoadingStage(prev => prev + 1);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [loading, loadingStage]);

  // Mouse tracking for interactive effects
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please enter some text to summarize');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');
    setPaymentRequired(false);
    setLoadingStage(0);
    setProgress(0);

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
        setLoadingStage(LOADING_STAGES.length - 1);
        setProgress(100);
        setLoading(false);
        return;
      }

      if (!response.ok) throw new Error(data.error || 'Failed to generate summary');

      // Complete the loading animation
      setLoadingStage(LOADING_STAGES.length - 1);
      setProgress(100);
      
      await new Promise(r => setTimeout(r, 800));
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  const handleWalletConnect = async () => {
    setLoading(true);
    setError('');
    setLoadingStage(0);
    setProgress(0);

    try {
      if (!window.ethereum) throw new Error('Please install MetaMask to continue');

      setLoadingStage(1);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      setLoadingStage(2);
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

      setLoadingStage(3);
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: paymentInfo.walletAddress,
          value: currentNetwork.paymentAmount,
          gas: '0x5208',
        }],
      });

      setLoadingStage(4);
      await new Promise(r => setTimeout(r, 1000));

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
      if (!response.ok) throw new Error(data.error || 'Failed to generate summary');

      setLoadingStage(LOADING_STAGES.length - 1);
      setProgress(100);
      await new Promise(r => setTimeout(r, 800));
      
      setPaymentRequired(false);
      setSummary(data.summary);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto" onMouseMove={handleMouseMove}>
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-pink-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-12 relative z-10"
      >
        <motion.div 
          className="flex items-center justify-center gap-4 mb-4"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-14 h-14 text-yellow-300 drop-shadow-glow" />
          </motion.div>
          <h1 className="text-7xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            x402
          </h1>
        </motion.div>
        <motion.p 
          className="text-xl text-purple-100/80 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Next-Gen AI Summarization • Blockchain Powered
        </motion.p>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white/5 backdrop-blur-2xl rounded-[2rem] p-10 shadow-2xl border border-white/10 relative overflow-hidden"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Glassmorphism shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        {/* Network Selector */}
        <div className="mb-8 relative z-10">
          <label className="flex items-center gap-2 text-white/90 text-sm font-semibold mb-4 tracking-wide">
            <Network className="w-5 h-5" />
            PAYMENT NETWORK
          </label>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(NETWORKS).map((key, index) => (
              <motion.button
                key={key}
                onClick={() => setSelectedNetwork(key)}
                disabled={loading}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-5 rounded-2xl font-bold transition-all duration-300 overflow-hidden ${
                  selectedNetwork === key
                    ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white shadow-2xl'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {selectedNetwork === key && (
                  <motion.div
                    layoutId="network-selector"
                    className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {selectedNetwork === key && <CheckCircle className="w-5 h-5" />}
                  {NETWORKS[key].chainName.split(' ')[0]}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Cinematic Loading Progress */}
        <AnimatePresence mode="wait">
          {loading && currentStage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 relative z-10"
            >
              <div className="bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl overflow-hidden">
                {/* Animated background gradient */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                
                <div className="relative z-10">
                  {/* Icon and main text */}
                  <div className="flex items-start gap-4 mb-6">
                    <motion.div
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="p-3 bg-white/10 rounded-2xl backdrop-blur"
                    >
                      {currentStage.icon && <currentStage.icon className="w-7 h-7 text-white" />}
                    </motion.div>
                    
                    <div className="flex-1">
                      <motion.h3
                        key={currentStage.text}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xl font-bold text-white mb-2"
                      >
                        {currentStage.text}
                      </motion.h3>
                      <motion.p
                        key={currentStage.subtext}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-sm text-purple-200/80"
                      >
                        {currentStage.subtext}
                      </motion.p>
                    </div>

                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-3xl font-black text-white/90"
                    >
                      {Math.round(progress)}%
                    </motion.div>
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-3 bg-black/30 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>

                  {/* Stage indicators */}
                  <div className="flex justify-between mt-4 px-1">
                    {LOADING_STAGES.slice(0, -1).map((stage, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ 
                          scale: loadingStage >= index ? 1 : 0.7,
                          opacity: loadingStage >= index ? 1 : 0.3
                        }}
                        className={`w-2 h-2 rounded-full ${
                          loadingStage >= index 
                            ? 'bg-gradient-to-r from-purple-400 to-pink-400' 
                            : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text Area with Character Counter */}
        <div className="mb-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              placeholder="Paste your text here and watch the magic happen..."
              disabled={loading}
              className="w-full h-56 px-6 py-5 bg-black/20 text-white placeholder-gray-400/60 border-2 border-white/10 rounded-2xl focus:border-purple-400/50 focus:outline-none resize-none transition-all duration-300 backdrop-blur-sm font-medium text-lg leading-relaxed"
              style={{
                boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3)'
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: charCount > 0 ? 1 : 0 }}
              className="absolute bottom-4 right-4 px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/20"
            >
              <span className="text-sm font-semibold text-purple-200">
                {charCount.toLocaleString()} characters
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Submit Button */}
        <motion.button
          onClick={handleSummarize}
          disabled={loading || !text.trim()}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="relative w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 hover:from-yellow-500 hover:via-orange-600 hover:to-pink-600 text-white font-black py-5 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden group shadow-2xl mb-6"
          style={{
            boxShadow: '0 10px 40px rgba(251, 191, 36, 0.3)'
          }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <Zap className="w-6 h-6 relative z-10" />
          <span className="text-lg relative z-10">Summarize with AI</span>
        </motion.button>

        {/* Payment Required */}
        <AnimatePresence>
          {paymentRequired && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden"
            >
              <div className="bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-yellow-400/30 shadow-2xl">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-pink-500/10"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="p-3 bg-yellow-400/20 rounded-2xl"
                    >
                      <Wallet className="w-7 h-7 text-yellow-300" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-black text-white">Payment Required</h3>
                      <p className="text-yellow-200/70 text-sm">Unlock your AI-powered summary</p>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-2xl p-5 mb-5 border border-yellow-400/20">
                    <p className="text-gray-300 text-sm mb-2">Amount</p>
                    <p className="text-3xl font-black text-transparent bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text">
                      0.01 {currentNetwork.nativeCurrency.symbol}
                    </p>
                  </div>
                  
                  <motion.button
                    onClick={handleWalletConnect}
                    disabled={loading}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl mb-4"
                    style={{ boxShadow: '0 10px 40px rgba(52, 211, 153, 0.3)' }}
                  >
                    <Wallet className="w-6 h-6" />
                    <span className="text-lg">Connect MetaMask & Pay</span>
                  </motion.button>
                  
                  <motion.a
                    href={currentNetwork.faucet}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ x: 5 }}
                    className="flex items-center justify-center gap-2 text-blue-300 hover:text-blue-200 text-sm font-semibold"
                  >
                    <span>Need testnet tokens?</span>
                    <span>→</span>
                  </motion.a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-red-500/20 backdrop-blur-xl rounded-2xl p-5 border border-red-400/30 flex items-center gap-3 shadow-xl"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <AlertCircle className="w-6 h-6 text-red-400" />
              </motion.div>
              <p className="text-red-100 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary */}
        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden"
            >
              <div className="bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-3xl p-8 border border-green-400/30 shadow-2xl">
                {/* Success particles effect */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-green-400 rounded-full"
                    initial={{ opacity: 1, scale: 0, x: '50%', y: '50%' }}
                    animate={{
                      opacity: [1, 0],
                      scale: [0, 1],
                      x: `${50 + Math.cos(i * 72 * Math.PI / 180) * 100}%`,
                      y: `${50 + Math.sin(i * 72 * Math.PI / 180) * 100}%`,
                    }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                  />
                ))}
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-5">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="p-3 bg-green-400/20 rounded-2xl"
                    >
                      <CheckCircle className="w-7 h-7 text-green-300" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-black text-white">Your Summary</h3>
                      <p className="text-green-200/70 text-sm">AI-generated in seconds</p>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-black/30 rounded-2xl p-6 border border-green-400/20"
                  >
                    <p className="text-gray-100 leading-relaxed text-lg whitespace-pre-wrap">
                      {summary}
                    </p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-3 mt-5"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigator.clipboard.writeText(summary)}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all border border-white/20"
                    >
                      Copy
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setText('');
                        setSummary('');
                        setCharCount(0);
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all"
                    >
                      New Summary
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-8 relative z-10"
      >
        <p className="text-purple-200/60 text-sm font-medium">
          Powered by <span className="text-purple-100 font-bold">Gemini AI</span> + <span className="text-pink-100 font-bold">x402 Protocol</span>
        </p>
      </motion.div>
    </div>
  );
}
