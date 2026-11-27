import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { GET_WORKOUTS } from '../../../apollo/user/query';
import { Workout } from '../../types/workout/workout';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import useReveal from '../../hooks/useReveal';
import QueryState from '../common/QueryState';

const HotWorkouts = () => {
	const router = useRouter();
	const { t } = useTranslation('landing');
	const [workouts, setWorkouts] = useState<Workout[]>([]);
	const sectionRef = useReveal<HTMLElement>(workouts.length > 0);

	const { loading, error, refetch } = useQuery(GET_WORKOUTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 5, sort: 'workoutRank', direction: 'DESC', search: {} } },
		onCompleted: (d: T) => setWorkouts(d?.getWorkouts?.list ?? []),
	});

	if (!workouts.length && !loading && !error) return null;

	return (
		<section ref={sectionRef} className="lp-section lp-reveal">
			<div className="lp-container">
				<div className="lp-section-head">
					<div>
						<span className="lp-eyebrow">{t('hotWorkouts.eyebrow')}</span>
						<h2 className="lp-h2">{t('hotWorkouts.title')}</h2>
					</div>
					<button className="lp-view-btn" onClick={() => router.push('/workout')}>
						{t('common:actions.viewAll')} →
					</button>
				</div>
				<QueryState loading={loading} error={error} hasData={workouts.length > 0} onRetry={() => void refetch()} />

				<div className="lp-workout-grid lp-workout-grid--observatory">
					{workouts.slice(0, 5).map((w, i) => {
						const isFeatured = i === 0;
						return (
						<article
								key={w._id}
								className={`lp-wcard${isFeatured ? ' lp-wcard--feature' : ''}`}
								onClick={() => router.push({ pathname: '/workout/detail', query: { id: w._id } })}
							>
								<div className="lp-wcard-img">
									<img
										src={w.workoutThumbnail ? `${REACT_APP_API_URL}/${w.workoutThumbnail}` : '/img/banner/header1.svg'}
										alt={w.workoutTitle}
										loading="lazy"
									/>
									<div className="lp-wcard-shade" />
									<div className="lp-wcard-topline">
										<span className={`lp-rank${isFeatured ? ' lp-chip--cyan' : ''}`}>#{i + 1}</span>
										{isFeatured && <span className="lp-chip lp-chip--cyan">{t('hotWorkouts.trending')}</span>}
									</div>
									<div className="lp-wcard-taxonomy">
										<span className="lp-chip">{t(`enums:muscle.${w.targetMuscle}`)}</span>
										<span className="lp-chip">{t(`enums:difficulty.${w.workoutDifficulty}`)}</span>
									</div>
								</div>

								<div className="lp-wcard-body">
									<div className="lp-wcard-title-row">
										<h3>{w.workoutTitle}</h3>
										<span className="lp-wcard-index">{String(i + 1).padStart(2, '0')}</span>
									</div>
									<div className="lp-wcard-data">
										<span className="lp-wcard-kcal">{t('hotWorkouts.kcal', { count: w.estimatedCaloriesBurned })}</span>
										<div className="lp-wcard-stats">
											<span><b>{w.workoutViews ?? 0}</b> {t('common:stats.views')}</span>
											<span><b>♥</b> {w.workoutLikes ?? 0}</span>
										</div>
									</div>
									<span className="lp-wcard-signal" aria-hidden="true" />
								</div>
							</article>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default HotWorkouts;
