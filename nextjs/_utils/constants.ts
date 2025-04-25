/************************************************************************************************
 ** Constants
 **
 ** Core constants and type definitions for the application.
 ** Defines supported networks, contract addresses, and related types.
 **
 ** Usage:
 ** - Import these constants for network and contract configuration
 ** - Use TChain type for type-safe chain operations
 ** - Reference NETWORKS array for supported chain information
 **
 ** Dependencies:
 ** - viem/chains: For chain type definitions and base configurations
 ************************************************************************************************/

import {base, optimism} from 'viem/chains';

import type {Chain} from 'viem/chains';

/************************************************************************************************
 ** MULTICALL_CONTRACT
 **
 ** The address of the Multicall3 contract used for batch contract calls.
 ** This is a standard contract address used across multiple networks.
 ************************************************************************************************/
export const MULTICALL_CONTRACT = '0xcA11bde05977b3631167028862bE2a173976CA11';

/************************************************************************************************
 ** TChain
 **
 ** Extended chain type that includes additional contract configurations.
 **
 ** @property contracts - Contract configurations
 **   - multicall3: Address of the Multicall3 contract
 **
 ** Note: Extends the base Chain type from viem
 ************************************************************************************************/
export type TChain = Chain & {
	contracts: {
		multicall3: {address: `0x${string}`};
	} & Chain['contracts'];
};

/************************************************************************************************
 ** NETWORKS
 **
 ** Array of supported networks with their configurations.
 ** Each network includes:
 ** - Base chain configuration from viem
 ** - Custom RPC URL from environment variables
 ** - Network name
 ** - Multicall3 contract address
 **
 ** Currently supports:
 ** - Optimism (chainId: 10)
 ** - Base (chainId: 8453)
 ************************************************************************************************/
export const NETWORKS: TChain[] = [
	{
		...optimism,
		rpcUrls: {default: {http: [process.env.RPC_URI_FOR_10 as string]}},
		name: 'Optimism',
		contracts: {
			multicall3: {address: MULTICALL_CONTRACT}
		}
	},
	{
		...base,
		rpcUrls: {default: {http: [process.env.RPC_URI_FOR_8453 as string]}},
		name: 'Base',
		contracts: {
			multicall3: {address: MULTICALL_CONTRACT}
		}
	}
];
