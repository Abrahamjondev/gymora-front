import React, { useEffect } from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Head from 'next/head';
import GymNavbar from '../common/GymNavbar';
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
						<GymNavbar overlay />
						<Stack id={'main'} >
							<Component {...props} />
						</Stack>
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
						<GymNavbar overlay />

						<Stack id={'main'} >
							<Component {...props} />
						</Stack>

						</Stack>
				</>
			);
		}
	};
};

export default withLayoutMain;
