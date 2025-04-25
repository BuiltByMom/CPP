/************************************************************************************************
 ** useLoginModal Hook
 **
 ** A hook that provides a unified interface for handling wallet connection and account management
 ** through RainbowKit modals. It intelligently determines which modal to show based on the user's
 ** connection state and environment.
 **
 ** Usage:
 ** - Use this hook when you need to handle wallet connection and account management
 ** - Provides a single function that handles both connection and account management
 ** - Automatically detects iframe environments and handles Ledger connections appropriately
 **
 ** Dependencies:
 ** - @rainbow-me/rainbowkit: For modal management
 ** - wagmi: For wallet connection and account state
 ************************************************************************************************/

import {useAccountModal, useChainModal, useConnectModal} from '@rainbow-me/rainbowkit';
import {useCallback} from 'react';
import {useAccount, useConnect} from 'wagmi';

/************************************************************************************************
 ** useLoginModal
 **
 ** A hook that returns a function to handle wallet connection and account management.
 **
 ** @returns A function that:
 **   - Opens the account modal if user is connected
 **   - Opens the connect modal if user is not connected
 **   - Handles special cases for iframe environments and Ledger connections
 **   - Falls back to chain modal if other modals are unavailable
 **
 ** Example:
 ** const openLoginModal = useLoginModal();
 ** // Later in your code:
 ** await openLoginModal();
 ************************************************************************************************/
export function useLoginModal(): () => Promise<void> {
	const {address, isConnected, connector, chain} = useAccount();
	const {connectors, connectAsync} = useConnect();
	const {openAccountModal} = useAccountModal();
	const {openConnectModal} = useConnectModal();
	const {openChainModal} = useChainModal();

	/************************************************************************************************
	 ** isIframe
	 **
	 ** Determines if the current environment is running inside an iframe.
	 ** This is important for handling Ledger connections in iframe environments.
	 **
	 ** @returns boolean indicating if the code is running in an iframe
	 ************************************************************************************************/
	const isIframe = useCallback((): boolean => {
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
	}, []);

	/************************************************************************************************
	 ** openLoginModal
	 **
	 ** The main function that handles wallet connection and account management.
	 ** It intelligently determines which modal to show based on the user's state.
	 **
	 ** @returns Promise<void>
	 **
	 ** Flow:
	 ** 1. If connected: Opens account modal
	 ** 2. If not connected:
	 **    - In iframe with Ledger: Connects directly
	 **    - Otherwise: Opens connect modal
	 ** 3. Falls back to chain modal if other modals unavailable
	 ************************************************************************************************/
	const openLoginModal = useCallback(async (): Promise<void> => {
		if (isConnected && connector && address) {
			if (openAccountModal) {
				openAccountModal();
			} else {
				if (openChainModal) {
					openChainModal();
					return;
				}
				console.warn('Impossible to open account modal');
			}
		} else {
			const ledgerConnector = connectors.find((c): boolean => c.id.toLowerCase().includes('ledger'));
			if (isIframe() && ledgerConnector) {
				await connectAsync({connector: ledgerConnector, chainId: chain?.id});
				return;
			}

			if (openConnectModal) {
				openConnectModal();
			} else {
				if (openChainModal) {
					openChainModal();
					return;
				}
				console.warn('Impossible to open login modal');
			}
		}
	}, [
		address,
		chain?.id,
		connectAsync,
		connector,
		connectors,
		isConnected,
		openAccountModal,
		openChainModal,
		openConnectModal,
		isIframe
	]);

	return openLoginModal;
}
