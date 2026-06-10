import { NextPage } from 'next';
import { useRouter } from 'next/router';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const sections = [
	{
		h: 'Your account',
		p: 'One account per person. You are responsible for what is published from your account, and blocked or deleted accounts lose access to the platform.',
	},
	{
		h: 'Free workouts, paid programs',
		p: 'Every workout on Gymora is free for registered members. Structured programs are one-time purchases with lifetime access; lessons unlock as you complete the previous ones.',
	},
	{
		h: 'Trainers and content',
		p: 'Trainers own the content they publish and must have the right to share it. Gymora may remove content that is harmful, misleading or violates these terms.',
	},
	{
		h: 'Reviews',
		p: 'Reviews are tied to real activity: you can only review a program you are enrolled in and a trainer you have purchased from. One review per item, and it should reflect your honest experience.',
	},
	{
		h: 'Health disclaimer',
		p: 'Training and nutrition content on Gymora is general guidance, not medical advice. Consult a professional before starting a new program, especially with existing health conditions.',
	},
	{
		h: 'Payments and refunds',
		p: 'Payments are processed securely by Stripe. Membership subscriptions can be cancelled anytime and remain active until the end of the paid period.',
	},
];

const TermsPage: NextPage = () => {
	const router = useRouter();
	return (
		<div className="wl-page">
			<div className="lp-container" style={{ maxWidth: '760px' }}>
				<div className="wl-hero" style={{ paddingBottom: '28px' }}>
					<span className="lp-eyebrow" style={{ marginBottom: '8px' }}>Legal</span>
					<h1 className="wl-title">Terms of <span className="lp-grad">Service</span></h1>
					<p className="lp-sub" style={{ margin: 0 }}>The ground rules for training, publishing and purchasing on Gymora.</p>
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

export default withLayoutBasic(TermsPage);
