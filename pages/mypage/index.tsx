import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import { Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyProfile from '../../libs/components/mypage/MyProfile';
import MyArticles from '../../libs/components/mypage/MyArticles';
import WriteArticle from '../../libs/components/mypage/WriteArticle';
import ChatContent from '../../libs/components/mypage/ChatContent';
import NutritionContent from '../../libs/components/mypage/NutritionContent';
import ProgressContent from '../../libs/components/mypage/ProgressContent';
import SubscriptionContent from '../../libs/components/mypage/SubscriptionContent';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getJwtToken, updateUserInfo } from '../../libs/auth';
import { REACT_APP_API_URL, Messages } from '../../libs/config';
import {
	GET_MEMBER_WORKOUTS, GET_DASHBOARD_STATS, GET_NOTIFICATIONS,
	GET_MEMBER_PURCHASED_COURSES, GET_TRAINER_COURSES, GET_RECOMMENDATIONS,
	GET_TRAINER_BY_MEMBER_ID,
} from '../../apollo/user/query';
import { CREATE_TRAINER, CREATE_WORKOUT, CREATE_COURSE, MARK_NOTIFICATION_READ } from '../../apollo/user/mutation';
import { Workout } from '../../libs/types/workout/workout';
import { Course } from '../../libs/types/course/course';
import { T } from '../../libs/types/common';
import { sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

type MenuItem = {
	key: string;
	label: string;
	icon: string;
	trainerOnly?: boolean;
	trainerOrAdmin?: boolean;
	userOnly?: boolean;
	/** Consumer features — hidden for trainers, who manage content here instead. */
	hideForTrainer?: boolean;
};

const menuSections: { title: string | null; items: MenuItem[] }[] = [
	{
		title: null,
		items: [
			{ key: 'dashboard', label: 'Dashboard', icon: '◫' },
			{ key: 'myProfile', label: 'My Profile', icon: '○' },
		],
	},
	{
		title: 'Studio',
		items: [
			{ key: 'myWorkouts', label: 'My Workouts', icon: '◈', trainerOnly: true },
			{ key: 'createWorkout', label: 'Create Workout', icon: '＋', trainerOnly: true },
			{ key: 'trainerCourses', label: 'My Programs', icon: '◧', trainerOnly: true },
			{ key: 'createCourse', label: 'Create Program', icon: '＋', trainerOnly: true },
			{ key: 'myArticles', label: 'My Articles', icon: '▤', trainerOrAdmin: true },
			{ key: 'writeArticle', label: 'Write Article', icon: '✎', trainerOrAdmin: true },
		],
	},
	{
		title: 'Training',
		items: [{ key: 'myCourses', label: 'My Programs', icon: '▦', hideForTrainer: true }],
	},
	{
		title: 'Activity',
		items: [
			{ key: 'notifications', label: 'Notifications', icon: '◉' },
			{ key: 'chat', label: 'Messages', icon: '◬' },
		],
	},
	{
		title: 'Health',
		items: [
			{ key: 'nutrition', label: 'Nutrition', icon: '◑', hideForTrainer: true },
			{ key: 'progress', label: 'Progress', icon: '△', hideForTrainer: true },
		],
	},
	{
		title: null,
		items: [
			{ key: 'subscription', label: 'Subscription', icon: '◇', hideForTrainer: true },
			{ key: 'becomeTrainer', label: 'Become Trainer', icon: '→', userOnly: true },
		],
	},
];

const notifTypeMeta: Record<string, { icon: string; color: string }> = {
	SYSTEM: { icon: '◉', color: '#9aabab' },
	WORKOUT: { icon: '◈', color: '#00dce5' },
	NUTRITION: { icon: '◑', color: '#ffb77f' },
	SUBSCRIPTION: { icon: '◇', color: '#ddb7ff' },
	CHAT: { icon: '◬', color: '#66daba' },
};

const notifTimeAgo = (iso: string) => {
	const diff = Date.now() - new Date(iso).getTime();
	const m = Math.floor(diff / 60000);
	if (m < 1) return 'now';
	if (m < 60) return `${m}m ago`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h ago`;
	const d = Math.floor(h / 24);
	if (d < 7) return `${d}d ago`;
	return new Date(iso).toLocaleDateString();
};

const isItemVisible = (item: MenuItem, memberType?: string) => {
	if (item.trainerOnly) return memberType === 'TRAINER';
	if (item.trainerOrAdmin) return memberType === 'TRAINER' || memberType === 'ADMIN';
	if (item.userOnly) return memberType === 'USER';
	if (item.hideForTrainer) return memberType !== 'TRAINER';
	return true;
};

const MyPage: NextPage = () => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const router = useRouter();
	const requestedCategory: string = (router.query?.category as string) ?? 'dashboard';

	// Guard: only categories visible to this role can render (e.g. a trainer
	// hitting ?category=subscription falls back to the dashboard).
	const allowedKeys = menuSections.flatMap((s) => s.items.filter((i) => isItemVisible(i, user?.memberType)).map((i) => i.key));
	const cat = allowedKeys.includes(requestedCategory) ? requestedCategory : 'dashboard';

	const [myWorkouts, setMyWorkouts] = useState<Workout[]>([]);
	const [dashboardStats, setDashboardStats] = useState<any>(null);
	const [notifications, setNotifications] = useState<any[]>([]);
	const [purchasedCourses, setPurchasedCourses] = useState<Course[]>([]);
	const [trainerCourses, setTrainerCourses] = useState<Course[]>([]);
	const [recommendations, setRecommendations] = useState<any[]>([]);
	const [trainerProfile, setTrainerProfile] = useState<any>(null);
	const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
	const [newWorkout, setNewWorkout] = useState({ workoutTitle: '', workoutDesc: '', workoutDifficulty: 'BEGINNER', targetMuscle: '', estimatedCaloriesBurned: 300 });
	const [newCourse, setNewCourse] = useState({ courseTitle: '', courseDesc: '', courseDifficulty: 'BEGINNER', courseCategory: 'STRENGTH', coursePrice: 0, courseDuration: 4 });
	const [trainerForm, setTrainerForm] = useState({ trainerBio: '', trainerSpecializations: '', trainerExperience: 1 });

	/** APOLLO **/
	useQuery(GET_MEMBER_WORKOUTS, { fetchPolicy: 'network-only', skip: !user?._id || user?.memberType !== 'TRAINER', onCompleted: (d: T) => setMyWorkouts(d?.getMemberWorkouts ?? []) });
	useQuery(GET_DASHBOARD_STATS, { fetchPolicy: 'cache-and-network', skip: !user?._id, onCompleted: (d: T) => setDashboardStats(d?.getDashboardStats) });
	const { refetch: notifRefetch } = useQuery(GET_NOTIFICATIONS, { fetchPolicy: 'network-only', skip: !user?._id, onCompleted: (d: T) => setNotifications(d?.getNotifications ?? []) });
	useQuery(GET_MEMBER_PURCHASED_COURSES, { fetchPolicy: 'network-only', skip: !user?._id, onCompleted: (d: T) => setPurchasedCourses(d?.getMemberPurchasedCourses ?? []) });
	useQuery(GET_TRAINER_COURSES, { fetchPolicy: 'network-only', skip: !user?._id || user?.memberType !== 'TRAINER', onCompleted: (d: T) => setTrainerCourses(d?.getTrainerCourses ?? []) });
	useQuery(GET_TRAINER_BY_MEMBER_ID, {
		fetchPolicy: 'cache-and-network',
		variables: { input: user?._id },
		skip: !user?._id || user?.memberType !== 'TRAINER',
		onCompleted: (d: T) => setTrainerProfile(d?.getTrainerByMemberId ?? null),
	});
	useQuery(GET_RECOMMENDATIONS, { fetchPolicy: 'cache-and-network', skip: !user?._id, variables: { input: { memberId: user?._id, goals: ['GENERAL'] } }, onCompleted: (d: T) => setRecommendations(d?.getRecommendations ?? []) });

	const [markRead] = useMutation(MARK_NOTIFICATION_READ);
	const [createTrainer] = useMutation(CREATE_TRAINER);
	const [createWorkout] = useMutation(CREATE_WORKOUT);
	const [createCourseMut] = useMutation(CREATE_COURSE);

	useEffect(() => {
		if (user._id) return;
		const jwt = getJwtToken();
		if (jwt) { updateUserInfo(jwt); return; }
		router.push('/').then();
	}, [user._id, router]);

	const menuHandler = (key: string) => {
		router.push({ pathname: '/mypage', query: { category: key } }, undefined, { shallow: true });
	};

	const markNotifRead = async (id: string) => {
		await markRead({ variables: { input: id } });
		const { data: rd } = await notifRefetch();
		if (rd?.getNotifications) setNotifications(rd.getNotifications);
	};

	const markAllNotifsRead = async () => {
		const unread = notifications.filter((n: any) => !n.isRead);
		if (!unread.length) return;
		await Promise.all(unread.map((n: any) => markRead({ variables: { input: n._id } })));
		const { data: rd } = await notifRefetch();
		if (rd?.getNotifications) setNotifications(rd.getNotifications);
	};

	const createWorkoutHandler = async () => {
		try {
			if (!newWorkout.workoutTitle || !newWorkout.targetMuscle) throw new Error('Title and target muscle required');
			await createWorkout({ variables: { input: { ...newWorkout, estimatedCaloriesBurned: Number(newWorkout.estimatedCaloriesBurned) } } });
			setNewWorkout({ workoutTitle: '', workoutDesc: '', workoutDifficulty: 'BEGINNER', targetMuscle: '', estimatedCaloriesBurned: 300 });
			await sweetMixinSuccessAlert('Workout created!');
			router.push({ pathname: '/mypage', query: { category: 'myWorkouts' } }, undefined, { shallow: true });
		} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
	};

	const createCourseHandler = async () => {
		try {
			if (!newCourse.courseTitle) throw new Error('Course title required');
			await createCourseMut({ variables: { input: { ...newCourse, coursePrice: Number(newCourse.coursePrice), courseDuration: Number(newCourse.courseDuration) } } });
			setNewCourse({ courseTitle: '', courseDesc: '', courseDifficulty: 'BEGINNER', courseCategory: 'STRENGTH', coursePrice: 0, courseDuration: 4 });
			await sweetMixinSuccessAlert('Course created!');
			router.push({ pathname: '/mypage', query: { category: 'trainerCourses' } }, undefined, { shallow: true });
		} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
	};

	const becomeTrainerHandler = async () => {
		try {
			if (!trainerForm.trainerBio) throw new Error('Bio is required');
			await createTrainer({ variables: { input: { trainerBio: trainerForm.trainerBio, trainerSpecializations: trainerForm.trainerSpecializations.split(',').map((s: string) => s.trim()).filter(Boolean), trainerExperience: Number(trainerForm.trainerExperience) } } });
			await sweetMixinSuccessAlert('Trainer profile created! Please re-login.');
		} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
	};

	const inputStyle: React.CSSProperties = { padding: '12px', background: '#201f20', border: '1px solid #3a494a', borderRadius: '8px', color: '#e5e2e3', fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', outline: 'none', width: '100%' };
	const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)' };
	const labelStyle: React.CSSProperties = { fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.04em' };
	const unreadCount = notifications.filter((n: any) => !n.isRead).length;

	if (device === 'mobile') return <div style={{ padding: '24px', color: '#e5e2e3', background: '#0d0d0e' }}>GYMORA MY PAGE MOBILE</div>;

	return (
		<div style={{ background: '#0d0d0e', minHeight: '100vh', padding: '40px 0' }}>
			<div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '292px 1fr', gap: '28px' }}>
				{/* Sidebar */}
				<div className="mp-side">
					{/* Identity card */}
					<div className="mp-card">
						<div className="mp-cover" />
						<div className="mp-profile-body">
							<div className="mp-ava">
								<img src={user?.memberImage ? `${REACT_APP_API_URL}/${user.memberImage}` : '/img/profile/defaultUser.svg'} alt="" />
							</div>
							<h3 className="mp-name">{user?.memberFullName || user?.memberNick || 'User'}</h3>
							<span className={`mp-chip${trainerProfile?.trainerVerificationStatus === 'VERIFIED' ? ' is-verified' : ''}`}>
								{trainerProfile?.trainerVerificationStatus === 'VERIFIED' ? 'Verified Trainer' : user?.memberType || 'USER'}
							</span>

							{user?.memberType === 'TRAINER' && trainerProfile && (
								<div className="mp-id-row">
									<span className="mp-rating">
										{trainerProfile.trainerRating > 0
											? `★ ${trainerProfile.trainerRating.toFixed(1)}${trainerProfile.trainerRatingCount ? ` (${trainerProfile.trainerRatingCount})` : ''}`
											: 'New trainer'}
									</span>
									<span>{trainerProfile.trainerExperience ?? 0}y exp</span>
								</div>
							)}

							{/* Mini stats */}
							<div className="mp-mini">
								{(user?.memberType === 'TRAINER'
									? [
											{ v: user?.memberWorkouts ?? 0, l: 'Workouts' },
											{ v: trainerCourses.length, l: 'Programs' },
											{ v: user?.memberArticles ?? 0, l: 'Articles' },
									  ]
									: [
											{ v: user?.memberWorkouts ?? 0, l: 'Workouts' },
											{ v: user?.memberCourses ?? 0, l: 'Programs' },
											{ v: user?.memberPoints ?? 0, l: 'Points' },
									  ]
								).map((s) => (
									<div key={s.l}>
										<span className="mp-mini-v">{s.v}</span>
										<span className="mp-mini-l">{s.l}</span>
									</div>
								))}
							</div>

							{user?.memberType === 'TRAINER' && trainerProfile && (
								<>
									{trainerProfile.trainerSpecializations?.length > 0 && (
										<div className="mp-specs">
											{trainerProfile.trainerSpecializations.slice(0, 3).map((s: string, i: number) => (
												<span key={i} className="lp-chip lp-chip--cyan" style={{ fontSize: '8.5px' }}>
													{s}
												</span>
											))}
										</div>
									)}
									{trainerProfile.trainerSocialLinks?.length > 0 && (
										<div className="mp-socials">
											{trainerProfile.trainerSocialLinks.slice(0, 2).map((link: string, i: number) => (
												<a key={i} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer">
													{link.replace(/^https?:\/\//, '')} ↗
												</a>
											))}
										</div>
									)}
									<button className="mp-public" onClick={() => router.push({ pathname: '/trainer/detail', query: { id: user._id } })}>
										View Public Profile →
									</button>
								</>
							)}
						</div>
					</div>

					{/* Navigation card */}
					<div className="mp-card">
						<nav className="mp-nav">
							{menuSections.map((section, sIdx) => {
								const visibleItems = section.items.filter((item) => isItemVisible(item, user?.memberType));
								if (visibleItems.length === 0) return null;

								return (
									<div key={sIdx}>
										{section.title && <div className="mp-nav-label">{section.title}</div>}
										{!section.title && sIdx > 0 && <div className="mp-sep" />}
										{visibleItems.map((item) => {
											const isActive = cat === item.key;
											const isBecomeTrainer = item.key === 'becomeTrainer';
											return (
												<button
													key={item.key}
													className={`mp-item${isActive ? ' is-active' : ''}${isBecomeTrainer ? ' is-green' : ''}`}
													onClick={() => menuHandler(item.key)}
												>
													<span className="mp-item-ic">{item.icon}</span>
													<span className="mp-item-label">{item.label}</span>
													{item.key === 'notifications' && unreadCount > 0 && <span className="mp-unread">{unreadCount}</span>}
												</button>
											);
										})}
									</div>
								);
							})}
						</nav>
					</div>
				</div>

				{/* Content */}
				<div>
					{/* Dashboard */}
					{cat === 'dashboard' && (
						<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
							<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 800, color: '#ffffff', marginBottom: '24px' }}>Welcome back, {user?.memberNick}</h2>

							{/* Stats — trainers see studio metrics, users see training metrics */}
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
								{(user?.memberType === 'TRAINER'
									? [
											{ label: 'Workouts Published', value: user?.memberWorkouts ?? 0, color: '#00dce5' },
											{ label: 'Programs', value: trainerCourses.length, color: '#ff8a00' },
											{ label: 'Likes', value: user?.memberLikes ?? 0, color: '#66daba' },
											{ label: 'Articles', value: user?.memberArticles ?? 0, color: '#ddb7ff' },
									  ]
									: [
											{ label: 'Total Calories', value: dashboardStats?.totalCalories ? Math.round(dashboardStats.totalCalories) : 0, color: '#ff8a00' },
											{ label: 'Workouts', value: dashboardStats?.workoutCount ?? user?.memberWorkouts ?? 0, color: '#00dce5' },
											{ label: 'Progress', value: dashboardStats?.progressEntries ?? 0, color: '#66daba' },
											{ label: 'Programs', value: user?.memberCourses ?? 0, color: '#ddb7ff' },
									  ]
								).map((s) => (
									<div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
										<span style={labelStyle}>{s.label}</span>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 800, color: s.color, display: 'block', marginTop: '4px' }}>{s.value}</span>
									</div>
								))}
							</div>

							{/* Recommendations — consumer feature */}
							{user?.memberType !== 'TRAINER' && recommendations.length > 0 && (
								<div style={{ background: 'rgba(0,220,229,0.03)', border: '1px solid rgba(0,220,229,0.1)', borderRadius: '14px', padding: '24px', marginBottom: '20px' }}>
									<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '18px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>Recommendations for You</h3>
									<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
										{recommendations.map((rec: any, i: number) => (
											<div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: '#00dce5', textTransform: 'uppercase', padding: '3px 8px', background: 'rgba(0,220,229,0.1)', borderRadius: '4px', border: '1px solid rgba(0,220,229,0.15)', whiteSpace: 'nowrap', marginTop: '2px' }}>{rec.target}</span>
												<div>
													<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#e5e2e3', lineHeight: '1.4', marginBottom: '4px' }}>{rec.reason}</p>
													{rec.items?.length > 0 && (
														<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.4)' }}>{rec.items.length} suggestion{rec.items.length > 1 ? 's' : ''}</span>
													)}
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Subscription summary — consumer feature */}
							{user?.memberType !== 'TRAINER' && dashboardStats?.subscriptionSummary && (
								<div style={{ background: 'rgba(255,138,0,0.04)', border: '1px solid rgba(255,138,0,0.12)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'rgba(255,183,127,0.9)' }}>{dashboardStats.subscriptionSummary}</span>
								</div>
							)}

							{/* Quick actions — role-aware */}
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
								{(user?.memberType === 'TRAINER'
									? [
											{ label: 'Create Workout', desc: 'Publish a free workout', action: () => menuHandler('createWorkout') },
											{ label: 'Create Program', desc: 'Build a paid program', action: () => menuHandler('createCourse') },
											{ label: 'Write Article', desc: 'Share your expertise', action: () => menuHandler('writeArticle') },
									  ]
									: [
											{ label: 'Nutrition', desc: 'Track meals & macros', action: () => menuHandler('nutrition') },
											{ label: 'Progress', desc: 'Log body metrics', action: () => menuHandler('progress') },
											{ label: 'Community', desc: 'Read & write articles', action: () => router.push('/community') },
									  ]
								).map((action) => (
									<button key={action.label} onClick={action.action} style={{ ...cardStyle, padding: '20px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)' }}
										onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,220,229,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
										onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '15px', fontWeight: 600, color: '#e5e2e3', display: 'block', marginBottom: '4px' }}>{action.label}</span>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: 'rgba(185,202,202,0.5)' }}>{action.desc}</span>
									</button>
								))}
							</div>
						</div>
					)}

					{cat === 'myProfile' && <MyProfile />}

					{cat === 'myWorkouts' && (
						<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
								<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3' }}>My Workouts ({myWorkouts.length})</h2>
								<button onClick={() => menuHandler('createWorkout')} style={{ background: 'linear-gradient(135deg, #00dce5, #e9feff)', color: '#003739', border: 'none', borderRadius: '10px', padding: '10px 20px', fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>+ Create</button>
							</div>
							{myWorkouts.length === 0 ? <p style={{ color: 'rgba(185,202,202,0.5)' }}>No workouts yet.</p> : (
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
									{myWorkouts.map((w) => (
										<div key={w._id} onClick={() => router.push({ pathname: '/workout/detail', query: { id: w._id } })} style={cardStyle}
											onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,220,229,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
											onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
											<div style={{ aspectRatio: '16/9', overflow: 'hidden' }}><img src={w.workoutThumbnail ? `${REACT_APP_API_URL}/${w.workoutThumbnail}` : '/img/banner/header1.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
											<div style={{ padding: '14px' }}>
												<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '15px', fontWeight: 600, color: '#e5e2e3', marginBottom: '4px' }}>{w.workoutTitle}</h4>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.45)' }}>{w.workoutDifficulty} · {w.estimatedCaloriesBurned} kcal</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{cat === 'createWorkout' && (
						<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
							<div className="nt-head">
								<div>
									<span className="lp-eyebrow" style={{ marginBottom: '6px' }}>Studio</span>
									<h2>Create Workout</h2>
								</div>
							</div>
							<div className="wd-form-card" style={{ maxWidth: '640px' }}>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
									<div>
										<span style={labelStyle}>Title *</span>
										<input className="wd-input" value={newWorkout.workoutTitle} onChange={(e) => setNewWorkout({ ...newWorkout, workoutTitle: e.target.value })} placeholder="Workout title" />
									</div>
									<div>
										<span style={labelStyle}>Description</span>
										<textarea className="wd-textarea" style={{ marginBottom: 0 }} value={newWorkout.workoutDesc} onChange={(e) => setNewWorkout({ ...newWorkout, workoutDesc: e.target.value })} placeholder="Describe this workout..." />
									</div>
									<div>
										<span style={labelStyle}>Target Muscle *</span>
										<div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
											{['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'].map((m) => {
												const isActive = newWorkout.targetMuscle === m;
												return (
													<button
														key={m}
														className="cl-cat-btn"
														style={isActive ? { borderColor: 'rgba(0,220,229,0.5)', background: 'rgba(0,220,229,0.14)', color: '#00eaf4' } : undefined}
														onClick={() => setNewWorkout({ ...newWorkout, targetMuscle: m })}
													>
														{m}
													</button>
												);
											})}
										</div>
									</div>
									<div>
										<span style={labelStyle}>Difficulty</span>
										<div className="wl-seg">
											{['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((d) => (
												<button key={d} className={newWorkout.workoutDifficulty === d ? 'is-active' : ''} onClick={() => setNewWorkout({ ...newWorkout, workoutDifficulty: d })}>
													{d.charAt(0) + d.slice(1).toLowerCase()}
												</button>
											))}
										</div>
									</div>
									<div style={{ maxWidth: '240px' }}>
										<span style={labelStyle}>Est. Calories Burned</span>
										<input className="wd-input" type="number" value={newWorkout.estimatedCaloriesBurned} onChange={(e) => setNewWorkout({ ...newWorkout, estimatedCaloriesBurned: Number(e.target.value) })} />
									</div>
									<button className="wd-btn" style={{ width: 'fit-content' }} onClick={createWorkoutHandler}>
										Publish Workout →
									</button>
								</div>
							</div>
						</div>
					)}

					{cat === 'myCourses' && (
						<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
							<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '24px' }}>My Programs ({purchasedCourses.length})</h2>
							{purchasedCourses.length === 0 ? <p style={{ color: 'rgba(185,202,202,0.5)' }}>No programs yet. <span onClick={() => router.push('/course')} style={{ color: '#e9feff', cursor: 'pointer', fontWeight: 600 }}>Browse programs →</span></p> : (
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
									{purchasedCourses.map((c) => (
										<div key={c._id} onClick={() => router.push({ pathname: '/course/detail', query: { id: c._id } })} style={cardStyle}
											onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,138,0,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
											onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
											<div style={{ aspectRatio: '16/9', overflow: 'hidden' }}><img src={c.courseThumbnail ? `${REACT_APP_API_URL}/${c.courseThumbnail}` : '/img/banner/header1.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
											<div style={{ padding: '14px' }}>
												<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '15px', fontWeight: 600, color: '#e5e2e3', marginBottom: '4px' }}>{c.courseTitle}</h4>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.45)' }}>{c.courseCategory} · {c.courseDuration}w · {c.courseDifficulty}</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{cat === 'trainerCourses' && (
						<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
								<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3' }}>My Programs ({trainerCourses.length})</h2>
								<button onClick={() => menuHandler('createCourse')} style={{ background: 'linear-gradient(135deg, #ff8a00, #ffb77f)', color: '#3a1800', border: 'none', borderRadius: '10px', padding: '10px 20px', fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>+ Create</button>
							</div>
							{trainerCourses.length === 0 ? <p style={{ color: 'rgba(185,202,202,0.5)' }}>No courses created yet.</p> : (
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
									{trainerCourses.map((c) => (
										<div key={c._id} onClick={() => router.push({ pathname: '/course/detail', query: { id: c._id } })} style={cardStyle}
											onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,138,0,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
											onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
											<div style={{ aspectRatio: '16/9', overflow: 'hidden' }}><img src={c.courseThumbnail ? `${REACT_APP_API_URL}/${c.courseThumbnail}` : '/img/banner/header1.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
											<div style={{ padding: '14px' }}>
												<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '15px', fontWeight: 600, color: '#e5e2e3', marginBottom: '4px' }}>{c.courseTitle}</h4>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.45)' }}>{c.courseCategory} · ${c.coursePrice} · {c.courseRating ? `★ ${c.courseRating.toFixed(1)}` : 'No ratings'}</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{cat === 'createCourse' && (
						<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
							<div className="nt-head">
								<div>
									<span className="lp-eyebrow lp-eyebrow--orange" style={{ marginBottom: '6px' }}>Studio</span>
									<h2>Create Program</h2>
								</div>
							</div>
							<div className="wd-form-card" style={{ maxWidth: '640px' }}>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
									<div>
										<span style={labelStyle}>Title *</span>
										<input className="wd-input" value={newCourse.courseTitle} onChange={(e) => setNewCourse({ ...newCourse, courseTitle: e.target.value })} placeholder="Program title" />
									</div>
									<div>
										<span style={labelStyle}>Description</span>
										<textarea className="wd-textarea" style={{ marginBottom: 0 }} value={newCourse.courseDesc} onChange={(e) => setNewCourse({ ...newCourse, courseDesc: e.target.value })} placeholder="Describe this program..." />
									</div>
									<div>
										<span style={labelStyle}>Category</span>
										<div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
											{[
												{ v: 'STRENGTH', c: '#ff8a00' },
												{ v: 'CARDIO', c: '#00dce5' },
												{ v: 'YOGA', c: '#ddb7ff' },
												{ v: 'MOBILITY', c: '#66daba' },
												{ v: 'NUTRITION', c: '#ffb77f' },
											].map((catOpt) => {
												const isActive = newCourse.courseCategory === catOpt.v;
												return (
													<button
														key={catOpt.v}
														className="cl-cat-btn"
														style={isActive ? { borderColor: `${catOpt.c}80`, background: `${catOpt.c}1c`, color: catOpt.c } : undefined}
														onClick={() => setNewCourse({ ...newCourse, courseCategory: catOpt.v })}
													>
														<span className="cl-cat-dot" style={{ background: catOpt.c }} />
														{catOpt.v.charAt(0) + catOpt.v.slice(1).toLowerCase()}
													</button>
												);
											})}
										</div>
									</div>
									<div>
										<span style={labelStyle}>Difficulty</span>
										<div className="wl-seg">
											{['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((d) => (
												<button key={d} className={newCourse.courseDifficulty === d ? 'is-active' : ''} onClick={() => setNewCourse({ ...newCourse, courseDifficulty: d })}>
													{d.charAt(0) + d.slice(1).toLowerCase()}
												</button>
											))}
										</div>
									</div>
									<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
										<div>
											<span style={labelStyle}>Price ($)</span>
											<input className="wd-input" type="number" value={newCourse.coursePrice} onChange={(e) => setNewCourse({ ...newCourse, coursePrice: Number(e.target.value) })} />
										</div>
										<div>
											<span style={labelStyle}>Duration (weeks)</span>
											<input className="wd-input" type="number" value={newCourse.courseDuration} onChange={(e) => setNewCourse({ ...newCourse, courseDuration: Number(e.target.value) })} />
										</div>
									</div>
									<button
										className="wd-btn"
										style={{ width: 'fit-content', background: 'linear-gradient(135deg, #ff8a00, #ffb77f)', color: '#3a1800' }}
										onClick={createCourseHandler}
									>
										Publish Program →
									</button>
								</div>
							</div>
						</div>
					)}

					{cat === 'myArticles' && <MyArticles />}
					{cat === 'writeArticle' && <WriteArticle />}

					{cat === 'chat' && <ChatContent />}
					{cat === 'nutrition' && <NutritionContent />}
					{cat === 'progress' && <ProgressContent />}
					{cat === 'subscription' && <SubscriptionContent />}

					{cat === 'notifications' && (
						<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
							<div className="nt-head">
								<h2>Notifications</h2>
								<div className="nt-tools">
									{unreadCount > 0 && (
										<span className="nt-unread-chip">
											<span className="nt-unread-dot" />
											{unreadCount} unread
										</span>
									)}
									<div className="wl-seg">
										<button className={notifFilter === 'all' ? 'is-active' : ''} onClick={() => setNotifFilter('all')}>
											All
										</button>
										<button className={notifFilter === 'unread' ? 'is-active' : ''} onClick={() => setNotifFilter('unread')}>
											Unread
										</button>
									</div>
									{unreadCount > 0 && (
										<button className="nt-markall" onClick={markAllNotifsRead}>
											Mark all read
										</button>
									)}
								</div>
							</div>

							{(() => {
								const visible = notifFilter === 'unread' ? notifications.filter((n: any) => !n.isRead) : notifications;
								if (visible.length === 0) {
									return (
										<div className="nt-empty">
											<div className="nt-empty-ic">◉</div>
											<h4>{notifFilter === 'unread' ? 'All caught up' : 'No notifications yet'}</h4>
											<p>{notifFilter === 'unread' ? 'You have read everything.' : 'Activity around your account will appear here.'}</p>
										</div>
									);
								}
								return (
									<div className="nt-list">
										{visible.map((n: any) => {
											const meta = notifTypeMeta[n.notificationType] || notifTypeMeta.SYSTEM;
											return (
												<div
													key={n._id}
													className={`nt-item ${n.isRead ? 'is-read' : 'is-unread'}`}
													style={
														{
															'--ntc': meta.color,
															'--ntc-bg': `${meta.color}14`,
															'--ntc-bd': `${meta.color}30`,
														} as React.CSSProperties
													}
													onClick={() => !n.isRead && markNotifRead(n._id)}
												>
													<span className="nt-ic">{meta.icon}</span>
													<div className="nt-body">
														<h4>{n.notificationTitle}</h4>
														<p>{n.notificationMessage}</p>
													</div>
													<div className="nt-meta">
														<span className="nt-type">{n.notificationType}</span>
														<span className="nt-time">{notifTimeAgo(n.createdAt)}</span>
													</div>
												</div>
											);
										})}
									</div>
								);
							})()}
						</div>
					)}

					{cat === 'becomeTrainer' && (
						<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
							<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '8px' }}>Become a Trainer</h2>
							<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'rgba(185,202,202,0.5)', marginBottom: '24px' }}>Create your trainer profile to start sharing workouts and courses.</p>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
								<div><span style={labelStyle}>Bio *</span><textarea value={trainerForm.trainerBio} onChange={(e) => setTrainerForm({ ...trainerForm, trainerBio: e.target.value })} placeholder="Tell us about your training background..." style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} /></div>
								<div><span style={labelStyle}>Specializations (comma separated)</span><input value={trainerForm.trainerSpecializations} onChange={(e) => setTrainerForm({ ...trainerForm, trainerSpecializations: e.target.value })} placeholder="Strength, HIIT, Mobility" style={inputStyle} /></div>
								<div><span style={labelStyle}>Years of Experience</span><input type="number" value={trainerForm.trainerExperience} onChange={(e) => setTrainerForm({ ...trainerForm, trainerExperience: Number(e.target.value) })} style={inputStyle} /></div>
								<button onClick={becomeTrainerHandler} style={{ background: 'linear-gradient(135deg, #66daba, #00dce5)', color: '#003739', border: 'none', borderRadius: '10px', padding: '14px 32px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer', width: 'fit-content' }}>Apply as Trainer</button>
							</div>
						</div>
					)}

					{cat === 'followers' && <div style={{ animation: 'fadeInUp 0.5s ease both' }}><h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>Followers</h2><p style={{ color: 'rgba(185,202,202,0.5)' }}>Coming soon.</p></div>}
					{cat === 'followings' && <div style={{ animation: 'fadeInUp 0.5s ease both' }}><h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>Following</h2><p style={{ color: 'rgba(185,202,202,0.5)' }}>Coming soon.</p></div>}
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(MyPage);
