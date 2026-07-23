import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

interface UrlFilterOptions {
	allowedSorts?: readonly string[];
	maxLimit?: number;
	scrollTarget?: string;
}

const isRecord = (value: unknown): value is Record<string, any> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isPageOnlyChange = (previous: unknown, next: unknown): boolean => {
	if (!isRecord(previous) || !isRecord(next)) return false;
	const { page: previousPage, ...previousRest } = previous;
	const { page: nextPage, ...nextRest } = next;
	return previousPage !== nextPage && JSON.stringify(previousRest) === JSON.stringify(nextRest);
};

const scrollFilterPageToTop = () => {
	if (typeof window === 'undefined') return;

	const scrollOptions: ScrollToOptions = { top: 0, behavior: 'smooth' };
	window.scrollTo(scrollOptions);
	document.documentElement.scrollTo(scrollOptions);
	document.body.scrollTo(scrollOptions);
};

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
const useUrlFilter = <T,>(initialInput: T, pathname: string, options: UrlFilterOptions = {}): [T, (next: T) => void] => {
	const router = useRouter();
	const [filter, setFilter] = useState<T>(initialInput);
	const filterRef = useRef<T>(initialInput);
	// Tracks the serialized value we last pushed ourselves, so our own URL writes
	// don't trigger a redundant re-parse in the sync effect below.
	const lastPushed = useRef<string | null>(null);

	const normalize = useCallback(
		(value: unknown): T => {
			if (!isRecord(value)) return initialInput;
			const next: Record<string, any> = { ...(initialInput as any), ...value };
			const initial = initialInput as any;

			const page = Number(next.page);
			const limit = Number(next.limit);
			next.page = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : initial.page;
			next.limit = Number.isFinite(limit) ? Math.min(options.maxLimit ?? 50, Math.max(1, Math.floor(limit))) : initial.limit;

			if (options.allowedSorts?.length && !options.allowedSorts.includes(next.sort)) next.sort = initial.sort;
			if (next.direction !== 'ASC' && next.direction !== 'DESC') next.direction = initial.direction;
			if (!isRecord(next.search)) next.search = initial.search;

			return next as T;
		},
		[initialInput, options.allowedSorts, options.maxLimit],
	);

	/** Read state FROM the URL on mount, shared-link load and browser back/forward. */
	useEffect(() => {
		if (!router.isReady) return;
		const raw = typeof router.query.input === 'string' ? router.query.input : null;
		if (raw === lastPushed.current) return; // this change came from our own push
		if (raw) {
			try {
				const next = normalize(JSON.parse(raw));
				filterRef.current = next;
				setFilter(next);
			} catch {
				filterRef.current = initialInput;
				setFilter(initialInput);
			}
		} else {
			filterRef.current = initialInput;
			setFilter(initialInput);
		}
		// initialInput is expected to be a stable module-level constant
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router.isReady, router.query.input]);

	/** Write state TO the URL (and local state) in a single call. */
	const update = useCallback(
		(next: T) => {
			const normalized = normalize(next);
			const previous = filterRef.current;
			const serialized = JSON.stringify(normalized);
			lastPushed.current = serialized;
			filterRef.current = normalized;
			setFilter(normalized);
			void router
				.push({ pathname, query: { input: serialized } }, undefined, {
					scroll: false,
					shallow: true,
				})
				.then(() => {
					if (typeof window === 'undefined' || isPageOnlyChange(previous, normalized)) return;
					window.requestAnimationFrame(() => {
						if (options.scrollTarget) {
							document.getElementById(options.scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
						} else {
							scrollFilterPageToTop();
						}
					});
				})
				.catch(() => undefined);
		},
		[normalize, options.scrollTarget, pathname, router],
	);

	return [filter, update];
};

export default useUrlFilter;
