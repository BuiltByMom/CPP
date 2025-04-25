/************************************************************************************************
 ** WithMom Context
 **
 ** A comprehensive context provider that sets up the entire Web3 infrastructure for the application.
 ** It configures and provides Wagmi, RainbowKit, and chain management in a single wrapper.
 **
 ** Usage:
 ** - Wrap your application with WithMom to enable all Web3 functionality
 ** - Configures wallet connections, RPC endpoints, and chain management
 ** - Provides a unified interface for Web3 interactions
 **
 ** Dependencies:
 ** - @rainbow-me/rainbowkit: For wallet UI and connection management
 ** - wagmi: For Web3 interactions
 ** - @tanstack/react-query: For data fetching and caching
 ** - viem: For chain and RPC configuration
 ************************************************************************************************/

'use client';

import {ChainProvider} from './WithChain';
import {RainbowKitProvider, getDefaultConfig} from '@rainbow-me/rainbowkit';
import {
	coinbaseWallet,
	frameWallet,
	injectedWallet,
	ledgerWallet,
	metaMaskWallet,
	rainbowWallet,
	safeWallet,
	walletConnectWallet
} from '@rainbow-me/rainbowkit/wallets';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {NETWORKS} from '../_utils/constants';
import {http, cookieStorage, createStorage, fallback} from '@wagmi/core';
import {WagmiProvider} from 'wagmi';
import {hashFn} from 'wagmi/query';

import type {AvatarComponent, DisclaimerComponent, Theme} from '@rainbow-me/rainbowkit';
import type {ReactElement} from 'react';
import type {Chain} from 'viem';
import type {State} from 'wagmi';
import type {_chains} from '@rainbow-me/rainbowkit/dist/config/getDefaultConfig';

/************************************************************************************************
 ** withRPC
 **
 ** Configures RPC endpoints for a given network chain.
 ** Handles multiple RPC sources and fallbacks in a specific order:
 ** 1. Environment-specific RPC
 ** 2. Legacy RPC configuration
 ** 3. Default chain RPC
 ** 4. Alchemy/Infura endpoints (if configured)
 **
 ** @param network - The chain to configure RPC for
 ** @returns Configured RPC transport with fallback support
 ************************************************************************************************/
export function withRPC(network: Chain): ReturnType<typeof fallback> {
	const httpTransport: string[] = [];

	const newRPC = process.env.RPC_URI_FOR?.[network.id] || '';
	const newRPCBugged = process.env[`RPC_URI_FOR_${network.id}`];
	const oldRPC = process.env.JSON_RPC_URI?.[network.id] || process.env.JSON_RPC_URL?.[network.id];
	const defaultJsonRPCURL = network?.rpcUrls?.public?.http?.[0];
	const injectedRPC = newRPC || oldRPC || newRPCBugged || defaultJsonRPCURL || '';

	if (injectedRPC) {
		httpTransport.push(injectedRPC);
	}
	if (network?.rpcUrls.alchemy?.http[0] && process.env.ALCHEMY_KEY) {
		httpTransport.push(`${network?.rpcUrls.alchemy.http[0]}/${process.env.ALCHEMY_KEY}`);
	}
	if (network?.rpcUrls.infura?.http[0] && process.env.INFURA_PROJECT_ID) {
		httpTransport.push(`${network?.rpcUrls.infura.http[0]}/${process.env.INFURA_PROJECT_ID}`);
	}
	if (!network.rpcUrls.default) {
		network.rpcUrls.default = {http: [], webSocket: []};
	}
	const defaultHttp = [...new Set([...httpTransport, ...(network.rpcUrls.default?.http || [])].filter(Boolean))];

	return fallback(defaultHttp.map(rpc => http(rpc)));
}

// Configure RPC transports for all supported networks
const allTransports: {[key: number]: ReturnType<typeof fallback>} = {};
for (const chain of NETWORKS) {
	allTransports[chain.id] = withRPC(chain);
}

/************************************************************************************************
 ** config
 **
 ** Default configuration for RainbowKit and Wagmi.
 ** Sets up:
 ** - App name and project ID
 ** - Supported chains
 ** - Wallet configurations
 ** - Storage settings
 ** - RPC transports
 ************************************************************************************************/
export const config = getDefaultConfig({
	appName: (process.env.WALLETCONNECT_PROJECT_NAME as string) || '',
	projectId: process.env.WALLETCONNECT_PROJECT_ID as string,
	chains: NETWORKS as unknown as _chains,
	ssr: true,
	syncConnectedChain: true,
	wallets: [
		{
			groupName: 'Popular',
			wallets: [
				injectedWallet,
				frameWallet,
				metaMaskWallet,
				walletConnectWallet,
				rainbowWallet,
				ledgerWallet,
				coinbaseWallet,
				safeWallet
			]
		}
	],
	storage: createStorage({
		storage: cookieStorage
	}),
	transports: allTransports
});

/************************************************************************************************
 ** TWithMom
 **
 ** Type definition for the WithMom component props.
 **
 ** @property children - React element to be wrapped
 ** @property initialState - Optional initial Wagmi state
 ** @property defaultNetwork - Optional default network
 ** @property supportedChains - Array of supported chains
 ** @property tokenLists - Optional array of token list URLs
 ** @property rainbowConfig - Optional RainbowKit configuration
 ************************************************************************************************/
type TWithMom = {
	children: ReactElement;
	initialState?: State;
	defaultNetwork?: Chain;
	supportedChains: Chain[];
	tokenLists?: string[];
	rainbowConfig?: {
		initialChain?: Chain | number;
		id?: string;
		theme?: Theme | null;
		showRecentTransactions?: boolean;
		appInfo?: {
			appName?: string;
			learnMoreUrl?: string;
			disclaimer?: DisclaimerComponent;
		};
		coolMode?: boolean;
		avatar?: AvatarComponent;
		modalSize?: 'compact' | 'wide';
	};
};

// Configure React Query client with Wagmi's hash function
const queryClient = new QueryClient({defaultOptions: {queries: {queryKeyHashFn: hashFn}}});

/************************************************************************************************
 ** WithMom
 **
 ** The main context provider component that sets up the entire Web3 infrastructure.
 **
 ** @param props - Component props (see TWithMom type)
 ** @returns ReactElement
 **
 ** Features:
 ** - Configures Wagmi provider with RPC endpoints
 ** - Sets up React Query for data management
 ** - Configures RainbowKit for wallet UI
 ** - Provides chain management through ChainProvider
 ** - Handles iframe detection for reconnection
 ************************************************************************************************/
function WithMom({children, rainbowConfig, initialState}: TWithMom): ReactElement {
	/************************************************************************************************
	 ** isIframe
	 **
	 ** Determines if the current environment is running inside an iframe.
	 ** Used to control reconnection behavior in Wagmi provider.
	 **
	 ** @returns boolean indicating if running in an iframe
	 ************************************************************************************************/
	function isIframe(): boolean {
		if (typeof window === 'undefined') {
			return false;
		}
		if (
			window !== window.top ||
			window.top !== window.self ||
			(document?.location?.ancestorOrigins || []).length !== 0
		) {
			return true;
		}
		return false;
	}

	return (
		<WagmiProvider config={config} reconnectOnMount={!isIframe()} initialState={initialState}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider {...rainbowConfig}>
					<ChainProvider>{children}</ChainProvider>
				</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}

export {WithMom};
