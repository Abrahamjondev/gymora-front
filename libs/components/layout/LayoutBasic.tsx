import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import GymNavbar from '../common/GymNavbar';
import GymFooter from '../common/GymFooter';
import hrefLangLinks from '../common/HrefLangLinks';
import { Stack } from '@mui/material';
import { getJwtToken, updateUserInfo } from '../../auth';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store'; //@ts-ignore
import 'swiper/css'; //@ts-ignore
import 'swiper/css/pagination'; //@ts-ignore
import 'swiper/css/navigation';

const PAGE_TITLE_KEYS: Record<string, string> = {
	'/workout': 'workoutList',
	'/workout/detail': 'workoutDetail',
	'/course': 'programList',
	'/course/detail': 'programDetail',
	'/trainer': 'trainerList',
	'/trainer/detail': 'trainerDetail',
	'/community': 'community',
	'/community/detail': 'article',
	'/member': 'memberProfile',
	'/account/join': 'signIn',
	'/mypage': 'myPage',
	'/cs': 'support',
	'/about': 'about',
	'/privacy': 'privacy',
	'/terms': 'terms',
};

const withLayoutBasic = (Component: any) => {
	return (props: any) => {
		const router = useRouter();
		const device = useDeviceDetect();
		const { t } = useTranslation('common');
		const user = useReactiveVar(userVar);

		const pageTitle = t(`titles.${PAGE_TITLE_KEYS[router.pathname] ?? 'default'}`);

		/** LIFECYCLES **/
		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
		}, []);

		if (device == 'mobile') {
			return (
				<>
					<Head>
						<title>{pageTitle}</title>
						<meta name={'title'} content={pageTitle} />
						{hrefLangLinks(router)}
					</Head>
					<Stack id="mobile-wrap" sx={{ background: '#131314', minHeight: '100vh' }}>
						<GymNavbar />
						<Stack id={'main'} >
							<Component {...props} />
						</Stack>
						<GymFooter />
					</Stack>
				</>
			);
		} else {
			return (
				<>
					<Head>
						<title>{pageTitle}</title>
						<meta name={'title'} content={pageTitle} />
						{hrefLangLinks(router)}
					</Head>
					<Stack id="pc-wrap" sx={{ background: '#131314', minHeight: '100vh' }}>
						<GymNavbar />

						<Stack id={'main'} >
							<Component {...props} />
						</Stack>

						<GymFooter />
					</Stack>
				</>
			);
		}
	};
};

export default withLayoutBasic;
