import { useEffect, useState } from 'react';

const useDeviceDetect = (): string => {
	// Keep the first render identical on the server and client. Reading
	// matchMedia during initial render makes SSR choose `desktop` while a
	// mobile browser chooses `mobile`, which causes a hydration mismatch and
	// can leave the page blank until the next refresh/HMR pass.
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
