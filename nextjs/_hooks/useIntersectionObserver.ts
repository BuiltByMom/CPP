/************************************************************************************************
 ** useIntersectionObserver Hook
 **
 ** A hook that provides a simple way to detect when an element enters the viewport.
 ** It uses the Intersection Observer API to efficiently track element visibility.
 **
 ** Usage:
 ** - Use this hook when you need to detect when an element becomes visible
 ** - Perfect for infinite scrolling, lazy loading, or triggering animations
 ** - Returns a ref callback that can be attached to any element
 **
 ** Dependencies:
 ** - React: For hooks and refs
 ** - Intersection Observer API (built into modern browsers)
 ************************************************************************************************/

import {useEffect, useRef} from 'react';

/************************************************************************************************
 ** useIntersectionObserver
 **
 ** A hook that creates an intersection observer to detect when an element becomes visible.
 **
 ** @param callback - Function to call when the element becomes visible
 ** @param options - IntersectionObserver options (defaults to {threshold: 0.1})
 **
 ** @returns A ref callback function that should be attached to the element to observe
 **
 ** Example:
 ** const ref = useIntersectionObserver(() => {
 **   console.log('Element is visible!');
 ** });
 **
 ** return <div ref={ref}>Observed Element</div>;
 ************************************************************************************************/
export function useIntersectionObserver(
	callback: () => void,
	options: IntersectionObserverInit = {threshold: 0.1}
): (node: Element | null) => void {
	const observer = useRef<IntersectionObserver | null>(null);

	const ref = (node: Element | null): void => {
		if (observer.current) {
			observer.current.disconnect();
		}

		if (node) {
			observer.current = new IntersectionObserver(entries => {
				if (entries[0].isIntersecting) {
					callback();
				}
			}, options);

			observer.current.observe(node);
		}
	};

	useEffect(() => {
		return () => {
			if (observer.current) {
				observer.current.disconnect();
			}
		};
	}, []);

	return ref;
}
