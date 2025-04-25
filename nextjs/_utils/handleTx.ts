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

export type TWriteTransaction = {
	chainID: number;
	statusHandler?: (status: typeof defaultTxStatus) => void;
	shouldDisplaySuccessToast?: boolean;
	shouldDisplayErrorToast?: boolean;
	shouldResetStatus?: boolean;
	config: Config;
};

type TPrepareWriteContractConfig = SimulateContractParameters & {
	chainId?: number;
	walletClient?: WalletClient;
	address: Address | undefined;
	confirmation?: number;
};

export async function handleTx(args: TWriteTransaction, props: TPrepareWriteContractConfig): Promise<TTxResponse> {
	const {shouldResetStatus = true, config} = args;

	args.statusHandler?.({...defaultTxStatus, pending: true});

	/*******************************************************************************************
	 ** First, make sure we are using the correct chainID.
	 ******************************************************************************************/
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

	/*******************************************************************************************
	 ** Prepare the write contract.
	 ******************************************************************************************/
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
