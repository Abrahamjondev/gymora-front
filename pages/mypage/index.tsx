import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import { CircularProgress, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyProfile from '../../libs/components/mypage/MyProfile';
import MyArticles from '../../libs/components/mypage/MyArticles';
import WriteArticle from '../../libs/components/mypage/WriteArticle';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getJwtToken, updateUserInfo } from '../../libs/auth';
import { REACT_APP_API_URL, Messages } from '../../libs/config';
import {
	GET_MEMBER_WORKOUTS,
	GET_DASHBOARD_STATS,
	GET_NOTIFICATIONS,
	GET_MEMBER_PURCHASED_COURSES,
	GET_TRAINER_COURSES,
} from '../../apollo/user/query';
import { CREATE_TRAINER, CREATE_WORKOUT, MARK_NOTIFICATION_READ } from '../../apollo/user/mutation';
import { Workout } from '../../libs/types/workout/workout';
import { Course } from '../../libs/types/course/course';
import { T } from '../../libs/types/common';
import { sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const menuItems = [
	{ key: 'dashboard', label: 'Dashboard', icon: '📊' },
	{ key: 'myProfile', label: 'My Profile', icon: '👤' },
	{ key: 'myWorkouts', label: 'My Workouts', icon: '💪', trainerOnly: true },
	{ key: 'createWorkout', label: 'Create Workout', icon: '➕', trainerOnly: true },
	{ key: 'myCourses', label: 'My Courses', icon: '📚' },
	{ key: 'trainerCourses', label: 'Trainer Courses', icon: '🎓', trainerOnly: true },
	{ key: 'myArticles', label: 'My Articles', icon: '📝', trainerOrAdmin: true },
	{ key: 'writeArticle', label: 'Write Article', icon: '✍️', trainerOrAdmin: true },
	{ key: 'notifications', label: 'Notifications', icon: '🔔' },
	{ key: 'chat', label: 'Messages', icon: '💬', isLink: '/chat' },
	{ key: 'nutrition', label: 'Nutrition', icon: '🥗', isLink: '/nutrition' },
	{ key: 'progress', label: 'Progress', icon: '📈', isLink: '/progress' },
	{ key: 'subscription', label: 'Subscription', icon: '💎', isLink: '/subscription' },
	{ key: 'becomeTrainer', label: 'Become Trainer', icon: '🎯', userOnly: true },
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
	const [newWorkout, setNewWorkout] = useState({ workoutTitle: '', workoutDesc: '', workoutDifficulty: 'BEGINNER', targetMuscle: '', estimatedCaloriesBurned: 300, isFree: true });
	const [trainerForm, setTrainerForm] = useState({ trainerBio: '', trainerSpecializations: '', trainerExperience: 1 });

	/** APOLLO **/
	useQuery(GET_MEMBER_WORKOUTS, { fetchPolicy: 'network-only', skip: !user?._id || user?.memberType !== 'TRAINER', onCompleted: (d: T) => setMyWorkouts(d?.getMemberWorkouts ?? []) });
	useQuery(GET_DASHBOARD_STATS, { fetchPolicy: 'cache-and-network', skip: !user?._id, onCompleted: (d: T) => setDashboardStats(d?.getDashboardStats) });
	const { refetch: notifRefetch } = useQuery(GET_NOTIFICATIONS, { fetchPolicy: 'network-only', skip: !user?._id, onCompleted: (d: T) => setNotifications(d?.getNotifications ?? []) });
	useQuery(GET_MEMBER_PURCHASED_COURSES, { fetchPolicy: 'network-only', skip: !user?._id, onCompleted: (d: T) => setPurchasedCourses(d?.getMemberPurchasedCourses ?? []) });
	useQuery(GET_TRAINER_COURSES, { fetchPolicy: 'network-only', skip: !user?._id || user?.memberType !== 'TRAINER', onCompleted: (d: T) => setTrainerCourses(d?.getTrainerCourses ?? []) });

	const [markRead] = useMutation(MARK_NOTIFICATION_READ);
	const [createTrainer] = useMutation(CREATE_TRAINER);
	const [createWorkout] = useMutation(CREATE_WORKOUT);

	/** LIFECYCLES **/
	useEffect(() => {
		if (user._id) return;
		const jwt = getJwtToken();
		if (jwt) { updateUserInfo(jwt); return; }
		router.push('/').then();
	}, [user._id, router]);

	/** HANDLERS **/
	const menuHandler = (key: string, isLink?: string) => {
		if (isLink) router.push(isLink);
		else router.push({ pathname: '/mypage', query: { category: key } }, undefined, { shallow: true });
	};

	const markNotifRead = async (id: string) => {
		await markRead({ variables: { input: id } });
		await notifRefetch();
	};

	const createWorkoutHandler = async () => {
		try {
			if (!newWorkout.workoutTitle || !newWorkout.targetMuscle) throw new Error('Title and target muscle required');
			await createWorkout({ variables: { input: { ...newWorkout, estimatedCaloriesBurned: Number(newWorkout.estimatedCaloriesBurned) } } });
			setNewWorkout({ workoutTitle: '', workoutDesc: '', workoutDifficulty: 'BEGINNER', targetMuscle: '', estimatedCaloriesBurned: 300, isFree: true });
			await sweetMixinSuccessAlert('Workout created!');
			router.push({ pathname: '/mypage', query: { category: 'myWorkouts' } }, undefined, { shallow: true });
		} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
	};

	const becomeTrainerHandler = async () => {
		try {
			if (!trainerForm.trainerBio) throw new Error('Bio is required');
			await createTrainer({ variables: { input: { trainerBio: trainerForm.trainerBio, trainerSpecializations: trainerForm.trainerSpecializations.split(',').map((s: string) => s.trim()).filter(Boolean), trainerExperience: Number(trainerForm.trainerExperience) } } });
			await sweetMixinSuccessAlert('Trainer profile created! Please re-login.');
		} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
	};

	const inputStyle = { padding: '12px', background: '#201f20', border: '1px solid #3a494a', borderRadius: '8px', color: '#e5e2e3', fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', outline: 'none', width: '100%' };

	if (device === 'mobile') return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>GYMORA MY PAGE MOBILE</div>;

	return (
		<div style={{ background: '#131314', minHeight: '100vh', padding: '40px 0' }}>
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px' }}>
				{/* Sidebar */}
				<div>
					<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '20px' }}>
						<div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 12px', border: '2px solid #3a494a' }}>
							<img src={user?.memberImage ? `${REACT_APP_API_URL}/${user.memberImage}` : '/img/profile/defaultUser.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
						</div>
						<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '18px', fontWeight: 700, color: '#e5e2e3', marginBottom: '4px' }}>{user?.memberFullName || user?.memberNick || 'User'}</h3>
						<p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#00dce5', textTransform: 'uppercase' }}>{user?.memberType || 'USER'}</p>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
						{menuItems
							.filter((item) => {
								if ((item as any).trainerOnly) return user?.memberType === 'TRAINER';
								if ((item as any).trainerOrAdmin) return user?.memberType === 'TRAINER' || user?.memberType === 'ADMIN';
								if ((item as any).userOnly) return user?.memberType === 'USER';
								return true;
							})
							.map((item) => (
								<button key={item.key} onClick={() => menuHandler(item.key, (item as any).isLink)} style={{ padding: '12px 16px', borderRadius: '8px', border: 'none', textAlign: 'left', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: category === item.key ? 700 : 400, cursor: 'pointer', background: category === item.key ? 'rgba(0,220,229,0.1)' : 'transparent', color: category === item.key ? '#e9feff' : '#849495', borderLeft: category === item.key ? '3px solid #00dce5' : '3px solid transparent', display: 'flex', alignItems: 'center', gap: '10px' }}>
									<span>{item.icon}</span> {item.label}
								</button>
							))}
					</div>
				</div>

				{/* Content */}
				<div>
					{/* Dashboard */}
					{category === 'dashboard' && (
						<div>
							<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 800, color: '#e5e2e3', marginBottom: '24px' }}>Welcome back, {user?.memberNick}!</h2>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
								{[
									{ label: 'Total Calories', value: dashboardStats?.totalCalories ? Math.round(dashboardStats.totalCalories) : 0, color: '#ff8a00' },
									{ label: 'Workouts', value: dashboardStats?.workoutCount ?? user?.memberWorkouts ?? 0, color: '#00dce5' },
									{ label: 'Progress Entries', value: dashboardStats?.progressEntries ?? 0, color: '#66daba' },
									{ label: 'Courses', value: user?.memberCourses ?? 0, color: '#ddb7ff' },
								].map((s) => (
									<div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>{s.label}</span>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '32px', fontWeight: 800, color: s.color }}>{s.value}</span>
									</div>
								))}
							</div>
							{dashboardStats?.subscriptionSummary && (
								<div style={{ background: 'rgba(0,220,229,0.05)', border: '1px solid rgba(0,220,229,0.2)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#e9feff' }}>{dashboardStats.subscriptionSummary}</span>
								</div>
							)}
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
								<button onClick={() => menuHandler('nutrition', '/nutrition')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', cursor: 'pointer', textAlign: 'left' }}>
									<span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🥗</span>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3' }}>Nutrition Dashboard</span>
								</button>
								<button onClick={() => menuHandler('progress', '/progress')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', cursor: 'pointer', textAlign: 'left' }}>
									<span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>📈</span>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3' }}>Progress Tracker</span>
								</button>
							</div>
						</div>
					)}

					{category === 'myProfile' && <MyProfile />}

					{/* My Workouts */}
					{category === 'myWorkouts' && (
						<div>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
								<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3' }}>My Workouts ({myWorkouts.length})</h2>
								<button onClick={() => menuHandler('createWorkout')} style={{ background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>+ Create</button>
							</div>
							{myWorkouts.length === 0 ? <p style={{ color: '#849495' }}>No workouts yet.</p> : (
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
									{myWorkouts.map((w) => (
										<div key={w._id} onClick={() => router.push({ pathname: '/workout/detail', query: { id: w._id } })} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
											<div style={{ aspectRatio: '16/9', overflow: 'hidden' }}><img src={w.workoutThumbnail ? `${REACT_APP_API_URL}/${w.workoutThumbnail}` : '/img/banner/header1.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
											<div style={{ padding: '16px' }}>
												<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3' }}>{w.workoutTitle}</h4>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495' }}>{w.workoutDifficulty} • {w.estimatedCaloriesBurned} cal • {w.isFree ? 'FREE' : 'PREMIUM'}</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Create Workout */}
					{category === 'createWorkout' && (
						<div>
							<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '24px' }}>Create Workout</h2>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
								<div><span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Title *</span><input value={newWorkout.workoutTitle} onChange={(e) => setNewWorkout({ ...newWorkout, workoutTitle: e.target.value })} placeholder="Workout title" style={inputStyle} /></div>
								<div><span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Description</span><textarea value={newWorkout.workoutDesc} onChange={(e) => setNewWorkout({ ...newWorkout, workoutDesc: e.target.value })} placeholder="Describe this workout..." style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} /></div>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
									<div><span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Target Muscle *</span><input value={newWorkout.targetMuscle} onChange={(e) => setNewWorkout({ ...newWorkout, targetMuscle: e.target.value })} placeholder="e.g. Chest, Legs" style={inputStyle} /></div>
									<div><span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Difficulty</span><select value={newWorkout.workoutDifficulty} onChange={(e) => setNewWorkout({ ...newWorkout, workoutDifficulty: e.target.value })} style={inputStyle}><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select></div>
								</div>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
									<div><span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Est. Calories</span><input type="number" value={newWorkout.estimatedCaloriesBurned} onChange={(e) => setNewWorkout({ ...newWorkout, estimatedCaloriesBurned: Number(e.target.value) })} style={inputStyle} /></div>
									<div><span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Access</span>
										<div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
											{[true, false].map((v) => (<button key={String(v)} onClick={() => setNewWorkout({ ...newWorkout, isFree: v })} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: newWorkout.isFree === v ? '2px solid #00dce5' : '1px solid #3a494a', background: newWorkout.isFree === v ? 'rgba(0,220,229,0.1)' : 'transparent', color: newWorkout.isFree === v ? '#e9feff' : '#849495', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>{v ? '🆓 Free' : '💎 Premium'}</button>))}
										</div>
									</div>
								</div>
								<button onClick={createWorkoutHandler} style={{ background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px', padding: '14px 32px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer', width: 'fit-content' }}>Create Workout</button>
							</div>
						</div>
					)}

					{/* My Purchased Courses */}
					{category === 'myCourses' && (
						<div>
							<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '24px' }}>My Courses ({purchasedCourses.length})</h2>
							{purchasedCourses.length === 0 ? <p style={{ color: '#849495' }}>No purchased courses yet. <span onClick={() => router.push('/course')} style={{ color: '#e9feff', cursor: 'pointer', fontWeight: 600 }}>Browse courses →</span></p> : (
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
									{purchasedCourses.map((c) => (
										<div key={c._id} onClick={() => router.push({ pathname: '/course/detail', query: { id: c._id } })} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
											<div style={{ aspectRatio: '16/9', overflow: 'hidden' }}><img src={c.courseThumbnail ? `${REACT_APP_API_URL}/${c.courseThumbnail}` : '/img/banner/header1.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
											<div style={{ padding: '16px' }}>
												<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3' }}>{c.courseTitle}</h4>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495' }}>{c.courseCategory} • {c.courseDuration}w • {c.courseDifficulty}</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Trainer Courses */}
					{category === 'trainerCourses' && (
						<div>
							<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '24px' }}>My Created Courses ({trainerCourses.length})</h2>
							{trainerCourses.length === 0 ? <p style={{ color: '#849495' }}>No courses created yet.</p> : (
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
									{trainerCourses.map((c) => (
										<div key={c._id} onClick={() => router.push({ pathname: '/course/detail', query: { id: c._id } })} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
											<div style={{ aspectRatio: '16/9', overflow: 'hidden' }}><img src={c.courseThumbnail ? `${REACT_APP_API_URL}/${c.courseThumbnail}` : '/img/banner/header1.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
											<div style={{ padding: '16px' }}>
												<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3' }}>{c.courseTitle}</h4>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495' }}>{c.courseCategory} • ${c.coursePrice} • ★ {c.courseRating?.toFixed(1) ?? '-'}</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{category === 'myArticles' && <MyArticles />}
					{category === 'writeArticle' && <WriteArticle />}

					{/* Notifications */}
					{category === 'notifications' && (
						<div>
							<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '24px' }}>Notifications</h2>
							{notifications.length === 0 ? <p style={{ color: '#849495' }}>No notifications.</p> : (
								<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
									{notifications.map((n: any) => (
										<div key={n._id} onClick={() => !n.isRead && markNotifRead(n._id)} style={{ background: n.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(0,220,229,0.05)', border: `1px solid ${n.isRead ? 'rgba(255,255,255,0.08)' : 'rgba(0,220,229,0.2)'}`, borderRadius: '12px', padding: '20px', cursor: n.isRead ? 'default' : 'pointer' }}>
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00dce5', textTransform: 'uppercase' }}>{n.notificationType}</span>
												<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
											</div>
											<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3', marginBottom: '4px' }}>{n.notificationTitle}</h4>
											<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#b9caca' }}>{n.notificationMessage}</p>
											{!n.isRead && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00dce5', marginTop: '8px', display: 'block' }}>Click to mark as read</span>}
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Become Trainer */}
					{category === 'becomeTrainer' && (
						<div>
							<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '8px' }}>Become a Trainer</h2>
							<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#849495', marginBottom: '24px' }}>Fill in your details to apply as a Gymora trainer. After approval, you can create workouts and courses.</p>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
								<div><span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Bio *</span><textarea value={trainerForm.trainerBio} onChange={(e) => setTrainerForm({ ...trainerForm, trainerBio: e.target.value })} placeholder="Tell us about your training background..." style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} /></div>
								<div><span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Specializations (comma separated)</span><input value={trainerForm.trainerSpecializations} onChange={(e) => setTrainerForm({ ...trainerForm, trainerSpecializations: e.target.value })} placeholder="Strength, HIIT, Mobility" style={inputStyle} /></div>
								<div><span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Years of Experience</span><input type="number" value={trainerForm.trainerExperience} onChange={(e) => setTrainerForm({ ...trainerForm, trainerExperience: Number(e.target.value) })} style={inputStyle} /></div>
								<button onClick={becomeTrainerHandler} style={{ background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px', padding: '14px 32px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer', width: 'fit-content' }}>Apply as Trainer</button>
							</div>
						</div>
					)}

					{category === 'followers' && <div><h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>Followers</h2><p style={{ color: '#849495' }}>Coming soon.</p></div>}
					{category === 'followings' && <div><h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>Following</h2><p style={{ color: '#849495' }}>Coming soon.</p></div>}
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(MyPage);
