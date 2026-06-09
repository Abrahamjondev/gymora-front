import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** Old Nestar route — redirect to Gymora equivalent */
const AdminPropertiesRedirect = () => {
	const router = useRouter();
	useEffect(() => {
		router.replace('/_admin/workouts');
	}, []);
	return null;
};

export default AdminPropertiesRedirect;
