import { ethers } from 'ethers';
import { Token } from '../types/tokens';
import { ERC20_ABI } from './abis';

/**
 * Fetches token information from the blockchain
 * @param tokenAddress The address of the token to fetch information for
 * @returns A Promise that resolves to a Token object
 */
export const fetchTokenInfo = async (tokenAddress: string): Promise<Token> => {
  try {
    // Validate the address format
    if (!ethers.utils.isAddress(tokenAddress)) {
      throw new Error('Invalid token address format');
    }

    // Create a provider - using Infura for mainnet
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/5ce5333d107c4712938f37e0715b0327');
    
    // Create a contract instance
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    // Fetch token information
    const [name, symbol, decimals] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
    ]);
    
    // Return token information
    return {
      address: tokenAddress,
      name,
      symbol,
      decimals,
      logoURI: `https://raw.githubusercontent.com/uniswap/assets/master/blockchains/ethereum/assets/${tokenAddress}/logo.png`
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    
    // Return a default token with the address
    return {
      address: tokenAddress,
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      decimals: 18,
      logoURI: 'https://raw.githubusercontent.com/uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
    };
  }
};