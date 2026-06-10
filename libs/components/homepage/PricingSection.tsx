import React from 'react';
import { useRouter } from 'next/router';
import useReveal from '../../hooks/useReveal';

/**
 * Plan prices mirror the canonical PLAN_PRICES on the backend
 * (payment.service.ts) — the server validates every payment amount.
 */
const PricingSection = () => {
	const router = useRouter();
	const sectionRef = useReveal<HTMLElement>();

	return (
		<section ref={sectionRef} className="lp-section lp-section--tinted lp-reveal">
			<div className="lp-container">
				<div className="lp-section-head" style={{ justifyContent: 'center', textAlign: 'center' }}>
					<div>
						<span className="lp-eyebrow">Membership</span>
						<h2 className="lp-h2">Simple, honest pricing</h2>
						<p className="lp-sub" style={{ margin: '14px auto 0' }}>
							Every workout is free forever and programs are one-time purchases. Membership is how you back the platform and the trainers behind it.
						</p>
					</div>
				</div>

				<div className="lp-pricing-grid">
					<div className="lp-price-card">
						<span className="lp-price-plan">Monthly</span>
						<span className="lp-price-value">
							$14.99 <span>/ month</span>
						</span>
						<p className="lp-price-note">Billed monthly. Cancel anytime.</p>
						<ul>
							<li>Support free training for everyone</li>
							<li>Back verified trainers directly</li>
							<li>Billed monthly, cancel anytime</li>
							<li>Secured by Stripe</li>
						</ul>
						<button className="lp-btn-ghost lp-price-btn" onClick={() => router.push('/subscription')}>
							Start Monthly
						</button>
					</div>

					<div className="lp-price-card is-featured">
						<span className="lp-price-plan">
							Yearly <span className="lp-price-save">Save 33%</span>
						</span>
						<span className="lp-price-value">
							$9.99 <span>/ month</span>
						</span>
						<p className="lp-price-note">$119.88 billed yearly. Cancel anytime.</p>
						<ul>
							<li>Everything in Monthly</li>
							<li>Best value — $9.99 a month</li>
							<li>One payment for the whole year</li>
							<li>Founding supporter of the platform</li>
						</ul>
						<button className="lp-btn-primary lp-price-btn" onClick={() => router.push('/subscription')}>
							Start Yearly
						</button>
					</div>
				</div>
			</div>
		</section>
	);
};

export default PricingSection;
