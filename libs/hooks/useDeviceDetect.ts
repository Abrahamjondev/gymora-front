import { useEffect, useState } from 'react';

const getDevice = (): string => {
	if (typeof window === 'undefined') return 'desktop';
	return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop';
};

const useDeviceDetect = (): string => {
	const [device, setDevice] = useState(getDevice);

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
