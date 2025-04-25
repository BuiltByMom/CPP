'use client';

import {NETWORKS} from '../_utils/constants';
import {useParams} from 'next/navigation';
import {type ReactElement, type ReactNode, createContext, useContext, useMemo} from 'react';
import {useAccount, useChainId} from 'wagmi';

import type {TChain} from '../_utils/constants';

type TChainContext = {
	chainID: number;
	source: 'url' | 'account' | 'hook';
	network: TChain | undefined;
};

const ChainContext = createContext<TChainContext | null>(null);

export function ChainProvider({children}: {children: ReactNode}): ReactElement {
	const {chainId: accountChainID} = useAccount();
	const fromChainID = useChainId();
	const params = useParams();

	const chainSlug = params?.chain as string | undefined;

	// Get chain from URL
	const urlChain = useMemo(() => {
		if (!chainSlug) {
			return null;
		}
		return NETWORKS.find(n => n.name.toLowerCase() === chainSlug.toLowerCase());
	}, [chainSlug]);

	const isChainSupported = useMemo(() => {
		const currentChainID = accountChainID || fromChainID;
		return NETWORKS.some(n => n.id === currentChainID);
	}, [accountChainID, fromChainID]);

	// Determine the current chain
	const currentChain = useMemo(() => {
		// If chain is not supported, use first supported chain
		if (!isChainSupported) {
			return {
				chainID: NETWORKS[0].id,
				source: 'hook' as const,
				network: NETWORKS[0]
			};
		}

		if (urlChain) {
			return {
				chainID: urlChain.id,
				source: 'url' as const,
				network: urlChain
			};
		}

		// Fallback to wallet chain if no URL chain
		if (accountChainID) {
			return {
				chainID: accountChainID,
				source: 'account' as const,
				network: NETWORKS.find(n => n.id === accountChainID)
			};
		}

		// Last resort: use hook chain
		return {chainID: fromChainID, source: 'hook' as const, network: NETWORKS.find(n => n.id === fromChainID)};
	}, [accountChainID, fromChainID, isChainSupported, urlChain]);

	return <ChainContext.Provider value={currentChain}>{children}</ChainContext.Provider>;
}

export function useChain(): TChainContext {
	const context = useContext(ChainContext);
	if (!context) {
		throw new Error('useChain must be used within a ChainProvider');
	}
	return context;
}
