import { NextPage } from 'next';
import { useRouter } from 'next/router';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const sections = [
	{
		h: 'What we collect',
		p: 'Your account details (nickname, phone), the content you publish (workouts, programs, articles, comments), training activity you log (meals, body metrics, lesson progress) and food photos you submit to the AI scanner.',
	},
	{
		h: 'How it is used',
		p: 'Your data powers the product itself — your dashboard, progress timeline, nutrition targets and recommendations. We do not sell personal data to third parties.',
	},
	{
		h: 'Payments',
		p: 'Card payments are processed by Stripe. Your card details never touch Gymora servers — we only store the payment status and amount needed for your purchase history.',
	},
	{
		h: 'Your content',
		p: 'Workouts, programs and articles you publish are visible to other members. You can edit or delete your own content at any time from My Page.',
	},
	{
		h: 'Contact',
		p: 'Questions about your data? Reach the team through the Support page or ask in the community.',
	},
];

const PrivacyPage: NextPage = () => {
	const router = useRouter();
	return (
		<div className="wl-page">
			<div className="lp-container" style={{ maxWidth: '760px' }}>
				<div className="wl-hero" style={{ paddingBottom: '28px' }}>
					<span className="lp-eyebrow" style={{ marginBottom: '8px' }}>Legal</span>
					<h1 className="wl-title">Privacy <span className="lp-grad">Policy</span></h1>
					<p className="lp-sub" style={{ margin: 0 }}>How Gymora handles your data, in plain language.</p>
				</div>
				{sections.map((s) => (
					<div key={s.h} className="wd-section" style={{ marginBottom: '28px' }}>
						<div className="wd-section-head" style={{ marginBottom: '10px' }}>
							<h3 style={{ fontSize: '19px' }}>{s.h}</h3>
						</div>
						<p>{s.p}</p>
					</div>
				))}
				<button className="lp-btn-ghost" onClick={() => router.push('/cs')}>Questions? Visit Support →</button>
			</div>
		</div>
	);
};

export default withLayoutBasic(PrivacyPage);
