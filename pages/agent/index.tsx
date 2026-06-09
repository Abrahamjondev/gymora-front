import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** Old Nestar route — redirect to Gymora equivalent */
const AgentRedirect = () => {
	const router = useRouter();
	useEffect(() => {
		router.replace('/trainer');
	}, []);
	return null;
};

export default AgentRedirect;
