import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Stack, Pagination } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import useUrlFilter from '../../libs/hooks/useUrlFilter';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Workout } from '../../libs/types/workout/workout';
import { WorkoutsInquiry } from '../../libs/types/workout/workout.input';
import { WorkoutDifficulty } from '../../libs/enums/workout.enum';
import { Direction } from '../../libs/enums/common.enum';
import LikeButton from '../../libs/components/common/LikeButton';
import FilterSelect from '../../libs/components/common/FilterSelect';
import DataLoadingOverlay from '../../libs/components/common/DataLoadingOverlay';
import ContentSkeletons from '../../libs/components/common/ContentSkeletons';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_WORKOUTS } from '../../apollo/user/query';
import { LIKE_WORKOUT } from '../../apollo/user/mutation';
import { REACT_APP_API_URL, Messages } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { notifyMember } from '../../libs/notify';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'workout', 'enums'])),
	},
});

const difficultyColor: Record<string, string> = {
	BEGINNER: '#66daba',
	INTERMEDIATE: '#ffb77f',
	ADVANCED: '#ff8a8a',
};

const WORKOUT_DEFAULT_INPUT: WorkoutsInquiry = {
	page: 1,
	limit: 9,
	sort: 'createdAt',
	direction: Direction.DESC,
	search: {},
};

const WorkoutList: NextPage = ({ initialInput, ...props }: T) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('workout');
	const user = useReactiveVar(userVar);
	const [workouts, setWorkouts] = useState<Workout[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchFilter, setSearchFilter] = useUrlFilter<WorkoutsInquiry>(WORKOUT_DEFAULT_INPUT, '/workout');
	const [searchText, setSearchText] = useState<string>('');
	const [likingWorkoutId, setLikingWorkoutId] = useState<string | null>(null);

	// View-state derived from the URL-synced filter so a shared link / refresh
	// lights up the correct controls.
	const activeFilter = (searchFilter.search?.workoutDifficulty as string) ?? 'ALL';
	const activeMuscle = (searchFilter.search?.targetMuscle as string) ?? '';
	const activeSort = searchFilter.sort ?? 'createdAt';

	/** APOLLO REQUESTS **/
	const {
		loading,
		data,
	} = useQuery(GET_WORKOUTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
	});

	const [likeWorkoutMutation] = useMutation(LIKE_WORKOUT);

	useEffect(() => {
		const result = data?.getWorkouts;
		if (!result) return;
		setWorkouts(result.list ?? []);
		setTotal(result.metaCounter?.[0]?.total ?? 0);
	}, [data]);

	// Keep the search box in sync when the filter comes from the URL (shared link, back/forward).
	useEffect(() => {
		setSearchText((searchFilter.search?.text as string) ?? '');
	}, [searchFilter.search?.text]);

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
		buildSearch({ difficulty });
	};

	const muscleHandler = (muscle: string) => {
		const val = activeMuscle === muscle ? '' : muscle;
		buildSearch({ muscle: val });
	};

	const sortHandler = (sort: string) => {
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
		setSearchText('');
		setSearchFilter({ ...searchFilter, page: 1, sort: 'createdAt', search: {} });
	};

	const filters = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
	const muscles = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'];
	const sortOptions = [
		{ value: 'createdAt', label: t('list.sort.newest') },
		{ value: 'workoutLikes', label: t('list.sort.mostLiked') },
		{ value: 'workoutViews', label: t('list.sort.mostViewed') },
		{ value: 'workoutRank', label: t('list.sort.topRanked') },
		{ value: 'estimatedCaloriesBurned', label: t('list.sort.highestBurn') },
	];

	const hasActiveFilters = activeFilter !== 'ALL' || activeMuscle || searchText;

	return (
		<div className="wl-page">
			<div className="lp-container">
				{/* Hero */}
				<div className="wl-hero">
					<div className="wl-hero-glow" />
					<span className="lp-eyebrow lp-eyebrow--orange">{t('list.eyebrow')}</span>
					<h1 className="wl-title">
						{t('list.titleLead')} <span className="lp-grad">{t('list.titleAccent')}</span>
					</h1>
					<p className="lp-sub" style={{ margin: 0 }}>
						{t('list.subtitle')}
					</p>
					<div className="wl-badge">
						<span className="wl-badge-dot" />
						<span>{total > 0 ? t('list.protocolsAvailable', { count: total }) : t('list.loadingProtocols')}</span>
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
								placeholder={t('list.searchPlaceholder')}
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
						<FilterSelect value={activeSort} options={sortOptions} ariaLabel={t('list.sort.topRanked')} onChange={sortHandler} />
					</div>

					<div className="wl-console-row">
						<div className="wl-seg">
							{filters.map((f) => (
								<button key={f} className={activeFilter === f ? 'is-active' : ''} onClick={() => filterHandler(f)}>
									{f === 'ALL' ? t('list.allLevels') : t(`enums:difficulty.${f}`)}
								</button>
							))}
						</div>
						<div className="wl-muscles">
							{muscles.map((m) => (
								<button key={m} className={activeMuscle === m ? 'is-active' : ''} onClick={() => muscleHandler(m)}>
									{t(`enums:muscle.${m}`)}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Active filters summary */}
				{hasActiveFilters && (
					<div className="wl-active-row">
						<span className="wl-active-label">{t('list.activeLabel')}</span>
						{activeFilter !== 'ALL' && <span className="wl-active-chip">{t(`enums:difficulty.${activeFilter}`)}</span>}
						{activeMuscle && <span className="wl-active-chip">{t(`enums:muscle.${activeMuscle}`)}</span>}
						{searchText && <span className="wl-active-chip">"{searchText}"</span>}
						<button className="wl-active-clear" onClick={clearAllHandler}>
							✕ {t('common:actions.clearAll')}
						</button>
					</div>
				)}

				{/* Workout Grid */}
				<div className={`wl-data-shell${loading && workouts.length ? ' is-fetching' : ''}`} aria-busy={loading}>
					{loading && !workouts.length ? <ContentSkeletons variant="workout" /> : (
					<div className={`wl-grid${loading && workouts.length ? ' is-fetching' : ''}`}>
						{workouts.map((workout) => (
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
											onError={(event) => {
												event.currentTarget.onerror = null;
												event.currentTarget.src = '/img/banner/header1.svg';
											}}
										/>
										<div className="wl-card-shade" />
										<div className="wl-card-chips">
											{workout.targetMuscle && (
												<span className="lp-chip lp-chip--cyan">
													{t(`enums:muscle.${workout.targetMuscle}`, { defaultValue: workout.targetMuscle })}
												</span>
											)}
										</div>
										<span className="wl-kcal">{t('list.kcal', { count: workout.estimatedCaloriesBurned })}</span>
									</div>

									<div className="wl-card-body">
										<h3>{workout.workoutTitle}</h3>
										<div className="wl-card-foot">
											<span className="wl-diff">
												<span
													className="wl-diff-dot"
													style={{ background: difficultyColor[workout.workoutDifficulty] || '#00dce5' }}
												/>
												{t(`enums:difficulty.${workout.workoutDifficulty}`)}
											</span>
											<div className="wl-card-side">
												<span className="wl-views">{workout.workoutViews ?? 0} {t('common:stats.views')}</span>
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
					)}
					{loading && <DataLoadingOverlay label={t('common:actions.loading')} />}
				</div>

				{/* No results */}
				{!loading && workouts.length === 0 && (
					<div className="wl-empty">
						<span className="wl-empty-label">{t('common:empty.noResults')}</span>
						<h3>{t('list.empty.title')}</h3>
						<p>{t('list.empty.subtitle')}</p>
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
