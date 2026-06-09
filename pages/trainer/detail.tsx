import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { CircularProgress, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Member } from '../../libs/types/member/member';
import { Trainer } from '../../libs/types/trainer/trainer';
import { Course } from '../../libs/types/course/course';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_MEMBER, GET_TRAINER_BY_MEMBER_ID, GET_COURSES_BY_TRAINER_ID, GET_TRAINER_REVIEWS, GET_WORKOUTS_BY_MEMBER_ID } from '../../apollo/user/query';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE, CREATE_REVIEW } from '../../apollo/user/mutation';
import { REACT_APP_API_URL, Messages } from '../../libs/config';
import { Workout } from '../../libs/types/workout/workout';
import { userVar } from '../../apollo/store';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const TrainerDetail: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const memberId = router.query?.id as string;

	const [member, setMember] = useState<Member | null>(null);
	const [trainer, setTrainer] = useState<Trainer | null>(null);
	const [courses, setCourses] = useState<Course[]>([]);
	const [workouts, setWorkouts] = useState<Workout[]>([]);
	const [reviews, setReviews] = useState<any[]>([]);
	const [reviewText, setReviewText] = useState('');
	const [reviewRating, setReviewRating] = useState(5);

	/** APOLLO **/
	const { loading: memberLoading, refetch: memberRefetch } = useQuery(GET_MEMBER, { fetchPolicy: 'network-only', variables: { input: memberId }, skip: !memberId, onCompleted: (d: T) => { if (d?.getMember) setMember(d.getMember); } });
	const { loading: trainerLoading } = useQuery(GET_TRAINER_BY_MEMBER_ID, { fetchPolicy: 'network-only', variables: { input: memberId }, skip: !memberId, onCompleted: (d: T) => {
		if (d?.getTrainerByMemberId) {
			setTrainer(d.getTrainerByMemberId);
		}
	}});
	useQuery(GET_WORKOUTS_BY_MEMBER_ID, { fetchPolicy: 'network-only', variables: { input: memberId }, skip: !memberId, onCompleted: (d: T) => setWorkouts(d?.getWorkoutsByMemberId ?? []) });

	// Fetch courses and reviews after trainer loads
	useQuery(GET_COURSES_BY_TRAINER_ID, { fetchPolicy: 'network-only', variables: { input: trainer?._id }, skip: !trainer?._id, onCompleted: (d: T) => setCourses(d?.getCoursesByTrainerId ?? []) });
	const { refetch: reviewsRefetch } = useQuery(GET_TRAINER_REVIEWS, { fetchPolicy: 'network-only', variables: { input: trainer?._id }, skip: !trainer?._id, onCompleted: (d: T) => setReviews(d?.getTrainerReviews ?? []) });

	const [likeMember] = useMutation(LIKE_TARGET_MEMBER);
	const [subscribeMut] = useMutation(SUBSCRIBE);
	const [unsubscribeMut] = useMutation(UNSUBSCRIBE);
	const [createReview] = useMutation(CREATE_REVIEW);

	/** HANDLERS **/
	const likeHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			await likeMember({ variables: { input: memberId } });
			const { data } = await memberRefetch({ input: memberId });
			if (data?.getMember) setMember(data.getMember);
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
	};

	const followHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (member?.meFollowed?.[0]?.myFollowing) {
				await unsubscribeMut({ variables: { input: memberId } });
			} else {
				await subscribeMut({ variables: { input: memberId } });
			}
			const { data } = await memberRefetch({ input: memberId });
			if (data?.getMember) setMember(data.getMember);
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) { sweetErrorHandling(err).then(); }
	};

	const reviewHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!reviewText) throw new Error('Review text required');
			await createReview({ variables: { input: { trainerId: trainer?._id, reviewRating, reviewText } } });
			setReviewText('');
			if (trainer?._id) {
				const { data } = await reviewsRefetch({ input: trainer._id });
				if (data?.getTrainerReviews) setReviews(data.getTrainerReviews);
			}
			await sweetMixinSuccessAlert('Review posted!');
		} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
	};

	if (memberLoading || trainerLoading) {
		return <Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#131314' }}><CircularProgress size={'4rem'} sx={{ color: '#00dce5' }} /></Stack>;
	}

	if (device === 'mobile') return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>TRAINER DETAIL MOBILE</div>;
	if (!member) return <Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#131314' }}><p style={{ color: '#b9caca' }}>Trainer not found.</p></Stack>;

	const isFollowing = member.meFollowed?.[0]?.myFollowing;
	const isLiked = member.meLiked?.[0]?.myFavorite;

	return (
		<div style={{ background: '#131314', minHeight: '100vh', padding: '40px 0' }}>
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '340px 1fr', gap: '40px' }}>
				{/* Left — Profile */}
				<div>
					<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
						<div style={{ width: '140px', height: '140px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 16px', border: '3px solid #3a494a' }}>
							<img src={member.memberImage ? `${REACT_APP_API_URL}/${member.memberImage}` : '/img/profile/defaultUser.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
						</div>
						<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 700, color: '#e5e2e3' }}>{member.memberFullName || member.memberNick}</h2>
						<p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#00dce5', textTransform: 'uppercase', marginBottom: '12px' }}>
							{trainer?.trainerVerificationStatus === 'VERIFIED' ? '✓ VERIFIED TRAINER' : 'TRAINER'}
						</p>
						{trainer?.trainerBio && <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#b9caca', lineHeight: '20px', marginBottom: '16px' }}>{trainer.trainerBio}</p>}

						{/* Stats */}
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px', paddingTop: '16px', borderTop: '1px solid #3a494a' }}>
							{[
								{ label: 'Rating', value: trainer?.trainerRating?.toFixed(1) ?? '-' },
								{ label: 'Experience', value: `${trainer?.trainerExperience ?? 0}y` },
								{ label: 'Followers', value: member.memberFollowers },
							].map((s) => (
								<div key={s.label}>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 800, color: '#e9feff', display: 'block' }}>{s.value}</span>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase' }}>{s.label}</span>
								</div>
							))}
						</div>

						{/* Specializations */}
						{trainer?.trainerSpecializations && trainer.trainerSpecializations.length > 0 && (
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
								{trainer.trainerSpecializations.map((s, i) => (
									<span key={i} style={{ padding: '4px 10px', background: 'rgba(0,220,229,0.1)', border: '1px solid rgba(0,220,229,0.2)', borderRadius: '9999px', fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00dce5', textTransform: 'uppercase' }}>{s}</span>
								))}
							</div>
						)}

						{/* Actions */}
						{user?._id && user._id !== member._id && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
								<button onClick={followHandler} style={{ width: '100%', padding: '12px', background: isFollowing ? '#353436' : '#e9feff', color: isFollowing ? '#849495' : '#003739', border: isFollowing ? '1px solid #3a494a' : 'none', borderRadius: '8px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
									{isFollowing ? 'Unfollow' : 'Follow'}
								</button>
								<button onClick={likeHandler} style={{ width: '100%', padding: '12px', background: isLiked ? '#e9feff' : 'transparent', color: isLiked ? '#003739' : '#e9feff', border: '1px solid #3a494a', borderRadius: '8px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
									{isLiked ? '♥ Liked' : '♡ Like'} ({member.memberLikes})
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Right — Content */}
				<div>
					{/* Workouts */}
					{workouts.length > 0 && (
						<div style={{ marginBottom: '40px' }}>
							<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>Workouts ({workouts.length})</h3>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
								{workouts.slice(0, 4).map((w) => (
									<div key={w._id} onClick={() => router.push({ pathname: '/workout/detail', query: { id: w._id } })} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
										<div style={{ aspectRatio: '16/9', overflow: 'hidden' }}><img src={w.workoutThumbnail ? `${REACT_APP_API_URL}/${w.workoutThumbnail}` : '/img/banner/header1.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
										<div style={{ padding: '12px' }}>
											<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, color: '#e5e2e3' }}>{w.workoutTitle}</h4>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495' }}>{w.workoutDifficulty} • {w.estimatedCaloriesBurned} cal</span>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Courses */}
					{courses.length > 0 && (
						<div style={{ marginBottom: '40px' }}>
							<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>Courses ({courses.length})</h3>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
								{courses.map((c) => (
									<div key={c._id} onClick={() => router.push({ pathname: '/course/detail', query: { id: c._id } })} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', cursor: 'pointer' }}>
										<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3', marginBottom: '4px' }}>{c.courseTitle}</h4>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495' }}>{c.courseCategory} • {c.courseDuration}w • {c.coursePrice > 0 ? `$${c.coursePrice}` : 'Free'}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Reviews */}
					<div>
						<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>Reviews ({reviews.length})</h3>

						{user?._id && user._id !== member._id && (
							<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
								<div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
									{[1,2,3,4,5].map((n) => (
										<span key={n} onClick={() => setReviewRating(n)} style={{ fontSize: '24px', cursor: 'pointer', color: n <= reviewRating ? '#ff8a00' : '#3a494a' }}>★</span>
									))}
								</div>
								<div style={{ display: 'flex', gap: '12px' }}>
									<input value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Write a review..." style={{ flex: 1, padding: '12px', background: '#201f20', border: '1px solid #3a494a', borderRadius: '8px', color: '#e5e2e3', fontFamily: 'Hanken Grotesk', fontSize: '14px', outline: 'none' }} />
									<button onClick={reviewHandler} style={{ background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Post</button>
								</div>
							</div>
						)}

						{reviews.length === 0 ? <p style={{ color: '#849495' }}>No reviews yet.</p> : (
							<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
								{reviews.map((r: any) => (
									<div key={r._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px' }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
											<div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#2a2a2b' }}>
												<img src={r.memberData?.memberImage ? `${REACT_APP_API_URL}/${r.memberData.memberImage}` : '/img/profile/defaultUser.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
											</div>
											<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, color: '#e5e2e3' }}>{r.memberData?.memberNick ?? 'User'}</span>
											<span style={{ color: '#ff8a00', fontSize: '13px' }}>{'★'.repeat(r.reviewRating)}{'☆'.repeat(5-r.reviewRating)}</span>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495', marginLeft: 'auto' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
										</div>
										<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#b9caca', marginLeft: '44px' }}>{r.reviewText}</p>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(TrainerDetail);
