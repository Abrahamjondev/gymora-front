import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import moment from 'moment';
import { useTranslation } from 'next-i18next';
import { GET_BOARD_ARTICLES, GET_COURSES, GET_TRAINER_MEMBERS, GET_WORKOUTS } from '../../../apollo/user/query';
import { REACT_APP_API_URL } from '../../config';
import { Course } from '../../types/course/course';
import { Member } from '../../types/member/member';
import { T } from '../../types/common';
import { Workout } from '../../types/workout/workout';
import useReveal from '../../hooks/useReveal';

interface ArticleSignal {
	_id: string;
	articleCategory: string;
	articleTitle: string;
	articleViews: number;
	articleLikes: number;
	createdAt: string;
	memberData?: { memberNick: string };
}

const mediaUrl = (path?: string) => (path ? `${REACT_APP_API_URL}/${path}` : '');

const PerformanceSignal = () => {
	const router = useRouter();
	const { t } = useTranslation('landing');
	const { data: workoutsData } = useQuery(GET_WORKOUTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, sort: 'workoutRank', direction: 'DESC', search: {} } },
	});
	const { data: coursesData } = useQuery(GET_COURSES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, sort: 'courseRank', direction: 'DESC', search: {} } },
	});
	const { data: trainersData } = useQuery(GET_TRAINER_MEMBERS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, sort: 'memberRank', direction: 'DESC', search: {} } },
	});
	const { data: articlesData } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, sort: 'createdAt', direction: 'DESC', search: {} } },
	});

	const workout = (workoutsData as T | undefined)?.getWorkouts?.list?.[0] as Workout | undefined;
	const course = (coursesData as T | undefined)?.getCourses?.list?.[0] as Course | undefined;
	const trainer = (trainersData as T | undefined)?.getTrainerMembers?.list?.[0] as Member | undefined;
	const article = (articlesData as T | undefined)?.getBoardArticles?.list?.[0] as ArticleSignal | undefined;
	const hasSignal = Boolean(workout || course || trainer || article);
	const sectionRef = useReveal<HTMLElement>(hasSignal);

	if (!hasSignal) return null;

	return (
		<section ref={sectionRef} className="lp-section lp-section--signal lp-reveal">
			<div className="lp-container">
				<div className="lp-section-head lp-signal-head">
					<div>
						<span className="lp-eyebrow lp-eyebrow--green">{t('performanceSignal.eyebrow')}</span>
						<h2 className="lp-h2">{t('performanceSignal.title')}</h2>
					</div>
					<button type="button" className="lp-view-btn" onClick={() => router.push('/workout')}>
						{t('performanceSignal.viewLibrary')} <span aria-hidden="true">→</span>
					</button>
				</div>

				<div className="lp-signal-console">
					{workout && (
						<button
							type="button"
							className="lp-signal-primary"
							onClick={() => router.push({ pathname: '/workout/detail', query: { id: workout._id } })}
						>
							{workout.workoutThumbnail && (
								<img className="lp-signal-primary-image" src={mediaUrl(workout.workoutThumbnail)} alt={workout.workoutTitle} loading="lazy" />
							)}
							<span className="lp-signal-primary-shade" aria-hidden="true" />
							<span className="lp-signal-primary-grid" aria-hidden="true" />
							<span className="lp-signal-primary-beacon" aria-hidden="true" />
							<span className="lp-signal-primary-topline">
								<span className="lp-signal-live"><i aria-hidden="true" /> {t('performanceSignal.live')}</span>
								<span>01 / 04</span>
							</span>
							<span className="lp-signal-primary-content">
								<span className="lp-signal-label">{t('performanceSignal.workoutLabel')}</span>
								<strong>{workout.workoutTitle}</strong>
								<span className="lp-signal-primary-meta">
									<span>{t(`enums:muscle.${workout.targetMuscle}`)}</span>
									<span>{t(`enums:difficulty.${workout.workoutDifficulty}`)}</span>
									<span>{t('hotWorkouts.kcal', { count: workout.estimatedCaloriesBurned })}</span>
								</span>
							</span>
						</button>
					)}

					<div className="lp-signal-rail">
						{course && (
							<button
								type="button"
								className="lp-signal-item lp-signal-item--orange"
								onClick={() => router.push({ pathname: '/course/detail', query: { id: course._id } })}
							>
								<span className="lp-signal-item-index">02</span>
								<span className="lp-signal-item-copy">
									<span className="lp-signal-label">{t('performanceSignal.programLabel')}</span>
									<strong>{course.courseTitle}</strong>
									<span className="lp-signal-item-meta">
										<span>{t(`enums:category.${course.courseCategory}`)}</span>
										<span>{t('topCourses.weeksShort', { count: course.courseDuration })}</span>
										<span>{course.coursePrice > 0 ? `$${course.coursePrice}` : t('topCourses.free')}</span>
									</span>
								</span>
								<span className="lp-signal-item-arrow" aria-hidden="true">↗</span>
							</button>
						)}

						{trainer && (
							<button
								type="button"
								className="lp-signal-item lp-signal-item--green"
								onClick={() => router.push({ pathname: '/trainer/detail', query: { id: trainer._id } })}
							>
								<span className="lp-signal-item-index">03</span>
								<span className="lp-signal-item-copy">
									<span className="lp-signal-label">{t('performanceSignal.trainerLabel')}</span>
									<strong>{trainer.memberFullName || trainer.memberNick}</strong>
									<span className="lp-signal-item-meta">
										<span>{t('performanceSignal.coachStatus')}</span>
										<span>{trainer.memberWorkouts} {t('performanceSignal.workoutsShort')}</span>
										<span>{trainer.memberFollowers} {t('performanceSignal.followersShort')}</span>
									</span>
								</span>
								<span className="lp-signal-item-avatar">
									<img src={mediaUrl(trainer.memberImage) || '/img/profile/defaultUser.svg'} alt={trainer.memberNick} loading="lazy" />
								</span>
							</button>
						)}

						{article && (
							<button
								type="button"
								className="lp-signal-item lp-signal-item--violet"
								onClick={() => router.push({ pathname: '/community/detail', query: { id: article._id } })}
							>
								<span className="lp-signal-item-index">04</span>
								<span className="lp-signal-item-copy">
									<span className="lp-signal-label">{t('performanceSignal.communityLabel')}</span>
									<strong>{article.articleTitle}</strong>
									<span className="lp-signal-item-meta">
										<span>{article.memberData?.memberNick || t('community.memberFallback')}</span>
										<span>{article.articleViews} {t('common:stats.views')}</span>
										<span>{moment(article.createdAt).format('MMM D')}</span>
									</span>
								</span>
								<span className="lp-signal-item-arrow" aria-hidden="true">↗</span>
							</button>
						)}
					</div>
				</div>

				<div className="lp-signal-footer" aria-hidden="true">
					<span>{t('performanceSignal.footerLeft')}</span>
					<span className="lp-signal-trace"><i /><i /><i /><i /><i /><i /><i /></span>
					<span>{t('performanceSignal.footerRight')}</span>
				</div>
			</div>
		</section>
	);
};

export default PerformanceSignal;
