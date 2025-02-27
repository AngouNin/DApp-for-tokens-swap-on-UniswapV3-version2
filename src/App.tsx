import { createConfig, http, WagmiProvider, useAccount, useConnect, useDisconnect } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';
import { mainnet } from 'wagmi/chains';
import { Wallet, ArrowRightLeft, AlertCircle } from 'lucide-react';
import SwapInterface from './components/SwapInterface';

const queryClient = new QueryClient();

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  connectors: [
    injected(),
  ],
});

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-900 text-white">
          <div className="container mx-auto px-4 py-8">
            <Header />
            <main className="mt-8">
              <SwapContainer />
            </main>
            <footer className="mt-16 text-center text-gray-500 text-sm">
              <p>Uniswap V4 Swap dApp - {new Date().getFullYear()}</p>
            </footer>
          </div>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function Header() {
  return (
    <header className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <ArrowRightLeft className="h-6 w-6 text-purple-500" />
        <h1 className="text-2xl font-bold">Uniswap V4 Swap</h1>
      </div>
      <ConnectButton />
    </header>
  );
}

function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (isConnected && address) {
    return (
      <button
        onClick={handleDisconnect}
        className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
      >
        <span className="mr-2">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
        <Wallet className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
    >
      <span className="mr-2">Connect Wallet</span>
      <Wallet className="h-4 w-4" />
    </button>
  );
}

function SwapContainer() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto bg-gray-800 rounded-xl shadow-md p-8 text-center">
        <AlertCircle className="h-12 w-12 text-purple-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Wallet Not Connected</h2>
        <p className="text-gray-400 mb-4">Please connect your wallet to use the swap interface.</p>
      </div>
    );
  }

  return <SwapInterface />;
}

export default App;