import React from 'react';
import moment from 'moment';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

const LandingFooter = () => {
	const { t } = useTranslation('common');
	const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

	const columns = [
		{
			title: t('footer.platform'),
			links: [
				{ label: t('nav.workouts'), href: '/workout' },
				{ label: t('nav.programs'), href: '/course' },
				{ label: t('nav.trainers'), href: '/trainer' },
				{ label: t('nav.community'), href: '/community' },
			],
		},
		{
			title: t('footer.account'),
			links: [
				{ label: t('footer.joinFree'), href: '/account/join' },
				{ label: t('nav.myPage'), href: '/mypage' },
				{ label: t('footer.membership'), href: '/subscription' },
			],
		},
		{
			title: t('footer.company'),
			links: [
				{ label: t('footer.about'), href: '/about' },
				{ label: t('footer.support'), href: '/cs' },
				{ label: t('footer.privacy'), href: '/privacy' },
				{ label: t('footer.terms'), href: '/terms' },
			],
		},
	];

	return (
		<footer className="lp-footer">
			<div className="lp-footer-watermark" aria-hidden="true">GYMORA</div>
			<div className="lp-container">
				<div className="lp-footer-signal" aria-hidden="true">
					<span />
					<span />
					<span />
					<span />
				</div>
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
						<p>{t('footer.tagline')}</p>
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
					<span>
						{moment().year()} {t('footer.rightsReserved')}
					</span>
					<button className="lp-footer-top-btn" onClick={scrollTop}>
						{t('footer.backToTop')}
					</button>
				</div>
			</div>
		</footer>
	);
};

export default LandingFooter;
