import React from 'react';
import moment from 'moment';
import Link from 'next/link';

const columns = [
	{ title: 'Platform', links: [{ label: 'Workouts', href: '/workout' }, { label: 'Programs', href: '/course' }, { label: 'Trainers', href: '/trainer' }, { label: 'Community', href: '/community' }] },
	{ title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Support', href: '/cs' }, { label: 'Privacy', href: '#' }, { label: 'Terms', href: '#' }] },
];

const LandingFooter = () => {
	return (
		<footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '56px 0 0', background: '#0a0a0b' }}>
			<div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '64px' }}>
				<div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
						<div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #00dce5, #00f5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
							<span style={{ fontSize: '14px', fontWeight: 900, color: '#003739', fontFamily: 'Hanken Grotesk' }}>G</span>
						</div>
						<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>gymora</span>
					</div>
					<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'rgba(185,202,202,0.5)', lineHeight: '1.6', maxWidth: '300px' }}>
						The elite platform for high-performance training and athletic development.
					</p>
				</div>
				{columns.map((col) => (
					<div key={col.title}>
						<h5 style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', fontWeight: 600, color: 'rgba(185,202,202,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '20px' }}>{col.title}</h5>
						<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
							{col.links.map((link) => (
								<li key={link.label}>
									<Link href={link.href} style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'rgba(185,202,202,0.4)', textDecoration: 'none', transition: 'color 0.2s ease' }}
										onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(233,254,255,0.8)'; }}
										onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(185,202,202,0.4)'; }}
									>{link.label}</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
			<div style={{ maxWidth: '1280px', margin: '40px auto 0', padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
					{moment().year()} Gymora. All rights reserved.
				</span>
			</div>
		</footer>
	);
};

export default LandingFooter;
