import { useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/** Progress moved into MyPage — this route only redirects old links. */
const ProgressPage: NextPage = () => {
	const router = useRouter();

	useEffect(() => {
		router.replace({ pathname: '/mypage', query: { category: 'progress' } });
	}, []);

	return null;
};

export default ProgressPage;
