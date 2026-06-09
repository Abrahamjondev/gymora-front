import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** Old Nestar route — redirect to Gymora equivalent */
const AgentDetailRedirect = () => {
	const router = useRouter();
	useEffect(() => {
		const { memberId } = router.query;
		router.replace({ pathname: '/member', query: memberId ? { memberId } : {} });
	}, [router.query]);
	return null;
};

export default AgentDetailRedirect;
