import React from 'react';
import moment from 'moment';
import Link from 'next/link';

const columns = [
	{
		title: 'Platform',
		links: [
			{ label: 'Workouts', href: '/workout' },
			{ label: 'Programs', href: '/course' },
			{ label: 'Trainers', href: '/trainer' },
			{ label: 'Community', href: '/community' },
		],
	},
	{
		title: 'Account',
		links: [
			{ label: 'Join Free', href: '/account/join' },
			{ label: 'My Page', href: '/mypage' },
			{ label: 'Membership', href: '/subscription' },
		],
	},
	{
		title: 'Company',
		links: [
			{ label: 'About', href: '/about' },
			{ label: 'Support', href: '/cs' },
			{ label: 'Privacy', href: '/privacy' },
			{ label: 'Terms', href: '/terms' },
		],
	},
];

const LandingFooter = () => {
	const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

	return (
		<footer className="lp-footer">
			<div className="lp-container">
				<div className="lp-footer-grid">
					<div className="lp-footer-brand">
						<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
							<div
								style={{
									width: '28px',
									height: '28px',
									borderRadius: '8px',
									background: 'linear-gradient(135deg, #00dce5, #00f5ff)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<span style={{ fontSize: '14px', fontWeight: 900, color: '#003739', fontFamily: 'Hanken Grotesk' }}>G</span>
							</div>
							<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
								gymora
							</span>
						</div>
						<p>The elite platform for high-performance training and athletic development.</p>
					</div>

					{columns.map((col) => (
						<div key={col.title} className="lp-footer-col">
							<h5>{col.title}</h5>
							<ul>
								{col.links.map((link) => (
									<li key={link.label}>
										<Link href={link.href}>{link.label}</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="lp-footer-bottom" style={{ marginTop: '56px' }}>
					<span>{moment().year()} Gymora. All rights reserved.</span>
					<button className="lp-footer-top-btn" onClick={scrollTop}>
						Back to top ↑
					</button>
				</div>
			</div>
		</footer>
	);
};

export default LandingFooter;
