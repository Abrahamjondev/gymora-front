import { useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/** Nutrition moved into MyPage — this route only redirects old links. */
const NutritionPage: NextPage = () => {
	const router = useRouter();

	useEffect(() => {
		router.replace({ pathname: '/mypage', query: { category: 'nutrition' } });
	}, []);

	return null;
};

export default NutritionPage;
