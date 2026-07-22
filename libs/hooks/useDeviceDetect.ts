import { useEffect, useState } from 'react';

const useDeviceDetect = (): string => {
	// Keep the first client render identical to SSR. Reading matchMedia in the
	// initial state makes mobile hydration render a different root tree.
	const [device, setDevice] = useState('desktop');

	useEffect(() => {
		const mediaQuery = window.matchMedia('(max-width: 768px)');
		const updateDevice = () => setDevice(mediaQuery.matches ? 'mobile' : 'desktop');

		updateDevice();
		mediaQuery.addEventListener?.('change', updateDevice);
		return () => mediaQuery.removeEventListener?.('change', updateDevice);
	}, []);

	return device;
};

export default useDeviceDetect;
