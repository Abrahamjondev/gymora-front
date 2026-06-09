import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** Old Nestar route — redirect to Gymora equivalent */
const PropertyRedirect = () => {
	const router = useRouter();
	useEffect(() => {
		router.replace('/workout');
	}, []);
	return null;
};

export default PropertyRedirect;
