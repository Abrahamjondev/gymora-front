import React, { ChangeEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Box, Button, CircularProgress, Stack, Typography, Pagination as MuiPagination } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Workout } from '../../libs/types/workout/workout';
import LikeButton from '../../libs/components/common/LikeButton';
import VideoPlayer from '../../libs/components/common/VideoPlayer';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_WORKOUT, GET_COMMENTS, GET_WORKOUT_REVIEWS } from '../../apollo/user/query';
import { LIKE_WORKOUT, CREATE_COMMENT, CREATE_REVIEW } from '../../apollo/user/mutation';
import { REACT_APP_API_URL, Messages } from '../../libs/config';
import { Comment } from '../../libs/types/comment/comment';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { userVar } from '../../apollo/store';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { notifyMember } from '../../libs/notify';
import CreatorCard from '../../libs/components/common/CreatorCard';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'workout', 'enums'])),
	},
});

const WorkoutDetail: NextPage = ({ initialComment, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('workout');
	const user = useReactiveVar(userVar);
	const [workoutId, setWorkoutId] = useState<string | null>(null);
	const [workout, setWorkout] = useState<Workout | null>(null);
	const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>(initialComment);
	const [workoutComments, setWorkoutComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState<number>(0);
	const [likeLoading, setLikeLoading] = useState<boolean>(false);
	const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
		commentGroup: CommentGroup.WORKOUT,
		commentContent: '',
		commentRefId: '',
	});

	/** APOLLO REQUESTS **/
	const [likeWorkoutMutation] = useMutation(LIKE_WORKOUT);
	const [createComment] = useMutation(CREATE_COMMENT);
	const [createReview] = useMutation(CREATE_REVIEW);
	const [workoutReviews, setWorkoutReviews] = useState<any[]>([]);
	const [reviewText, setReviewText] = useState('');
	const [reviewRating, setReviewRating] = useState(5);

	const {
		loading: getWorkoutLoading,
		data: getWorkoutData,
		error: getWorkoutError,
		refetch: getWorkoutRefetch,
	} = useQuery(GET_WORKOUT, {
		fetchPolicy: 'network-only',
		variables: { input: workoutId },
		skip: !workoutId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			if (data?.getWorkout) setWorkout(data.getWorkout);
		},
	});

	const {
		loading: getCommentsLoading,
		data: getCommentsData,
		error: getCommentsError,
		refetch: getCommentsRefetch,
	} = useQuery(GET_COMMENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: commentInquiry },
		skip: !commentInquiry.search.commentRefId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			if (data?.getComments?.list) setWorkoutComments(data.getComments.list);
			setCommentTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
		},
	});

	const { refetch: reviewsRefetch } = useQuery(GET_WORKOUT_REVIEWS, {
		fetchPolicy: 'network-only',
		variables: { input: workoutId },
		skip: !workoutId,
		onCompleted: (data: T) => setWorkoutReviews(data?.getWorkoutReviews ?? []),
	});

	const reviewHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!reviewText) throw new Error(t('alerts.reviewTextRequired'));
			await createReview({ variables: { input: { workoutId, reviewRating, reviewText } } });
			notifyMember((workout as any)?.memberId, user._id, 'WORKOUT', 'New review on your workout', `${user.memberNick} rated "${workout?.workoutTitle}" ${reviewRating}/5`);
			setReviewText('');
			const { data } = await reviewsRefetch({ input: workoutId });
			if (data?.getWorkoutReviews) setWorkoutReviews(data.getWorkoutReviews);
			await sweetTopSmallSuccessAlert(t('alerts.reviewPosted'), 800);
		} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
	};

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.id) {
			setWorkoutId(router.query.id as string);
			setCommentInquiry({
				...commentInquiry,
				search: { commentRefId: router.query.id as string },
			});
			setInsertCommentData({
				...insertCommentData,
				commentRefId: router.query.id as string,
			});
		}
	}, [router]);

	useEffect(() => {
		if (commentInquiry.search.commentRefId) {
			getCommentsRefetch({ input: commentInquiry });
		}
	}, [commentInquiry]);

	useEffect(() => {
		if (!user?._id || !workoutId) return;

		getWorkoutRefetch({ input: workoutId }).then(({ data }) => {
			if (data?.getWorkout) setWorkout(data.getWorkout);
		});
	}, [user?._id, workoutId]);

	/** HANDLERS **/
	const likeHandler = async (user: T, id: string) => {
		if (likeLoading) return;
		const previousWorkout = workout;

		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);

			setLikeLoading(true);
			let nextLiked = false;
			if (workout) {
				const wasLiked = !!workout.meLiked?.[0]?.myFavorite;
				nextLiked = !wasLiked;
				setWorkout({
					...workout,
					workoutLikes: (workout.workoutLikes ?? 0) + (wasLiked ? -1 : 1),
					meLiked: wasLiked ? [] : [{ memberId: user._id, likeRefId: id, myFavorite: true }],
				} as any);
			}

			const { data } = await likeWorkoutMutation({ variables: { input: id } });
			if (nextLiked) notifyMember((workout as any)?.memberId, user._id, 'WORKOUT', 'New like on your workout', `${user.memberNick} liked "${workout?.workoutTitle}"`);
			const updatedLikes = data?.likeWorkout?.workoutLikes;
			if (typeof updatedLikes === 'number') {
				setWorkout((prev) =>
					prev
						? ({
								...prev,
								workoutLikes: updatedLikes,
								meLiked: nextLiked ? [{ memberId: user._id, likeRefId: id, myFavorite: true }] : [],
						  } as any)
						: prev,
				);
			}
		} catch (err: any) {
			setWorkout(previousWorkout);
			sweetMixinErrorAlert(err.message).then();
		} finally {
			setLikeLoading(false);
		}
	};

	const commentPaginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		commentInquiry.page = value;
		setCommentInquiry({ ...commentInquiry });
	};

	const createCommentHandler = async () => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await createComment({ variables: { input: insertCommentData } });
			notifyMember((workout as any)?.memberId, user._id, 'WORKOUT', 'New comment on your workout', `${user.memberNick} commented on "${workout?.workoutTitle}"`);
			setInsertCommentData({ ...insertCommentData, commentContent: '' });
			// Set manually — refetch doesn't reliably re-fire onCompleted
			const { data } = await getCommentsRefetch({ input: commentInquiry });
			if (data?.getComments?.list) setWorkoutComments(data.getComments.list);
			setCommentTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	/** LOADING STATE **/
	if (getWorkoutLoading) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#131314' }}>
				<CircularProgress size={'4rem'} sx={{ color: '#00dce5' }} />
			</Stack>
		);
	}

	if (!workout) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#131314' }}>
				<Typography sx={{ color: '#b9caca', fontFamily: 'Hanken Grotesk', fontSize: '18px' }}>{t('detail.notFound')}</Typography>
			</Stack>
		);
	}

	const difficultyColor: Record<string, string> = {
		BEGINNER: '#66daba',
		INTERMEDIATE: '#ffb77f',
		ADVANCED: '#ff8a8a',
	};

	return (
		<div className="wd-page">
			{/* Hero */}
			<div className="wd-hero">
				<img
					className="wd-hero-img"
					src={workout.workoutThumbnail ? `${REACT_APP_API_URL}/${workout.workoutThumbnail}` : '/img/banner/header1.svg'}
					alt={workout.workoutTitle}
				/>
				<div className="wd-hero-tint" />
				<div className="wd-hero-tint-side" />
				<div className="lp-hero-grain" />
				<div className="lp-container wd-hero-inner">
					<button className="wd-back" onClick={() => router.push('/workout')}>
						← {t('detail.back')}
					</button>
					<div>
						<div className="wd-chips">
							{workout.targetMuscle && (
								<span className="lp-chip lp-chip--cyan">
									{t(`enums:muscle.${workout.targetMuscle}`, { defaultValue: workout.targetMuscle })}
								</span>
							)}
							<span className="lp-chip" style={{ color: difficultyColor[workout.workoutDifficulty] || '#00dce5' }}>
								{t(`enums:difficulty.${workout.workoutDifficulty}`)}
							</span>
							<span className="lp-chip" style={{ color: '#ffc08f', borderColor: 'rgba(255,138,0,0.3)' }}>
								{t('detail.kcal', { count: workout.estimatedCaloriesBurned })}
							</span>
						</div>
						<h1 className="wd-title">{workout.workoutTitle}</h1>
						<div className="wd-meta">
							<span>
								<b>{workout.workoutViews ?? 0}</b> {t('common:stats.views')}
							</span>
							<span>
								<b>{workout.workoutLikes ?? 0}</b> {t('common:stats.likes')}
							</span>
							<span>
								<b>{workout.exercises?.length ?? 0}</b> {t('detail.exercises')}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="lp-container wd-layout">
				{/* Sticky sidebar */}
				<div className="wd-side">
					<div className="wd-stats">
						<h4>{t('detail.summary.title')}</h4>
						<div className="wd-stats-grid">
							<div>
								<span className="wd-stat-label">{t('detail.summary.estCal')}</span>
								<span className="wd-stat-value">{workout.estimatedCaloriesBurned}</span>
							</div>
							<div>
								<span className="wd-stat-label">{t('detail.summary.difficulty')}</span>
								<span className="wd-stat-value" style={{ fontSize: '14px' }}>
									<span
										style={{
											width: '7px',
											height: '7px',
											borderRadius: '50%',
											flex: 'none',
											background: difficultyColor[workout.workoutDifficulty] || '#00dce5',
										}}
									/>
									{t(`enums:difficulty.${workout.workoutDifficulty}`)}
								</span>
							</div>
							<div>
								<span className="wd-stat-label">{t('detail.summary.views')}</span>
								<span className="wd-stat-value">{workout.workoutViews ?? 0}</span>
							</div>
							<div>
								<span className="wd-stat-label">{t('detail.summary.likes')}</span>
								<span className="wd-stat-value">{workout.workoutLikes ?? 0}</span>
							</div>
						</div>
					</div>

					{/* Like button */}
					<LikeButton
						liked={!!workout.meLiked?.[0]?.myFavorite}
						count={workout.workoutLikes ?? 0}
						onClick={(e) => likeHandler(user, workout._id)}
						variant="full"
						label={t('detail.likeThisWorkout')}
					/>

					{/* Creator profile */}
					<CreatorCard memberId={(workout as any)?.memberId} title={t('common:creator.coach')} />
				</div>

				{/* Main content */}
				<div className="wd-main">
					{/* Description */}
					{workout.workoutDesc && (
						<div className="wd-section">
							<div className="wd-section-head">
								<h3>{t('detail.about')}</h3>
							</div>
							<p>{workout.workoutDesc}</p>
						</div>
					)}

					{/* Exercises */}
					{workout.exercises && workout.exercises.length > 0 && (
						<div className="wd-section">
							<div className="wd-section-head">
								<h3>{t('detail.trainingPlan')}</h3>
								<span className="wd-section-count">{t('detail.exercisesCount', { count: workout.exercises.length })}</span>
							</div>
							{workout.exercises.map((ex, idx) => (
								<div key={idx} className="wd-ex-row">
									<div className="wd-ex-left">
										<span className="wd-ex-idx">{String(idx + 1).padStart(2, '0')}</span>
										<h4>{ex.exerciseName}</h4>
									</div>
									<div className="wd-ex-chips">
										<span>{t('detail.sets', { count: ex.sets })}</span>
										<span>{t('detail.reps', { count: ex.reps })}</span>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Video */}
					{workout.videoUrl && (
						<div className="wd-section">
							<div className="wd-section-head">
								<h3>{t('detail.video')}</h3>
							</div>
							<VideoPlayer src={workout.videoUrl} title={workout.workoutTitle} />
						</div>
					)}

					{/* Comments */}
					<div className="wd-section">
						<div className="wd-section-head">
							<h3>{t('detail.comments')}</h3>
							<span className="wd-section-count">{t('detail.commentsTotal', { count: commentTotal })}</span>
						</div>

						{/* Leave a comment */}
						<div className="wd-form-card">
							<textarea
								className="wd-textarea"
								onChange={({ target: { value } }) => setInsertCommentData({ ...insertCommentData, commentContent: value })}
								value={insertCommentData.commentContent}
								placeholder={t('detail.commentPlaceholder')}
							/>
							<button
								className="wd-btn"
								onClick={createCommentHandler}
								disabled={insertCommentData.commentContent === '' || user?._id === ''}
							>
								{t('detail.postComment')}
							</button>
						</div>

						{/* Comment list */}
						{workoutComments.map((comment: Comment) => (
							<div key={comment._id} className="wd-comment">
								<img
									src={comment.memberData?.memberImage ? `${REACT_APP_API_URL}/${comment.memberData.memberImage}` : '/img/profile/defaultUser.svg'}
									alt=""
								/>
								<div className="wd-comment-body">
									<div className="wd-comment-head">
										<span className="wd-comment-nick">{comment.memberData?.memberNick ?? t('detail.anonymous')}</span>
										<span className="wd-comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
									</div>
									<p>{comment.commentContent}</p>
								</div>
							</div>
						))}

						{workoutComments.length === 0 && !getCommentsLoading && (
							<p className="wd-empty-line">{t('detail.noCommentsYet')}</p>
						)}

						{commentTotal > 5 && (
							<Stack alignItems="center" sx={{ mt: 3 }}>
								<MuiPagination
									page={commentInquiry.page}
									count={Math.ceil(commentTotal / commentInquiry.limit)}
									onChange={commentPaginationChangeHandler}
									shape="circular"
									sx={{
										'& .MuiPaginationItem-root': { color: '#b9caca', borderColor: '#3a494a' },
										'& .Mui-selected': { backgroundColor: '#e9feff !important', color: '#003739' },
									}}
								/>
							</Stack>
						)}
					</div>

					{/* Star Reviews */}
					<div className="wd-section">
						<div className="wd-section-head">
							<h3>{t('detail.athleteReviews')}</h3>
							<span className="wd-section-count">{t('detail.reviewsCount', { count: workoutReviews.length })}</span>
						</div>
						{user?._id && (
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
						)}
						{workoutReviews.map((r: any) => (
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
									</div>
									<p>{r.reviewText}</p>
								</div>
							</div>
						))}
						{workoutReviews.length === 0 && <p className="wd-empty-line">{t('detail.noReviewsYet')}</p>}
					</div>
				</div>
			</div>
		</div>
	);
};

WorkoutDetail.defaultProps = {
	initialComment: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: {
			commentRefId: '',
		},
	},
};

export default withLayoutBasic(WorkoutDetail);
