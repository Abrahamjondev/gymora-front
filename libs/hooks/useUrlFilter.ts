import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * Keeps a list-page search/filter object in sync with the URL query string.
 *
 * The whole filter object is serialized into a single `?input=` query param, so
 * every state change (filter, sort, pagination, search) is reflected in the URL
 * and the page becomes fully shareable — opening the link reproduces the exact
 * filtered view. Inspired by the nestar-next pattern, but centralized so the URL
 * write can never be forgotten: `setSearchFilter` always updates state AND URL.
 *
 * @param initialInput stable default filter (define it module-level)
 * @param pathname     the route to push to (e.g. '/workout')
 */
const useUrlFilter = <T,>(initialInput: T, pathname: string): [T, (next: T) => void] => {
	const router = useRouter();
	const [filter, setFilter] = useState<T>(initialInput);
	// Tracks the serialized value we last pushed ourselves, so our own URL writes
	// don't trigger a redundant re-parse in the sync effect below.
	const lastPushed = useRef<string | null>(null);

	/** Read state FROM the URL on mount, shared-link load and browser back/forward. */
	useEffect(() => {
		if (!router.isReady) return;
		const raw = typeof router.query.input === 'string' ? router.query.input : null;
		if (raw === lastPushed.current) return; // this change came from our own push
		if (raw) {
			try {
				setFilter(JSON.parse(raw) as T);
			} catch {
				setFilter(initialInput);
			}
		} else {
			setFilter(initialInput);
		}
		// initialInput is expected to be a stable module-level constant
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router.isReady, router.query.input]);

	/** Write state TO the URL (and local state) in a single call. */
	const update = useCallback(
		(next: T) => {
			const serialized = JSON.stringify(next);
			lastPushed.current = serialized;
			setFilter(next);
			router.push({ pathname, query: { input: serialized } }, undefined, {
				scroll: false,
				shallow: true,
			});
		},
		[router, pathname],
	);

	return [filter, update];
};

export default useUrlFilter;
