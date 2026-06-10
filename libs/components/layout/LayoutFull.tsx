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

const withLayoutFull = (Component: any) => {
	return (props: any) => {
		const router = useRouter();
		const device = useDeviceDetect();
		const user = useReactiveVar(userVar);

		/** LIFECYCLES **/
		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
		}, []);

		if (device == 'mobile') {
			return (
				<>
					<Head>
						<title>Gymora</title>
						<meta name={'title'} content={`Gymora`} />
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
						<title>Gymora</title>
						<meta name={'title'} content={`Gymora`} />
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

export default withLayoutFull;
