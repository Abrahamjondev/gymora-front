import { useEffect, useState } from 'react';

/** Animates a number from 0 to target with ease-out cubic. */
const useCountUp = (target: number, duration: number = 1400): number => {
	const [value, setValue] = useState<number>(0);

	useEffect(() => {
		if (!target) return;
		let frame = 0;
		const start = performance.now();
		const tick = (now: number) => {
			const progress = Math.min((now - start) / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			setValue(Math.round(target * eased));
			if (progress < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [target, duration]);

	return value;
};

export default useCountUp;
