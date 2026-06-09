import React from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const About: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();

	if (device === 'mobile') {
		return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>GYMORA ABOUT MOBILE</div>;
	}

	return (
		<div style={{ background: '#131314', minHeight: '100vh', padding: '40px 0' }}>
			<div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
				{/* Hero */}
				<div style={{ textAlign: 'center', marginBottom: '64px' }}>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#00f5ff', fontWeight: 500, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
						About Gymora
					</span>
					<h1 style={{ fontFamily: 'Hanken Grotesk', fontSize: '48px', lineHeight: '52px', letterSpacing: '-0.02em', fontWeight: 800, color: '#e5e2e3', maxWidth: '700px', margin: '0 auto 20px' }}>
						Elevating Human Performance
					</h1>
					<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '18px', lineHeight: '28px', color: '#b9caca', maxWidth: '600px', margin: '0 auto' }}>
						Gymora is an elite fitness platform connecting world-class trainers with dedicated athletes. We combine precision programming, scientific nutrition, and data-driven insights to transform physical potential.
					</p>
				</div>

				{/* Stats */}
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '64px' }}>
					{[
						{ value: '50K+', label: 'Active Athletes' },
						{ value: '200+', label: 'Elite Trainers' },
						{ value: '500+', label: 'Programs' },
						{ value: '94%', label: 'Success Rate' },
					].map((stat) => (
						<div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
							<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '36px', fontWeight: 800, color: '#e9feff', display: 'block', marginBottom: '8px' }}>
								{stat.value}
							</span>
							<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
								{stat.label}
							</span>
						</div>
					))}
				</div>

				{/* Mission */}
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '64px' }}>
					<div>
						<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>
							Our Mission
						</h2>
						<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', lineHeight: '26px', color: '#b9caca' }}>
							We believe that elite-level training should be accessible to everyone. Gymora bridges the gap between professional coaching and everyday athletes through technology, community, and science-backed programming.
						</p>
					</div>
					<div>
						<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>
							Our Approach
						</h2>
						<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', lineHeight: '26px', color: '#b9caca' }}>
							Every workout, course, and nutrition plan on Gymora is designed by verified professionals. Our platform combines biometric insights, AI-powered food analysis, and progressive overload tracking to optimize your results.
						</p>
					</div>
				</div>

				{/* Features */}
				<div style={{ marginBottom: '64px' }}>
					<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '24px', textAlign: 'center' }}>
						What Sets Us Apart
					</h2>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
						{[
							{ icon: '💪', title: 'Precision Training', desc: 'Every rep tracked, every set optimized. Our workouts use micro-periodization for maximum results.' },
							{ icon: '🧬', title: 'Data-Driven Insights', desc: 'BMI, BMR, TDEE calculations. AI food analysis. Your body, quantified.' },
							{ icon: '🎯', title: 'Verified Trainers', desc: 'NASM, ACE, and CSCS certified professionals. No influencers — only experts.' },
							{ icon: '📊', title: 'Progress Tracking', desc: 'Body measurements, weight logs, progress photos. See your transformation over time.' },
							{ icon: '🥗', title: 'Smart Nutrition', desc: 'Meal logging, macro tracking, personalized recommendations based on your goals.' },
							{ icon: '👥', title: 'Elite Community', desc: 'Connect with athletes, share achievements, join challenges, and grow together.' },
						].map((f) => (
							<div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
								<span style={{ fontSize: '28px', display: 'block', marginBottom: '12px' }}>{f.icon}</span>
								<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '18px', fontWeight: 600, color: '#e5e2e3', marginBottom: '8px' }}>{f.title}</h3>
								<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', lineHeight: '20px', color: '#849495' }}>{f.desc}</p>
							</div>
						))}
					</div>
				</div>

				{/* CTA */}
				<div style={{ background: 'rgba(0,220,229,0.05)', border: '1px solid rgba(0,220,229,0.2)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
					<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '32px', fontWeight: 800, color: '#e5e2e3', marginBottom: '12px' }}>
						Ready to transform?
					</h2>
					<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', color: '#b9caca', marginBottom: '24px' }}>
						Join thousands of athletes already training with Gymora
					</p>
					<button
						onClick={() => router.push('/account/join')}
						style={{ background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px', padding: '16px 40px', fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
					>
						Get Started Free
					</button>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(About);
