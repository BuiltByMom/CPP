/************************************************************************************************
 ** WithChain Context
 **
 ** A context provider that manages the current blockchain network state.
 ** It determines the active chain from multiple sources (URL, wallet, hook) and provides
 ** a unified interface for accessing chain information throughout the application.
 **
 ** Usage:
 ** - Wrap your application with ChainProvider to enable chain context
 ** - Use useChain hook to access current chain information
 ** - Handles fallback chain selection when current chain is not supported
 **
 ** Dependencies:
 ** - wagmi: For wallet and chain information
 ** - next/navigation: For URL parameter access
 ** - React: For context and hooks
 ************************************************************************************************/

'use client';

import {NETWORKS} from '../_utils/constants';
import {useParams} from 'next/navigation';
import {type ReactElement, type ReactNode, createContext, useContext, useMemo} from 'react';
import {useAccount, useChainId} from 'wagmi';

import type {TChain} from '../_utils/constants';

/************************************************************************************************
 ** TChainContext
 **
 ** Type definition for the chain context value.
 **
 ** @property chainID - The numeric ID of the current chain
 ** @property source - The source of the chain information ('url', 'account', or 'hook')
 ** @property network - The full chain information object
 ************************************************************************************************/
type TChainContext = {
	chainID: number;
	source: 'url' | 'account' | 'hook';
	network: TChain | undefined;
};

const ChainContext = createContext<TChainContext | null>(null);

/************************************************************************************************
 ** ChainProvider
 **
 ** A context provider component that manages and provides chain information.
 **
 ** @param props - Component props
 **   - children: React nodes to be wrapped with chain context
 **
 ** @returns ReactElement
 **
 ** Chain Selection Priority:
 ** 1. URL chain (if specified and valid)
 ** 2. Wallet chain (if connected and supported)
 ** 3. Hook chain (fallback)
 ** 4. First supported chain (if no valid chain found)
 ************************************************************************************************/
export function ChainProvider({children}: {children: ReactNode}): ReactElement {
	/************************************************************************************************
	 ** Get chain information from different sources
	 **
	 ** - accountChainID: Current chain ID from connected wallet
	 ** - fromChainID: Chain ID from Wagmi hook
	 ** - chainSlug: Chain name from URL parameters
	 ************************************************************************************************/
	const {chainId: accountChainID} = useAccount();
	const fromChainID = useChainId();
	const params = useParams();
	const chainSlug = params?.chain as string | undefined;

	/************************************************************************************************
	 ** urlChain
	 **
	 ** Determines the chain from URL parameters.
	 ** Matches the chain slug from URL against supported networks.
	 **
	 ** @returns The matching chain object or null if not found
	 ************************************************************************************************/
	const urlChain = useMemo(() => {
		if (!chainSlug) {
			return null;
		}
		return NETWORKS.find(n => n.name.toLowerCase() === chainSlug.toLowerCase());
	}, [chainSlug]);

	/************************************************************************************************
	 ** isChainSupported
	 **
	 ** Checks if the current chain (from wallet or hook) is supported.
	 **
	 ** @returns boolean indicating if the current chain is in the supported networks list
	 ************************************************************************************************/
	const isChainSupported = useMemo(() => {
		const currentChainID = accountChainID || fromChainID;
		return NETWORKS.some(n => n.id === currentChainID);
	}, [accountChainID, fromChainID]);

	/************************************************************************************************
	 ** currentChain
	 **
	 ** Determines the active chain based on priority:
	 ** 1. First supported chain if current chain is not supported
	 ** 2. URL chain if specified
	 ** 3. Wallet chain if connected
	 ** 4. Hook chain as last resort
	 **
	 ** @returns TChainContext object with chain information and source
	 ************************************************************************************************/
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

/************************************************************************************************
 ** useChain
 **
 ** A hook to access the current chain context.
 **
 ** @returns TChainContext object containing current chain information
 **
 ** @throws Error if used outside of ChainProvider
 **
 ** Example:
 ** const {chainID, network} = useChain();
 ************************************************************************************************/
export function useChain(): TChainContext {
	const context = useContext(ChainContext);
	if (!context) {
		throw new Error('useChain must be used within a ChainProvider');
	}
	return context;
}
