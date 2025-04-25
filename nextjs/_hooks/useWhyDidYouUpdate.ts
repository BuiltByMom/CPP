/************************************************************************************************
 ** useWhyDidYouUpdate Hook
 **
 ** A development debugging hook that helps identify why a component re-rendered by comparing
 ** previous and current props. This is particularly useful for performance optimization and
 ** debugging unnecessary re-renders.
 **
 ** Usage:
 ** - Wrap this hook in a component to track prop changes
 ** - Provides detailed console output of which props changed and their values
 ** - Only logs when actual changes are detected
 **
 ** Note: This hook should only be used in development and should be removed in production
 ************************************************************************************************/

import {useEffect, useRef} from 'react';

/************************************************************************************************
 ** useWhyDidYouUpdate
 **
 ** A debugging hook that tracks and logs prop changes in a component.
 **
 ** @param name - The name of the component being debugged (for console output)
 ** @param props - The props object to track changes for
 **
 ** @returns void
 **
 ** Example:
 ** function MyComponent(props) {
 **   useWhyDidYouUpdate('MyComponent', props);
 **   return <div>...</div>;
 ** }
 ************************************************************************************************/
// biome-ignore lint/suspicious/noExplicitAny: we really want any
function useWhyDidYouUpdate(name: string, props: any): void {
	// Get a mutable ref object where we can store props ...
	// ... for comparison next time this hook runs.
	// biome-ignore lint/suspicious/noExplicitAny: we really want any
	const previousProps = useRef<any>(null);

	useEffect((): void => {
		if (previousProps.current) {
			// Get all keys from previous and current props
			const allKeys = Object.keys({...previousProps.current, ...props});
			// Use this object to keep track of changed props
			// biome-ignore lint/suspicious/noExplicitAny: we really want any
			const changesObj: any = {};
			// Iterate through keys
			for (const key of allKeys) {
				// If previous is different from current
				if (previousProps.current[key] !== props[key]) {
					// Add to changesObj
					changesObj[key] = {
						from: previousProps.current[key],
						to: props[key]
					};
				}
			}

			// If changesObj not empty then output to console
			if (Object.keys(changesObj).length) {
				console.log('[why-did-you-update]', name, changesObj);
			}
		}

		// Finally update previousProps with current props for next hook call
		previousProps.current = props;
	});
}

export default useWhyDidYouUpdate;
