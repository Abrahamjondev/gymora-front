import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Stack, Pagination } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Workout } from '../../libs/types/workout/workout';
import { WorkoutsInquiry } from '../../libs/types/workout/workout.input';
import { WorkoutDifficulty } from '../../libs/enums/workout.enum';
import { Direction } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_WORKOUTS } from '../../apollo/user/query';
import { LIKE_WORKOUT } from '../../apollo/user/mutation';
import { REACT_APP_API_URL, Messages } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const WorkoutList: NextPage = ({ initialInput, ...props }: T) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [workouts, setWorkouts] = useState<Workout[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchFilter, setSearchFilter] = useState<WorkoutsInquiry>({
		page: 1,
		limit: 9,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: {},
	});
	const [activeFilter, setActiveFilter] = useState<string>('ALL');

	/** APOLLO REQUESTS **/
	const {
		loading,
		data,
		error,
		refetch,
	} = useQuery(GET_WORKOUTS, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setWorkouts(data?.getWorkouts?.list ?? []);
			setTotal(data?.getWorkouts?.metaCounter?.[0]?.total ?? 0);
		},
	});

	const [likeWorkoutMutation] = useMutation(LIKE_WORKOUT);

	/** HANDLERS **/
	const likeHandler = async (e: any, id: string) => {
		try {
			e.stopPropagation();
			if (!user?._id) throw new Error(Messages.error2);
			await likeWorkoutMutation({ variables: { input: id } });
			const { data } = await refetch({ input: searchFilter });
			if (data?.getWorkouts?.list) {
				setWorkouts(data.getWorkouts.list);
				setTotal(data.getWorkouts.metaCounter?.[0]?.total ?? 0);
			}
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const filterHandler = (difficulty: string) => {
		setActiveFilter(difficulty);
		if (difficulty === 'ALL') {
			setSearchFilter({ ...searchFilter, page: 1, search: {} });
		} else {
			setSearchFilter({
				...searchFilter,
				page: 1,
				search: { workoutDifficulty: difficulty as WorkoutDifficulty },
			});
		}
	};

	const paginationHandler = (e: any, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const pushDetailHandler = (workoutId: string) => {
		router.push({ pathname: '/workout/detail', query: { id: workoutId } });
	};

	const filters = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

	if (device === 'mobile') {
		return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>GYMORA WORKOUTS MOBILE</div>;
	}

	return (
		<div style={{ background: '#131314', minHeight: '100vh', padding: '40px 0' }}>
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
				{/* Header */}
				<div style={{ marginBottom: '40px' }}>
					<span
						style={{
							fontFamily: 'JetBrains Mono, monospace',
							fontSize: '11px',
							letterSpacing: '0.2em',
							color: '#ff8a00',
							fontWeight: 500,
							textTransform: 'uppercase',
							display: 'block',
							marginBottom: '8px',
						}}
					>
						Performance Protocol
					</span>
					<h2
						style={{
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontSize: '40px',
							lineHeight: '48px',
							letterSpacing: '-0.02em',
							fontWeight: 800,
							color: '#e9feff',
						}}
					>
						Workout Library
					</h2>
					<p
						style={{
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontSize: '16px',
							lineHeight: '24px',
							color: '#b9caca',
							maxWidth: '560px',
							marginTop: '16px',
						}}
					>
						Precision-engineered routines designed for elite athletes and performance-driven individuals.
					</p>
				</div>

				{/* Filters */}
				<div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
					{filters.map((f) => (
						<button
							key={f}
							onClick={() => filterHandler(f)}
							style={{
								padding: '8px 24px',
								borderRadius: '9999px',
								fontFamily: 'Hanken Grotesk, sans-serif',
								fontSize: '14px',
								fontWeight: activeFilter === f ? 700 : 400,
								cursor: 'pointer',
								transition: 'all 0.2s',
								border: activeFilter === f ? 'none' : '1px solid #3a494a',
								background: activeFilter === f ? '#e9feff' : '#353436',
								color: activeFilter === f ? '#003739' : '#b9caca',
							}}
						>
							{f === 'ALL' ? 'All Workouts' : f.charAt(0) + f.slice(1).toLowerCase()}
						</button>
					))}
				</div>

				{/* Workout Grid */}
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
					{loading && !workouts.length
						? [1, 2, 3, 4, 5, 6].map((i) => (
								<div
									key={i}
									style={{
										background: 'rgba(255,255,255,0.03)',
										border: '1px solid rgba(255,255,255,0.08)',
										borderRadius: '12px',
										overflow: 'hidden',
									}}
								>
									<div style={{ aspectRatio: '16/9', background: '#2a2a2b' }} />
									<div style={{ padding: '20px' }}>
										<div style={{ height: '20px', background: '#2a2a2b', borderRadius: '4px', marginBottom: '12px' }} />
										<div style={{ height: '14px', background: '#1c1b1c', borderRadius: '4px', width: '60%' }} />
									</div>
								</div>
						  ))
						: workouts.map((workout) => (
								<div
									key={workout._id}
									onClick={() => pushDetailHandler(workout._id)}
									style={{
										background: 'rgba(255,255,255,0.03)',
										border: '1px solid rgba(255,255,255,0.08)',
										borderRadius: '12px',
										overflow: 'hidden',
										cursor: 'pointer',
										transition: 'all 0.3s',
									}}
									onMouseOver={(e) => {
										(e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
										(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,220,229,0.3)';
									}}
									onMouseOut={(e) => {
										(e.currentTarget as HTMLElement).style.transform = 'scale(1)';
										(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
									}}
								>
									{/* Image */}
									<div style={{ position: 'relative', aspectRatio: '16/9' }}>
										<img
											src={
												workout.workoutThumbnail
													? `${REACT_APP_API_URL}/${workout.workoutThumbnail}`
													: '/img/banner/header1.svg'
											}
											alt={workout.workoutTitle}
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
										/>
										<div
											style={{
												position: 'absolute',
												inset: 0,
												background: 'linear-gradient(to top, rgba(19,19,20,0.8), transparent)',
											}}
										/>
										<div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px' }}>
											<span
												style={{
													padding: '2px 8px',
													background: 'rgba(0,0,0,0.6)',
													backdropFilter: 'blur(8px)',
													borderRadius: '4px',
													border: '1px solid rgba(255,255,255,0.1)',
													fontFamily: 'JetBrains Mono, monospace',
													fontSize: '10px',
													color: '#ff8a00',
													textTransform: 'uppercase',
												}}
											>
												{workout.targetMuscle || workout.workoutDifficulty}
											</span>
										</div>
									</div>

									{/* Info */}
									<div style={{ padding: '20px' }}>
										<h3
											style={{
												fontFamily: 'Hanken Grotesk, sans-serif',
												fontSize: '20px',
												lineHeight: '28px',
												fontWeight: 600,
												color: '#e9feff',
											}}
										>
											{workout.workoutTitle}
										</h3>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '16px',
												marginTop: '8px',
												color: '#b9caca',
											}}
										>
											<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 500 }}>
												🔥 {workout.estimatedCaloriesBurned} KCAL
											</span>
											<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 500 }}>
												{workout.isFree ? '🆓 FREE' : '💎 PREMIUM'}
											</span>
										</div>
										<div
											style={{
												marginTop: '16px',
												paddingTop: '16px',
												borderTop: '1px solid #3a494a',
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
											}}
										>
											<span
												style={{
													fontFamily: 'JetBrains Mono, monospace',
													fontSize: '11px',
													color: 'rgba(185,202,202,0.6)',
													textTransform: 'uppercase',
												}}
											>
												{workout.workoutDifficulty}
											</span>
											<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
												<span
													onClick={(e) => likeHandler(e, workout._id)}
													style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: workout.meLiked?.[0]?.myFavorite ? '#ff8a00' : '#849495', cursor: 'pointer' }}
												>
													{workout.meLiked?.[0]?.myFavorite ? '♥' : '♡'} {workout.workoutLikes ?? 0}
												</span>
												<span style={{ color: '#e9feff', fontSize: '18px' }}>→</span>
											</div>
										</div>
									</div>
								</div>
						  ))}
				</div>

				{/* No results */}
				{!loading && workouts.length === 0 && (
					<div
						style={{
							textAlign: 'center',
							padding: '80px 0',
							color: '#b9caca',
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontSize: '18px',
						}}
					>
						No workouts found. Try a different filter.
					</div>
				)}

				{/* Pagination */}
				{total > 0 && (
					<Stack
						alignItems="center"
						style={{ marginTop: '40px' }}
					>
						<Pagination
							count={Math.ceil(total / searchFilter.limit)}
							page={searchFilter.page}
							onChange={paginationHandler}
							shape="rounded"
							sx={{
								'& .MuiPaginationItem-root': {
									color: '#b9caca',
									borderColor: '#3a494a',
									fontFamily: 'JetBrains Mono, monospace',
								},
								'& .Mui-selected': {
									backgroundColor: '#e9feff !important',
									color: '#003739',
								},
							}}
						/>
					</Stack>
				)}
			</div>
		</div>
	);
};

export default withLayoutBasic(WorkoutList);
