import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { CircularProgress, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { notifyMember } from '../../libs/notify';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import {
	GET_MEMBER,
	GET_WORKOUTS_BY_MEMBER_ID,
	GET_MEMBER_FOLLOWERS,
	GET_MEMBER_FOLLOWINGS,
	GET_BOARD_ARTICLES,
} from '../../apollo/user/query';
import { Messages, REACT_APP_API_URL } from '../../libs/config';
import { Member } from '../../libs/types/member/member';
import { Workout } from '../../libs/types/workout/workout';
import { T } from '../../libs/types/common';
import LikeButton from '../../libs/components/common/LikeButton';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const difficultyColor: Record<string, string> = {
	BEGINNER: '#66daba',
	INTERMEDIATE: '#ffb77f',
	ADVANCED: '#ff8a8a',
};

const MemberPage: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const memberId = router.query?.memberId as string;
	const [activeTab, setActiveTab] = useState<string>('workouts');
	const [member, setMember] = useState<Member | null>(null);
	const [memberWorkouts, setMemberWorkouts] = useState<Workout[]>([]);
	const [followers, setFollowers] = useState<any[]>([]);
	const [followings, setFollowings] = useState<any[]>([]);
	const [articles, setArticles] = useState<any[]>([]);
	const [followBusy, setFollowBusy] = useState(false);

	/** APOLLO REQUESTS **/
	const [subscribeMutation] = useMutation(SUBSCRIBE);
	const [unsubscribeMutation] = useMutation(UNSUBSCRIBE);
	const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

	const { loading: memberLoading, refetch: memberRefetch } = useQuery(GET_MEMBER, {
		fetchPolicy: 'network-only',
		variables: { input: memberId },
		skip: !memberId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			if (data?.getMember) setMember(data.getMember);
		},
	});

	const { loading: workoutsLoading } = useQuery(GET_WORKOUTS_BY_MEMBER_ID, {
		fetchPolicy: 'network-only',
		variables: { input: memberId },
		skip: !memberId,
		onCompleted: (data: T) => {
			setMemberWorkouts(data?.getWorkoutsByMemberId ?? []);
		},
	});

	useQuery(GET_MEMBER_FOLLOWERS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 20, search: { followingId: memberId } } },
		skip: !memberId,
		onCompleted: (d: T) => setFollowers(d?.getMemberFollowers?.list ?? []),
	});

	useQuery(GET_MEMBER_FOLLOWINGS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 20, search: { followerId: memberId } } },
		skip: !memberId,
		onCompleted: (d: T) => setFollowings(d?.getMemberFollowings?.list ?? []),
	});

	useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 10, sort: 'createdAt', direction: 'DESC', search: { memberId } } },
		skip: !memberId,
		onCompleted: (d: T) => setArticles(d?.getBoardArticles?.list ?? []),
	});

	// Trainers have a much richer dedicated profile — send visitors there
	useEffect(() => {
		if (member?.memberType === 'TRAINER') {
			router.replace({ pathname: '/trainer/detail', query: { id: member._id } });
		}
	}, [member?._id, member?.memberType]);

	/** HANDLERS **/
	const followHandler = async () => {
		if (followBusy) return;
		try {
			if (!memberId || !user?._id) throw new Error(Messages.error2);
			setFollowBusy(true);
			if (member?.meFollowed?.[0]?.myFollowing) {
				await unsubscribeMutation({ variables: { input: memberId } });
			} else {
				await subscribeMutation({ variables: { input: memberId } });
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

	const likeMemberHandler = async () => {
		try {
			if (!memberId || !user?._id) throw new Error(Messages.error2);
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
			await likeTargetMember({ variables: { input: memberId } });
			if (!wasLiked) notifyMember(memberId, user._id, 'SYSTEM', 'New like on your profile', `${user.memberNick} liked your profile`);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const personClickHandler = (p: any) => {
		if (!p?._id) return;
		if (p.memberType === 'TRAINER') router.push({ pathname: '/trainer/detail', query: { id: p._id } });
		else router.push({ pathname: '/member', query: { memberId: p._id } });
	};

	const tabs = [
		{ key: 'workouts', label: `Workouts (${memberWorkouts.length})` },
		{ key: 'followers', label: `Followers (${member?.memberFollowers ?? 0})` },
		{ key: 'followings', label: `Following (${member?.memberFollowings ?? 0})` },
		{ key: 'articles', label: `Articles (${member?.memberArticles ?? 0})` },
	];

	if (memberLoading) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#0d0d0e' }}>
				<CircularProgress size={'4rem'} sx={{ color: '#00dce5' }} />
			</Stack>
		);
	}

	if (!member) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#0d0d0e' }}>
				<p style={{ color: '#b9caca', fontFamily: 'Hanken Grotesk', fontSize: '18px' }}>Member not found.</p>
			</Stack>
		);
	}

	const isFollowing = member.meFollowed?.[0]?.myFollowing;
	const isOwnProfile = user?._id === member._id;
	const memberName = member.memberFullName || member.memberNick;

	const renderPeople = (list: any[], dataKey: 'followerData' | 'followingData', emptyText: string) => {
		const people = list.map((f: any) => f[dataKey]).filter(Boolean);
		if (!people.length) return <p className="wd-empty-line">{emptyText}</p>;
		return (
			<div className="td-grid2">
				{people.map((p: any) => (
					<div key={p._id} className="td-person" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)', padding: '12px 14px' }} onClick={() => personClickHandler(p)}>
						<img src={p.memberImage ? `${REACT_APP_API_URL}/${p.memberImage}` : '/img/profile/defaultUser.svg'} alt={p.memberNick} />
						<span className="td-person-nick">{p.memberFullName || p.memberNick}</span>
						<span className={`td-person-type${p.memberType === 'TRAINER' ? ' is-trainer' : ''}`}>{p.memberType}</span>
					</div>
				))}
			</div>
		);
	};

	return (
		<div className="wl-page">
			<div className="lp-container">
				<div className="td-layout" style={{ paddingTop: '8px' }}>
					{/* Profile card */}
					<div className="td-profile-col">
						<div className="td-sticky">
						<div className="td-profile">
							<div className="td-avatar">
								<img src={member.memberImage ? `${REACT_APP_API_URL}/${member.memberImage}` : '/img/profile/defaultUser.svg'} alt={memberName} />
							</div>
							<h2 className="td-name">{memberName}</h2>
							<div className="td-verified is-pending">{member.memberType}</div>
							{member.memberDesc && <p className="td-bio">{member.memberDesc}</p>}

							{/* Stats */}
							<div className="td-stats">
								<div>
									<span className="td-stat-value">{member.memberWorkouts ?? 0}</span>
									<span className="td-stat-label">Workouts</span>
								</div>
								<div>
									<span className="td-stat-value">{member.memberFollowers ?? 0}</span>
									<span className="td-stat-label">Followers</span>
								</div>
								<div>
									<span className="td-stat-value">{member.memberFollowings ?? 0}</span>
									<span className="td-stat-label">Following</span>
								</div>
								<div>
									<span className="td-stat-value">{member.memberArticles ?? 0}</span>
									<span className="td-stat-label">Articles</span>
								</div>
								<div>
									<span className="td-stat-value">{member.memberLikes ?? 0}</span>
									<span className="td-stat-label">Likes</span>
								</div>
								<div>
									<span className="td-stat-value">{member.memberViews ?? 0}</span>
									<span className="td-stat-label">Views</span>
								</div>
							</div>

							{/* Actions */}
							{user?._id && !isOwnProfile && (
								<div className="td-actions">
									<button className={`td-follow${isFollowing ? ' is-following' : ''}`} onClick={followHandler} disabled={followBusy}>
										{isFollowing ? 'Following' : 'Follow'}
									</button>
									<LikeButton liked={!!member.meLiked?.[0]?.myFavorite} count={member.memberLikes ?? 0} onClick={likeMemberHandler} variant="full" />
								</div>
							)}
						</div>
						</div>
					</div>

					{/* Main content */}
					<div className="td-main">
						{/* Tabs */}
						<div className="wl-seg" style={{ marginBottom: '24px' }}>
							{tabs.map((tab) => (
								<button key={tab.key} className={activeTab === tab.key ? 'is-active' : ''} onClick={() => setActiveTab(tab.key)}>
									{tab.label}
								</button>
							))}
						</div>

						{/* Workouts tab */}
						{activeTab === 'workouts' &&
							(memberWorkouts.length === 0 && !workoutsLoading ? (
								<p className="wd-empty-line">No workouts yet.</p>
							) : (
								<div className="td-grid2">
									{memberWorkouts.map((w) => (
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
							))}

						{/* Followers tab */}
						{activeTab === 'followers' && renderPeople(followers, 'followerData', 'No followers yet.')}

						{/* Followings tab */}
						{activeTab === 'followings' && renderPeople(followings, 'followingData', 'Not following anyone yet.')}

						{/* Articles tab */}
						{activeTab === 'articles' &&
							(articles.length === 0 ? (
								<p className="wd-empty-line">No articles yet.</p>
							) : (
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
							))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(MemberPage);
