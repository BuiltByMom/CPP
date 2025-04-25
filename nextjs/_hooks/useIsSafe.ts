/************************************************************************************************
 ** useIsSafe Hook
 **
 ** A hook that detects if the current environment is using Gnosis Safe (formerly Safe{Wallet}).
 ** It checks both the wallet connector and the iframe environment to determine if the user
 ** is interacting through a Safe interface.
 **
 ** Usage:
 ** - Use this hook when you need to detect if the user is using Gnosis Safe
 ** - Useful for adapting UI or behavior for Safe users
 ** - Handles both direct Safe wallet connections and Safe iframe environments
 **
 ** Dependencies:
 ** - wagmi: For wallet connection information
 ** - React: For hooks and memoization
 ************************************************************************************************/

'use client';

import {useMemo} from 'react';
import {useAccount} from 'wagmi';

/************************************************************************************************
 ** useIsSafe
 **
 ** A hook that determines if the current environment is using Gnosis Safe.
 **
 ** @returns boolean indicating if the user is using Gnosis Safe
 **
 ** Note:
 ** - Checks both the wallet connector and iframe environment
 ** - Returns true if either condition is met
 ** - Handles various Safe integration scenarios (direct connection, iframe, etc.)
 ************************************************************************************************/
export function useIsSafe(): boolean {
	const {connector} = useAccount();

	/************************************************************************************************
	 ** isInSafeIFrame
	 **
	 ** Determines if the current environment is running inside a Gnosis Safe iframe.
	 ** Checks multiple conditions to ensure accurate detection:
	 ** 1. If running in an iframe
	 ** 2. If the iframe is from app.safe.global
	 ** 3. If the parent window is from app.safe.global
	 ** 4. If the current window is from app.safe.global
	 **
	 ** @returns boolean indicating if running in a Safe iframe
	 ************************************************************************************************/
	function isInSafeIFrame(): boolean {
		if (typeof window === 'undefined') {
			return false;
		}
		if (
			window !== window.top ||
			window.top !== window.self ||
			(document?.location?.ancestorOrigins || []).length !== 0
		) {
			// check if https://app.safe.global is ancestor
			if (Array.from(document?.location?.ancestorOrigins || []).includes('https://app.safe.global')) {
				return true;
			}
			// check if https://app.safe.global is parent
			if (window.top?.location?.href?.includes('https://app.safe.global')) {
				return true;
			}

			// check if https://app.safe.global is self
			if (window.self?.location?.href?.includes('https://app.safe.global')) {
				return true;
			}

			return true;
		}
		return false;
	}

	/************************************************************************************************
	 ** isUsingSafe
	 **
	 ** Determines if the current wallet connection is using Gnosis Safe.
	 ** Checks both the connector ID and wallet ID to ensure accurate detection.
	 **
	 ** @returns boolean indicating if using Safe wallet
	 ************************************************************************************************/
	const isUsingSafe = useMemo(() => {
		return (
			connector?.id === 'safe' ||
			(connector as unknown as {_wallets?: {id: string}[]})?._wallets?.[0]?.id === 'safe' ||
			false
		);
	}, [connector]);

	return isUsingSafe || isInSafeIFrame();
}
