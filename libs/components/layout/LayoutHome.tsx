import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import GymNavbar from '../common/GymNavbar';
import hrefLangLinks from '../common/HrefLangLinks';
import { Stack } from '@mui/material';
import { userVar } from '../../../apollo/store';
import { useReactiveVar } from '@apollo/client';
import { getJwtToken, updateUserInfo } from '../../auth';
//@ts-ignore
import 'swiper/css'; //@ts-ignore
import 'swiper/css/pagination'; //@ts-ignore
import 'swiper/css/navigation';

const withLayoutMain = (Component: any) => {
	return (props: any) => {
		const router = useRouter();
		const device = useDeviceDetect();
		const { t } = useTranslation('common');
		const user = useReactiveVar(userVar);

		const pageTitle = t('titles.home');

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
						<GymNavbar overlay />
						<Stack id={'main'} className="gymora-main">
							<Component {...props} />
						</Stack>
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
						<GymNavbar overlay />

						<Stack id={'main'} className="gymora-main">
							<Component {...props} />
						</Stack>

						</Stack>
				</>
			);
		}
	};
};

export default withLayoutMain;
