import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

// Static FAQ — there is no CS backend module; every answer reflects real platform behavior.
const faqs = [
	{
		q: 'Is Gymora really free?',
		a: 'Yes — every workout on the platform is completely free for registered members. Trainers publish their workouts openly; you only pay if you enroll in a structured multi-week program.',
	},
	{
		q: 'How do program purchases work?',
		a: 'Programs are one-time purchases with lifetime access, processed through Stripe secure checkout. Your first lesson unlocks immediately after enrolling, and the following lessons unlock as you complete the previous ones.',
	},
	{
		q: 'How do I become a trainer?',
		a: 'Open My Page and use the "Become Trainer" form — add your bio, specializations and experience. Your account is upgraded to a trainer profile, and platform admins verify trainers before their badge turns green.',
	},
	{
		q: 'Who can leave reviews?',
		a: 'Workout reviews are open to all members. To review a program you must be enrolled in it, and to review a trainer you must have purchased one of their programs — this keeps every rating genuine.',
	},
	{
		q: 'How does the AI food scanner work?',
		a: 'In My Page → Nutrition, tap "AI Scan Food" and upload a photo of your meal. The AI estimates calories, protein, carbs and fats, and you can log the result directly as breakfast, lunch, dinner or a snack.',
	},
	{
		q: 'How does the membership subscription work?',
		a: 'Membership is $14.99 monthly or $119.88 yearly ($9.99/month equivalent). Payments are processed by Stripe and you can manage everything from My Page → Subscription.',
	},
	{
		q: 'Can I message trainers directly?',
		a: 'Yes — My Page → Messages is a real-time chat. You can see who is online and get replies instantly while you are both on the platform.',
	},
];

const SupportPage: NextPage = () => {
	const router = useRouter();
	const [open, setOpen] = useState<number | null>(0);

	return (
		<div className="wl-page">
			<div className="lp-container" style={{ maxWidth: '860px' }}>
				{/* Hero */}
				<div className="wl-hero">
					<div className="wl-hero-glow" />
					<span className="lp-eyebrow" style={{ marginBottom: '8px' }}>Support</span>
					<h1 className="wl-title">
						How can we <span className="lp-grad">help?</span>
					</h1>
					<p className="lp-sub" style={{ margin: 0 }}>
						Answers to the most common questions about training, programs and your account.
					</p>
				</div>

				{/* FAQ */}
				<div style={{ marginTop: '8px' }}>
					{faqs.map((item, i) => {
						const isOpen = open === i;
						return (
							<div key={i} className={`cs-acc${isOpen ? ' is-open' : ''}`}>
								<button className="cs-q" onClick={() => setOpen(isOpen ? null : i)}>
									{item.q}
									<span className="cs-q-ic">+</span>
								</button>
								<div className="cs-a">
									<div>
										<p>{item.a}</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Still need help */}
				<div className="lp-cta" style={{ padding: '52px 32px', marginTop: '40px' }}>
					<div className="lp-cta-orb" />
					<h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)' }}>Still have a question?</h2>
					<p>The community is full of trainers and athletes who have probably been exactly where you are.</p>
					<div className="lp-cta-actions">
						<button className="lp-btn-primary" onClick={() => router.push('/community')}>
							Ask the Community →
						</button>
						<button className="lp-btn-ghost" onClick={() => router.push('/trainer')}>
							Find a Trainer
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(SupportPage);
