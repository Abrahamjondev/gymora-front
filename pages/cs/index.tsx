import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const faqs = [
	{ q: 'How do I get started with Gymora?', a: 'Create an account, choose your fitness goal, and browse our workout library. You can start with free workouts or subscribe for premium access to courses and trainers.' },
	{ q: 'What is included in the subscription?', a: 'Monthly and Yearly plans include unlimited access to all courses, personalized nutrition tracking, AI-powered food analysis, progress tracking, and direct messaging with trainers.' },
	{ q: 'Can I become a trainer on Gymora?', a: 'Yes! Sign up as a Trainer during registration. Once verified, you can create workouts, courses with lessons, and earn from course sales.' },
	{ q: 'How do course payments work?', a: 'Free courses can be enrolled directly. Paid courses use Stripe checkout. After payment confirmation, all lessons are unlocked for lifetime access.' },
	{ q: 'How do I track my progress?', a: 'Use the Progress Tracker to log your weight, body measurements, and photos over time. The Analytics dashboard shows your BMI, BMR, and daily calorie needs.' },
	{ q: 'Can I cancel my subscription?', a: 'Yes, you can cancel anytime from your account settings. Your access continues until the end of the billing period.' },
];

const CS: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const [openFaq, setOpenFaq] = useState<number | null>(null);

	if (device === 'mobile') {
		return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>GYMORA CS MOBILE</div>;
	}

	return (
		<div style={{ background: '#131314', minHeight: '100vh', padding: '40px 0' }}>
			<div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
				{/* Header */}
				<div style={{ textAlign: 'center', marginBottom: '48px' }}>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#00f5ff', fontWeight: 500, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
						Support Center
					</span>
					<h1 style={{ fontFamily: 'Hanken Grotesk', fontSize: '40px', lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: 800, color: '#e5e2e3', marginBottom: '12px' }}>
						How can we help?
					</h1>
					<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', lineHeight: '24px', color: '#b9caca' }}>
						Find answers to common questions about Gymora
					</p>
				</div>

				{/* FAQ */}
				<div style={{ marginBottom: '48px' }}>
					<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 700, color: '#e5e2e3', marginBottom: '24px' }}>
						Frequently Asked Questions
					</h2>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
						{faqs.map((faq, idx) => (
							<div
								key={idx}
								style={{
									background: 'rgba(255,255,255,0.03)',
									border: '1px solid rgba(255,255,255,0.08)',
									borderRadius: '12px',
									overflow: 'hidden',
									transition: 'all 0.2s',
								}}
							>
								<button
									onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
									style={{
										width: '100%',
										padding: '20px 24px',
										background: 'transparent',
										border: 'none',
										cursor: 'pointer',
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3', textAlign: 'left' }}>
										{faq.q}
									</span>
									<span style={{ color: '#00f5ff', fontSize: '20px', flexShrink: 0, marginLeft: '16px' }}>
										{openFaq === idx ? '−' : '+'}
									</span>
								</button>
								{openFaq === idx && (
									<div style={{ padding: '0 24px 20px' }}>
										<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', lineHeight: '22px', color: '#b9caca' }}>
											{faq.a}
										</p>
									</div>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Contact */}
				<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
					<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 700, color: '#e5e2e3', marginBottom: '12px' }}>
						Still need help?
					</h3>
					<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#b9caca', marginBottom: '24px' }}>
						Our team is ready to assist you with any questions
					</p>
					<button
						onClick={() => router.push('/account/join')}
						style={{
							background: '#e9feff',
							color: '#003739',
							border: 'none',
							borderRadius: '8px',
							padding: '14px 32px',
							fontFamily: 'Hanken Grotesk',
							fontSize: '14px',
							fontWeight: 700,
							cursor: 'pointer',
						}}
					>
						Contact Support
					</button>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(CS);
