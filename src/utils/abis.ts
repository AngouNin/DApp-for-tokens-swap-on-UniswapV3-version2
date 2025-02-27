// Simplified ABI for Uniswap V4 Swap Router
export const SWAP_ROUTER_V4_ABI = [
  // Swap ETH for Tokens
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  
  // Swap Tokens for ETH
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  
  // Swap Tokens for Tokens
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  
  // Get amounts out
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  
  // Get amounts in
  'function getAmountsIn(uint amountOut, address[] memory path) public view returns (uint[] memory amounts)'
];

// ERC20 Token ABI
export const ERC20_ABI = [
  // Read-only functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  
  // Write functions
  'function approve(address spender, uint256 value) returns (bool)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];