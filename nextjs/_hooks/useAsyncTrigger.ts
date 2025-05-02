/************************************************************************************************
 ** useAsyncTrigger Hooks
 **
 ** A set of hooks that provide a way to handle asynchronous effects in React components.
 ** These hooks are designed to work around the limitations of useEffect with async functions
 ** and provide a clean way to trigger async operations.
 **
 ** Usage:
 ** - Use when you need to perform async operations in response to prop or state changes
 ** - Provides both simple and argument-passing variants
 ** - Returns a function that can be called to manually trigger the effect
 **
 ** Dependencies:
 ** - React: For hooks and effect management
 ************************************************************************************************/

import {useCallback, useEffect} from 'react';

import type {DependencyList} from 'react';

/************************************************************************************************
 ** useAsyncTrigger
 **
 ** A hook that creates an async effect that can be triggered by dependency changes.
 **
 ** @param effect - The async function to execute
 ** @param deps - Array of dependencies that trigger the effect when changed
 **
 ** @returns A function that can be called to manually trigger the effect
 **
 ** Example:
 ** const trigger = useAsyncTrigger(async () => {
 **   await fetchData();
 ** }, [someDependency]);
 ************************************************************************************************/
function useAsyncTrigger(effect: () => Promise<void>, deps: DependencyList): () => Promise<void> {
	const asyncEffectInCallback = useCallback(async (): Promise<void> => {
		effect();
	}, [...deps]);

	useEffect((): void => {
		asyncEffectInCallback();
	}, [asyncEffectInCallback]);

	return asyncEffectInCallback;
}

/************************************************************************************************
 ** useAsyncTriggerWithArgs
 **
 ** A variant of useAsyncTrigger that allows passing arguments to the effect function.
 **
 ** @param effect - The async function to execute, which can accept arguments
 ** @param deps - Array of dependencies that trigger the effect when changed
 **
 ** @returns A function that can be called with arguments to trigger the effect
 **
 ** Example:
 ** const trigger = useAsyncTriggerWithArgs(async (arg1, arg2) => {
 **   await fetchData(arg1, arg2);
 ** }, [someDependency]);
 **
 ** // Later:
 ** await trigger('value1', 'value2');
 ************************************************************************************************/
function useAsyncTriggerWithArgs(effect: (args?: unknown) => Promise<void>, deps: DependencyList): () => Promise<void> {
	const asyncEffectInCallback = useCallback(
		async (...args: unknown[]): Promise<void> => {
			effect(...args);
		},
		[...deps]
	);

	useEffect((): void => {
		asyncEffectInCallback();
	}, [asyncEffectInCallback]);

	return asyncEffectInCallback;
}

export {useAsyncTrigger, useAsyncTriggerWithArgs};
