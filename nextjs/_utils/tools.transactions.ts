/************************************************************************************************
 ** Transaction Tools
 **
 ** A comprehensive set of utilities for handling blockchain transactions.
 ** Includes transaction status management, error handling, and a Transaction class
 ** for building and executing transactions.
 **
 ** Usage:
 ** - Use Transaction class for building and executing transactions
 ** - Use handleTx for direct transaction handling
 ** - Use status constants for transaction state management
 **
 ** Dependencies:
 ** - @wagmi/core: For contract interactions
 ** - viem: For error handling and types
 ** - _utils/tools: For address and number utilities
 ************************************************************************************************/

import {assertAddress} from './tools.addresses';
import {toBigInt} from './tools.numbers';
import {simulateContract, switchChain, waitForTransactionReceipt, writeContract} from '@wagmi/core';
import {BaseError} from 'viem';

import type {TAddress} from './tools.addresses';
import type {Config, SimulateContractParameters} from '@wagmi/core';
import type {Dispatch, SetStateAction} from 'react';
import type {TransactionReceipt} from 'viem';
import type {Connector} from 'wagmi';
import {assert} from '_utils/helpers';

/************************************************************************************************
 ** Transaction Status Constants
 **
 ** Default status states for transaction management.
 ** Used to track the current state of a transaction.
 ************************************************************************************************/
export const defaultTxStatus = {none: true, pending: false, success: false, error: false, errorMessage: ''};
const errorTxStatus = {none: false, pending: false, success: false, error: true, errorMessage: ''};
const pendingTxStatus = {none: false, pending: true, success: false, error: false, errorMessage: ''};
const successTxStatus = {none: false, pending: false, success: true, error: false, errorMessage: ''};
const timeout = 3000;

/************************************************************************************************
 ** Type Definitions
 **
 ** Core types for transaction handling and status management.
 ************************************************************************************************/
export type TTxStatus = {
	none: boolean;
	pending: boolean;
	success: boolean;
	error: boolean;
	errorMessage?: string;
};

export type TBaseError = {
	name?: string;
	message: string;
};

export type TTxResponse = {
	isSuccessful: boolean;
	receipt?: TransactionReceipt;
	error?: BaseError | unknown;
};

/************************************************************************************************
 ** Transaction Class
 **
 ** A builder class for creating and executing transactions.
 ** Provides a fluent interface for transaction configuration and execution.
 **
 ** Features:
 ** - Status management
 ** - Error handling
 ** - Success callbacks
 ** - Transaction argument population
 ************************************************************************************************/
export class Transaction {
	provider: Connector;
	onStatus: Dispatch<SetStateAction<TTxStatus>>;
	options?: {shouldIgnoreSuccessTxStatusChange: boolean};
	txArgs?: unknown[];
	funcCall: (provider: Connector, ...rest: never[]) => Promise<TTxResponse>;
	successCall?: (receipt?: TransactionReceipt) => Promise<void>;

	/************************************************************************************************
	 ** Constructor
	 **
	 ** @param provider - The wallet connector to use
	 ** @param funcCall - The function to call for transaction execution
	 ** @param onStatus - Status update callback
	 ** @param options - Optional configuration
	 ************************************************************************************************/
	constructor(
		provider: Connector,
		funcCall: (provider: Connector, ...rest: never[]) => Promise<TTxResponse>,
		onStatus: Dispatch<SetStateAction<TTxStatus>>,
		options?: {shouldIgnoreSuccessTxStatusChange: boolean}
	) {
		this.provider = provider;
		this.funcCall = funcCall;
		this.onStatus = onStatus;
		this.options = options;
	}

	/************************************************************************************************
	 ** populate
	 **
	 ** Sets the transaction arguments.
	 **
	 ** @param txArgs - The arguments to pass to the transaction
	 ** @returns this for chaining
	 ************************************************************************************************/
	populate(...txArgs: unknown[]): Transaction {
		this.txArgs = txArgs;
		return this;
	}

	/************************************************************************************************
	 ** onSuccess
	 **
	 ** Sets the success callback.
	 **
	 ** @param onSuccess - Callback to execute on successful transaction
	 ** @returns this for chaining
	 ************************************************************************************************/
	onSuccess(onSuccess: (receipt?: TransactionReceipt) => Promise<void>): Transaction {
		this.successCall = onSuccess;
		return this;
	}

	/************************************************************************************************
	 ** onHandleError
	 **
	 ** Handles transaction errors.
	 **
	 ** @param error - The error message
	 ************************************************************************************************/
	onHandleError(error: string): void {
		this.onStatus({...errorTxStatus, errorMessage: error});
		setTimeout((): void => this.onStatus(defaultTxStatus), timeout);
	}

	/************************************************************************************************
	 ** perform
	 **
	 ** Executes the transaction.
	 **
	 ** @returns Promise<TTxResponse> with transaction result
	 **
	 ** Process:
	 ** 1. Sets status to pending
	 ** 2. Executes transaction
	 ** 3. Handles success/error states
	 ** 4. Calls success callback if configured
	 ** 5. Resets status after timeout
	 ************************************************************************************************/
	async perform(): Promise<TTxResponse> {
		this.onStatus(pendingTxStatus);
		try {
			const args = (this.txArgs || []) as never[];
			const {isSuccessful, receipt, error} = await this.funcCall(this.provider, ...args);
			if (isSuccessful) {
				if (this.successCall && receipt) {
					await this.successCall(receipt);
				}
				if (this?.options?.shouldIgnoreSuccessTxStatusChange) {
					return {isSuccessful, receipt};
				}
				this.onStatus(successTxStatus);
				setTimeout((): void => this.onStatus(defaultTxStatus), timeout);
				return {isSuccessful, receipt};
			}
			this.onHandleError((error as TBaseError)?.message || 'Transaction failed');
			return {isSuccessful: false};
		} catch (error) {
			const err = error as BaseError;
			this.onHandleError(err?.shortMessage || err?.message || 'Transaction failed');
			return {isSuccessful: false};
		}
	}
}

/************************************************************************************************
 ** Transaction Configuration Types
 **
 ** Types for configuring transaction handling.
 ************************************************************************************************/
export type TWriteTransaction = {
	chainID: number;
	connector: Connector | undefined;
	config: Config;
	contractAddress: TAddress | undefined;
	statusHandler?: (status: typeof defaultTxStatus) => void;
	onTrySomethingElse?: () => Promise<TTxResponse>; //When the abi is incorrect, ex: usdt, we may need to bypass the error and try something else
	shouldDisplaySuccessToast?: boolean;
	shouldDisplayErrorToast?: boolean;
	shouldResetStatus?: boolean;
};

type TPrepareWriteContractConfig = SimulateContractParameters & {
	chainId?: number;
	address: TAddress | undefined;
	confirmation?: number;
};

/************************************************************************************************
 ** handleTx
 **
 ** Main transaction handling function.
 **
 ** @param args - Transaction configuration
 ** @param props - Contract write configuration
 **
 ** @returns Promise<TTxResponse> with transaction result
 **
 ** Process:
 ** 1. Validates configuration
 ** 2. Switches chain if necessary
 ** 3. Simulates contract call
 ** 4. Executes transaction
 ** 5. Waits for confirmations
 ** 6. Handles success/error states
 ** 7. Attempts fallback if configured
 ************************************************************************************************/
export async function handleTx(args: TWriteTransaction, props: TPrepareWriteContractConfig): Promise<TTxResponse> {
	const {config, connector, shouldResetStatus = true} = args;
	const {address} = props;

	if (!config || !address || !connector) {
		console.error('Invalid config or connector or address');
		return {isSuccessful: false, error: new Error('Invalid config or connector or address')};
	}

	args.statusHandler?.({...defaultTxStatus, pending: true});

	/************************************************************************************************
	 ** Chain Switching
	 **
	 ** Ensures the correct chain is active before proceeding.
	 ************************************************************************************************/
	const chainID = await connector?.getChainId();
	if (chainID !== args.chainID) {
		try {
			await switchChain(config, {chainId: args.chainID});
		} catch (error) {
			if (!(error instanceof BaseError)) {
				console.error(error);
				return {isSuccessful: false, error};
			}
			args.statusHandler?.({...defaultTxStatus, error: true});
			console.error(error);
			return {isSuccessful: false, error};
		}
	}

	/************************************************************************************************
	 ** Contract Interaction
	 **
	 ** Simulates and executes the contract call.
	 ** Handles transaction receipt and status updates.
	 ************************************************************************************************/
	assertAddress(props.address, 'contractAddress');
	assert(chainID === args.chainID, 'ChainID mismatch');
	try {
		const simulateContractConfig = await simulateContract(config, {
			...(props as SimulateContractParameters),
			chainId: chainID,
			connector: props.connector,
			address: props.address,
			value: toBigInt(props.value)
		});
		const hash = await writeContract(config, simulateContractConfig.request);
		const receipt = await waitForTransactionReceipt(config, {
			chainId: chainID,
			hash,
			confirmations: props.confirmation || 2
		});

		if (receipt.status === 'success') {
			args.statusHandler?.({...defaultTxStatus, success: true});
		} else if (receipt.status === 'reverted') {
			args.statusHandler?.({...defaultTxStatus, error: true});
		}
		// If shouldDisplaySuccessToast is undefined, we display the toast by default
		if (args.shouldDisplaySuccessToast || args.shouldDisplaySuccessToast === undefined) {
			console.log('Transaction successful!');
		}
		return {isSuccessful: receipt.status === 'success', receipt};
	} catch (error) {
		if (!(error instanceof BaseError)) {
			console.error(error);
			return {isSuccessful: false, error};
		}

		if (args.onTrySomethingElse) {
			if (
				error.name === 'ContractFunctionExecutionError' &&
				error.shortMessage !== 'User rejected the request.' // We need this because for Arbitrum, rejection is a ContractFunctionExecutionError
			) {
				console.log('onTrySomethingElse');
				return await args.onTrySomethingElse();
			}
		}

		// If shouldDisplayErrorToast is undefined, we display the toast by default
		if (args.shouldDisplayErrorToast || args.shouldDisplayErrorToast === undefined) {
			console.error(error.shortMessage);
		}
		args.statusHandler?.({...defaultTxStatus, error: true});
		console.error(error);
		return {isSuccessful: false, error};
	} finally {
		if (shouldResetStatus) {
			setTimeout((): void => {
				args.statusHandler?.({...defaultTxStatus});
			}, 3000);
		}
	}
}
