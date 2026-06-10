import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { CircularProgress, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import { GET_MEMBER, GET_WORKOUTS_BY_MEMBER_ID } from '../../apollo/user/query';
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

const MemberPage: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const memberId = router.query?.memberId as string;
	const [activeTab, setActiveTab] = useState<string>('workouts');
	const [member, setMember] = useState<Member | null>(null);
	const [memberWorkouts, setMemberWorkouts] = useState<Workout[]>([]);

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

	/** HANDLERS **/
	const subscribeHandler = async () => {
		try {
			if (!memberId || !user?._id) throw new Error(Messages.error2);
			await subscribeMutation({ variables: { input: memberId } });
			const { data } = await memberRefetch({ input: memberId });
			if (data?.getMember) setMember(data.getMember);
			await sweetTopSmallSuccessAlert('Followed!', 800);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const unsubscribeHandler = async () => {
		try {
			if (!memberId || !user?._id) throw new Error(Messages.error2);
			await unsubscribeMutation({ variables: { input: memberId } });
			const { data } = await memberRefetch({ input: memberId });
			if (data?.getMember) setMember(data.getMember);
			await sweetTopSmallSuccessAlert('Unfollowed!', 800);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const likeMemberHandler = async () => {
		try {
			if (!memberId || !user?._id) throw new Error(Messages.error2);
			const wasLiked = !!member?.meLiked?.[0]?.myFavorite;
			setMember((prev: any) => prev ? { ...prev, memberLikes: (prev.memberLikes ?? 0) + (wasLiked ? -1 : 1), meLiked: wasLiked ? [] : [{ memberId: user._id, likeRefId: memberId, myFavorite: true }] } : prev);
			await likeTargetMember({ variables: { input: memberId } });
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const tabs = ['workouts', 'followers', 'followings', 'articles'];

	if (memberLoading) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#131314' }}>
				<CircularProgress size={'4rem'} sx={{ color: '#00dce5' }} />
			</Stack>
		);
	}

	if (device === 'mobile') {
		return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>GYMORA MEMBER MOBILE</div>;
	}

	if (!member) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#131314' }}>
				<p style={{ color: '#b9caca', fontFamily: 'Hanken Grotesk', fontSize: '18px' }}>Member not found.</p>
			</Stack>
		);
	}

	const isFollowing = member.meFollowed?.[0]?.myFollowing;

	return (
		<div style={{ background: '#131314', minHeight: '100vh', padding: '40px 0' }}>
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>
				{/* Left sidebar — Profile */}
				<div>
					<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
						<div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 16px', border: '3px solid #3a494a' }}>
							<img
								src={member.memberImage ? `${REACT_APP_API_URL}/${member.memberImage}` : '/img/profile/defaultUser.svg'}
								alt={member.memberNick}
								style={{ width: '100%', height: '100%', objectFit: 'cover' }}
							/>
						</div>
						<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '22px', fontWeight: 700, color: '#e5e2e3', marginBottom: '4px' }}>
							{member.memberFullName || member.memberNick}
						</h2>
						<p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#00dce5', textTransform: 'uppercase', marginBottom: '8px' }}>
							{member.memberType}
						</p>
						{member.memberDesc && (
							<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#849495', lineHeight: '20px', marginBottom: '16px' }}>
								{member.memberDesc}
							</p>
						)}

						{/* Stats */}
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px', paddingTop: '16px', borderTop: '1px solid #3a494a' }}>
							{[
								{ label: 'Workouts', value: member.memberWorkouts },
								{ label: 'Followers', value: member.memberFollowers },
								{ label: 'Articles', value: member.memberArticles },
							].map((s) => (
								<div key={s.label}>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 800, color: '#e5e2e3', display: 'block' }}>{s.value}</span>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase' }}>{s.label}</span>
								</div>
							))}
						</div>

						{/* Actions */}
						{user?._id && user._id !== member._id && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
								{isFollowing ? (
									<button onClick={unsubscribeHandler} style={{ width: '100%', padding: '12px', background: '#353436', color: '#849495', border: '1px solid #3a494a', borderRadius: '8px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
										Unfollow
									</button>
								) : (
									<button onClick={subscribeHandler} style={{ width: '100%', padding: '12px', background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
										Follow
									</button>
								)}
								<LikeButton
									liked={!!member.meLiked?.[0]?.myFavorite}
									count={member.memberLikes ?? 0}
									onClick={likeMemberHandler}
									variant="full"
								/>
							</div>
						)}
					</div>

					{/* Tab navigation */}
					<div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
						{tabs.map((tab) => (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								style={{
									padding: '12px 16px',
									borderRadius: '8px',
									border: 'none',
									textAlign: 'left',
									fontFamily: 'Hanken Grotesk',
									fontSize: '14px',
									fontWeight: activeTab === tab ? 700 : 400,
									cursor: 'pointer',
									background: activeTab === tab ? 'rgba(0,220,229,0.1)' : 'transparent',
									color: activeTab === tab ? '#e9feff' : '#849495',
									borderLeft: activeTab === tab ? '3px solid #00dce5' : '3px solid transparent',
								}}
							>
								{tab.charAt(0).toUpperCase() + tab.slice(1)}
							</button>
						))}
					</div>
				</div>

				{/* Right content */}
				<div>
					{/* Workouts tab */}
					{activeTab === 'workouts' && (
						<div>
							<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 700, color: '#e5e2e3', marginBottom: '20px' }}>
								Workouts ({memberWorkouts.length})
							</h3>
							{memberWorkouts.length === 0 ? (
								<p style={{ color: '#849495', fontFamily: 'Hanken Grotesk', fontSize: '16px' }}>No workouts yet.</p>
							) : (
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
									{memberWorkouts.map((w) => (
										<div
											key={w._id}
											onClick={() => router.push({ pathname: '/workout/detail', query: { id: w._id } })}
											style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s' }}
											onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,220,229,0.3)')}
											onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)')}
										>
											<div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
												<img src={w.workoutThumbnail ? `${REACT_APP_API_URL}/${w.workoutThumbnail}` : '/img/banner/header1.svg'} alt={w.workoutTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
											</div>
											<div style={{ padding: '16px' }}>
												<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3', marginBottom: '4px' }}>{w.workoutTitle}</h4>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495' }}>{w.workoutDifficulty} • {w.estimatedCaloriesBurned} cal</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Followers tab */}
					{activeTab === 'followers' && (
						<div>
							<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 700, color: '#e5e2e3', marginBottom: '20px' }}>
								Followers ({member.memberFollowers})
							</h3>
							<p style={{ color: '#849495', fontFamily: 'Hanken Grotesk', fontSize: '14px' }}>
								Followers list will be implemented with the follow components migration.
							</p>
						</div>
					)}

					{/* Followings tab */}
					{activeTab === 'followings' && (
						<div>
							<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 700, color: '#e5e2e3', marginBottom: '20px' }}>
								Following ({member.memberFollowings})
							</h3>
							<p style={{ color: '#849495', fontFamily: 'Hanken Grotesk', fontSize: '14px' }}>
								Followings list will be implemented with the follow components migration.
							</p>
						</div>
					)}

					{/* Articles tab */}
					{activeTab === 'articles' && (
						<div>
							<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 700, color: '#e5e2e3', marginBottom: '20px' }}>
								Articles ({member.memberArticles})
							</h3>
							<p style={{ color: '#849495', fontFamily: 'Hanken Grotesk', fontSize: '14px' }}>
								Articles list will be implemented with the community components migration.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(MemberPage);
