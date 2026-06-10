import { useEffect, useRef } from 'react';

/**
 * Adds the `is-visible` class when the element scrolls into view.
 * Pass `ready` so the observer attaches after data-dependent sections render.
 */
const useReveal = <T extends HTMLElement>(ready: boolean = true) => {
	const ref = useRef<T | null>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el || !ready) return;
		if (typeof IntersectionObserver === 'undefined') {
			el.classList.add('is-visible');
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-visible');
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [ready]);

	return ref;
};

export default useReveal;
