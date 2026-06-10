import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { CircularProgress, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Member } from '../../libs/types/member/member';
import { Trainer } from '../../libs/types/trainer/trainer';
import { Course } from '../../libs/types/course/course';
import { T } from '../../libs/types/common';
import LikeButton from '../../libs/components/common/LikeButton';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	GET_MEMBER,
	GET_TRAINER_BY_MEMBER_ID,
	GET_COURSES_BY_TRAINER_ID,
	GET_TRAINER_REVIEWS,
	GET_WORKOUTS_BY_MEMBER_ID,
	GET_MEMBER_PURCHASED_COURSES,
	GET_MEMBER_FOLLOWERS,
	GET_MEMBER_FOLLOWINGS,
	GET_BOARD_ARTICLES,
} from '../../apollo/user/query';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE, CREATE_REVIEW } from '../../apollo/user/mutation';
import { REACT_APP_API_URL, Messages } from '../../libs/config';
import { Workout } from '../../libs/types/workout/workout';
import { userVar } from '../../apollo/store';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const difficultyColor: Record<string, string> = {
	BEGINNER: '#66daba',
	INTERMEDIATE: '#ffb77f',
	ADVANCED: '#ff8a8a',
};

const categoryAccent: Record<string, string> = {
	STRENGTH: '#ff8a00',
	CARDIO: '#00dce5',
	YOGA: '#ddb7ff',
	MOBILITY: '#66daba',
	NUTRITION: '#ffb77f',
};

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
	const [purchasedCourses, setPurchasedCourses] = useState<Course[]>([]);
	const [reviewText, setReviewText] = useState('');
	const [reviewRating, setReviewRating] = useState(5);
	const [followBusy, setFollowBusy] = useState(false);
	const [articles, setArticles] = useState<any[]>([]);
	const [followers, setFollowers] = useState<any[]>([]);
	const [followings, setFollowings] = useState<any[]>([]);
	const [peopleTab, setPeopleTab] = useState<'followers' | 'followings'>('followers');

	/** APOLLO **/
	const { loading: memberLoading, refetch: memberRefetch } = useQuery(GET_MEMBER, {
		fetchPolicy: 'network-only',
		variables: { input: memberId },
		skip: !memberId,
		onCompleted: (d: T) => {
			if (d?.getMember) setMember(d.getMember);
		},
	});
	const { loading: trainerLoading } = useQuery(GET_TRAINER_BY_MEMBER_ID, {
		fetchPolicy: 'network-only',
		variables: { input: memberId },
		skip: !memberId,
		onCompleted: (d: T) => {
			if (d?.getTrainerByMemberId) setTrainer(d.getTrainerByMemberId);
		},
	});
	useQuery(GET_WORKOUTS_BY_MEMBER_ID, {
		fetchPolicy: 'network-only',
		variables: { input: memberId },
		skip: !memberId,
		onCompleted: (d: T) => setWorkouts(d?.getWorkoutsByMemberId ?? []),
	});

	// Fetch courses and reviews after trainer loads
	useQuery(GET_COURSES_BY_TRAINER_ID, {
		fetchPolicy: 'network-only',
		variables: { input: trainer?._id },
		skip: !trainer?._id,
		onCompleted: (d: T) => setCourses(d?.getCoursesByTrainerId ?? []),
	});
	const { refetch: reviewsRefetch } = useQuery(GET_TRAINER_REVIEWS, {
		fetchPolicy: 'network-only',
		variables: { input: trainer?._id },
		skip: !trainer?._id,
		onCompleted: (d: T) => setReviews(d?.getTrainerReviews ?? []),
	});

	// Review eligibility mirrors the backend rule: a trainer can only be
	// reviewed by a member who purchased one of their courses.
	useQuery(GET_MEMBER_PURCHASED_COURSES, {
		fetchPolicy: 'cache-and-network',
		skip: !user?._id,
		onCompleted: (d: T) => setPurchasedCourses(d?.getMemberPurchasedCourses ?? []),
	});

	// Trainer's published articles
	useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 4, sort: 'createdAt', direction: 'DESC', search: { memberId } } },
		skip: !memberId,
		onCompleted: (d: T) => setArticles(d?.getBoardArticles?.list ?? []),
	});

	// Followers (who follow this trainer) and followings (who the trainer follows)
	useQuery(GET_MEMBER_FOLLOWERS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 8, search: { followingId: memberId } } },
		skip: !memberId,
		onCompleted: (d: T) => setFollowers(d?.getMemberFollowers?.list ?? []),
	});
	useQuery(GET_MEMBER_FOLLOWINGS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 8, search: { followerId: memberId } } },
		skip: !memberId,
		onCompleted: (d: T) => setFollowings(d?.getMemberFollowings?.list ?? []),
	});

	const [likeMember] = useMutation(LIKE_TARGET_MEMBER);
	const [subscribeMut] = useMutation(SUBSCRIBE);
	const [unsubscribeMut] = useMutation(UNSUBSCRIBE);
	const [createReview] = useMutation(CREATE_REVIEW);

	/** HANDLERS **/
	const likeHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			const wasLiked = !!member?.meLiked?.[0]?.myFavorite;
			setMember((prev: any) =>
				prev
					? {
							...prev,
							memberLikes: (prev.memberLikes ?? 0) + (wasLiked ? -1 : 1),
							meLiked: wasLiked ? [] : [{ memberId: user._id, likeRefId: memberId, myFavorite: true }],
					  }
					: prev,
			);
			await likeMember({ variables: { input: memberId } });
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const followHandler = async () => {
		if (followBusy) return;
		try {
			if (!user?._id) throw new Error(Messages.error2);
			setFollowBusy(true);
			if (member?.meFollowed?.[0]?.myFollowing) {
				await unsubscribeMut({ variables: { input: memberId } });
			} else {
				await subscribeMut({ variables: { input: memberId } });
			}
			const { data } = await memberRefetch({ input: memberId });
			if (data?.getMember) setMember(data.getMember);
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		} finally {
			setFollowBusy(false);
		}
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
		} catch (err: any) {
			sweetMixinErrorAlert(err?.graphQLErrors?.[0]?.message || err.message).then();
		}
	};

	if (memberLoading || trainerLoading) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#0d0d0e' }}>
				<CircularProgress size={'4rem'} sx={{ color: '#00dce5' }} />
			</Stack>
		);
	}

	if (!member) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#0d0d0e' }}>
				<p style={{ color: '#b9caca', fontFamily: 'Hanken Grotesk' }}>Trainer not found.</p>
			</Stack>
		);
	}

	const isFollowing = member.meFollowed?.[0]?.myFollowing;
	const isLiked = member.meLiked?.[0]?.myFavorite;
	const isOwnProfile = user?._id === member._id;
	const trainerName = member.memberFullName || member.memberNick;

	// Backend permission mirrors (review.service.ts): purchase required + one review per member
	const canReview = !!trainer?._id && purchasedCourses.some((c) => c.trainerId === trainer._id);
	const alreadyReviewed = !!user?._id && reviews.some((r) => r.memberId === user._id);

	return (
		<div className="wl-page">
			<div className="lp-container">
				<button className="wd-back" style={{ marginBottom: '8px' }} onClick={() => router.push('/trainer')}>
					← Trainers
				</button>

				<div className="td-layout" style={{ paddingTop: '20px' }}>
					{/* Profile card */}
					<div className="td-profile-col">
						<div className="td-sticky">
						<div className="td-profile">
							<div className="td-avatar">
								<img src={member.memberImage ? `${REACT_APP_API_URL}/${member.memberImage}` : '/img/profile/defaultUser.svg'} alt={trainerName} />
							</div>
							<h2 className="td-name">{trainerName}</h2>
							<div className={`td-verified${trainer?.trainerVerificationStatus !== 'VERIFIED' ? ' is-pending' : ''}`}>
								{trainer?.trainerVerificationStatus === 'VERIFIED' ? 'Verified trainer' : 'Trainer'}
							</div>
							{trainer?.trainerBio && <p className="td-bio">{trainer.trainerBio}</p>}

							{/* Stats */}
							<div className="td-stats">
								<div>
									<span className="td-stat-value">
										{trainer?.trainerRating ? trainer.trainerRating.toFixed(1) : '—'}
										{trainer?.trainerRatingCount ? <small> ({trainer.trainerRatingCount})</small> : null}
									</span>
									<span className="td-stat-label">Rating</span>
								</div>
								<div>
									<span className="td-stat-value">{trainer?.trainerExperience ?? 0}y</span>
									<span className="td-stat-label">Experience</span>
								</div>
								<div>
									<span className="td-stat-value">{member.memberFollowers ?? 0}</span>
									<span className="td-stat-label">Followers</span>
								</div>
								<div>
									<span className="td-stat-value">{member.memberWorkouts ?? 0}</span>
									<span className="td-stat-label">Workouts</span>
								</div>
								<div>
									<span className="td-stat-value">{member.memberViews ?? 0}</span>
									<span className="td-stat-label">Views</span>
								</div>
								<div>
									<span className="td-stat-value">{trainer?.trainerRank ?? member.memberRank ?? 0}</span>
									<span className="td-stat-label">Rank</span>
								</div>
							</div>

							{/* Specializations */}
							{trainer?.trainerSpecializations && trainer.trainerSpecializations.length > 0 && (
								<div className="td-specs">
									{trainer.trainerSpecializations.map((s, i) => (
										<span key={i} className="lp-chip lp-chip--cyan">
											{s}
										</span>
									))}
								</div>
							)}

							{/* Social links */}
							{trainer?.trainerSocialLinks && trainer.trainerSocialLinks.length > 0 && (
								<div className="td-socials">
									{trainer.trainerSocialLinks.map((link, i) => (
										<a key={i} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer">
											{link.replace(/^https?:\/\//, '')} ↗
										</a>
									))}
								</div>
							)}

							{/* Actions */}
							{user?._id && !isOwnProfile && (
								<div className="td-actions">
									<button className={`td-follow${isFollowing ? ' is-following' : ''}`} onClick={followHandler} disabled={followBusy}>
										{isFollowing ? 'Following' : 'Follow'}
									</button>
									<LikeButton liked={!!isLiked} count={member.memberLikes ?? 0} onClick={likeHandler} variant="full" />
								</div>
							)}
						</div>

						{/* Followers / Following */}
						<div className="td-people-card">
							<div className="td-tabs">
								<button className={peopleTab === 'followers' ? 'is-active' : ''} onClick={() => setPeopleTab('followers')}>
									Followers ({member.memberFollowers ?? 0})
								</button>
								<button className={peopleTab === 'followings' ? 'is-active' : ''} onClick={() => setPeopleTab('followings')}>
									Following ({member.memberFollowings ?? 0})
								</button>
							</div>
							{(peopleTab === 'followers'
								? followers.map((f: any) => f.followerData)
								: followings.map((f: any) => f.followingData)
							)
								.filter(Boolean)
								.map((p: any) => (
									<div
										key={p._id}
										className="td-person"
										onClick={() =>
											p.memberType === 'TRAINER'
												? router.push({ pathname: '/trainer/detail', query: { id: p._id } })
												: router.push({ pathname: '/member', query: { memberId: p._id } })
										}
									>
										<img src={p.memberImage ? `${REACT_APP_API_URL}/${p.memberImage}` : '/img/profile/defaultUser.svg'} alt={p.memberNick} />
										<span className="td-person-nick">{p.memberFullName || p.memberNick}</span>
										<span className={`td-person-type${p.memberType === 'TRAINER' ? ' is-trainer' : ''}`}>{p.memberType}</span>
									</div>
								))}
							{(peopleTab === 'followers' ? followers : followings).length === 0 && (
								<p className="td-people-empty">{peopleTab === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</p>
							)}
						</div>
						</div>
					</div>

					{/* Main content */}
					<div className="td-main">
						{/* Workouts */}
						{workouts.length > 0 && (
							<div className="wd-section">
								<div className="wd-section-head">
									<h3>Free Workouts</h3>
									<span className="wd-section-count">{workouts.length} published</span>
								</div>
								<div className="td-grid2">
									{workouts.map((w) => (
										<div key={w._id} className="wl-card" onClick={() => router.push({ pathname: '/workout/detail', query: { id: w._id } })}>
											<div className="wl-card-img">
												<img
													src={w.workoutThumbnail ? `${REACT_APP_API_URL}/${w.workoutThumbnail}` : '/img/banner/header1.svg'}
													alt={w.workoutTitle}
													loading="lazy"
												/>
												<div className="wl-card-shade" />
												<div className="wl-card-chips">
													{w.targetMuscle && <span className="lp-chip lp-chip--cyan">{w.targetMuscle}</span>}
												</div>
												<span className="wl-kcal">{w.estimatedCaloriesBurned} KCAL</span>
											</div>
											<div className="wl-card-body">
												<h3>{w.workoutTitle}</h3>
												<div className="wl-card-foot">
													<span className="wl-diff">
														<span className="wl-diff-dot" style={{ background: difficultyColor[w.workoutDifficulty] || '#00dce5' }} />
														{w.workoutDifficulty}
													</span>
													<span className="wl-card-arrow">→</span>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Courses */}
						{courses.length > 0 && (
							<div className="wd-section">
								<div className="wd-section-head">
									<h3>Programs</h3>
									<span className="wd-section-count">
										{courses.length} program{courses.length > 1 ? 's' : ''}
									</span>
								</div>
								<div className="lp-course-rows">
									{courses.map((c, i) => {
										const accent = categoryAccent[c.courseCategory] || '#00dce5';
										return (
											<div
												key={c._id}
												className="lp-course-row"
												style={{ ['--accent' as any]: accent, flex: 'none' }}
												onClick={() => router.push({ pathname: '/course/detail', query: { id: c._id } })}
											>
												<span className="lp-course-row-idx">0{i + 1}</span>
												<div className="lp-course-row-thumb">
													<img
														src={c.courseThumbnail ? `${REACT_APP_API_URL}/${c.courseThumbnail}` : '/img/banner/header1.svg'}
														alt={c.courseTitle}
														loading="lazy"
													/>
												</div>
												<div className="lp-course-row-info">
													<h3>{c.courseTitle}</h3>
													<div className="lp-course-row-meta">
														<span style={{ color: accent }}>{c.courseCategory}</span>
														<span>{c.courseDuration}w</span>
														<span>{c.courseDifficulty}</span>
													</div>
												</div>
												<div className="lp-course-row-right">
													{c.courseRating && c.courseRating > 0 ? (
														<span className="lp-course-row-rating">★ {c.courseRating.toFixed(1)}</span>
													) : null}
													<span className="lp-course-row-price">{c.coursePrice > 0 ? `$${c.coursePrice}` : 'Free'}</span>
												</div>
												<span className="lp-course-row-arrow">→</span>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{/* Articles */}
						{articles.length > 0 && (
							<div className="wd-section">
								<div className="wd-section-head">
									<h3>Articles</h3>
									<span className="wd-section-count">Latest {articles.length}</span>
								</div>
								<div className="td-grid2">
									{articles.map((article: any) => (
										<div
											key={article._id}
											className="lp-article-card"
											onClick={() => router.push({ pathname: '/community/detail', query: { id: article._id } })}
										>
											<span className="lp-article-cat">{article.articleCategory?.replace(/_/g, ' ')}</span>
											<h3>{article.articleTitle}</h3>
											<div className="lp-article-meta">
												<span>{new Date(article.createdAt).toLocaleDateString()}</span>
												<span>
													{article.articleViews} views · ♥ {article.articleLikes}
												</span>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Reviews */}
						<div className="wd-section">
							<div className="wd-section-head">
								<h3>Athlete Reviews</h3>
								<span className="wd-section-count">
									{reviews.length} review{reviews.length === 1 ? '' : 's'}
								</span>
							</div>

							{/* Review form — mirrors backend permission rules */}
							{user?._id && !isOwnProfile && (
								<>
									{alreadyReviewed ? (
										<div className="td-review-note is-done">You have already reviewed this trainer.</div>
									) : canReview ? (
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
													placeholder={`Share your experience with ${trainerName}...`}
												/>
												<button className="wd-btn" onClick={reviewHandler}>
													Post
												</button>
											</div>
										</div>
									) : (
										<div className="td-review-note">
											Only athletes who have purchased one of {trainerName}'s courses can leave a review.
										</div>
									)}
								</>
							)}

							{reviews.length === 0 ? (
								<p className="wd-empty-line">No reviews yet.</p>
							) : (
								reviews.map((r: any) => (
									<div key={r._id} className="wd-comment">
										<img
											src={r.memberData?.memberImage ? `${REACT_APP_API_URL}/${r.memberData.memberImage}` : '/img/profile/defaultUser.svg'}
											alt=""
										/>
										<div className="wd-comment-body">
											<div className="wd-comment-head">
												<span className="wd-comment-nick">{r.memberData?.memberNick ?? 'User'}</span>
												<span className="wd-comment-stars">
													{'★'.repeat(r.reviewRating)}
													{'☆'.repeat(5 - r.reviewRating)}
												</span>
												<span className="wd-comment-date">{new Date(r.createdAt).toLocaleDateString()}</span>
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
		</div>
	);
};

export default withLayoutBasic(TrainerDetail);
