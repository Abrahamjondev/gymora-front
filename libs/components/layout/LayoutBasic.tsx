import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Head from 'next/head';
import GymNavbar from '../common/GymNavbar';
import GymFooter from '../common/GymFooter';
import { Stack } from '@mui/material';
import { getJwtToken, updateUserInfo } from '../../auth';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store'; //@ts-ignore
import 'swiper/css'; //@ts-ignore
import 'swiper/css/pagination'; //@ts-ignore
import 'swiper/css/navigation';

const PAGE_TITLES: Record<string, string> = {
	'/workout': 'Workout Library — Gymora',
	'/workout/detail': 'Workout — Gymora',
	'/course': 'Training Programs — Gymora',
	'/course/detail': 'Program — Gymora',
	'/trainer': 'Trainers — Gymora',
	'/trainer/detail': 'Trainer Profile — Gymora',
	'/community': 'Community — Gymora',
	'/community/detail': 'Article — Gymora',
	'/member': 'Member Profile — Gymora',
	'/account/join': 'Sign In — Gymora',
	'/mypage': 'My Page — Gymora',
	'/cs': 'Support — Gymora',
	'/about': 'About — Gymora',
	'/privacy': 'Privacy Policy — Gymora',
	'/terms': 'Terms of Service — Gymora',
};

const withLayoutBasic = (Component: any) => {
	return (props: any) => {
		const router = useRouter();
		const device = useDeviceDetect();
		const user = useReactiveVar(userVar);

		const pageTitle = PAGE_TITLES[router.pathname] ?? 'Gymora';

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
