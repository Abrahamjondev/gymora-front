import { NextPage } from 'next';
import useDeviceDetect from '../libs/hooks/useDeviceDetect';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import { Stack } from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import HeroSection from '../libs/components/homepage/HeroSection';
import HotWorkouts from '../libs/components/homepage/HotWorkouts';
import HowItWorks from '../libs/components/homepage/HowItWorks';
import TopCourses from '../libs/components/homepage/TopCourses';
import EliteTrainers from '../libs/components/homepage/EliteTrainers';
import CommunityPulse from '../libs/components/homepage/CommunityPulse';
import PricingSection from '../libs/components/homepage/PricingSection';
import LandingFooter from '../libs/components/homepage/LandingFooter';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Home: NextPage = () => {
	const device = useDeviceDetect();

	return (
		<Stack sx={{ background: '#0d0d0e', minHeight: '100vh' }}>
			<HeroSection />
			<HotWorkouts />
			<HowItWorks />
			<TopCourses />
			<EliteTrainers />
			<CommunityPulse />
			<PricingSection />
			<LandingFooter />
		</Stack>
	);
};

export default withLayoutMain(Home);
