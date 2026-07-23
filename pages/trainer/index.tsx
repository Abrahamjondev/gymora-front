import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Pagination, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import useUrlFilter from '../../libs/hooks/useUrlFilter';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Member } from '../../libs/types/member/member';
import { Direction } from '../../libs/enums/common.enum';
import LikeButton from '../../libs/components/common/LikeButton';
import QueryState from '../../libs/components/common/QueryState';
import FilterSelect from '../../libs/components/common/FilterSelect';
import DataLoadingOverlay from '../../libs/components/common/DataLoadingOverlay';
import ContentSkeletons from '../../libs/components/common/ContentSkeletons';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_TRAINER_MEMBERS } from '../../apollo/user/query';
import { LIKE_TARGET_MEMBER } from '../../apollo/user/mutation';
import { REACT_APP_API_URL, Messages } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'trainer', 'enums'])),
	},
});

interface TrainersInquiry {
	page: number;
	limit: number;
	sort: string;
	direction: Direction;
	search: { text?: string };
}

const TRAINER_DEFAULT_INPUT: TrainersInquiry = {
	page: 1,
	limit: 6,
	sort: 'memberRank',
	direction: Direction.DESC,
	search: {},
};

const TRAINER_SORTS = ['memberRank', 'memberLikes', 'memberViews', 'createdAt'] as const;

const TrainerList: NextPage = () => {
	const device = useDeviceDetect();
	const { t } = useTranslation('trainer');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [trainers, setTrainers] = useState<Member[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchFilter, setSearchFilter] = useUrlFilter<TrainersInquiry>(TRAINER_DEFAULT_INPUT, '/trainer', {
		allowedSorts: TRAINER_SORTS,
		scrollTarget: 'list-results-start',
	});
	const [searchText, setSearchText] = useState<string>('');

	// Sort control derived from the URL-synced filter so a shared link / refresh reflects it.
	const activeSort = searchFilter.sort ?? 'memberRank';

	/** APOLLO REQUESTS **/
	const {
		loading,
		data,
		error,
		refetch,
	} = useQuery(GET_TRAINER_MEMBERS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
	});

	/** LIFECYCLES **/
	useEffect(() => {
		const result = data?.getTrainerMembers;
		if (!result) return;
		setTrainers(result.list ?? []);
		setTotal(result.metaCounter?.[0]?.total ?? 0);
	}, [data]);

	// Keep the search box in sync when the filter comes from the URL (shared link, back/forward).
	useEffect(() => {
		setSearchText(searchFilter.search?.text ?? '');
	}, [searchFilter.search?.text]);

	const [likeMember] = useMutation(LIKE_TARGET_MEMBER);

	/** HANDLERS **/
	const likeHandler = async (e: any, id: string) => {
		try {
			e.stopPropagation();
			if (!user?._id) throw new Error(Messages.error2);
			setTrainers((prev: any[]) =>
				prev.map((t: any) => {
					if (t._id !== id) return t;
					const wasLiked = !!t.meLiked?.[0]?.myFavorite;
					return { ...t, memberLikes: (t.memberLikes ?? 0) + (wasLiked ? -1 : 1), meLiked: wasLiked ? [] : [{ memberId: user._id, likeRefId: id, myFavorite: true }] };
				}),
			);
			await likeMember({ variables: { input: id } });
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const searchHandler = () => {
		setSearchFilter({
			...searchFilter,
			page: 1,
			search: searchText ? { text: searchText } : {},
		});
	};

	const sortHandler = (sort: string) => {
		setSearchFilter({ ...searchFilter, page: 1, sort });
	};

	const paginationHandler = (e: any, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const pushDetailHandler = (memberId: string) => {
		router.push({ pathname: '/trainer/detail', query: { id: memberId } });
	};

	const cardKeyDownHandler = (event: React.KeyboardEvent<HTMLElement>, memberId: string) => {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		pushDetailHandler(memberId);
	};

	const sortOptions = [
		{ value: 'memberRank', label: t('list.sort.topRanked') },
		{ value: 'memberLikes', label: t('list.sort.mostLiked') },
		{ value: 'memberViews', label: t('list.sort.mostViewed') },
		{ value: 'createdAt', label: t('list.sort.newest') },
	];

	return (
		<div className="wl-page">
			<div className="lp-container">
				{/* Hero */}
				<div className="wl-hero">
					<div className="wl-hero-glow" />
					<span className="lp-eyebrow lp-eyebrow--green">{t('list.eyebrow')}</span>
					<h1 className="wl-title">
						{t('list.titlePre')} <span className="lp-grad">{t('list.titleAccent')}</span>
					</h1>
					<p className="lp-sub" style={{ margin: 0 }}>
						{t('list.subtitle')}
					</p>
					<div className="wl-badge">
						<span className="wl-badge-dot" />
						<span>{total > 0 ? t('list.rosterCount', { count: total }) : t('list.loadingRoster')}</span>
					</div>
				</div>

				{/* Search console */}
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
										setSearchFilter({ ...searchFilter, page: 1, search: {} });
									}}
								>
									✕
								</span>
							)}
						</div>
						<FilterSelect value={activeSort} options={sortOptions} ariaLabel={t('list.sort.topRanked')} onChange={sortHandler} />
					</div>
				</div>

				<QueryState loading={loading} error={error} hasData={trainers.length > 0} onRetry={() => void refetch({ input: searchFilter })} />

				{/* Trainer Grid */}
				<div className={`wl-data-shell${loading && trainers.length ? ' is-fetching' : ''}`} aria-busy={loading}>
					{loading && !trainers.length ? <ContentSkeletons variant="trainer" /> : (
					<div className={`tr-grid${loading && trainers.length ? ' is-fetching' : ''}`}>
						{trainers.map((trainer, index) => {
							const trainerName = trainer.memberFullName || trainer.memberNick;
							return (
								<article
									key={trainer._id}
									className={`tr-card${index === 0 ? ' is-featured' : ''}`}
									onClick={() => pushDetailHandler(trainer._id)}
									onKeyDown={(event) => cardKeyDownHandler(event, trainer._id)}
									role="button"
									tabIndex={0}
									aria-label={t('list.card.openProfile', { name: trainerName })}
								>
									<div className="tr-card-shell">
										<div className="tr-card-img">
											<img
												src={trainer.memberImage ? `${REACT_APP_API_URL}/${trainer.memberImage}` : '/img/profile/defaultUser.svg'}
												alt={trainer.memberNick}
												loading="lazy"
												onError={(event) => {
													event.currentTarget.onerror = null;
													event.currentTarget.src = '/img/profile/defaultUser.svg';
												}}
											/>
											<div className="tr-card-shade" aria-hidden="true" />
											<div className="tr-card-image-grid" aria-hidden="true" />
											<div className="tr-card-scan" aria-hidden="true" />
											{trainer.memberRank > 0 && (
												<div className="tr-card-rank">
													<span>{t('list.card.rank')}</span>
													<strong>{trainer.memberRank}</strong>
												</div>
											)}
										</div>

										<div className="tr-card-body">
											<div className="tr-card-identity">
												<span className="tr-card-kicker">{t('list.card.profileLabel')}</span>
												<h3>{trainerName}</h3>
												{trainer.memberFullName && <span className="tr-card-nick">@{trainer.memberNick}</span>}
												<p>{trainer.memberDesc || t('list.defaultBio')}</p>
											</div>

											<div className="tr-card-stats">
												<div>
													<strong>{trainer.memberWorkouts}</strong>
													<span>{t('list.card.workouts')}</span>
												</div>
												<div>
													<strong>{trainer.memberCourses}</strong>
													<span>{t('list.card.programs')}</span>
												</div>
												<div>
													<strong>{trainer.memberFollowers}</strong>
													<span>{t('list.card.followers')}</span>
												</div>
											</div>
										</div>

										<div className="tr-card-foot">
											<LikeButton
												liked={!!trainer.meLiked?.[0]?.myFavorite}
												count={trainer.memberLikes ?? 0}
												onClick={(event) => likeHandler(event, trainer._id)}
											/>
											<span className="tr-card-arrow" aria-hidden="true">
												<span>↗</span>
											</span>
										</div>
									</div>
								</article>
							);
						})}
					</div>
					)}
					{loading && <DataLoadingOverlay label={t('common:actions.loading')} />}
				</div>

				{/* No results */}
				{!loading && trainers.length === 0 && (
					<div className="wl-empty">
						<span className="wl-empty-label">{t('list.empty.label')}</span>
						<h3>{t('list.empty.title')}</h3>
						<p>{t('list.empty.hint')}</p>
					</div>
				)}

				{/* Stats bar */}
				{total > 0 && (
					<div className="tr-stats">
						{[
							{ label: t('list.stats.totalTrainers'), value: `${total}` },
							{ label: t('list.stats.workoutsPublished'), value: `${trainers.reduce((a, m) => a + (m.memberWorkouts || 0), 0)}` },
							{ label: t('list.stats.followers'), value: `${trainers.reduce((a, m) => a + (m.memberFollowers || 0), 0)}` },
							{ label: t('list.stats.likes'), value: `${trainers.reduce((a, m) => a + (m.memberLikes || 0), 0)}` },
						].map((stat) => (
							<div key={stat.label}>
								<span className="tr-stat-label">{stat.label}</span>
								<span className="tr-stat-value">{stat.value}</span>
							</div>
						))}
					</div>
				)}

				{/* Pagination */}
				{total > searchFilter.limit && (
					<Stack alignItems="center" style={{ marginTop: '48px' }}>
						<Pagination
							count={Math.ceil(total / searchFilter.limit)}
							page={searchFilter.page}
							onChange={paginationHandler}
							shape="rounded"
							sx={{
								'& .MuiPaginationItem-root': { color: '#b9caca', borderColor: '#3a494a', fontFamily: 'JetBrains Mono, monospace' },
								'& .Mui-selected': { backgroundColor: '#e9feff !important', color: '#003739' },
							}}
						/>
					</Stack>
				)}
			</div>
		</div>
	);
};

export default withLayoutBasic(TrainerList);
