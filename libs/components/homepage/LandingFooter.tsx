import React from 'react';
import moment from 'moment';

const LandingFooter = () => {
	const columns = [
		{ title: 'Programs', links: ['Hypertrophy', 'Powerlifting', 'Hybrid Athlete', 'Mobility'] },
		{ title: 'Company', links: ['About Us', 'Careers', 'Privacy', 'Terms'] },
		{ title: 'Support', links: ['Help Center', 'Contact Pro', 'System Status'] },
	];

	return (
		<footer style={{ background: '#0e0e0f', borderTop: '1px solid #3a494a', padding: '64px 0 0' }}>
			<div
				style={{
					maxWidth: '1200px',
					margin: '0 auto',
					padding: '0 24px',
					display: 'grid',
					gridTemplateColumns: '1fr 1fr 1fr 1fr',
					gap: '48px',
				}}
			>
				<div>
					<div
						style={{
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontSize: '24px',
							fontWeight: 800,
							letterSpacing: '-0.02em',
							color: '#e9feff',
							marginBottom: '24px',
						}}
					>
						GYMORA
					</div>
					<p
						style={{
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontSize: '14px',
							color: '#b9caca',
							lineHeight: '20px',
							marginBottom: '24px',
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
								marginBottom: '24px',
								fontSize: '14px',
							}}
						>
							{col.title}
						</h5>
						<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
							{col.links.map((link) => (
								<li key={link}>
									<a
										href="#"
										style={{
											fontFamily: 'Hanken Grotesk, sans-serif',
											fontSize: '14px',
											color: '#b9caca',
											textDecoration: 'none',
										}}
									>
										{link}
									</a>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
			<div
				style={{
					maxWidth: '1200px',
					margin: '48px auto 0',
					padding: '24px',
					borderTop: '1px solid #3a494a',
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
						color: '#b9caca',
						textTransform: 'uppercase',
					}}
				>
					© {moment().year()} GYMORA ELITE PERFORMANCE. ALL RIGHTS RESERVED.
				</span>
				<div style={{ display: 'flex', gap: '24px' }}>
					<span
						style={{
							fontFamily: 'JetBrains Mono, monospace',
							fontSize: '11px',
							letterSpacing: '0.05em',
							color: '#b9caca',
							textTransform: 'uppercase',
						}}
					>
						Status: Operational
					</span>
				</div>
			</div>
		</footer>
	);
};

export default LandingFooter;
