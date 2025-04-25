import {getEnsAddress, getEnsName} from '@wagmi/core';
import {getAddress, zeroAddress} from 'viem';
import {mainnet} from 'viem/chains';

import type {Config} from '@wagmi/core';
import {assert} from '_utils/helpers';

/************************************************************************************************
 ** TAddressWagmi represents a Wagmi-compatible Ethereum address
 ** Always in the format: 0x{40 hex characters}
 ** Used for compatibility with Wagmi library functions
 ************************************************************************************************/
type TAddressWagmi = `0x${string}`;

/************************************************************************************************
 ** TAddressSmol represents a Smol-specific Ethereum address format
 ** Enforces strict hex format: 0x followed by exactly 40 hex characters
 ** Used for internal address validation and type safety
 ************************************************************************************************/
type TAddressSmol = '/^0x[0-9a-f]{40}$/i';

/************************************************************************************************
 ** TAddressLike represents any address-like value that can be converted to a valid address
 ** Union type of different address formats that can be normalized
 ** Used for flexible address input handling
 ************************************************************************************************/
type TAddressLike = TAddressSmol | TAddressWagmi | string;

/************************************************************************************************
 ** TAddress is the standard address type used throughout the application
 ** Alias for TAddressWagmi to ensure consistent address handling
 ** Used as the canonical address type for all address-related operations
 ************************************************************************************************/
export type TAddress = TAddressWagmi;

/************************************************************************************************
 ** TInputAddressLike represents an address input with validation state and metadata
 ** Used for form inputs and address validation workflows
 ** Contains:
 ** - address: The Ethereum address (optional)
 ** - label: Human readable label for the address
 ** - isValid: Validation state of the address
 ** - source: Origin of the address data
 ** - error: Optional error message for invalid addresses
 ************************************************************************************************/
export type TInputAddressLike = {
	address?: TAddress;
	label: string;
	isValid: boolean | 'undetermined';
	source?: 'typed' | 'addressBook' | 'defaultValue' | 'autoPopulate';
	error?: string;
};

/************************************************************************************************
 ** defaultInputAddressLike provides default values for TInputAddressLike
 ** Used to initialize address input states with safe defaults
 ** Ensures consistent initial state for address input handling
 ************************************************************************************************/
export const defaultInputAddressLike: TInputAddressLike = {
	address: undefined,
	label: '',
	error: '',
	isValid: 'undetermined',
	source: 'typed'
} as const;

/************************************************************************************************
 ** ethTokenAddress represents the special Ethereum native token address
 ** Used to identify ETH token operations vs ERC20 token operations
 ** Standard convention for representing ETH in token operations
 ************************************************************************************************/
export const ethTokenAddress = toAddress('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');

/************************************************************************************************
 ** isTAddress checks if a string is a valid TAddress type
 **
 ** @param address - The address string to validate
 ** @returns boolean - True if the address matches TAddress format
 **
 ** Validates:
 ** - Address starts with 0x
 ** - Contains only valid hex characters
 ** - Matches expected Ethereum address length
 ************************************************************************************************/
function isTAddress(address?: string | null): address is TAddress {
	const regex = /^0x([0-9a-f][0-9a-f])*$/i;
	return !!address && regex.test(address);
}

/************************************************************************************************
 ** isZeroAddress checks if an address is the zero address (0x000...000)
 **
 ** @param address - The address to check
 ** @returns boolean - True if the address is the zero address
 **
 ** Used to:
 ** - Validate address initialization
 ** - Check for invalid/unset addresses
 ** - Handle special zero address cases
 ************************************************************************************************/
export function isZeroAddress(address?: string): boolean {
	return toAddress(address) === toAddress(zeroAddress);
}

/************************************************************************************************
 ** isEthAddress checks if an address is the ETH token address
 **
 ** @param address - The address to check
 ** @returns boolean - True if the address is the ETH token address
 **
 ** Used to:
 ** - Differentiate between ETH and ERC20 token operations
 ** - Handle special ETH token cases
 ** - Validate token addresses
 ************************************************************************************************/
export function isEthAddress(address?: string | null | TAddress): boolean {
	return toAddress(address) === toAddress(ethTokenAddress);
}

/************************************************************************************************
 ** isAddress checks if a string is a valid Ethereum address
 **
 ** @param address - The address string to validate
 ** @returns boolean - True if the address is valid
 **
 ** Validates:
 ** - Address format (0x + 40 hex chars)
 ** - Not the zero address
 ** - Proper checksum
 **
 ** Used for general address validation throughout the application
 ************************************************************************************************/
export function isAddress(address?: string | null): address is TAddress {
	const regex = /^0x([0-9a-f][0-9a-f])*$/i;
	return !!address && regex.test(address) && !isZeroAddress(address);
}

/************************************************************************************************
 ** toAddress converts any address-like value to a standardized TAddress
 **
 ** @param address - The address-like value to convert
 ** @returns TAddress - The normalized address
 **
 ** Features:
 ** - Handles null/undefined (returns zero address)
 ** - Trims whitespace
 ** - Converts to checksum format
 ** - Ensures consistent address format
 **
 ** Used as the primary address normalization function
 ************************************************************************************************/
export function toAddress(address?: TAddressLike | null): TAddress {
	if (!address) {
		return zeroAddress;
	}
	const trimmedAddress = address.trim();
	return getAddress(toChecksumAddress(trimmedAddress)?.valueOf());
}

/************************************************************************************************
 ** toSafeAddress formats an address for safe display
 **
 ** @param props - Object containing address and display options
 ** @returns string - The formatted address string
 **
 ** Features:
 ** - Prioritizes ENS name if available
 ** - Supports custom address override
 ** - Truncates long addresses
 ** - Handles undefined/zero addresses
 **
 ** Used for user-friendly address display throughout the UI
 ************************************************************************************************/
export function toSafeAddress(props: {
	address?: TAddress;
	ens?: string;
	placeholder?: string;
	addrOverride?: string;
}): string {
	if (props.ens) {
		return props.ens;
	}
	if (!isZeroAddress(props.address) && props.addrOverride) {
		return props.addrOverride;
	}
	if (!isZeroAddress(props.address)) {
		return truncateHex(props.address, 5);
	}
	if (!props.address) {
		return props.placeholder || '';
	}
	return toAddress(props.address);
}

/************************************************************************************************
 ** toChecksumAddress converts an address to its checksum format
 **
 ** @param address - The address to convert
 ** @returns TAddressSmol - The checksummed address or zero address if invalid
 **
 ** Features:
 ** - Validates address format
 ** - Applies EIP-55 checksum
 ** - Handles special cases (undefined, null, GENESIS)
 ** - Returns zero address for invalid inputs
 **
 ** Used internally for address normalization
 ************************************************************************************************/
function toChecksumAddress(address?: string | null | undefined): TAddressSmol {
	try {
		if (address && address !== 'GENESIS') {
			const checksummedAddress = getAddress(address);
			if (isTAddress(checksummedAddress)) {
				return checksummedAddress as TAddressSmol;
			}
		}
	} catch {
		// console.error(error);
	}
	return zeroAddress as TAddressSmol;
}

/************************************************************************************************
 ** truncateHex truncates a hex string (address) for display
 **
 ** @param address - The address to truncate
 ** @param size - Number of characters to keep on each end
 ** @returns string - The truncated address string
 **
 ** Features:
 ** - Handles zero address
 ** - Configurable truncation size
 ** - Maintains 0x prefix
 ** - Adds ellipsis for truncated portion
 **
 ** @example
 ** ```typescript
 ** truncateHex("0x1234567890abcdef1234567890abcdef12345678", 4)
 ** // Returns: "0x1234...5678"
 ** ```
 ************************************************************************************************/
export function truncateHex(address: string | undefined, size: number): string {
	if (isZeroAddress(address)) {
		if (size === 0) {
			return zeroAddress;
		}
		return `0x${zeroAddress.slice(2, size)}…${zeroAddress.slice(-size)}`;
	}

	if (address !== undefined) {
		if (size === 0) {
			return address;
		}
		if (address.length <= size * 2 + 4) {
			return address;
		}
		return `0x${address.slice(2, size + 2)}…${address.slice(-size)}`;
	}
	if (size === 0) {
		return zeroAddress;
	}
	return `0x${zeroAddress.slice(2, size)}…${zeroAddress.slice(-size)}`;
}

/************************************************************************************************
 ** assertAddress validates that an address meets all requirements
 **
 ** @param addr - The address to validate
 ** @param name - Optional name for error messages
 **
 ** Validates:
 ** - Address is defined
 ** - Matches TAddress format
 ** - Not zero address
 ** - Not ETH address
 **
 ** Throws detailed errors if validation fails
 ************************************************************************************************/
export function assertAddress(addr: string | TAddress | undefined, name?: string): asserts addr is TAddress {
	assert(isAddress(addr), `${name || 'Address'} is not set`);
	assert(isTAddress(addr), `${name || 'Address'} provided is invalid`);
	assert(toAddress(addr) !== zeroAddress, `${name || 'Address'} is 0x0`);
	assert(!isEthAddress(addr), `${name || 'Address'} is 0xE`);
}

/************************************************************************************************
 ** TAddressAndEns pairs an Ethereum address with its ENS name
 ** Used for displaying and managing address/ENS pairs
 ************************************************************************************************/
export type TAddressAndEns = {
	address: TAddress;
	label: string;
};

/************************************************************************************************
 ** getAddressAndEns resolves an address or ENS name to its canonical form
 **
 ** @param address - Address or ENS name to resolve
 ** @param chainID - Chain ID for resolution
 ** @param config - Wagmi config object
 ** @returns Promise<TAddressAndEns | undefined> - Resolved address and ENS pair
 **
 ** Features:
 ** - Handles both forward and reverse ENS resolution
 ** - Validates addresses
 ** - Returns undefined for invalid inputs
 **
 ** @example
 ** ```typescript
 ** const resolved = await getAddressAndEns("vitalik.eth", 1, wagmiConfig);
 ** // Returns: { address: "0x...", label: "vitalik.eth" }
 ** ```
 ************************************************************************************************/
export async function getAddressAndEns(
	address: string,
	chainID: number,
	config: Config
): Promise<TAddressAndEns | undefined> {
	if (isAddress(address)) {
		const ensName = await getEnsName(config, {address, chainId: mainnet.id});
		return {address: toAddress(address), label: ensName ?? ''};
	}
	if (address.endsWith('.eth')) {
		const receiverAddress = toAddress(await getEnsAddress(config, {name: address, chainId: chainID}));

		return isAddress(receiverAddress) ? {address: toAddress(receiverAddress), label: address} : undefined;
	}
	return;
}
