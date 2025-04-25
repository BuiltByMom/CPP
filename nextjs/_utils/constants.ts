import {base, optimism} from 'viem/chains';

import type {Chain} from 'viem/chains';

export const MULTICALL_CONTRACT = '0xcA11bde05977b3631167028862bE2a173976CA11';

export type TChain = Chain & {
	contracts: {
		multicall3: {address: `0x${string}`};
	} & Chain['contracts'];
};

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
