import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { CircularProgress, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Course, Lesson } from '../../libs/types/course/course';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_COURSE, GET_COURSE_REVIEWS, GET_LESSON_PROGRESS, GET_TRAINER } from '../../apollo/user/query';
import CreatorCard from '../../libs/components/common/CreatorCard';
import { PURCHASE_COURSE, CREATE_REVIEW, COMPLETE_LESSON, CREATE_COURSE_CHECKOUT_SESSION, CONFIRM_COURSE_PAYMENT, LIKE_TARGET_COURSE } from '../../apollo/user/mutation';
import { REACT_APP_API_URL, Messages, appLocale } from '../../libs/config';
import { userVar } from '../../apollo/store';
import VideoPlayer from '../../libs/components/common/VideoPlayer';
import LikeButton from '../../libs/components/common/LikeButton';
import { sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../libs/sweetAlert';
import QueryState from '../../libs/components/common/QueryState';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common', 'program', 'enums'])) },
});

const categoryColors: Record<string, string> = {
	STRENGTH: '#ff8a00',
	CARDIO: '#00dce5',
	YOGA: '#ddb7ff',
	MOBILITY: '#66daba',
	NUTRITION: '#ffb77f',
};

const difficultyColor: Record<string, string> = {
	BEGINNER: '#66daba',
	INTERMEDIATE: '#ffb77f',
	ADVANCED: '#ff8a8a',
};

const CourseDetail: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('program');
	const user = useReactiveVar(userVar);
	const [courseId, setCourseId] = useState<string | null>(null);
	const [course, setCourse] = useState<Course | null>(null);
	const [reviews, setReviews] = useState<any[]>([]);
	const [reviewText, setReviewText] = useState('');
	const [reviewRating, setReviewRating] = useState(5);
	const [lessonProgress, setLessonProgress] = useState<any[]>([]);
	const [watchingLesson, setWatchingLesson] = useState<string | null>(null);

	// Keep the open lesson video in the URL (?lesson=) so a refresh restores it
	// instead of collapsing back to the curriculum list.
	useEffect(() => {
		const l = router.query.lesson as string | undefined;
		if (l && l !== watchingLesson) setWatchingLesson(l);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router.query.lesson]);

	const toggleWatch = (lessonId: string) => {
		const next = watchingLesson === lessonId ? null : lessonId;
		setWatchingLesson(next);
		const query: any = { ...router.query };
		if (next) query.lesson = next;
		else delete query.lesson;
		router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
	};

	const { loading, error, refetch } = useQuery(GET_COURSE, {
		fetchPolicy: 'network-only',
		variables: { input: courseId },
		skip: !courseId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (d: T) => {
			if (d?.getCourse) setCourse(d.getCourse);
		},
	});
	const { refetch: reviewsRefetch } = useQuery(GET_COURSE_REVIEWS, {
		fetchPolicy: 'network-only',
		variables: { input: courseId },
		skip: !courseId,
		// Empty reviews/progress legitimately throw NO_DATA_FOUND on the backend —
		// don't surface that as a global error popup.
		context: { skipGlobalError: true },
		onCompleted: (d: T) => setReviews(d?.getCourseReviews ?? []),
		onError: () => setReviews([]),
	});
	const { refetch: progressRefetch } = useQuery(GET_LESSON_PROGRESS, {
		fetchPolicy: 'network-only',
		variables: { input: courseId },
		skip: !courseId || !user?._id,
		context: { skipGlobalError: true },
		onCompleted: (d: T) => setLessonProgress(d?.getLessonProgress ?? []),
		onError: () => setLessonProgress([]),
	});

	const [purchaseCourse] = useMutation(PURCHASE_COURSE);
	// Creator (trainer entity -> member) for the sidebar profile card
	const { data: trainerData } = useQuery(GET_TRAINER, {
		fetchPolicy: 'cache-and-network',
		variables: { input: course?.trainerId },
		skip: !course?.trainerId,
	});
	const courseTrainer: any = trainerData?.getTrainer;

	const [createReview] = useMutation(CREATE_REVIEW);
	const [completeLesson] = useMutation(COMPLETE_LESSON);
	const [createCheckoutSession] = useMutation(CREATE_COURSE_CHECKOUT_SESSION);
	const [confirmCoursePayment] = useMutation(CONFIRM_COURSE_PAYMENT);
	const [likeTargetCourse] = useMutation(LIKE_TARGET_COURSE);
	const confirmingRef = React.useRef(false);

	useEffect(() => {
		// Stripe success/cancel URLs return with ?courseId=... (not ?id=) — accept both
		const id = (router.query.id as string) || (router.query.courseId as string);
		if (id) setCourseId(id);
	}, [router]);

	// Complete the Stripe checkout: success_url carries session_id, and without
	// this call (backend has no webhook) the paid member is never enrolled.
	useEffect(() => {
		const sessionId = router.query.session_id as string;
		const id = (router.query.id as string) || (router.query.courseId as string);
		if (!sessionId || !id || !user?._id || confirmingRef.current) return;
		confirmingRef.current = true;
		(async () => {
			try {
				await confirmCoursePayment({ variables: { sessionId, courseId: id } });
				const { data } = await refetch({ input: id });
				if (data?.getCourse) setCourse(data.getCourse);
				await sweetMixinSuccessAlert(t('alerts.paymentConfirmed'));
			} catch (err: any) {
				sweetMixinErrorAlert(err?.graphQLErrors?.[0]?.message || err.message).then();
			} finally {
				// strip stripe params so refresh doesn't re-confirm
				router.replace({ pathname: '/course/detail', query: { id } }, undefined, { shallow: true });
			}
		})();
	}, [router.query.session_id, user?._id]);

	const isLessonCompleted = (lessonId: string) => lessonProgress.some((p: any) => p.lessonId === lessonId && p.isCompleted);

	const completeLessonHandler = async (lessonId: string) => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			await completeLesson({ variables: { input: lessonId } });
			const { data } = await progressRefetch({ input: courseId });
			if (data?.getLessonProgress) setLessonProgress(data.getLessonProgress);
			await sweetMixinSuccessAlert(t('alerts.lessonCompleted'));
		} catch (err: any) {
			sweetMixinErrorAlert(err.message.replace('Definer: ', '')).then();
		}
	};

	const enrollHandler = async () => {
		try {
			if (!user?._id) {
				await sweetMixinErrorAlert(Messages.error2);
				router.push('/account/join');
				return;
			}
			if (course && course.coursePrice > 0) {
				const { data } = await createCheckoutSession({ variables: { courseId, baseUrl: window.location.origin } });
				const url = data?.createCourseCheckoutSession;
				if (url) {
					window.location.href = url;
					return;
				}
			}
			await purchaseCourse({ variables: { input: courseId } });
			const { data } = await refetch({ input: courseId });
			if (data?.getCourse) setCourse(data.getCourse);
			await sweetMixinSuccessAlert(t('alerts.enrolled'));
		} catch (err: any) {
			sweetMixinErrorAlert(err.message.replace('Definer: ', '')).then();
		}
	};

	// Like a program — only purchasers can (backend enforces it too)
	const likeCourseHandler = async () => {
		try {
			if (!user?._id) { router.push('/account/join'); return; }
			if (!isEnrolled) {
				await sweetMixinErrorAlert(t('alerts.likeGate'));
				return;
			}
			const wasLiked = !!course?.meLiked?.[0]?.myFavorite;
			setCourse((prev: any) => prev ? {
				...prev,
				courseLikes: (prev.courseLikes ?? 0) + (wasLiked ? -1 : 1),
				meLiked: wasLiked ? [] : [{ memberId: user._id, likeRefId: prev._id, myFavorite: true }],
			} : prev);
			await likeTargetCourse({ variables: { input: courseId } });
		} catch (err: any) {
			const { data } = await refetch({ input: courseId });
			if (data?.getCourse) setCourse(data.getCourse);
			sweetMixinErrorAlert(err?.graphQLErrors?.[0]?.message || err.message).then();
		}
	};

	const reviewHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!reviewText) throw new Error(t('alerts.reviewTextRequired'));
			await createReview({ variables: { input: { courseId, reviewRating, reviewText } } });
			setReviewText('');
			const { data } = await reviewsRefetch({ input: courseId });
			if (data?.getCourseReviews) setReviews(data.getCourseReviews);
			await sweetMixinSuccessAlert(t('alerts.reviewPosted'));
		} catch (err: any) {
			sweetMixinErrorAlert(err?.graphQLErrors?.[0]?.message || err.message).then();
		}
	};

	const lessonsByWeek: Record<number, Lesson[]> = {};
	if (course?.lessons) {
		course.lessons.forEach((l) => {
			if (!lessonsByWeek[l.weekNumber]) lessonsByWeek[l.weekNumber] = [];
			lessonsByWeek[l.weekNumber].push(l);
		});
	}
	const weekNumbers = Object.keys(lessonsByWeek)
		.map(Number)
		.sort((a, b) => a - b);

	if (loading) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#0d0d0e' }}>
				<CircularProgress size={'4rem'} sx={{ color: '#00dce5' }} />
			</Stack>
		);
	}

	if (error) {
		return (
			<Stack sx={{ justifyContent: 'center', width: '100%', minHeight: '70vh', background: '#0d0d0e' }}>
				<div className="lp-container">
					<QueryState error={error} onRetry={() => void refetch({ input: courseId })} />
				</div>
			</Stack>
		);
	}

	if (!course) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#0d0d0e' }}>
				<p style={{ color: '#b9caca', fontFamily: 'Hanken Grotesk' }}>{t('detail.notFound')}</p>
			</Stack>
		);
	}

	const isEnrolled = user?._id ? course.purchasedMembers?.includes(user._id) : false;
	// The trainer who created this program owns it — full access, no payment.
	const isCreator = !!user?._id && !!courseTrainer?.memberId && String(courseTrainer.memberId) === String(user._id);
	// Admins can view every program for free.
	const isAdmin = user?.memberType === 'ADMIN';
	// Anyone with access can watch the videos / curriculum.
	const hasAccess = isEnrolled || isCreator || isAdmin;
	const accent = categoryColors[course.courseCategory] || '#00dce5';
	const totalLessons = course.lessons?.length ?? 0;
	const completedCount = course.lessons?.filter((l) => isLessonCompleted(l._id)).length ?? 0;
	const enrolledCount = course.purchasedMembers?.length ?? 0;
	const alreadyReviewed = !!user?._id && reviews.some((r) => r.memberId === user._id);

	let lessonIndex = 0;

	return (
		<div className="wd-page">
			{/* Hero */}
			<div className="wd-hero">
				<img
					className="wd-hero-img"
					src={course.courseThumbnail ? `${REACT_APP_API_URL}/${course.courseThumbnail}` : '/img/banner/header1.svg'}
					alt={course.courseTitle}
				/>
				<div className="wd-hero-tint" />
				<div className="wd-hero-tint-side" />
				<div className="lp-hero-grain" />
				<div className="lp-container wd-hero-inner">
					<button className="wd-back" onClick={() => router.push('/course')}>
						{t('detail.back')}
					</button>
					<div>
						<div className="wd-chips">
							<span className="lp-chip" style={{ background: `${accent}20`, borderColor: `${accent}35`, color: accent }}>
								{t(`enums:category.${course.courseCategory}`)}
							</span>
							<span className="lp-chip" style={{ color: difficultyColor[course.courseDifficulty] || '#00dce5' }}>
								{t(`enums:difficulty.${course.courseDifficulty}`)}
							</span>
							{course.courseRating && course.courseRating > 0 ? (
								<span className="lp-chip" style={{ color: '#ffb77f', borderColor: 'rgba(255,138,0,0.3)' }}>
									★ {course.courseRating.toFixed(1)} ({course.courseRatingCount})
								</span>
							) : null}
						</div>
						<h1 className="wd-title">{course.courseTitle}</h1>
						{course.courseDesc && (
							<p className="lp-sub" style={{ margin: '0 0 18px', color: 'rgba(213,226,226,0.82)' }}>
								{course.courseDesc}
							</p>
						)}
						<div className="wd-meta">
							<span>
								<b>{course.courseDuration}</b> {t('detail.weeksWord')}
							</span>
							<span>
								<b>{totalLessons}</b> {t('detail.sessionsWord')}
							</span>
							<span>
								<b>{enrolledCount}</b> {t('common:stats.enrolled')}
							</span>
							{(course.courseLikes ?? 0) > 0 && (
								<span>
									<b>{course.courseLikes}</b> {t('common:stats.likes')}
								</span>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="lp-container wd-layout">
				{/* Sticky sidebar */}
				<div className="wd-side">
					<div className="pd-price-card">
						<span className="pd-price-label">{isCreator ? t('detail.yourProgram') : isAdmin && !isEnrolled ? t('detail.adminAccess') : t('detail.lifetimeAccess')}</span>
						<span className="pd-price">
							{isCreator || (isAdmin && !isEnrolled) ? t('detail.free') : course.coursePrice > 0 ? `$${course.coursePrice}` : t('detail.free')}
						</span>
						{isCreator ? (
							<button className="pd-enroll is-enrolled" onClick={() => router.push({ pathname: '/mypage', query: { category: 'trainerCourses' } })}>
								{t('detail.manageProgram')}
							</button>
						) : isAdmin && !isEnrolled ? (
							<button className="pd-enroll is-enrolled" onClick={undefined}>
								{t('detail.fullAccess')}
							</button>
						) : (
							<button className={`pd-enroll${isEnrolled ? ' is-enrolled' : ''}`} onClick={isEnrolled ? undefined : enrollHandler}>
								{isEnrolled ? t('detail.enrolled') : course.coursePrice > 0 ? t('detail.enrollNow') : t('detail.enrollFree')}
							</button>
						)}
						{!hasAccess && course.coursePrice > 0 && <span className="pd-secure">{t('detail.secureCheckout')}</span>}
						{isCreator && <span className="pd-secure">{t('detail.youCreated')}</span>}
						{isAdmin && !isCreator && !isEnrolled && <span className="pd-secure">{t('detail.freeForAdmins')}</span>}

						{/* Social proof + like (likes only by purchasers) */}
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
							<div>
								<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '17px', fontWeight: 800, color: '#ffffff', display: 'block' }}>{enrolledCount}</span>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '9.5px', letterSpacing: '0.08em', color: '#849495', textTransform: 'uppercase' }}>{t('detail.membersJoined')}</span>
							</div>
							{isEnrolled ? (
								<LikeButton liked={!!course.meLiked?.[0]?.myFavorite} count={course.courseLikes ?? 0} onClick={likeCourseHandler} />
							) : (
								<span title={t('detail.likeGate')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontFamily: 'JetBrains Mono', fontSize: '12px', color: 'rgba(200,214,214,0.55)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
									♥ {course.courseLikes ?? 0}
								</span>
							)}
						</div>
					</div>

					{/* Progress — only for real enrolled learners, real lessonProgress data */}
					{isEnrolled && totalLessons > 0 && (
						<div className="pd-progress-card">
							<div className="pd-progress-head">
								<span>{t('detail.yourProgress')}</span>
								<span>
									{completedCount}/{totalLessons}
								</span>
							</div>
							<div className="pd-progress-bar">
								<div className="pd-progress-fill" style={{ width: `${Math.round((completedCount / totalLessons) * 100)}%` }} />
							</div>
						</div>
					)}

					<div className="wd-stats">
						<h4>{t('detail.programSummary')}</h4>
						<div className="wd-stats-grid">
							<div>
								<span className="wd-stat-label">{t('detail.duration')}</span>
								<span className="wd-stat-value">{t('detail.weeksShortValue', { count: course.courseDuration })}</span>
							</div>
							<div>
								<span className="wd-stat-label">{t('detail.sessions')}</span>
								<span className="wd-stat-value">{totalLessons}</span>
							</div>
							<div>
								<span className="wd-stat-label">{t('detail.category')}</span>
								<span className="wd-stat-value" style={{ fontSize: '14px', color: accent }}>
									{t(`enums:category.${course.courseCategory}`)}
								</span>
							</div>
							<div>
								<span className="wd-stat-label">{t('detail.level')}</span>
								<span className="wd-stat-value" style={{ fontSize: '14px' }}>
									<span
										style={{
											width: '7px',
											height: '7px',
											borderRadius: '50%',
											flex: 'none',
											background: difficultyColor[course.courseDifficulty] || '#00dce5',
										}}
									/>
									{t(`enums:difficulty.${course.courseDifficulty}`)}
								</span>
							</div>
						</div>
					</div>

					{/* Trainer profile */}
					<CreatorCard
						memberId={courseTrainer?.memberId}
						title={t('common:creator.yourTrainer')}
						trainerRating={courseTrainer?.trainerRating}
						trainerRatingCount={courseTrainer?.trainerRatingCount}
						trainerExperience={courseTrainer?.trainerExperience}
					/>
				</div>

				{/* Main content */}
				<div className="wd-main">
					{/* Curriculum */}
					<div className="wd-section">
						<div className="wd-section-head">
							<h3>{t('detail.curriculum')}</h3>
							<span className="wd-section-count">
								{t('common:stats.weeks', { count: course.courseDuration })} · {t('common:stats.sessions', { count: totalLessons })}
							</span>
						</div>

						{weekNumbers.length > 0 ? (
							weekNumbers.map((wn) => (
								<div key={wn}>
									<div className="pd-week">
										<span className="pd-week-num">W{String(wn).padStart(2, '0')}</span>
										<h3>{t('detail.week', { number: wn })}</h3>
										<span className="pd-week-line" />
									</div>
									{lessonsByWeek[wn].map((l) => {
										lessonIndex += 1;
										const done = isLessonCompleted(l._id);
										const watching = watchingLesson === l._id;
										return (
											<React.Fragment key={l._id}>
												<div className={`pd-lesson${done ? ' is-done' : ''}`}>
													<span className={`pd-lesson-check${done ? ' is-done' : ''}`}>{done ? '✓' : String(lessonIndex).padStart(2, '0')}</span>
													<div className="pd-lesson-info">
														<h4>{l.title}</h4>
														{l.description && <p>{l.description}</p>}
													</div>
													<div className="pd-lesson-right">
														{l.duration ? <span className="pd-lesson-dur">{t('detail.minutes', { count: Math.round(l.duration) })}</span> : null}
														{hasAccess && l.videoUrl && (
															<button
																className="pd-lesson-btn"
																onClick={(e) => {
																	e.stopPropagation();
																	toggleWatch(l._id);
																}}
															>
																{watching ? t('common:actions.close') : t('detail.watch')}
															</button>
														)}
														{isEnrolled &&
															(done ? (
																<span className="pd-lesson-done">{t('detail.completed')}</span>
															) : (
																<button
																	className="pd-lesson-btn"
																	onClick={(e) => {
																		e.stopPropagation();
																		completeLessonHandler(l._id);
																	}}
																>
																	{t('detail.markDone')}
																</button>
															))}
													</div>
												</div>
												{watching && hasAccess && l.videoUrl && (
													<div style={{ margin: '4px 0 14px', animation: 'fadeInUp 0.3s ease both' }}>
														<VideoPlayer src={l.videoUrl} title={l.title} />
													</div>
												)}
											</React.Fragment>
										);
									})}
								</div>
							))
						) : (
							<p className="wd-empty-line">{t('detail.curriculumSoon')}</p>
						)}
					</div>

					{/* Reviews */}
					<div className="wd-section">
						<div className="wd-section-head">
							<h3>{t('detail.athleteReviews')}</h3>
							<span className="wd-section-count">
								{reviews.length === 1 ? t('detail.oneReview') : t('detail.reviewCount', { count: reviews.length })}
							</span>
						</div>

						{/* Review form — backend allows reviews only from enrolled members, once */}
						{user?._id && (
							<>
								{alreadyReviewed ? (
									<div className="td-review-note is-done">{t('detail.alreadyReviewed')}</div>
								) : isEnrolled ? (
									<div className="wd-form-card">
										<div className="wd-stars">
											{[1, 2, 3, 4, 5].map((n) => (
												<span key={n} onClick={() => setReviewRating(n)} style={{ color: n <= reviewRating ? '#ff8a00' : '#3a494a' }}>
													★
												</span>
											))}
										</div>
										<div style={{ display: 'flex', gap: '12px' }}>
											<input
												className="wd-input"
												style={{ flex: 1 }}
												value={reviewText}
												onChange={(e) => setReviewText(e.target.value)}
												placeholder={t('detail.reviewPlaceholder')}
											/>
											<button className="wd-btn" onClick={reviewHandler}>
												{t('common:actions.post')}
											</button>
										</div>
									</div>
								) : (
									<div className="td-review-note">{t('detail.reviewGate')}</div>
								)}
							</>
						)}

						{reviews.length === 0 ? (
							<p className="wd-empty-line">{t('detail.noReviews')}</p>
						) : (
							reviews.map((r: any) => (
								<div key={r._id} className="wd-comment">
									<img
										src={r.memberData?.memberImage ? `${REACT_APP_API_URL}/${r.memberData.memberImage}` : '/img/profile/defaultUser.svg'}
										alt=""
									/>
									<div className="wd-comment-body">
										<div className="wd-comment-head">
											<span className="wd-comment-nick">{r.memberData?.memberNick ?? t('detail.userFallback')}</span>
											<span className="wd-comment-stars">
												{'★'.repeat(r.reviewRating)}
												{'☆'.repeat(5 - r.reviewRating)}
											</span>
											<span className="wd-comment-date">{new Date(r.createdAt).toLocaleDateString(appLocale())}</span>
										</div>
										<p>{r.reviewText}</p>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(CourseDetail);
