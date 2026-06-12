import React from 'react';
import { useTranslation } from 'next-i18next';
import useReveal from '../../hooks/useReveal';

const HowItWorks = () => {
	const { t } = useTranslation('landing');
	const sectionRef = useReveal<HTMLElement>();

	const steps = [
		{
			num: '01',
			title: t('howItWorks.step1.title'),
			desc: t('howItWorks.step1.desc'),
		},
		{
			num: '02',
			title: t('howItWorks.step2.title'),
			desc: t('howItWorks.step2.desc'),
		},
		{
			num: '03',
			title: t('howItWorks.step3.title'),
			desc: t('howItWorks.step3.desc'),
		},
	];

	return (
		<section ref={sectionRef} className="lp-section lp-reveal">
			<div className="lp-container">
				<div className="lp-section-head">
					<div>
						<span className="lp-eyebrow">{t('howItWorks.eyebrow')}</span>
						<h2 className="lp-h2">{t('howItWorks.title')}</h2>
					</div>
				</div>

				<div className="lp-how-grid">
					{steps.map((step) => (
						<div key={step.num} className="lp-how-card">
							<span className="lp-how-num">{step.num}</span>
							<h3>{step.title}</h3>
							<p>{step.desc}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default HowItWorks;
