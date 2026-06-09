import React from 'react';
import { useRouter } from 'next/router';

const SubscriptionPlans = () => {
	const router = useRouter();

	return (
		<section style={{ maxWidth: '1200px', margin: '0 auto', padding: '96px 24px' }}>
			<div
				style={{
					position: 'relative',
					background: '#201f20',
					borderRadius: '16px',
					padding: '48px',
					overflow: 'hidden',
					border: '1px solid #3a494a',
					textAlign: 'center',
				}}
			>
				<h2
					style={{
						fontFamily: 'Hanken Grotesk, sans-serif',
						fontSize: '40px',
						lineHeight: '48px',
						letterSpacing: '-0.02em',
						fontWeight: 800,
						color: '#e5e2e3',
						marginBottom: '24px',
					}}
				>
					Ready to reach your peak?
				</h2>
				<p
					style={{
						fontFamily: 'Hanken Grotesk, sans-serif',
						fontSize: '16px',
						lineHeight: '24px',
						color: '#b9caca',
						maxWidth: '640px',
						margin: '0 auto 40px',
					}}
				>
					Join 50,000+ athletes using GYMORA to redefine what's possible in their training journey.
				</p>
				<div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
					<button
						onClick={() => router.push('/account/join')}
						style={{
							background: '#e9feff',
							color: '#003739',
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontWeight: 700,
							padding: '20px 40px',
							borderRadius: '8px',
							border: 'none',
							cursor: 'pointer',
							fontSize: '14px',
							transition: 'transform 0.2s',
						}}
						onMouseOver={(e) => ((e.target as HTMLElement).style.transform = 'scale(1.05)')}
						onMouseOut={(e) => ((e.target as HTMLElement).style.transform = 'scale(1)')}
					>
						Get Started Now
					</button>
					<button
						onClick={() => router.push('/cs')}
						style={{
							background: 'transparent',
							color: '#e5e2e3',
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontWeight: 700,
							padding: '20px 40px',
							borderRadius: '8px',
							border: '1px solid #3a494a',
							cursor: 'pointer',
							fontSize: '14px',
						}}
					>
						Talk to a Coach
					</button>
				</div>
			</div>
		</section>
	);
};

export default SubscriptionPlans;
