import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** Old Nestar route — redirect to Gymora equivalent */
const PropertyDetailRedirect = () => {
	const router = useRouter();
	useEffect(() => {
		const { id } = router.query;
		router.replace({ pathname: '/workout/detail', query: id ? { id } : {} });
	}, [router.query]);
	return null;
};

export default PropertyDetailRedirect;
