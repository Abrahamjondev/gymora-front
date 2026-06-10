import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { CircularProgress, Pagination, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Member } from '../../libs/types/member/member';
import { Direction } from '../../libs/enums/common.enum';
import LikeButton from '../../libs/components/common/LikeButton';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_TRAINER_MEMBERS } from '../../apollo/user/query';
import { LIKE_TARGET_MEMBER } from '../../apollo/user/mutation';
import { REACT_APP_API_URL, Messages } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const TrainerList: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [trainers, setTrainers] = useState<Member[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchFilter, setSearchFilter] = useState({
		page: 1,
		limit: 6,
		sort: 'memberRank',
		direction: Direction.DESC,
		search: {} as { text?: string },
	});
	const [searchText, setSearchText] = useState<string>('');
	const [activeSort, setActiveSort] = useState<string>('memberRank');

	/** APOLLO REQUESTS **/
	const {
		loading,
		refetch,
	} = useQuery(GET_TRAINER_MEMBERS, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setTrainers(data?.getTrainerMembers?.list ?? []);
			setTotal(data?.getTrainerMembers?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		refetch({ input: searchFilter });
	}, [searchFilter]);

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
		setActiveSort(sort);
		setSearchFilter({ ...searchFilter, page: 1, sort });
	};

	const paginationHandler = (e: any, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const pushDetailHandler = (memberId: string) => {
		router.push({ pathname: '/trainer/detail', query: { id: memberId } });
	};

	const sortOptions = [
		{ value: 'memberRank', label: 'Top Ranked' },
		{ value: 'memberLikes', label: 'Most Liked' },
		{ value: 'memberViews', label: 'Most Viewed' },
		{ value: 'createdAt', label: 'Newest' },
	];

	/** LOADING STATE **/
	if (loading && !trainers.length) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#0d0d0e' }}>
				<CircularProgress size={'4rem'} sx={{ color: '#00dce5' }} />
			</Stack>
		);
	}

	return (
		<div className="wl-page">
			<div className="lp-container">
				{/* Hero */}
				<div className="wl-hero">
					<div className="wl-hero-glow" />
					<span className="lp-eyebrow lp-eyebrow--green">Verified professionals</span>
					<h1 className="wl-title">
						Elite <span className="lp-grad">Trainers</span>
					</h1>
					<p className="lp-sub" style={{ margin: 0 }}>
						Work with world-class athletes and certified professionals dedicated to pushing your limits.
					</p>
					<div className="wl-badge">
						<span className="wl-badge-dot" />
						<span>{total > 0 ? `${total} trainers on the roster` : 'Loading roster'}</span>
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
								placeholder="Search by name or keyword..."
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
						<select className="wl-sort" value={activeSort} onChange={(e) => sortHandler(e.target.value)}>
							{sortOptions.map((s) => (
								<option key={s.value} value={s.value}>
									{s.label}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Trainer Grid */}
				<div className="tr-grid">
					{trainers.map((trainer) => (
						<div key={trainer._id} className="tr-card" onClick={() => pushDetailHandler(trainer._id)}>
							<div className="tr-card-img">
								<img
									src={trainer.memberImage ? `${REACT_APP_API_URL}/${trainer.memberImage}` : '/img/profile/defaultUser.svg'}
									alt={trainer.memberNick}
									loading="lazy"
								/>
								<div className="tr-card-shade" />
								{trainer.memberRank > 0 && (
									<div className="tr-card-rank">
										<span className="tr-card-star">★</span>
										{trainer.memberRank}
									</div>
								)}
								<div className="tr-card-overlay">
									<h3>{trainer.memberFullName || trainer.memberNick}</h3>
									<p>{trainer.memberDesc || 'Professional fitness trainer'}</p>
								</div>
							</div>

							<div className="tr-card-foot">
								<div className="tr-card-meta">
									<span>
										<b>{trainer.memberWorkouts}</b> workouts
									</span>
									<span>
										<b>{trainer.memberFollowers}</b> followers
									</span>
								</div>
								<div className="tr-card-side">
									<LikeButton
										liked={!!trainer.meLiked?.[0]?.myFavorite}
										count={trainer.memberLikes ?? 0}
										onClick={(e) => likeHandler(e, trainer._id)}
									/>
									<span className="tr-card-arrow">→</span>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* No results */}
				{!loading && trainers.length === 0 && (
					<div className="wl-empty">
						<span className="wl-empty-label">No results</span>
						<h3>No trainers match this search.</h3>
						<p>Try a different name or keyword.</p>
					</div>
				)}

				{/* Stats bar */}
				{total > 0 && (
					<div className="tr-stats">
						{[
							{ label: 'Total Trainers', value: `${total}` },
							{ label: 'Workouts Published', value: `${trainers.reduce((a, t) => a + (t.memberWorkouts || 0), 0)}` },
							{ label: 'Followers', value: `${trainers.reduce((a, t) => a + (t.memberFollowers || 0), 0)}` },
							{ label: 'Likes', value: `${trainers.reduce((a, t) => a + (t.memberLikes || 0), 0)}` },
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
