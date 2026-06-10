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
import LikeButton from '../../libs/components/common/LikeButton';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_WORKOUTS } from '../../apollo/user/query';
import { LIKE_WORKOUT } from '../../apollo/user/mutation';
import { REACT_APP_API_URL, Messages } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { notifyMember } from '../../libs/notify';

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
	const [likingWorkoutId, setLikingWorkoutId] = useState<string | null>(null);

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

	useEffect(() => {
		if (!user?._id) return;
		refetch({ input: searchFilter });
	}, [user?._id]);

	/** HANDLERS **/
	const likeHandler = async (e: any, id: string) => {
		e.stopPropagation();
		if (likingWorkoutId === id) return;

		const previousWorkouts = workouts;

		try {
			if (!user?._id) throw new Error(Messages.error2);
			setLikingWorkoutId(id);

			let nextLiked = false;
			setWorkouts((prev) =>
				prev.map((w) => {
					if (w._id !== id) return w;
					const wasLiked = !!w.meLiked?.[0]?.myFavorite;
					nextLiked = !wasLiked;
					return {
						...w,
						workoutLikes: (w.workoutLikes ?? 0) + (wasLiked ? -1 : 1),
						meLiked: wasLiked ? [] : [{ memberId: user._id, likeRefId: id, myFavorite: true }],
					};
				}),
			);

			const { data } = await likeWorkoutMutation({ variables: { input: id } });
			if (nextLiked) {
				const target = previousWorkouts.find((w) => w._id === id);
				notifyMember((target as any)?.memberId, user._id, 'WORKOUT', 'New like on your workout', `${user.memberNick} liked "${target?.workoutTitle ?? 'your workout'}"`);
			}
			const updatedLikes = data?.likeWorkout?.workoutLikes;
			if (typeof updatedLikes === 'number') {
				setWorkouts((prev) =>
					prev.map((w) =>
						w._id === id
							? {
									...w,
									workoutLikes: updatedLikes,
									meLiked: nextLiked ? [{ memberId: user._id, likeRefId: id, myFavorite: true }] : [],
							  }
							: w,
					),
				);
			}
		} catch (err: any) {
			setWorkouts(previousWorkouts);
			sweetMixinErrorAlert(err.message).then();
		} finally {
			setLikingWorkoutId(null);
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

	const clearAllHandler = () => {
		setActiveFilter('ALL');
		setActiveMuscle('');
		setSearchText('');
		setActiveSort('createdAt');
		setSearchFilter({ ...searchFilter, page: 1, sort: 'createdAt', search: {} });
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

	const hasActiveFilters = activeFilter !== 'ALL' || activeMuscle || searchText;

	return (
		<div className="wl-page">
			<div className="lp-container">
				{/* Hero */}
				<div className="wl-hero">
					<div className="wl-hero-glow" />
					<span className="lp-eyebrow lp-eyebrow--orange">Performance Protocol</span>
					<h1 className="wl-title">
						Workout <span className="lp-grad">Library</span>
					</h1>
					<p className="lp-sub" style={{ margin: 0 }}>
						Precision-engineered routines designed for elite athletes and performance-driven individuals.
					</p>
					<div className="wl-badge">
						<span className="wl-badge-dot" />
						<span>{total > 0 ? `${total} protocols available` : 'Loading protocols'}</span>
					</div>
				</div>

				{/* Filter console */}
				<div className="wl-console">
					<div className="wl-console-row">
						<div className="wl-search">
							<input
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
								placeholder="Search workouts..."
							/>
							{searchText && (
								<span
									className="wl-search-clear"
									onClick={() => {
										setSearchText('');
										buildSearch({ text: '' });
									}}
								>
									✕
								</span>
							)}
						</div>
						<select className="wl-sort" value={activeSort} onChange={(e) => sortHandler(e.target.value)}>
							{sortOptions.map((s) => (
								<option key={s.value} value={s.value}>
									{s.label}
								</option>
							))}
						</select>
					</div>

					<div className="wl-console-row">
						<div className="wl-seg">
							{filters.map((f) => (
								<button key={f} className={activeFilter === f ? 'is-active' : ''} onClick={() => filterHandler(f)}>
									{f === 'ALL' ? 'All Levels' : f.charAt(0) + f.slice(1).toLowerCase()}
								</button>
							))}
						</div>
						<div className="wl-muscles">
							{muscles.map((m) => (
								<button key={m} className={activeMuscle === m ? 'is-active' : ''} onClick={() => muscleHandler(m)}>
									{m}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Active filters summary */}
				{hasActiveFilters && (
					<div className="wl-active-row">
						<span className="wl-active-label">ACTIVE:</span>
						{activeFilter !== 'ALL' && <span className="wl-active-chip">{activeFilter}</span>}
						{activeMuscle && <span className="wl-active-chip">{activeMuscle}</span>}
						{searchText && <span className="wl-active-chip">"{searchText}"</span>}
						<button className="wl-active-clear" onClick={clearAllHandler}>
							✕ Clear all
						</button>
					</div>
				)}

				{/* Workout Grid */}
				<div className="wl-grid">
					{loading && !workouts.length
						? [1, 2, 3, 4, 5, 6].map((i) => (
								<div key={i} className="wl-skel">
									<div className="wl-skel-img" />
									<div className="wl-skel-body">
										<div className="wl-skel-line" />
										<div className="wl-skel-line" />
									</div>
								</div>
						  ))
						: workouts.map((workout) => (
								<div key={workout._id} className="wl-card" onClick={() => pushDetailHandler(workout._id)}>
									<div className="wl-card-img">
										<img
											src={
												workout.workoutThumbnail
													? `${REACT_APP_API_URL}/${workout.workoutThumbnail}`
													: '/img/banner/header1.svg'
											}
											alt={workout.workoutTitle}
											loading="lazy"
										/>
										<div className="wl-card-shade" />
										<div className="wl-card-chips">
											{workout.targetMuscle && <span className="lp-chip lp-chip--cyan">{workout.targetMuscle}</span>}
										</div>
										<span className="wl-kcal">{workout.estimatedCaloriesBurned} KCAL</span>
									</div>

									<div className="wl-card-body">
										<h3>{workout.workoutTitle}</h3>
										<div className="wl-card-foot">
											<span className="wl-diff">
												<span
													className="wl-diff-dot"
													style={{ background: difficultyColor[workout.workoutDifficulty] || '#00dce5' }}
												/>
												{workout.workoutDifficulty}
											</span>
											<div className="wl-card-side">
												<span className="wl-views">{workout.workoutViews ?? 0} views</span>
												<LikeButton
													liked={!!workout.meLiked?.[0]?.myFavorite}
													count={workout.workoutLikes ?? 0}
													onClick={(e) => likeHandler(e, workout._id)}
												/>
												<span className="wl-card-arrow">→</span>
											</div>
										</div>
									</div>
								</div>
						  ))}
				</div>

				{/* No results */}
				{!loading && workouts.length === 0 && (
					<div className="wl-empty">
						<span className="wl-empty-label">No results</span>
						<h3>Nothing matches this protocol.</h3>
						<p>Try a different muscle group, level or search term.</p>
					</div>
				)}

				{/* Pagination */}
				{total > 0 && (
					<Stack alignItems="center" style={{ marginTop: '48px' }}>
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
