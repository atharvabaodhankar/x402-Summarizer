import { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, Wallet, CheckCircle, Network, Zap, Brain, Lock, Rocket, Stars, TrendingUp } from 'lucide-react';
import './Summarizer.css';

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

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
  };

  const handleNewSummary = () => {
    setText('');
    setSummary('');
    setCharCount(0);
  };

  return (
    <div className="summarizer-container">
      {/* Animated Background Orbs */}
      <div className="background-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      {/* Header */}
      <div className="header">
        <div className="header-content">
          <Sparkles className="header-icon" />
          <h1 className="header-title">x402</h1>
        </div>
        <p className="header-subtitle">HTTP 402 Payment Protocol Demo</p>
        <div className="header-description">
          <p>This project demonstrates the HTTP 402 "Payment Required" status code in action.</p>
          <p>Pay-per-use AI summarization powered by blockchain micropayments.</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="main-card">
        {/* Network Selector */}
        <div className="network-selector">
          <label className="network-label">
            <Network />
            PAYMENT NETWORK
          </label>
          <div className="network-buttons">
            {Object.keys(NETWORKS).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedNetwork(key)}
                disabled={loading}
                className={`network-button ${selectedNetwork === key ? 'active' : ''}`}
              >
                <span className="button-content">
                  {selectedNetwork === key && <CheckCircle style={{ width: '1.25rem', height: '1.25rem' }} />}
                  {NETWORKS[key].chainName.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cinematic Loading Progress */}
        {loading && currentStage && (
          <div className="loading-container">
            <div className="loading-card">
              <div className="loading-shimmer"></div>
              
              <div className="loading-header">
                <div className="loading-icon-wrapper">
                  {currentStage.icon && <currentStage.icon className="loading-icon" />}
                </div>
                
                <div className="loading-text">
                  <h3 className="loading-title">{currentStage.text}</h3>
                  <p className="loading-subtitle">{currentStage.subtext}</p>
                </div>

                <div className="loading-percentage">
                  {Math.round(progress)}%
                </div>
              </div>

              {/* Progress bar */}
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}>
                  <div className="progress-bar-shimmer"></div>
                </div>
              </div>

              {/* Stage indicators */}
              <div className="stage-indicators">
                {LOADING_STAGES.slice(0, -1).map((_, index) => (
                  <div
                    key={index}
                    className={`stage-dot ${loadingStage >= index ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Text Area with Character Counter */}
        <div className="input-container">
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Paste your text here and watch the magic happen..."
            disabled={loading}
            className="textarea"
          />
          {charCount > 0 && (
            <div className="char-counter">
              {charCount.toLocaleString()} characters
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSummarize}
          disabled={loading || !text.trim()}
          className="submit-button"
        >
          <div className="button-shimmer"></div>
          <Zap style={{ width: '1.5rem', height: '1.5rem' }} />
          <span>Summarize with AI</span>
        </button>

        {/* Payment Required */}
        {paymentRequired && (
          <div className="payment-modal">
            <div className="payment-card">
              <div className="payment-rotating-bg"></div>
              
              <div className="payment-header">
                <div className="payment-icon-wrapper">
                  <Wallet className="payment-icon" />
                </div>
                <div>
                  <h3 className="payment-title">Payment Required</h3>
                  <p className="payment-subtitle">Unlock your AI-powered summary</p>
                </div>
              </div>
              
              <div className="payment-amount-box">
                <p className="payment-amount-label">Amount</p>
                <p className="payment-amount">
                  0.01 {currentNetwork.nativeCurrency.symbol}
                </p>
              </div>
              
              <button
                onClick={handleWalletConnect}
                disabled={loading}
                className="payment-button"
              >
                <Wallet style={{ width: '1.5rem', height: '1.5rem' }} />
                <span>Connect MetaMask & Pay</span>
              </button>
              
              <a
                href={currentNetwork.faucet}
                target="_blank"
                rel="noopener noreferrer"
                className="payment-link"
              >
                <span>Need testnet tokens?</span>
                <span>→</span>
              </a>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-container">
            <AlertCircle className="error-icon" />
            <p className="error-text">{error}</p>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="summary-container">
            <div className="summary-card">
              <div className="summary-header">
                <div className="summary-icon-wrapper">
                  <CheckCircle className="summary-icon" />
                </div>
                <div>
                  <h3 className="summary-title">Your Summary</h3>
                  <p className="summary-subtitle">AI-generated in seconds</p>
                </div>
              </div>
              
              <div className="summary-content-box">
                <p className="summary-text">{summary}</p>
              </div>
              
              <div className="summary-actions">
                <button onClick={handleCopy} className="action-button secondary">
                  Copy
                </button>
                <button onClick={handleNewSummary} className="action-button primary">
                  New Summary
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="footer-info">
          <h3>About HTTP 402</h3>
          <p>
            HTTP 402 is a reserved status code for future payment systems. This demo implements 
            the x402 protocol, enabling seamless blockchain-based micropayments for API access.
          </p>
          <p>
            When you request a summary, the server responds with 402 Payment Required. Your wallet 
            automatically handles the payment, and the request is retried with proof of payment.
          </p>
        </div>
        <p className="footer-text">
          Powered by <span className="footer-highlight">Gemini AI</span> + <span className="footer-highlight">x402 Protocol</span>
        </p>
      </div>
    </div>
  );
}
