/************************************************************************************************
 ** Helper Functions
 **
 ** A collection of utility functions for common operations.
 ** Includes assertion, URI conversion, and type conversion helpers.
 **
 ** Usage:
 ** - Use these functions for common utility operations
 ** - Provides type-safe assertions
 ** - Handles IPFS URI conversions
 ** - Manages explorer URL generation
 ** - Converts string values to booleans
 ************************************************************************************************/

/************************************************************************************************
 ** assert
 **
 ** Type-safe assertion function that throws an error if the condition is false.
 **
 ** @param condition - The condition to assert
 ** @param message - Optional error message or Error object
 **
 ** @throws Error if condition is false
 **
 ** Example:
 ** assert(value !== undefined, 'Value must be defined');
 ************************************************************************************************/
export function assert(condition: boolean, message?: string | Error): asserts condition {
	if (!condition) {
		if (typeof message === 'string') {
			throw new Error(message);
		}
		throw message;
	}
}

/************************************************************************************************
 ** ipfsToURI
 **
 ** Converts an IPFS URI to a HTTP URI using a provided root URI.
 **
 ** @param ipfsURI - The IPFS URI to convert
 ** @param rootURI - The root URI to use for conversion
 **
 ** @returns The converted HTTP URI
 **
 ** Note:
 ** - Handles empty URIs
 ** - Preserves HTTPS URIs
 ** - Converts ipfs:// to HTTP using rootURI
 ************************************************************************************************/
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

/************************************************************************************************
 ** getExplorerUrl
 **
 ** Generates a blockchain explorer URL for a given address.
 **
 ** @param url - The base explorer URL
 ** @param address - The address to generate the URL for
 **
 ** @returns The complete explorer URL
 **
 ** Note:
 ** - Returns empty string if either parameter is missing
 ** - Appends address to the base URL
 ************************************************************************************************/
export const getExplorerUrl = (url?: string, address?: string): string => {
	if (!url || !address) {
		return '';
	}

	return `${url}/address/${address}`;
};

/************************************************************************************************
 ** stringToBoolean
 **
 ** Converts a string or boolean value to a boolean.
 **
 ** @param value - The value to convert
 **
 ** @returns The boolean value
 **
 ** Conversion Rules:
 ** - undefined/null/empty string -> false
 ** - boolean -> same value
 ** - 'true' (case-insensitive) -> true
 ** - any other string -> false
 ************************************************************************************************/
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
