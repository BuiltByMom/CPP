export function assert(condition: boolean, message?: string | Error): asserts condition {
	if (!condition) {
		if (typeof message === 'string') {
			throw new Error(message);
		}
		throw message;
	}
}

export const ipfsToURI = (ipfsURI: string, rootURI: string): string => {
	if (!ipfsURI) {
		return '';
	}
	if (ipfsURI.startsWith('ipfs://')) {
		return ipfsURI.replace('ipfs://', rootURI);
	}
	if (ipfsURI.startsWith('https://')) {
		return ipfsURI;
	}

	return ipfsURI;
};

export const getExplorerUrl = (url?: string, address?: string): string => {
	if (!url || !address) {
		return '';
	}

	return `${url}/address/${address}`;
};

export function stringToBoolean(value: string | boolean | undefined): boolean {
	if (!value) {
		return false;
	}
	if (typeof value === 'boolean') {
		return value;
	}
	if (value.toLowerCase() === 'true') {
		return true;
	}
	return false;
}
