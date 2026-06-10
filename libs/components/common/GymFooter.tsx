import React from 'react';
import moment from 'moment';
import Link from 'next/link';

const GymFooter = () => {
	const columns = [
		{
			title: 'Platform',
			links: [
				{ label: 'Workouts', href: '/workout' },
				{ label: 'Community', href: '/community' },
				{ label: 'Support', href: '/cs' },
			],
		},
		{
			title: 'Company',
			links: [
				{ label: 'About Us', href: '/about' },
				{ label: 'Privacy', href: '/privacy' },
				{ label: 'Terms', href: '/terms' },
			],
		},
	];

	return (
		<footer style={{ background: '#0e0e0f', borderTop: '1px solid #3a494a', padding: '48px 0 0' }}>
			<div
				style={{
					maxWidth: '1200px',
					margin: '0 auto',
					padding: '0 24px',
					display: 'grid',
					gridTemplateColumns: '2fr 1fr 1fr',
					gap: '48px',
				}}
			>
				<div>
					<span
						style={{
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontSize: '24px',
							fontWeight: 800,
							letterSpacing: '-0.02em',
							color: '#e9feff',
							display: 'block',
							marginBottom: '16px',
						}}
					>
						GYMORA
					</span>
					<p
						style={{
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontSize: '14px',
							color: '#b9caca',
							lineHeight: '20px',
							maxWidth: '320px',
						}}
					>
						The elite platform for high-performance training and athletic development.
					</p>
				</div>
				{columns.map((col) => (
					<div key={col.title}>
						<h5
							style={{
								fontFamily: 'Hanken Grotesk, sans-serif',
								fontWeight: 700,
								color: '#e5e2e3',
								marginBottom: '20px',
								fontSize: '14px',
							}}
						>
							{col.title}
						</h5>
						<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
							{col.links.map((link) => (
								<li key={link.label}>
									<Link
										href={link.href}
										style={{
											fontFamily: 'Hanken Grotesk, sans-serif',
											fontSize: '14px',
											color: '#849495',
											textDecoration: 'none',
										}}
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
			<div
				style={{
					maxWidth: '1200px',
					margin: '32px auto 0',
					padding: '20px 24px',
					borderTop: '1px solid rgba(58,73,74,0.5)',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<span
					style={{
						fontFamily: 'JetBrains Mono, monospace',
						fontSize: '11px',
						letterSpacing: '0.05em',
						color: '#849495',
						textTransform: 'uppercase',
					}}
				>
					© {moment().year()} GYMORA. ALL RIGHTS RESERVED.
				</span>
			</div>
		</footer>
	);
};

export default GymFooter;
