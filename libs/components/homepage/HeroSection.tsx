import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { GET_WORKOUTS, GET_TRAINER_MEMBERS, GET_COURSES } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { T } from '../../types/common';
import useCountUp from '../../hooks/useCountUp';

const MARQUEE_ITEMS = [
	'muscle.Chest',
	'muscle.Back',
	'muscle.Legs',
	'muscle.Shoulders',
	'muscle.Arms',
	'muscle.Core',
	'muscle.Full Body',
	'category.STRENGTH',
	'category.CARDIO',
	'category.YOGA',
	'category.MOBILITY',
	'category.NUTRITION',
];

const HeroSection = () => {
	const router = useRouter();
	const { t } = useTranslation('landing');
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
				badge: workoutTotal > 0 ? t('hero.badgeWorkouts', { count: workoutTotal }) : t('hero.badgeDefault'),
				primary: { label: t('hero.ctaGetStarted'), action: () => router.push('/account/join') },
				secondary: { label: t('hero.ctaBrowsePrograms'), action: () => router.push('/course') },
		  }
		: user.memberType === 'TRAINER'
		? {
				badge: t('hero.badgeWelcome', { name: user.memberNick }),
				primary: { label: t('hero.ctaOpenStudio'), action: () => router.push('/mypage') },
				secondary: { label: t('hero.ctaPublicProfile'), action: () => router.push({ pathname: '/trainer/detail', query: { id: user._id } }) },
		  }
		: user.memberType === 'ADMIN'
		? {
				badge: t('hero.badgeWelcome', { name: user.memberNick }),
				primary: { label: t('hero.ctaAdminPanel'), action: () => router.push('/_admin/users') },
				secondary: { label: t('hero.ctaBrowsePlatform'), action: () => router.push('/workout') },
		  }
		: {
				badge: t('hero.badgeWelcome', { name: user.memberNick }),
				primary: { label: t('hero.ctaContinueTraining'), action: () => router.push('/workout') },
				secondary: { label: t('hero.ctaMyDashboard'), action: () => router.push('/mypage') },
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
				{/* Background: trainer campaign image + duotone tint + atmosphere */}
				<div className="lp-hero-bg" />
				<div className="lp-hero-tint" />
				<div className="lp-hero-orb" />
				<div className="lp-hero-grain" />
				<div className="lp-hero-tint-bottom" />

				<div className="lp-hero-visual" aria-hidden="true">
					<span className="lp-hero-motion-ring lp-hero-motion-ring--wide" />
					<span className="lp-hero-motion-ring lp-hero-motion-ring--tight" />
					<span className="lp-hero-motion-sweep" />
					<span className="lp-hero-motion-spark lp-hero-motion-spark--one" />
					<span className="lp-hero-motion-spark lp-hero-motion-spark--two" />
				</div>

				<div className="lp-container">
					<div className="lp-hero-content">
						<div className="lp-hero-badge">
							<span className="lp-dot" />
							<span>{heroCta.badge}</span>
						</div>

						<h1 className="lp-hero-title">
							{t('hero.titleLine1')
								.split(' ')
								.map((word, i) => (
									<React.Fragment key={`l1-${i}`}>
										{i > 0 && ' '}
										<span className="lp-word">
											<span style={{ animationDelay: `${0.1 + i * 0.1}s` }}>{word}</span>
										</span>
									</React.Fragment>
								))}
							<br />
							<span className="lp-hero-line lp-hero-line--signal">
								{t('hero.titleLine2')
									.split(' ')
									.map((word, i) => (
										<React.Fragment key={`l2-${i}`}>
											{i > 0 && ' '}
											<span className="lp-word">
												<span className="lp-grad" style={{ animationDelay: `${0.32 + i * 0.1}s` }}>
													{word}
												</span>
											</span>
										</React.Fragment>
									))}
							</span>
						</h1>

						<p className="lp-hero-subtitle">{t('hero.subtitle')}</p>

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
								{ value: workoutTotal > 0 ? `${workoutCount}+` : '—', label: t('common:stats.workouts') },
								{ value: trainerTotal > 0 ? `${trainerCount}+` : '—', label: t('common:nav.trainers') },
								{ value: courseTotal > 0 ? `${courseCount}+` : '—', label: t('common:stats.programs') },
								{ value: '24/7', label: t('hero.statAccess') },
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
									{t(`enums:${item}`)}
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
