import { NextPage } from 'next';
import useDeviceDetect from '../libs/hooks/useDeviceDetect';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import { Stack } from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import HeroSection from '../libs/components/homepage/HeroSection';
import FeaturedWorkouts from '../libs/components/homepage/FeaturedWorkouts';
import EliteTrainers from '../libs/components/homepage/EliteTrainers';
import SubscriptionPlans from '../libs/components/homepage/SubscriptionPlans';
import LandingFooter from '../libs/components/homepage/LandingFooter';
import CommunityBoards from '../libs/components/homepage/CommunityBoards';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Home: NextPage = () => {
	const device = useDeviceDetect();

	return (
		<Stack className={'home-page'} sx={{ background: '#131314', minHeight: '100vh' }}>
			<HeroSection />
			<FeaturedWorkouts />
			<EliteTrainers />
			<SubscriptionPlans />
			<CommunityBoards />
			<LandingFooter />
		</Stack>
	);
};

export default withLayoutMain(Home);
