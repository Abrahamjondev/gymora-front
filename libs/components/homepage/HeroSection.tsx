import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { GET_WORKOUTS, GET_TRAINER_MEMBERS, GET_COURSES } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { T } from '../../types/common';
import useCountUp from '../../hooks/useCountUp';

const MARQUEE_ITEMS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Strength', 'Cardio', 'Yoga', 'Mobility', 'Nutrition'];

const HeroSection = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [workoutTotal, setWorkoutTotal] = useState<number>(0);
	const [trainerTotal, setTrainerTotal] = useState<number>(0);
	const [courseTotal, setCourseTotal] = useState<number>(0);
	const workoutCount = useCountUp(workoutTotal);
	const trainerCount = useCountUp(trainerTotal);
	const courseCount = useCountUp(courseTotal);

	// Role-aware hero CTAs — a logged-in member never sees "Get Started Free"
	const heroCta = !user?._id
		? {
				badge: workoutTotal > 0 ? `${workoutTotal}+ workouts available` : 'Elite fitness platform',
				primary: { label: 'Get Started Free', action: () => router.push('/account/join') },
				secondary: { label: 'Browse Programs', action: () => router.push('/course') },
		  }
		: user.memberType === 'TRAINER'
		? {
				badge: `Welcome back, ${user.memberNick}`,
				primary: { label: 'Open Your Studio', action: () => router.push('/mypage') },
				secondary: { label: 'My Public Profile', action: () => router.push({ pathname: '/trainer/detail', query: { id: user._id } }) },
		  }
		: user.memberType === 'ADMIN'
		? {
				badge: `Welcome back, ${user.memberNick}`,
				primary: { label: 'Open Admin Panel', action: () => router.push('/_admin/users') },
				secondary: { label: 'Browse Platform', action: () => router.push('/workout') },
		  }
		: {
				badge: `Welcome back, ${user.memberNick}`,
				primary: { label: 'Continue Training', action: () => router.push('/workout') },
				secondary: { label: 'My Dashboard', action: () => router.push('/mypage') },
		  };

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

	useQuery(GET_COURSES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, sort: 'createdAt', direction: 'DESC', search: {} } },
		onCompleted: (d: T) => setCourseTotal(d?.getCourses?.metaCounter?.[0]?.total ?? 0),
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
							<span>{heroCta.badge}</span>
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
							<button className="lp-btn-primary" onClick={heroCta.primary.action}>
								{heroCta.primary.label} <span style={{ fontSize: '16px' }}>→</span>
							</button>
							<button className="lp-btn-ghost" onClick={heroCta.secondary.action}>
								{heroCta.secondary.label}
							</button>
						</div>

						<div className="lp-hero-stats">
							{[
								{ value: workoutTotal > 0 ? `${workoutCount}+` : '—', label: 'Workouts' },
								{ value: trainerTotal > 0 ? `${trainerCount}+` : '—', label: 'Trainers' },
								{ value: courseTotal > 0 ? `${courseCount}+` : '—', label: 'Programs' },
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
