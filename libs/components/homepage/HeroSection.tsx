import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { GET_WORKOUTS, GET_TRAINER_MEMBERS } from '../../../apollo/user/query';
import { T } from '../../types/common';
import useCountUp from '../../hooks/useCountUp';

const MARQUEE_ITEMS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Strength', 'Cardio', 'Yoga', 'Mobility', 'Nutrition'];

const HeroSection = () => {
	const router = useRouter();
	const [workoutTotal, setWorkoutTotal] = useState<number>(0);
	const [trainerTotal, setTrainerTotal] = useState<number>(0);
	const workoutCount = useCountUp(workoutTotal);
	const trainerCount = useCountUp(trainerTotal);

	useQuery(GET_WORKOUTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, search: {} } },
		onCompleted: (d: T) => setWorkoutTotal(d?.getWorkouts?.metaCounter?.[0]?.total ?? 0),
	});

	useQuery(GET_TRAINER_MEMBERS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, search: {} } },
		onCompleted: (d: T) => setTrainerTotal(d?.getTrainerMembers?.metaCounter?.[0]?.total ?? 0),
	});

	return (
		<>
			<section className="lp-hero">
				{/* Background: athletic photo + duotone tint + atmosphere */}
				<div className="lp-hero-bg" />
				<div className="lp-hero-tint" />
				<div className="lp-hero-orb" />
				<div className="lp-hero-grain" />
				<div className="lp-hero-tint-bottom" />

				<div className="lp-container">
					<div className="lp-hero-content">
						<div className="lp-hero-badge">
							<span className="lp-dot" />
							<span>{workoutTotal > 0 ? `${workoutTotal}+ workouts available` : 'Elite fitness platform'}</span>
						</div>

						<h1 className="lp-hero-title">
							<span className="lp-word">
								<span style={{ animationDelay: '0.1s' }}>Expert</span>
							</span>{' '}
							<span className="lp-word">
								<span style={{ animationDelay: '0.2s' }}>training.</span>
							</span>
							<br />
							<span className="lp-word">
								<span className="lp-grad" style={{ animationDelay: '0.32s' }}>
									Real
								</span>
							</span>{' '}
							<span className="lp-word">
								<span className="lp-grad" style={{ animationDelay: '0.42s' }}>
									results.
								</span>
							</span>
						</h1>

						<p className="lp-hero-subtitle">
							Precision-engineered programs for elite performance. Professional-grade coaching and data-driven insights.
						</p>

						<div className="lp-hero-actions">
							<button className="lp-btn-primary" onClick={() => router.push('/account/join')}>
								Get Started Free <span style={{ fontSize: '16px' }}>→</span>
							</button>
							<button className="lp-btn-ghost" onClick={() => router.push('/workout')}>
								Browse Programs
							</button>
						</div>

						<div className="lp-hero-stats">
							{[
								{ value: workoutTotal > 0 ? `${workoutCount}+` : '—', label: 'Workouts' },
								{ value: trainerTotal > 0 ? `${trainerCount}+` : '—', label: 'Trainers' },
								{ value: '100%', label: 'Free Workouts' },
								{ value: '24/7', label: 'Access' },
							].map((stat) => (
								<div key={stat.label}>
									<span className="lp-stat-value">{stat.value}</span>
									<span className="lp-stat-label">{stat.label}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Discipline marquee */}
			<div className="lp-marquee" aria-hidden="true">
				<div className="lp-marquee-track">
					{[0, 1].map((copy) => (
						<React.Fragment key={copy}>
							{MARQUEE_ITEMS.map((item) => (
								<span key={`${copy}-${item}`} className="lp-marquee-item">
									{item}
								</span>
							))}
						</React.Fragment>
					))}
				</div>
			</div>
		</>
	);
};

export default HeroSection;
