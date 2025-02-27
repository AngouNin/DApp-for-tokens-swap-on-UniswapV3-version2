import { ethers } from 'ethers';
import axios from 'axios';
import { Token } from '../types/tokens';
// import { AlphaRouter } from '@uniswap/smart-order-router';
import { Token as UniswapToken, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core';
import { SWAP_ROUTER_V4_ABI } from './abis'; 

// Constants
const UNISWAP_V4_ROUTER_ADDRESS = '0x66a9893cc07d91d95644aedd05d03f95e1dba8af'; // Replace with actual V4 router when available
const SLIPPAGE_TOLERANCE = new Percent(50, 10000); // 0.5%
const CHAIN_ID = 1; // Ethereum mainnet

// Helper function to convert our Token type to Uniswap SDK Token
const convertToUniswapToken = (token: Token): UniswapToken => {
  return new UniswapToken(
    CHAIN_ID,
    token.address,
    token.decimals,
    token.symbol,
    token.name
  );
};

// Get token price from a reliable API
const getTokenPrice = async (tokenAddress: string): Promise<number> => {
  try {
    // Using CoinGecko API to get token prices
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`
    );
    
    if (response.data && response.data[tokenAddress.toLowerCase()]) {
      return response.data[tokenAddress.toLowerCase()].usd;
    }
    
    // Fallback to a default value if price not found
    return 0;
  } catch (error) {
    console.error('Error fetching token price:', error);
    return 0;
  }
};

// Get the best quote for swapping tokens
export const getTokenQuote = async (
  fromToken: Token,
  toToken: Token,
  fromAmount: string
): Promise<string> => {
  try {
    // For a production app, you would use the Uniswap SDK to get the best route
    // Since Uniswap V4 is still new, we'll use a combination of API calls and price calculations
    
    // Get token prices from an API
    const [fromTokenPrice, toTokenPrice] = await Promise.all([
      getTokenPrice(fromToken.address),
      getTokenPrice(toToken.address)
    ]);
    
    // If we couldn't get prices from the API, use a fallback method
    if (!fromTokenPrice || !toTokenPrice) {
      return fallbackQuoteCalculation(fromToken, toToken, fromAmount);
    }
    
    // Calculate the expected output amount based on current market prices
    const amountInUsd = parseFloat(fromAmount) * fromTokenPrice;
    const expectedOutput = amountInUsd / toTokenPrice;
    
    // Apply a small discount to account for slippage and fees (0.3% fee + 0.5% slippage)
    const discountedOutput = expectedOutput * 0.992;
    
    // Format to appropriate decimals
    return discountedOutput.toFixed(9);
  } catch (error) {
    console.error('Error getting quote:', error);
    // Fallback to our simplified calculation if the API call fails
    return fallbackQuoteCalculation(fromToken, toToken, fromAmount);
  }
};

// Fallback calculation when API is not available
const fallbackQuoteCalculation = (
  fromToken: Token,
  toToken: Token,
  fromAmount: string
): string => {
  // Simplified exchange rate simulation based on token pairs
  let exchangeRate;
  
  if (fromToken.symbol === 'WETH' && toToken.symbol === 'USDC') {
    exchangeRate = 3000 + (Math.random() * 100 - 50); // Around $3000 per ETH
  } else if (fromToken.symbol === 'USDC' && toToken.symbol === 'WETH') {
    exchangeRate = 1 / (3000 + (Math.random() * 100 - 50));
  } else if (fromToken.symbol === 'WBTC' && toToken.symbol === 'WETH') {
    exchangeRate = 15 + (Math.random() * 1 - 0.5); // Around 15 ETH per BTC
  } else if (fromToken.symbol === 'WETH' && toToken.symbol === 'WBTC') {
    exchangeRate = 1 / (15 + (Math.random() * 1 - 0.5));
  } else if (fromToken.symbol === 'WETH' && toToken.symbol === 'UNI') {
    exchangeRate = 200 + (Math.random() * 20 - 10); // Around 200 UNI per ETH
  } else if (fromToken.symbol === 'UNI' && toToken.symbol === 'WETH') {
    exchangeRate = 1 / (200 + (Math.random() * 20 - 10));
  } else if (fromToken.symbol === 'USDC' && toToken.symbol === 'DAI') {
    exchangeRate = 0.99 + (Math.random() * 0.02 - 0.01); // Close to 1:1 with small variation
  } else if (fromToken.symbol === 'DAI' && toToken.symbol === 'USDC') {
    exchangeRate = 1 / (0.99 + (Math.random() * 0.02 - 0.01));
  } else {
    // Default random exchange rate for other pairs
    exchangeRate = 0.8 + (Math.random() * 0.4); // Random rate between 0.8 and 1.2
  }
  
  // Calculate output amount
  const rawAmount = parseFloat(fromAmount) * exchangeRate;
  
  // Format to appropriate decimals
  return rawAmount.toFixed(toToken.decimals);
};

// Execute the swap transaction
export const executeSwap = async (
  walletAddress: string,
  fromToken: Token,
  toToken: Token,
  fromAmount: string
): Promise<void> => {
  try {
    // Request access to the user's MetaMask account
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    
    // Parse the input amount
    const amountIn = ethers.utils.parseUnits(fromAmount, fromToken.decimals);
    
    // Check if token needs approval (not needed for ETH)
    const isNativeETH = fromToken.address.toLowerCase() === '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'.toLowerCase();
    
    if (!isNativeETH) {
      // Create token contract instance
      const tokenContract = new ethers.Contract(
        fromToken.address,
        [
          'function approve(address spender, uint256 amount) public returns (bool)',
          'function allowance(address owner, address spender) view returns (uint256)'
        ],
        signer
      );
      
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(walletAddress, UNISWAP_V4_ROUTER_ADDRESS);
      
      // If allowance is insufficient, request approval
      if (currentAllowance.lt(amountIn)) {
        console.log('Approving tokens...');
        const approveTx = await tokenContract.approve(
          UNISWAP_V4_ROUTER_ADDRESS,
          ethers.constants.MaxUint256 // Infinite approval
        );
        
        // Wait for approval transaction to be mined
        await approveTx.wait();
        console.log('Approval successful');
      }
    }
    
    // Get the quote for the swap
    const amountOutMin = await getTokenQuote(fromToken, toToken, fromAmount);
    // Assuming SLIPPAGE_TOLERANCE is a Percent object
    const slippageTolerance = SLIPPAGE_TOLERANCE.toFixed(4);
    const slippageMultiplier = 1 - parseFloat(slippageTolerance);

    const amountOutMinWei = ethers.utils.parseUnits(
      (parseFloat(amountOutMin) * slippageMultiplier).toFixed(toToken.decimals),
      toToken.decimals
    );
    
    // Create router contract instance
    const routerContract = new ethers.Contract(
      UNISWAP_V4_ROUTER_ADDRESS,
      SWAP_ROUTER_V4_ABI,
      signer
    );
    
    // Prepare swap parameters
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
    
    // Execute the swap
    let tx;
    if (isNativeETH) {
      // Swapping ETH for tokens
      tx = await routerContract.swapExactETHForTokens(
        amountOutMinWei,
        [fromToken.address, toToken.address],
        walletAddress,
        deadline,
        { value: amountIn }
      );
    } else if (toToken.address.toLowerCase() === '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'.toLowerCase()) {
      // Swapping tokens for ETH
      tx = await routerContract.swapExactTokensForETH(
        amountIn,
        amountOutMinWei,
        [fromToken.address, toToken.address],
        walletAddress,
        deadline
      );
    } else {
      // Swapping tokens for tokens
      tx = await routerContract.swapExactTokensForTokens(
        amountIn,
        amountOutMinWei,
        [fromToken.address, toToken.address],
        walletAddress,
        deadline
      );
    }
    
    // Wait for transaction to be mined
    await tx.wait();
    
    console.log('Swap executed successfully!');
  } catch (error) {
    console.error('Error executing swap:', error);
    throw new Error('Failed to execute swap: ' + (error as Error).message);
  }
};