/************************************************************************************************
 ** Decoder Tools
 **
 ** A set of utility functions for safely decoding values from contract calls or API responses.
 ** Provides type-safe decoding with default values for various data types.
 **
 ** Usage:
 ** - Use these functions to safely decode values from contract calls
 ** - Provides default values for failed decodings
 ** - Handles type checking and conversion
 **
 ** Dependencies:
 ** - viem: For address utilities
 ** - _utils/tools.addresses: For address type and conversion
 ************************************************************************************************/

import {toAddress} from './tools.addresses';
import {zeroAddress} from 'viem';

import type {TAddress} from './tools.addresses';

/************************************************************************************************
 ** TUnknowValueType
 **
 ** Union type representing a value that could be either a success or failure.
 **
 ** Success case:
 ** - status: 'success'
 ** - result: unknown value
 ** - error: undefined
 **
 ** Failure case:
 ** - status: 'failure'
 ** - error: Error object
 ** - result: undefined
 ************************************************************************************************/
type TUnknowValueType =
	| {
			error: Error;
			result?: undefined;
			status: 'failure';
	  }
	| {
			error?: undefined;
			result: unknown;
			status: 'success';
	  };

/************************************************************************************************
 ** decodeAsBigInt
 **
 ** Safely decodes a value as a bigint.
 **
 ** @param value - The value to decode
 ** @param defaultValue - Default value to return if decoding fails (default: 0n)
 ** @returns bigint - The decoded value or default
 **
 ** Note:
 ** - Returns defaultValue if value is undefined, has failure status, or is not a bigint
 ** - Attempts to convert result to bigint if possible
 ************************************************************************************************/
export function decodeAsBigInt(value: TUnknowValueType, defaultValue = 0n): bigint {
	if (!value?.status || value.status === 'failure') {
		return defaultValue;
	}
	try {
		if (typeof value.result !== 'bigint') {
			return defaultValue;
		}
		return BigInt(value.result);
	} catch {
		return defaultValue;
	}
}

/************************************************************************************************
 ** decodeAsString
 **
 ** Safely decodes a value as a string.
 **
 ** @param value - The value to decode
 ** @param defaultValue - Default value to return if decoding fails (default: '')
 ** @returns string - The decoded value or default
 **
 ** Note:
 ** - Returns defaultValue if value is undefined, has failure status, or is not a string
 ************************************************************************************************/
export function decodeAsString(value: TUnknowValueType, defaultValue = ''): string {
	if (!value?.status || value.status === 'failure') {
		return defaultValue;
	}
	try {
		if (typeof value.result !== 'string') {
			return defaultValue;
		}
		return value.result;
	} catch {
		return defaultValue;
	}
}

/************************************************************************************************
 ** decodeAsAddress
 **
 ** Safely decodes a value as an Ethereum address.
 **
 ** @param value - The value to decode
 ** @param defaultValue - Default value to return if decoding fails (default: zeroAddress)
 ** @returns TAddress - The decoded address or default
 **
 ** Note:
 ** - Returns defaultValue if value is undefined, has failure status, or is not a string
 ** - Converts string result to checksum address format
 ************************************************************************************************/
export function decodeAsAddress(value: TUnknowValueType, defaultValue = zeroAddress): TAddress {
	if (!value?.status || value.status === 'failure') {
		return defaultValue;
	}
	try {
		if (typeof value.result !== 'string') {
			return defaultValue;
		}
		return toAddress(value.result);
	} catch {
		return defaultValue;
	}
}

/************************************************************************************************
 ** decodeAsNumber
 **
 ** Safely decodes a value as a number.
 **
 ** @param value - The value to decode
 ** @param defaultValue - Default value to return if decoding fails (default: 0)
 ** @returns number - The decoded value or default
 **
 ** Note:
 ** - Returns defaultValue if value is undefined, has failure status, or is not a number
 ************************************************************************************************/
export function decodeAsNumber(value: TUnknowValueType, defaultValue = 0): number {
	if (!value?.status || value.status === 'failure') {
		return defaultValue;
	}
	try {
		if (typeof value.result !== 'number') {
			return defaultValue;
		}
		return value.result;
	} catch {
		return defaultValue;
	}
}

/************************************************************************************************
 ** decodeAsBoolean
 **
 ** Safely decodes a value as a boolean.
 **
 ** @param value - The value to decode
 ** @param defaultValue - Default value to return if decoding fails (default: false)
 ** @returns boolean - The decoded value or default
 **
 ** Note:
 ** - Returns defaultValue if value is undefined, has failure status, or is not a boolean
 ************************************************************************************************/
export function decodeAsBoolean(value: TUnknowValueType, defaultValue = false): boolean {
	if (!value?.status || value.status === 'failure') {
		return defaultValue;
	}
	try {
		if (typeof value.result !== 'boolean') {
			return defaultValue;
		}
		return value.result;
	} catch {
		return defaultValue;
	}
}
