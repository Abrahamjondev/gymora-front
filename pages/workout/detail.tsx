import React, { ChangeEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Box, Button, CircularProgress, Stack, Typography, Pagination as MuiPagination } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Workout } from '../../libs/types/workout/workout';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
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

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const WorkoutDetail: NextPage = ({ initialComment, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [workoutId, setWorkoutId] = useState<string | null>(null);
	const [workout, setWorkout] = useState<Workout | null>(null);
	const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>(initialComment);
	const [workoutComments, setWorkoutComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState<number>(0);
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
			if (!reviewText) throw new Error('Review text required');
			await createReview({ variables: { input: { workoutId, reviewRating, reviewText } } });
			setReviewText('');
			const { data } = await reviewsRefetch({ input: workoutId });
			if (data?.getWorkoutReviews) setWorkoutReviews(data.getWorkoutReviews);
			await sweetTopSmallSuccessAlert('Review posted!', 800);
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

	/** HANDLERS **/
	const likeHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeWorkoutMutation({ variables: { input: id } });
			await getWorkoutRefetch({ input: workoutId });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
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
			setInsertCommentData({ ...insertCommentData, commentContent: '' });
			await getCommentsRefetch({ input: commentInquiry });
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

	if (device === 'mobile') {
		return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>GYMORA WORKOUT DETAIL MOBILE</div>;
	}

	if (!workout) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#131314' }}>
				<Typography sx={{ color: '#b9caca', fontFamily: 'Hanken Grotesk', fontSize: '18px' }}>Workout not found.</Typography>
			</Stack>
		);
	}

	return (
		<div style={{ background: '#131314', minHeight: '100vh' }}>
			{/* Hero */}
			<div
				style={{
					position: 'relative',
					width: '100%',
					height: '400px',
					backgroundImage: workout.workoutThumbnail
						? `url(${REACT_APP_API_URL}/${workout.workoutThumbnail})`
						: 'url(/img/banner/header1.svg)',
					backgroundSize: 'cover',
					backgroundPosition: 'center',
				}}
			>
				<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #131314 0%, rgba(19,19,20,0.4) 50%, rgba(19,19,20,0.2) 100%)' }} />
				<div style={{ position: 'absolute', bottom: '40px', width: '100%', maxWidth: '1200px', padding: '0 24px', left: '50%', transform: 'translateX(-50%)' }}>
					<div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
						<span style={{ padding: '2px 8px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#ff8a00', textTransform: 'uppercase' }}>
							{workout.targetMuscle}
						</span>
						<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#b9caca' }}>
							{workout.estimatedCaloriesBurned} KCAL
						</span>
					</div>
					<h1 style={{ fontFamily: 'Hanken Grotesk', fontSize: '40px', lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: 800, color: '#ffffff' }}>
						{workout.workoutTitle}
					</h1>
				</div>
			</div>

			{/* Content */}
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>
				{/* Left sidebar */}
				<div>
					<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
						<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px', textTransform: 'uppercase' }}>
							Workout Summary
						</h4>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
							{[
								{ label: 'EST. CAL', value: `${workout.estimatedCaloriesBurned}` },
								{ label: 'DIFFICULTY', value: workout.workoutDifficulty },
								{ label: 'VIEWS', value: `${workout.workoutViews ?? 0}` },
								{ label: 'LIKES', value: `${workout.workoutLikes ?? 0}` },
							].map((s) => (
								<div key={s.label}>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{s.label}</span>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 700, color: '#e5e2e3' }}>{s.value}</span>
								</div>
							))}
						</div>
					</div>

					{/* Like button */}
					<button
						onClick={() => likeHandler(user, workout._id)}
						style={{
							width: '100%',
							padding: '14px',
							background: workout.meLiked?.[0]?.myFavorite ? '#e9feff' : 'transparent',
							color: workout.meLiked?.[0]?.myFavorite ? '#003739' : '#e9feff',
							border: '1px solid #3a494a',
							borderRadius: '8px',
							fontFamily: 'Hanken Grotesk',
							fontSize: '14px',
							fontWeight: 700,
							cursor: 'pointer',
						}}
					>
						{workout.meLiked?.[0]?.myFavorite ? '♥ Liked' : '♡ Like this workout'}
					</button>
				</div>

				{/* Right content */}
				<div>
					{/* Description */}
					{workout.workoutDesc && (
						<div style={{ marginBottom: '32px' }}>
							<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 600, color: '#e5e2e3', marginBottom: '12px' }}>About</h3>
							<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', lineHeight: '24px', color: '#b9caca' }}>{workout.workoutDesc}</p>
						</div>
					)}

					{/* Exercises */}
					{workout.exercises && workout.exercises.length > 0 && (
						<div style={{ marginBottom: '32px' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
								<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 600, color: '#e5e2e3' }}>Training Plan</h3>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495' }}>{workout.exercises.length} EXERCISES</span>
							</div>
							{workout.exercises.map((ex, idx) => (
								<div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(58,73,74,0.5)' }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: '#849495', width: '24px' }}>{String(idx + 1).padStart(2, '0')}</span>
										<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3' }}>{ex.exerciseName}</h4>
									</div>
									<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
										<span style={{ padding: '4px 10px', background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '4px', fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#00f5ff' }}>{ex.sets} SETS</span>
										<span style={{ padding: '4px 10px', background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '4px', fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#00f5ff' }}>{ex.reps} REPS</span>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Video */}
					{workout.videoUrl && (
						<div style={{ marginBottom: '32px' }}>
							<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 600, color: '#e5e2e3', marginBottom: '12px' }}>Video</h3>
							<video src={`${REACT_APP_API_URL}/${workout.videoUrl}`} controls style={{ width: '100%', borderRadius: '12px', background: '#0e0e0f' }} />
						</div>
					)}

					{/* Comments */}
					<div>
						<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 600, color: '#e5e2e3', marginBottom: '16px' }}>
							Reviews ({commentTotal})
						</h3>

						{/* Leave a review */}
						<div style={{ marginBottom: '24px' }}>
							<textarea
								onChange={({ target: { value } }) => setInsertCommentData({ ...insertCommentData, commentContent: value })}
								value={insertCommentData.commentContent}
								placeholder="Leave a review..."
								style={{
									width: '100%',
									minHeight: '80px',
									background: 'rgba(255,255,255,0.03)',
									border: '1px solid #3a494a',
									borderRadius: '8px',
									padding: '12px 16px',
									fontFamily: 'Hanken Grotesk',
									fontSize: '14px',
									color: '#e5e2e3',
									outline: 'none',
									resize: 'vertical',
									marginBottom: '12px',
								}}
							/>
							<button
								onClick={createCommentHandler}
								disabled={insertCommentData.commentContent === '' || user?._id === ''}
								style={{
									background: insertCommentData.commentContent && user?._id ? '#e9feff' : '#353436',
									color: insertCommentData.commentContent && user?._id ? '#003739' : '#849495',
									border: 'none',
									borderRadius: '8px',
									padding: '12px 32px',
									fontFamily: 'Hanken Grotesk',
									fontSize: '14px',
									fontWeight: 700,
									cursor: insertCommentData.commentContent && user?._id ? 'pointer' : 'not-allowed',
								}}
							>
								Submit Review
							</button>
						</div>

						{/* Comment list */}
						{workoutComments.map((comment: Comment) => (
							<div key={comment._id} style={{ padding: '16px 0', borderBottom: '1px solid rgba(58,73,74,0.3)' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
									<div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#2a2a2b' }}>
										<img
											src={comment.memberData?.memberImage ? `${REACT_APP_API_URL}/${comment.memberData.memberImage}` : '/img/profile/defaultUser.svg'}
											alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
										/>
									</div>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, color: '#e5e2e3' }}>{comment.memberData?.memberNick ?? 'Anonymous'}</span>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
								</div>
								<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', lineHeight: '20px', color: '#b9caca', marginLeft: '44px' }}>{comment.commentContent}</p>
							</div>
						))}

						{workoutComments.length === 0 && !getCommentsLoading && (
							<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#849495', textAlign: 'center', padding: '24px 0' }}>No reviews yet. Be the first!</p>
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
					<div style={{ marginTop: '32px' }}>
						<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 600, color: '#e5e2e3', marginBottom: '16px' }}>Star Reviews ({workoutReviews.length})</h3>
						{user?._id && (
							<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
								<div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
									{[1,2,3,4,5].map((n) => <span key={n} onClick={() => setReviewRating(n)} style={{ fontSize: '24px', cursor: 'pointer', color: n <= reviewRating ? '#ff8a00' : '#3a494a' }}>★</span>)}
								</div>
								<div style={{ display: 'flex', gap: '12px' }}>
									<input value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Write a review..." style={{ flex: 1, padding: '12px', background: '#201f20', border: '1px solid #3a494a', borderRadius: '8px', color: '#e5e2e3', fontFamily: 'Hanken Grotesk', fontSize: '14px', outline: 'none' }} />
									<button onClick={reviewHandler} style={{ background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Post</button>
								</div>
							</div>
						)}
						{workoutReviews.map((r: any) => (
							<div key={r._id} style={{ padding: '16px 0', borderBottom: '1px solid rgba(58,73,74,0.3)' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
									<div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#2a2a2b' }}><img src={r.memberData?.memberImage ? `${REACT_APP_API_URL}/${r.memberData.memberImage}` : '/img/profile/defaultUser.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, color: '#e5e2e3' }}>{r.memberData?.memberNick ?? 'User'}</span>
									<span style={{ color: '#ff8a00', fontSize: '13px' }}>{'★'.repeat(r.reviewRating)}{'☆'.repeat(5 - r.reviewRating)}</span>
								</div>
								<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#b9caca', marginLeft: '44px' }}>{r.reviewText}</p>
							</div>
						))}
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
