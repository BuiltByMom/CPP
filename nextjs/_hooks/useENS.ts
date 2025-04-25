import {mainnet} from 'viem/chains';
import {useAccount, useEnsAvatar, useEnsName} from 'wagmi';

type TEns = {name: string; avatar: string; isLoading: boolean};

/************************************************************************************************
 ** useENS
 **
 ** A hook that fetches ENS name and avatar for the connected wallet address.
 **
 ** @returns An object containing:
 **   - name: The ENS name (empty string if none found)
 **   - avatar: The URL to the ENS avatar (empty string if none found)
 **   - isLoading: Boolean indicating if either name or avatar is still loading
 **
 ** Note:
 ** - Uses infinite stale time for name to prevent unnecessary refetches
 ** - Avatar is only fetched if a name is found
 ** - Returns empty strings for name and avatar if none found
 ************************************************************************************************/
export function useENS(): TEns {
	const {address} = useAccount();
	const {data: ensName, isLoading: isLoadingENS} = useEnsName({
		chainId: mainnet.id,
		address: address,
		query: {
			staleTime: Number.POSITIVE_INFINITY,
			enabled: !!address
		}
	});
	const {data: ensAvatar, isLoading: isLoadingENSAvatar} = useEnsAvatar({
		name: ensName || undefined,
		chainId: 1,
		query: {enabled: !!ensName}
	});

	return {
		name: ensName || '',
		avatar: ensAvatar || '',
		isLoading: isLoadingENS || isLoadingENSAvatar
	};
}
