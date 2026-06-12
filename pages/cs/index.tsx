import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common', 'static'])) },
});

const SupportPage: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('static');
	const [open, setOpen] = useState<number | null>(0);

	// Static FAQ — there is no CS backend module; every answer reflects real platform behavior.
	const faqs = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
		q: t(`cs.faq.q${n}`),
		a: t(`cs.faq.a${n}`),
	}));

	return (
		<div className="wl-page">
			<div className="lp-container" style={{ maxWidth: '860px' }}>
				{/* Hero */}
				<div className="wl-hero">
					<div className="wl-hero-glow" />
					<span className="lp-eyebrow" style={{ marginBottom: '8px' }}>{t('cs.eyebrow')}</span>
					<h1 className="wl-title">
						{t('cs.titlePre')} <span className="lp-grad">{t('cs.titleAccent')}</span>
					</h1>
					<p className="lp-sub" style={{ margin: 0 }}>
						{t('cs.subtitle')}
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
					<h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)' }}>{t('cs.cta.title')}</h2>
					<p>{t('cs.cta.subtitle')}</p>
					<div className="lp-cta-actions">
						<button className="lp-btn-primary" onClick={() => router.push('/community')}>
							{t('cs.cta.primary')}
						</button>
						<button className="lp-btn-ghost" onClick={() => router.push('/trainer')}>
							{t('cs.cta.secondary')}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(SupportPage);
