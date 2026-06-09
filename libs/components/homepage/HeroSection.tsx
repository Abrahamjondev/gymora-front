import React from 'react';
import { useRouter } from 'next/router';

const HeroSection = () => {
	const router = useRouter();

	return (
		<section style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 24px 96px', textAlign: 'center' }}>
			{/* Badge */}
			<div
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: '8px',
					padding: '4px 12px',
					borderRadius: '9999px',
					background: '#2a2a2b',
					border: '1px solid #3a494a',
					marginBottom: '32px',
				}}
			>
				<span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5ff' }} />
				<span
					style={{
						fontFamily: 'JetBrains Mono, monospace',
						fontSize: '11px',
						letterSpacing: '0.05em',
						fontWeight: 500,
						color: '#00f5ff',
						textTransform: 'uppercase',
					}}
				>
					New: Advanced Hypertrophy v2.0
				</span>
			</div>

			<h1
				style={{
					fontFamily: 'Hanken Grotesk, sans-serif',
					fontSize: '40px',
					lineHeight: '48px',
					letterSpacing: '-0.02em',
					fontWeight: 800,
					color: '#e5e2e3',
					maxWidth: '768px',
					margin: '0 auto 24px',
				}}
			>
				Expert training. <span style={{ color: '#00f5ff' }}>Real results.</span>
			</h1>
			<p
				style={{
					fontFamily: 'Hanken Grotesk, sans-serif',
					fontSize: '16px',
					lineHeight: '24px',
					color: '#b9caca',
					maxWidth: '560px',
					margin: '0 auto 40px',
				}}
			>
				Precision-engineered programs for elite performance. Access professional-grade coaching and data-driven
				insights to transform your physical potential.
			</p>
			<div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
				<button
					onClick={() => router.push('/account/join')}
					style={{
						background: '#e9feff',
						color: '#003739',
						fontFamily: 'Hanken Grotesk, sans-serif',
						fontWeight: 700,
						padding: '16px 32px',
						borderRadius: '8px',
						border: 'none',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						fontSize: '14px',
					}}
				>
					Get Started Free →
				</button>
				<button
					onClick={() => router.push('/workout')}
					style={{
						background: '#353436',
						color: '#e5e2e3',
						fontFamily: 'Hanken Grotesk, sans-serif',
						fontWeight: 700,
						padding: '16px 32px',
						borderRadius: '8px',
						border: '1px solid #3a494a',
						cursor: 'pointer',
						fontSize: '14px',
					}}
				>
					Browse Programs
				</button>
			</div>
		</section>
	);
};

export default HeroSection;
