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
	const [searchText, setSearchText] = useState<string>('');
	const [activeMuscle, setActiveMuscle] = useState<string>('');
	
	const [activeSort, setActiveSort] = useState<string>('createdAt');

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

	const buildSearch = (overrides: any = {}) => {
		const diff = overrides.difficulty ?? activeFilter;
		const muscle = overrides.muscle ?? activeMuscle;
		
		const text = overrides.text ?? searchText;
		const sort = overrides.sort ?? activeSort;

		const search: any = {};
		if (diff !== 'ALL') search.workoutDifficulty = diff;
		if (muscle) search.targetMuscle = muscle;
		
		if (text) search.text = text;

		setSearchFilter({ ...searchFilter, page: 1, sort, search });
	};

	const filterHandler = (difficulty: string) => {
		setActiveFilter(difficulty);
		buildSearch({ difficulty });
	};

	const muscleHandler = (muscle: string) => {
		const val = activeMuscle === muscle ? '' : muscle;
		setActiveMuscle(val);
		buildSearch({ muscle: val });
	};

	

	const sortHandler = (sort: string) => {
		setActiveSort(sort);
		buildSearch({ sort });
	};

	const searchHandler = () => {
		buildSearch({ text: searchText });
	};

	const paginationHandler = (e: any, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const pushDetailHandler = (workoutId: string) => {
		router.push({ pathname: '/workout/detail', query: { id: workoutId } });
	};

	const filters = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
	const muscles = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'];
	const sortOptions = [
		{ value: 'createdAt', label: 'Newest' },
		{ value: 'workoutLikes', label: 'Most Liked' },
		{ value: 'workoutViews', label: 'Most Viewed' },
		{ value: 'workoutRank', label: 'Top Ranked' },
		{ value: 'estimatedCaloriesBurned', label: 'Highest Burn' },
	];

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

				{/* Search Bar */}
				<div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
					<div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid #3a494a', borderRadius: '8px', padding: '0 16px' }}>
						<span style={{ color: '#849495', marginRight: '8px' }}>🔍</span>
						<input
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
							placeholder="Search workouts..."
							style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', color: '#e5e2e3', padding: '14px 0' }}
						/>
						{searchText && (
							<span onClick={() => { setSearchText(''); buildSearch({ text: '' }); }} style={{ color: '#849495', cursor: 'pointer', fontSize: '16px' }}>✕</span>
						)}
					</div>
					{/* Sort */}
					<select
						value={activeSort}
						onChange={(e) => sortHandler(e.target.value)}
						style={{ padding: '12px 16px', background: '#201f20', border: '1px solid #3a494a', borderRadius: '8px', color: '#e5e2e3', fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
					>
						{sortOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
					</select>
				</div>

				{/* Difficulty Filters */}
				<div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
					{filters.map((f) => (
						<button key={f} onClick={() => filterHandler(f)} style={{ padding: '8px 20px', borderRadius: '9999px', fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '13px', fontWeight: activeFilter === f ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s', border: activeFilter === f ? 'none' : '1px solid #3a494a', background: activeFilter === f ? '#e9feff' : '#353436', color: activeFilter === f ? '#003739' : '#b9caca' }}>
							{f === 'ALL' ? 'All Levels' : f.charAt(0) + f.slice(1).toLowerCase()}
						</button>
					))}
					</div>

				{/* Muscle Group Filters */}
				<div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
					<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'flex', alignItems: 'center', marginRight: '4px' }}>MUSCLE:</span>
					{muscles.map((m) => (
						<button key={m} onClick={() => muscleHandler(m)} style={{ padding: '6px 14px', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s', border: activeMuscle === m ? '1px solid #00dce5' : '1px solid #3a494a', background: activeMuscle === m ? 'rgba(0,220,229,0.15)' : 'transparent', color: activeMuscle === m ? '#00dce5' : '#849495' }}>
							{m}
						</button>
					))}
				</div>

				{/* Active filters summary */}
				{(activeFilter !== 'ALL' || activeMuscle || searchText) && (
					<div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
						<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#849495' }}>ACTIVE:</span>
						{activeFilter !== 'ALL' && <span style={{ padding: '4px 10px', background: 'rgba(233,254,255,0.1)', border: '1px solid rgba(233,254,255,0.2)', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#e9feff' }}>{activeFilter}</span>}
						{activeMuscle && <span style={{ padding: '4px 10px', background: 'rgba(0,220,229,0.1)', border: '1px solid rgba(0,220,229,0.2)', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#00dce5' }}>{activeMuscle}</span>}

						{searchText && <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#b9caca' }}>"{searchText}"</span>}
						<button onClick={() => { setActiveFilter('ALL'); setActiveMuscle(''); setSearchText(''); setActiveSort('createdAt'); setSearchFilter({ ...searchFilter, page: 1, sort: 'createdAt', search: {} }); }} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #3a494a', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#849495', cursor: 'pointer' }}>✕ Clear all</button>
					</div>
				)}

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
