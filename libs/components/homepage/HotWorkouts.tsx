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

				<div className="lp-workout-grid">
					{workouts.slice(0, 5).map((w, i) => {
						const isFeatured = i === 0;
						return (
							<div
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
									<div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
										<span className={`lp-rank${isFeatured ? ' lp-chip--cyan' : ''}`}>#{i + 1}</span>
										{isFeatured && <span className="lp-chip lp-chip--cyan">{t('hotWorkouts.trending')}</span>}
									</div>
									<div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '6px' }}>
										<span className="lp-chip">{t(`enums:muscle.${w.targetMuscle}`)}</span>
										<span className="lp-chip">{t(`enums:difficulty.${w.workoutDifficulty}`)}</span>
									</div>
								</div>

								<div className="lp-wcard-body">
									<h3
										style={{
											fontFamily: 'Hanken Grotesk',
											fontSize: '16px',
											fontWeight: 600,
											color: '#e5e2e3',
											lineHeight: '1.3',
											margin: '0 0 8px',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
									>
										{w.workoutTitle}
									</h3>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 700, color: '#ffc08f' }}>
											{t('hotWorkouts.kcal', { count: w.estimatedCaloriesBurned })}
										</span>
										<div style={{ display: 'flex', gap: '12px' }}>
											<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'rgba(213,226,226,0.8)' }}>
												<b style={{ color: '#ffffff' }}>{w.workoutViews ?? 0}</b> {t('common:stats.views')}
											</span>
											<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'rgba(213,226,226,0.8)' }}>
												♥ <b style={{ color: '#ffffff' }}>{w.workoutLikes ?? 0}</b>
											</span>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default HotWorkouts;
