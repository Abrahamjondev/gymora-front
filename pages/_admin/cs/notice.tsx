import { useEffect } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

/** Legacy Nestar CS module — no backend support in Gymora. Redirects to admin home. */
const LegacyCsPage: NextPage = () => {
	const router = useRouter();
	useEffect(() => {
		router.replace('/_admin/users');
	}, []);
	return null;
};

export default LegacyCsPage;
