import React from 'react';
import useReveal from '../../hooks/useReveal';

const steps = [
	{
		num: '01',
		title: 'Create your free account',
		desc: 'Join in seconds. Every workout on the platform is completely free — train with no paywall from day one.',
	},
	{
		num: '02',
		title: 'Train with elite programs',
		desc: 'Follow trainer-built workouts, then go deeper with structured multi-week programs. Secure checkout, instant access to your first lesson.',
	},
	{
		num: '03',
		title: 'Track everything',
		desc: 'Scan meals with AI, hit personalized nutrition targets and watch your progress timeline grow in your dashboard.',
	},
];

const HowItWorks = () => {
	const sectionRef = useReveal<HTMLElement>();

	return (
		<section ref={sectionRef} className="lp-section lp-reveal">
			<div className="lp-container">
				<div className="lp-section-head">
					<div>
						<span className="lp-eyebrow">How it works</span>
						<h2 className="lp-h2">From first rep to real results</h2>
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
