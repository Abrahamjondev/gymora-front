import { NextPage } from 'next';
import useDeviceDetect from '../libs/hooks/useDeviceDetect';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import { Stack } from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import HeroSection from '../libs/components/homepage/HeroSection';
import HotWorkouts from '../libs/components/homepage/HotWorkouts';
import TopCourses from '../libs/components/homepage/TopCourses';
import EliteTrainers from '../libs/components/homepage/EliteTrainers';
import PerformanceSignal from '../libs/components/homepage/PerformanceSignal';
import PricingSection from '../libs/components/homepage/PricingSection';
import LandingFooter from '../libs/components/homepage/LandingFooter';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'landing', 'enums'])),
	},
});

const Home: NextPage = () => {
	const device = useDeviceDetect();

	return (
		<Stack className="lp-home" sx={{ background: '#0d0d0e', minHeight: '100vh' }}>
			<HeroSection />
			<HotWorkouts />
			<TopCourses />
			<EliteTrainers />
			<PerformanceSignal />
			<PricingSection />
			<LandingFooter />
		</Stack>
	);
};

export default withLayoutMain(Home);
