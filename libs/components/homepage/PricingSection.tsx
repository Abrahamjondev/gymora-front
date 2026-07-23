import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import useReveal from '../../hooks/useReveal';

/**
 * Plan prices mirror the canonical PLAN_PRICES on the backend
 * (payment.service.ts) — the server validates every payment amount.
 */
const PricingSection = () => {
	const router = useRouter();
	const { t } = useTranslation('landing');
	const sectionRef = useReveal<HTMLElement>();

	return (
		<section ref={sectionRef} className="lp-section lp-section--tinted lp-reveal">
			<div className="lp-container">
				<div className="lp-section-head" style={{ justifyContent: 'center', textAlign: 'center' }}>
					<div>
						<span className="lp-eyebrow">{t('pricing.eyebrow')}</span>
						<h2 className="lp-h2">{t('pricing.title')}</h2>
						<p className="lp-sub" style={{ margin: '14px auto 0' }}>
							{t('pricing.subtitle')}
						</p>
					</div>
				</div>

			<div className="lp-pricing-grid lp-pricing-grid--console">
				<div className="lp-price-card lp-price-card--compact" data-plan="monthly">
					<span className="lp-price-card-orbit" aria-hidden="true" />
					<div className="lp-price-card-head">
						<span className="lp-price-plan">{t('pricing.monthly.plan')}</span>
						<span className="lp-price-index">01</span>
					</div>
					<span className="lp-price-value">
						$14.99 <span>{t('pricing.perMonth')}</span>
						</span>
						<p className="lp-price-note">{t('pricing.monthly.note')}</p>
						<ul>
							<li>{t('pricing.monthly.feature1')}</li>
							<li>{t('pricing.monthly.feature2')}</li>
							<li>{t('pricing.monthly.feature3')}</li>
							<li>{t('pricing.monthly.feature4')}</li>
						</ul>
					<div className="lp-price-card-foot">
						<button className="lp-btn-ghost lp-price-btn" onClick={() => router.push('/subscription')}>
							{t('pricing.monthly.cta')} <span className="lp-price-btn-arrow">↗</span>
						</button>
					</div>
				</div>

				<div className="lp-price-card lp-price-card--compact is-featured" data-plan="yearly">
					<span className="lp-price-card-orbit" aria-hidden="true" />
					<div className="lp-price-card-head">
						<span className="lp-price-plan">
							{t('pricing.yearly.plan')} <span className="lp-price-save">{t('pricing.yearly.save')}</span>
						</span>
						<span className="lp-price-index">02</span>
					</div>
						<span className="lp-price-value">
							$9.99 <span>{t('pricing.perMonth')}</span>
						</span>
						<p className="lp-price-note">{t('pricing.yearly.note')}</p>
						<ul>
							<li>{t('pricing.yearly.feature1')}</li>
							<li>{t('pricing.yearly.feature2')}</li>
							<li>{t('pricing.yearly.feature3')}</li>
							<li>{t('pricing.yearly.feature4')}</li>
						</ul>
					<div className="lp-price-card-foot">
						<button className="lp-btn-primary lp-price-btn" onClick={() => router.push('/subscription')}>
							{t('pricing.yearly.cta')} <span className="lp-price-btn-arrow">↗</span>
						</button>
					</div>
				</div>
				</div>
			</div>
		</section>
	);
};

export default PricingSection;
