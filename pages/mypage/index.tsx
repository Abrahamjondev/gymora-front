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
} from '../../apollo/user/query';
import { CREATE_TRAINER, CREATE_WORKOUT, CREATE_COURSE, MARK_NOTIFICATION_READ } from '../../apollo/user/mutation';
import { Workout } from '../../libs/types/workout/workout';
import { Course } from '../../libs/types/course/course';
import { T } from '../../libs/types/common';
import { sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const menuSections: { title: string | null; items: { key: string; label: string; icon: string; trainerOnly?: boolean; trainerOrAdmin?: boolean; userOnly?: boolean }[] }[] = [
	{
		title: null,
		items: [
			{ key: 'dashboard', label: 'Dashboard', icon: '◫' },
			{ key: 'myProfile', label: 'My Profile', icon: '○' },
		],
	},
	{
		title: 'Content',
		items: [
			{ key: 'myWorkouts', label: 'My Workouts', icon: '◈', trainerOnly: true },
			{ key: 'createWorkout', label: 'Create Workout', icon: '＋', trainerOnly: true },
			{ key: 'myCourses', label: 'My Courses', icon: '▦' },
			{ key: 'trainerCourses', label: 'Trainer Courses', icon: '◧', trainerOnly: true },
			{ key: 'createCourse', label: 'Create Course', icon: '＋', trainerOnly: true },
			{ key: 'myArticles', label: 'My Articles', icon: '▤', trainerOrAdmin: true },
			{ key: 'writeArticle', label: 'Write Article', icon: '✎', trainerOrAdmin: true },
		],
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
			{ key: 'nutrition', label: 'Nutrition', icon: '◑' },
			{ key: 'progress', label: 'Progress', icon: '△' },
		],
	},
	{
		title: null,
		items: [
			{ key: 'subscription', label: 'Subscription', icon: '◇' },
			{ key: 'becomeTrainer', label: 'Become Trainer', icon: '→', userOnly: true },
		],
	},
];

const MyPage: NextPage = () => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const router = useRouter();
	const category: string = (router.query?.category as string) ?? 'dashboard';

	const [myWorkouts, setMyWorkouts] = useState<Workout[]>([]);
	const [dashboardStats, setDashboardStats] = useState<any>(null);
	const [notifications, setNotifications] = useState<any[]>([]);
	const [purchasedCourses, setPurchasedCourses] = useState<Course[]>([]);
	const [trainerCourses, setTrainerCourses] = useState<Course[]>([]);
	const [recommendations, setRecommendations] = useState<any[]>([]);
	const [newWorkout, setNewWorkout] = useState({ workoutTitle: '', workoutDesc: '', workoutDifficulty: 'BEGINNER', targetMuscle: '', estimatedCaloriesBurned: 300 });
	const [newCourse, setNewCourse] = useState({ courseTitle: '', courseDesc: '', courseDifficulty: 'BEGINNER', courseCategory: 'STRENGTH', coursePrice: 0, courseDuration: 4 });
	const [trainerForm, setTrainerForm] = useState({ trainerBio: '', trainerSpecializations: '', trainerExperience: 1 });

	/** APOLLO **/
	useQuery(GET_MEMBER_WORKOUTS, { fetchPolicy: 'network-only', skip: !user?._id || user?.memberType !== 'TRAINER', onCompleted: (d: T) => setMyWorkouts(d?.getMemberWorkouts ?? []) });
	useQuery(GET_DASHBOARD_STATS, { fetchPolicy: 'cache-and-network', skip: !user?._id, onCompleted: (d: T) => setDashboardStats(d?.getDashboardStats) });
	const { refetch: notifRefetch } = useQuery(GET_NOTIFICATIONS, { fetchPolicy: 'network-only', skip: !user?._id, onCompleted: (d: T) => setNotifications(d?.getNotifications ?? []) });
	useQuery(GET_MEMBER_PURCHASED_COURSES, { fetchPolicy: 'network-only', skip: !user?._id, onCompleted: (d: T) => setPurchasedCourses(d?.getMemberPurchasedCourses ?? []) });
	useQuery(GET_TRAINER_COURSES, { fetchPolicy: 'network-only', skip: !user?._id || user?.memberType !== 'TRAINER', onCompleted: (d: T) => setTrainerCourses(d?.getTrainerCourses ?? []) });
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
			<div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
				{/* Sidebar */}
				<div style={{ position: 'sticky', top: '24px', alignSelf: 'start' }}>
					<div style={{
						background: 'linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)',
						border: '1px solid rgba(255,255,255,0.06)',
						borderRadius: '16px', padding: '0', overflow: 'hidden',
						backdropFilter: 'blur(20px)',
					}}>
						{/* Profile card */}
						<div style={{
							padding: '28px 20px 20px',
							background: 'linear-gradient(135deg, rgba(0,220,229,0.06) 0%, rgba(0,220,229,0.01) 100%)',
							borderBottom: '1px solid rgba(255,255,255,0.05)',
							textAlign: 'center',
						}}>
							<div style={{
								width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden',
								margin: '0 auto 14px',
								border: '2px solid rgba(0,220,229,0.25)',
								boxShadow: '0 0 20px rgba(0,220,229,0.1)',
							}}>
								<img src={user?.memberImage ? `${REACT_APP_API_URL}/${user.memberImage}` : '/img/profile/defaultUser.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
							</div>
							<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '15px', fontWeight: 700, color: '#e9feff', marginBottom: '6px', letterSpacing: '-0.01em' }}>
								{user?.memberFullName || user?.memberNick || 'User'}
							</h3>
							<span style={{
								fontFamily: 'JetBrains Mono', fontSize: '9px',
								color: '#003739', textTransform: 'uppercase', letterSpacing: '0.08em',
								background: 'linear-gradient(135deg, #00dce5, #66daba)',
								padding: '3px 10px', borderRadius: '4px', fontWeight: 700,
							}}>
								{user?.memberType || 'USER'}
							</span>
						</div>

						{/* Nav sections */}
						<nav style={{ padding: '8px 8px 12px' }}>
							{menuSections.map((section, sIdx) => {
								const visibleItems = section.items.filter((item) => {
									if ((item as any).trainerOnly) return user?.memberType === 'TRAINER';
									if ((item as any).trainerOrAdmin) return user?.memberType === 'TRAINER' || user?.memberType === 'ADMIN';
									if ((item as any).userOnly) return user?.memberType === 'USER';
									return true;
								});
								if (visibleItems.length === 0) return null;

								return (
									<div key={sIdx}>
										{section.title && (
											<div style={{
												fontFamily: 'JetBrains Mono', fontSize: '9px', fontWeight: 600,
												color: '#c8d6d6', textTransform: 'uppercase',
												letterSpacing: '0.1em', padding: '14px 12px 6px',
											}}>
												{section.title}
											</div>
										)}
										{!section.title && sIdx > 0 && (
											<div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '8px 12px' }} />
										)}
										{visibleItems.map((item) => {
											const isActive = category === item.key;
											const isBecomeTrainer = item.key === 'becomeTrainer';
											return (
												<button key={item.key} onClick={() => menuHandler(item.key)} style={{
													width: '100%', padding: '9px 12px', borderRadius: '10px',
													border: 'none', textAlign: 'left',
													fontFamily: 'Hanken Grotesk', fontSize: '13px',
													fontWeight: isActive ? 600 : 500,
													cursor: 'pointer',
													transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
													background: isActive
														? 'linear-gradient(135deg, rgba(0,220,229,0.12), rgba(0,220,229,0.04))'
														: isBecomeTrainer
															? 'rgba(102,218,186,0.08)'
															: 'transparent',
													color: isActive ? '#e9feff'
														: isBecomeTrainer ? '#7ae8c8'
														: '#c8d6d6',
													display: 'flex', alignItems: 'center', gap: '10px',
													position: 'relative',
													boxShadow: isActive ? '0 2px 8px rgba(0,220,229,0.08)' : 'none',
												}}>
													<span style={{
														width: '24px', height: '24px',
														display: 'flex', alignItems: 'center', justifyContent: 'center',
														fontSize: '13px',
														borderRadius: '7px',
														background: isActive ? 'rgba(0,220,229,0.15)' : 'rgba(255,255,255,0.06)',
														color: isActive ? '#00dce5'
															: isBecomeTrainer ? '#7ae8c8'
															: '#9aabab',
														transition: 'all 0.25s ease',
														flexShrink: 0,
													}}>
														{item.icon}
													</span>
													<span style={{ flex: 1 }}>{item.label}</span>
													{item.key === 'notifications' && unreadCount > 0 && (
														<span style={{
															background: 'linear-gradient(135deg, #00dce5, #66daba)',
															color: '#003739', fontSize: '9px', fontWeight: 700,
															padding: '2px 7px', borderRadius: '9999px',
															fontFamily: 'JetBrains Mono',
															boxShadow: '0 0 8px rgba(0,220,229,0.3)',
														}}>
															{unreadCount}
														</span>
													)}
													{isActive && (
														<div style={{
															position: 'absolute', left: '0', top: '50%',
															transform: 'translateY(-50%)',
															width: '3px', height: '16px',
															background: '#00dce5', borderRadius: '0 3px 3px 0',
														}} />
													)}
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
					{category === 'dashboard' && (
						<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
							<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 800, color: '#ffffff', marginBottom: '24px' }}>Welcome back, {user?.memberNick}</h2>

							{/* Stats */}
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
								{[
									{ label: 'Total Calories', value: dashboardStats?.totalCalories ? Math.round(dashboardStats.totalCalories) : 0, color: '#ff8a00' },
									{ label: 'Workouts', value: dashboardStats?.workoutCount ?? user?.memberWorkouts ?? 0, color: '#00dce5' },
									{ label: 'Progress', value: dashboardStats?.progressEntries ?? 0, color: '#66daba' },
									{ label: 'Courses', value: user?.memberCourses ?? 0, color: '#ddb7ff' },
								].map((s) => (
									<div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
										<span style={labelStyle}>{s.label}</span>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 800, color: s.color, display: 'block', marginTop: '4px' }}>{s.value}</span>
									</div>
								))}
							</div>

							{/* Recommendations */}
							{recommendations.length > 0 && (
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

							{/* Subscription summary */}
							{dashboardStats?.subscriptionSummary && (
								<div style={{ background: 'rgba(255,138,0,0.04)', border: '1px solid rgba(255,138,0,0.12)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'rgba(255,183,127,0.9)' }}>{dashboardStats.subscriptionSummary}</span>
								</div>
							)}

							{/* Quick actions */}
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
								{[
									{ label: 'Nutrition', desc: 'Track meals & macros', link: '/nutrition' },
									{ label: 'Progress', desc: 'Log body metrics', link: '/progress' },
									{ label: 'Community', desc: 'Read & write articles', link: '/community' },
								].map((action) => (
									<button key={action.label} onClick={() => router.push(action.link)} style={{ ...cardStyle, padding: '20px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)' }}
										onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,220,229,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
										onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '15px', fontWeight: 600, color: '#e5e2e3', display: 'block', marginBottom: '4px' }}>{action.label}</span>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: 'rgba(185,202,202,0.5)' }}>{action.desc}</span>
									</button>
								))}
							</div>
						</div>
					)}

					{category === 'myProfile' && <MyProfile />}

					{category === 'myWorkouts' && (
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

					{category === 'createWorkout' && (
						<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
							<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '24px' }}>Create Workout</h2>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
								<div><span style={labelStyle}>Title *</span><input value={newWorkout.workoutTitle} onChange={(e) => setNewWorkout({ ...newWorkout, workoutTitle: e.target.value })} placeholder="Workout title" style={inputStyle} /></div>
								<div><span style={labelStyle}>Description</span><textarea value={newWorkout.workoutDesc} onChange={(e) => setNewWorkout({ ...newWorkout, workoutDesc: e.target.value })} placeholder="Describe this workout..." style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} /></div>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
									<div><span style={labelStyle}>Target Muscle *</span><input value={newWorkout.targetMuscle} onChange={(e) => setNewWorkout({ ...newWorkout, targetMuscle: e.target.value })} placeholder="e.g. Chest, Legs" style={inputStyle} /></div>
									<div><span style={labelStyle}>Difficulty</span><select value={newWorkout.workoutDifficulty} onChange={(e) => setNewWorkout({ ...newWorkout, workoutDifficulty: e.target.value })} style={inputStyle}><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select></div>
								</div>
								<div><span style={labelStyle}>Est. Calories Burned</span><input type="number" value={newWorkout.estimatedCaloriesBurned} onChange={(e) => setNewWorkout({ ...newWorkout, estimatedCaloriesBurned: Number(e.target.value) })} style={inputStyle} /></div>
								<button onClick={createWorkoutHandler} style={{ background: 'linear-gradient(135deg, #00dce5, #e9feff)', color: '#003739', border: 'none', borderRadius: '10px', padding: '14px 32px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer', width: 'fit-content' }}>Create Workout</button>
							</div>
						</div>
					)}

					{category === 'myCourses' && (
						<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
							<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '24px' }}>My Courses ({purchasedCourses.length})</h2>
							{purchasedCourses.length === 0 ? <p style={{ color: 'rgba(185,202,202,0.5)' }}>No courses yet. <span onClick={() => router.push('/course')} style={{ color: '#e9feff', cursor: 'pointer', fontWeight: 600 }}>Browse courses →</span></p> : (
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

					{category === 'trainerCourses' && (
						<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
								<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3' }}>Trainer Courses ({trainerCourses.length})</h2>
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

					{category === 'createCourse' && (
						<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
							<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '24px' }}>Create Course</h2>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
								<div><span style={labelStyle}>Title *</span><input value={newCourse.courseTitle} onChange={(e) => setNewCourse({ ...newCourse, courseTitle: e.target.value })} placeholder="Course title" style={inputStyle} /></div>
								<div><span style={labelStyle}>Description</span><textarea value={newCourse.courseDesc} onChange={(e) => setNewCourse({ ...newCourse, courseDesc: e.target.value })} placeholder="Describe this course..." style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} /></div>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
									<div><span style={labelStyle}>Category</span><select value={newCourse.courseCategory} onChange={(e) => setNewCourse({ ...newCourse, courseCategory: e.target.value })} style={inputStyle}><option value="STRENGTH">Strength</option><option value="CARDIO">Cardio</option><option value="YOGA">Yoga</option><option value="MOBILITY">Mobility</option><option value="NUTRITION">Nutrition</option></select></div>
									<div><span style={labelStyle}>Difficulty</span><select value={newCourse.courseDifficulty} onChange={(e) => setNewCourse({ ...newCourse, courseDifficulty: e.target.value })} style={inputStyle}><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select></div>
								</div>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
									<div><span style={labelStyle}>Price ($)</span><input type="number" value={newCourse.coursePrice} onChange={(e) => setNewCourse({ ...newCourse, coursePrice: Number(e.target.value) })} style={inputStyle} /></div>
									<div><span style={labelStyle}>Duration (weeks)</span><input type="number" value={newCourse.courseDuration} onChange={(e) => setNewCourse({ ...newCourse, courseDuration: Number(e.target.value) })} style={inputStyle} /></div>
								</div>
								<button onClick={createCourseHandler} style={{ background: 'linear-gradient(135deg, #ff8a00, #ffb77f)', color: '#3a1800', border: 'none', borderRadius: '10px', padding: '14px 32px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer', width: 'fit-content' }}>Create Course</button>
							</div>
						</div>
					)}

					{category === 'myArticles' && <MyArticles />}
					{category === 'writeArticle' && <WriteArticle />}

					{category === 'chat' && <ChatContent />}
					{category === 'nutrition' && <NutritionContent />}
					{category === 'progress' && <ProgressContent />}
					{category === 'subscription' && <SubscriptionContent />}

					{category === 'notifications' && (
						<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
								<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3' }}>Notifications</h2>
								{unreadCount > 0 && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'rgba(0,220,229,0.7)' }}>{unreadCount} unread</span>}
							</div>
							{notifications.length === 0 ? <p style={{ color: 'rgba(185,202,202,0.5)' }}>No notifications.</p> : (
								<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
									{notifications.map((n: any) => (
										<div key={n._id} onClick={() => !n.isRead && markNotifRead(n._id)} style={{ background: n.isRead ? 'rgba(255,255,255,0.015)' : 'rgba(0,220,229,0.03)', border: `1px solid ${n.isRead ? 'rgba(255,255,255,0.04)' : 'rgba(0,220,229,0.12)'}`, borderRadius: '12px', padding: '18px', cursor: n.isRead ? 'default' : 'pointer', transition: 'all 0.2s ease' }}>
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: n.isRead ? 'rgba(185,202,202,0.3)' : '#00dce5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{n.notificationType}</span>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.3)' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
											</div>
											<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '15px', fontWeight: 600, color: n.isRead ? 'rgba(229,226,227,0.6)' : '#e5e2e3', marginBottom: '4px' }}>{n.notificationTitle}</h4>
											<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: 'rgba(185,202,202,0.5)', lineHeight: '1.4' }}>{n.notificationMessage}</p>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{category === 'becomeTrainer' && (
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

					{category === 'followers' && <div style={{ animation: 'fadeInUp 0.5s ease both' }}><h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>Followers</h2><p style={{ color: 'rgba(185,202,202,0.5)' }}>Coming soon.</p></div>}
					{category === 'followings' && <div style={{ animation: 'fadeInUp 0.5s ease both' }}><h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>Following</h2><p style={{ color: 'rgba(185,202,202,0.5)' }}>Coming soon.</p></div>}
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(MyPage);
