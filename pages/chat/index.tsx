import { useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({ props: { ...(await serverSideTranslations(locale, ['common'])) } });

/** Chat moved into MyPage (Messages) — this route only redirects old links. */
const ChatPage: NextPage = () => {
	const router = useRouter();

	useEffect(() => {
		router.replace({ pathname: '/mypage', query: { category: 'chat' } });
	}, []);

	return null;
};

export default ChatPage;
