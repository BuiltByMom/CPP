/************************************************************************************************
 ** Transaction Handler
 **
 ** A utility for handling blockchain transactions with comprehensive error handling,
 ** chain switching, and status management.
 **
 ** Usage:
 ** - Use this utility for all contract write operations
 ** - Handles chain switching automatically
 ** - Provides transaction status updates
 ** - Manages success/error toasts
 **
 ** Dependencies:
 ** - @wagmi/core: For contract interactions
 ** - viem: For error handling and types
 ** - _utils/tools: For number and transaction utilities
 ************************************************************************************************/

import {toBigInt} from './tools.numbers';
import {defaultTxStatus} from './tools.transactions';
import {
	type Config,
	type SimulateContractParameters,
	simulateContract,
	switchChain,
	waitForTransactionReceipt,
	writeContract
} from '@wagmi/core';
import {type Address, BaseError, type WalletClient} from 'viem';

import type {TTxResponse} from './tools.transactions';
import {assert} from '_utils/helpers';

/************************************************************************************************
 ** TWriteTransaction
 **
 ** Configuration for transaction handling.
 **
 ** @property chainID - Target chain ID for the transaction
 ** @property statusHandler - Optional callback for transaction status updates
 ** @property shouldDisplaySuccessToast - Whether to show success toast (default: true)
 ** @property shouldDisplayErrorToast - Whether to show error toast (default: true)
 ** @property shouldResetStatus - Whether to reset status after completion (default: true)
 ** @property config - Wagmi configuration object
 ************************************************************************************************/
export type TWriteTransaction = {
	chainID: number;
	statusHandler?: (status: typeof defaultTxStatus) => void;
	shouldDisplaySuccessToast?: boolean;
	shouldDisplayErrorToast?: boolean;
	shouldResetStatus?: boolean;
	config: Config;
};

/************************************************************************************************
 ** TPrepareWriteContractConfig
 **
 ** Configuration for contract write preparation.
 **
 ** @property chainId - Optional chain ID override
 ** @property walletClient - Optional wallet client
 ** @property address - Contract address
 ** @property confirmation - Number of confirmations to wait for (default: 2)
 ************************************************************************************************/
type TPrepareWriteContractConfig = SimulateContractParameters & {
	chainId?: number;
	walletClient?: WalletClient;
	address: Address | undefined;
	confirmation?: number;
};

/************************************************************************************************
 ** handleTx
 **
 ** Main transaction handling function that orchestrates the entire transaction process.
 **
 ** @param args - Transaction configuration (TWriteTransaction)
 ** @param props - Contract write configuration (TPrepareWriteContractConfig)
 **
 ** @returns Promise<TTxResponse> with transaction result
 **
 ** Process:
 ** 1. Updates status to pending
 ** 2. Switches chain if necessary
 ** 3. Simulates contract call
 ** 4. Executes transaction
 ** 5. Waits for confirmations
 ** 6. Handles success/error states
 ** 7. Resets status if configured
 ************************************************************************************************/
export async function handleTx(args: TWriteTransaction, props: TPrepareWriteContractConfig): Promise<TTxResponse> {
	const {shouldResetStatus = true, config} = args;

	args.statusHandler?.({...defaultTxStatus, pending: true});

	/************************************************************************************************
	 ** Chain Switching
	 **
	 ** Ensures the correct chain is active before proceeding with the transaction.
	 ** Handles chain switching errors and updates status accordingly.
	 ************************************************************************************************/
	if (config.state.chainId !== args.chainID) {
		try {
			await switchChain(config, {chainId: args.chainID});
		} catch (error) {
			if (!(error instanceof BaseError)) {
				return {isSuccessful: false, error};
			}
			console.error(error.shortMessage);
			args.statusHandler?.({...defaultTxStatus, error: true, errorMessage: 'Error switching chain'});
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
	assert(config.state.chainId === args.chainID, 'ChainID mismatch');
	try {
		const simulateContractConfig = await simulateContract(config, {
			...(props as SimulateContractParameters),
			address: props.address,
			value: toBigInt(props.value),
			chainId: config.state.chainId
		});

		const hash = await writeContract(config, simulateContractConfig.request);
		const receipt = await waitForTransactionReceipt(config, {
			chainId: config.state.chainId,
			hash,
			confirmations: props.confirmation || 2
		});

		if (receipt.status === 'success') {
			args.statusHandler?.({...defaultTxStatus, success: true});
		} else if (receipt.status === 'reverted') {
			args.statusHandler?.({...defaultTxStatus, error: true, errorMessage: 'Transaction reverted'});
		}

		if (args.shouldDisplaySuccessToast || args.shouldDisplaySuccessToast === undefined) {
			console.log('Transaction successful!');
		}

		return {isSuccessful: receipt.status === 'success', receipt};
	} catch (error) {
		if (!(error instanceof BaseError)) {
			return {isSuccessful: false, error};
		}

		if (args.shouldDisplayErrorToast || args.shouldDisplayErrorToast === undefined) {
			console.error(error.shortMessage);
		}
		args.statusHandler?.({...defaultTxStatus, error: true, errorMessage: error.shortMessage});
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
