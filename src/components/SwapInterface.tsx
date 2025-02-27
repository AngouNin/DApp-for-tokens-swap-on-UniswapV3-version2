import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ArrowDown, RefreshCw, AlertCircle } from 'lucide-react';
import { getTokenQuote, executeSwap } from '../utils/swapUtils';
import { Token } from '../types/tokens';
import { COMMON_TOKENS } from '../constants/tokens';

const SwapInterface = () => {
  const { address } = useAccount();
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [customFromAddress, setCustomFromAddress] = useState<string>('');
  const [customToAddress, setCustomToAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [swapStatus, setSwapStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  // Reset error when inputs change
  useEffect(() => {
    setError(null);
  }, [fromToken, toToken, fromAmount]);

  // Get quote when inputs change
  useEffect(() => {
    const fetchQuote = async () => {
      if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
        setIsLoading(true);
        try {
          const quote = await getTokenQuote(fromToken, toToken, fromAmount);
          setToAmount(quote);
          setError(null);
        } catch (err) {
          console.error('Error fetching quote:', err);
          setError('Failed to get swap quote. Please try again.');
          setToAmount('');
        } finally {
          setIsLoading(false);
        }
      } else {
        setToAmount('');
      }
    };

    fetchQuote();
  }, [fromToken, toToken, fromAmount]);

  const handleSwap = async () => {
    if (!address || !fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      setError('Please fill in all fields correctly');
      return;
    }

    setSwapStatus('pending');
    setError(null);

    try {
      await executeSwap(address, fromToken, toToken, fromAmount);
      setSwapStatus('success');
      // Reset form after successful swap
      setTimeout(() => {
        setFromAmount('');
        setToAmount('');
        setSwapStatus('idle');
      }, 3000);
    } catch (err) {
      console.error('Swap error:', err);
      setError('Swap failed. Please try again.');
      setSwapStatus('error');
    }
  };

  const handleFromTokenSelect = (token: Token | null) => {
    if (token && token.address === toToken?.address) {
      // Swap positions if same token selected
      setToToken(fromToken);
    }
    setFromToken(token);
  };

  const handleToTokenSelect = (token: Token | null) => {
    if (token && token.address === fromToken?.address) {
      // Swap positions if same token selected
      setFromToken(toToken);
    }
    setToToken(token);
  };

  const handleAddCustomFromToken = () => {
    if (customFromAddress && customFromAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      const customToken: Token = {
        address: customFromAddress,
        symbol: 'CUSTOM',
        name: 'Custom Token',
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
      };
      setFromToken(customToken);
      setCustomFromAddress('');
    } else {
      setError('Please enter a valid token address');
    }
  };

  const handleAddCustomToToken = () => {
    if (customToAddress && customToAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      const customToken: Token = {
        address: customToAddress,
        symbol: 'CUSTOM',
        name: 'Custom Token',
        decimals: 18,
        logoURI: 'https://raw.githubusercontent.com/uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
      };
      setToToken(customToken);
      setCustomToAddress('');
    } else {
      setError('Please enter a valid token address');
    }
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 rounded-xl shadow-md overflow-hidden p-6">
      <h2 className="text-xl font-semibold mb-4">Swap Tokens</h2>
      
      {/* From Token */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">From</label>
        <div className="flex space-x-2 mb-2">
          <select
            className="bg-gray-700 text-white rounded-lg p-2 flex-grow"
            value={fromToken?.address || ''}
            onChange={(e) => {
              const selectedToken = COMMON_TOKENS.find(t => t.address === e.target.value) || null;
              handleFromTokenSelect(selectedToken);
            }}
          >
            <option value="">Select token</option>
            {COMMON_TOKENS.map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Amount"
            className="bg-gray-700 text-white rounded-lg p-2 flex-grow"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Custom token address"
            className="bg-gray-700 text-white rounded-lg p-2 flex-grow"
            value={customFromAddress}
            onChange={(e) => setCustomFromAddress(e.target.value)}
          />
          <button
            onClick={handleAddCustomFromToken}
            className="bg-gray-600 hover:bg-gray-500 text-white rounded-lg px-3"
          >
            Add
          </button>
        </div>
      </div>
      
      {/* Switch Button */}
      <div className="flex justify-center my-4">
        <button
          onClick={switchTokens}
          className="bg-gray-700 hover:bg-gray-600 rounded-full p-2"
          disabled={!fromToken || !toToken}
        >
          <ArrowDown className="h-5 w-5 text-purple-500" />
        </button>
      </div>
      
      {/* To Token */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">To</label>
        <div className="flex space-x-2 mb-2">
          <select
            className="bg-gray-700 text-white rounded-lg p-2 flex-grow"
            value={toToken?.address || ''}
            onChange={(e) => {
              const selectedToken = COMMON_TOKENS.find(t => t.address === e.target.value) || null;
              handleToTokenSelect(selectedToken);
            }}
          >
            <option value="">Select token</option>
            {COMMON_TOKENS.map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Amount"
            className="bg-gray-700 text-white rounded-lg p-2 flex-grow"
            value={toAmount}
            readOnly
          />
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Custom token address"
            className="bg-gray-700 text-white rounded-lg p-2 flex-grow"
            value={customToAddress}
            onChange={(e) => setCustomToAddress(e.target.value)}
          />
          <button
            onClick={handleAddCustomToToken}
            className="bg-gray-600 hover:bg-gray-500 text-white rounded-lg px-3"
          >
            Add
          </button>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      
      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0 || isLoading || swapStatus === 'pending'}
        className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${
          !fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0 || isLoading || swapStatus === 'pending'
            ? 'bg-purple-900/50 text-purple-300 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {swapStatus === 'pending' ? (
          <>
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            Swapping...
          </>
        ) : swapStatus === 'success' ? (
          'Swap Successful!'
        ) : isLoading ? (
          <>
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            Loading Quote...
          </>
        ) : (
          'Swap'
        )}
      </button>
      
      {/* Price Info */}
      {fromToken && toToken && toAmount && (
        <div className="mt-4 text-sm text-gray-400">
          <p className="flex justify-between">
            <span>Rate:</span>
            <span>
              1 {fromToken.symbol} ≈ {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken.symbol}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default SwapInterface;