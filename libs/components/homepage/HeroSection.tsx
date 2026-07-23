import React from 'react';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { GET_WORKOUTS, GET_TRAINER_MEMBERS, GET_COURSES } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { T } from '../../types/common';
import useCountUp from '../../hooks/useCountUp';

const HeroSection = () => {
	const router = useRouter();
	const { t } = useTranslation('landing');
	const user = useReactiveVar(userVar);
	const { data: workoutsData } = useQuery(GET_WORKOUTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, search: {} } },
	});
	const { data: trainersData } = useQuery(GET_TRAINER_MEMBERS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, search: {} } },
	});
	const { data: coursesData } = useQuery(GET_COURSES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, sort: 'createdAt', direction: 'DESC', search: {} } },
	});
	const workoutTotal = (workoutsData as T | undefined)?.getWorkouts?.metaCounter?.[0]?.total ?? 0;
	const trainerTotal = (trainersData as T | undefined)?.getTrainerMembers?.metaCounter?.[0]?.total ?? 0;
	const courseTotal = (coursesData as T | undefined)?.getCourses?.metaCounter?.[0]?.total ?? 0;
	const workoutCount = useCountUp(workoutTotal);
	const trainerCount = useCountUp(trainerTotal);
	const courseCount = useCountUp(courseTotal);
	const heroStats = [
		{ value: workoutTotal > 0 ? `${workoutCount}+` : '—', label: t('common:stats.workouts') },
		{ value: trainerTotal > 0 ? `${trainerCount}+` : '—', label: t('common:nav.trainers') },
		{ value: courseTotal > 0 ? `${courseCount}+` : '—', label: t('common:stats.programs') },
		{ value: '24/7', label: t('hero.statAccess') },
	];

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

					</div>
				</div>
			</section>

			<div className="lp-stats-deck" aria-label={t('hero.statsLabel')}>
				<div className="lp-stats-deck-inner">
					{heroStats.map((stat, index) => (
						<div key={stat.label} className={`lp-stat-card${index === heroStats.length - 1 ? ' is-accent' : ''}`}>
							<span className="lp-stat-card-index">0{index + 1}</span>
							<div>
								<span className="lp-stat-card-value">{stat.value}</span>
								<span className="lp-stat-card-label">{stat.label}</span>
							</div>
							<span className="lp-stat-card-signal" aria-hidden="true" />
						</div>
					))}
					</div>
				</div>
			</>
	);
};

export default HeroSection;
