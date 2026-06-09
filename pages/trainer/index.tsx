import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { CircularProgress, Pagination, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Member } from '../../libs/types/member/member';
import { Direction } from '../../libs/enums/common.enum';
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
			await likeMember({ variables: { input: id } });
			const { data } = await refetch({ input: searchFilter });
			if (data?.getTrainerMembers?.list) {
				setTrainers(data.getTrainerMembers.list);
				setTotal(data.getTrainerMembers.metaCounter?.[0]?.total ?? 0);
			}
			await sweetTopSmallSuccessAlert('success', 800);
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

	const paginationHandler = (e: any, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const pushDetailHandler = (memberId: string) => {
		router.push({ pathname: '/member', query: { memberId } });
	};

	/** LOADING STATE **/
	if (loading && !trainers.length) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#131314' }}>
				<CircularProgress size={'4rem'} sx={{ color: '#00dce5' }} />
			</Stack>
		);
	}

	if (device === 'mobile') {
		return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>GYMORA TRAINERS MOBILE</div>;
	}

	return (
		<div style={{ background: '#131314', minHeight: '100vh', padding: '40px 0' }}>
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
				{/* Header */}
				<div style={{ marginBottom: '32px' }}>
					<h2
						style={{
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontSize: '40px',
							lineHeight: '48px',
							letterSpacing: '-0.02em',
							fontWeight: 800,
							color: '#e5e2e3',
							textTransform: 'uppercase',
						}}
					>
						Elite Performance
						<br />
						Trainers
					</h2>
					<p style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '16px', lineHeight: '24px', color: '#b9caca', maxWidth: '480px', marginTop: '12px' }}>
						Work with world-class athletes and certified professionals dedicated to pushing your limits.
					</p>
				</div>

				{/* Search */}
				<div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
					<div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid #3a494a', borderRadius: '8px', padding: '0 16px' }}>
						<span style={{ color: '#849495', marginRight: '8px' }}>🔍</span>
						<input
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
							placeholder="Search by name or keyword..."
							style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', color: '#e5e2e3', padding: '14px 0' }}
						/>
					</div>
					<button
						onClick={searchHandler}
						style={{ background: '#353436', border: '1px solid #3a494a', borderRadius: '8px', padding: '14px 24px', fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', fontWeight: 600, color: '#e5e2e3', cursor: 'pointer' }}
					>
						Search
					</button>
				</div>

				{/* Trainer Grid */}
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
					{trainers.map((trainer) => (
						<div
							key={trainer._id}
							onClick={() => pushDetailHandler(trainer._id)}
							style={{
								background: 'rgba(255,255,255,0.03)',
								border: '1px solid rgba(255,255,255,0.08)',
								borderRadius: '12px',
								overflow: 'hidden',
								cursor: 'pointer',
								transition: 'all 0.3s',
							}}
							onMouseOver={(e) => {
								(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,220,229,0.3)';
								(e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
							}}
							onMouseOut={(e) => {
								(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
								(e.currentTarget as HTMLElement).style.transform = 'scale(1)';
							}}
						>
							{/* Image */}
							<div style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
								<img
									src={
										trainer.memberImage
											? `${REACT_APP_API_URL}/${trainer.memberImage}`
											: '/img/profile/defaultUser.svg'
									}
									alt={trainer.memberNick}
									style={{
										width: '100%',
										height: '100%',
										objectFit: 'cover',
										filter: 'grayscale(0.5)',
										transition: 'filter 0.5s, transform 0.5s',
									}}
									onMouseOver={(e) => {
										(e.target as HTMLImageElement).style.filter = 'grayscale(0)';
										(e.target as HTMLImageElement).style.transform = 'scale(1.05)';
									}}
									onMouseOut={(e) => {
										(e.target as HTMLImageElement).style.filter = 'grayscale(0.5)';
										(e.target as HTMLImageElement).style.transform = 'scale(1)';
									}}
								/>
								{/* Rank badge */}
								{trainer.memberRank > 0 && (
									<div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 8px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
										<span style={{ color: '#ff8a00', fontSize: '12px' }}>★</span>
										<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#e5e2e3', fontWeight: 700 }}>
											{trainer.memberRank}
										</span>
									</div>
								)}
							</div>

							{/* Info */}
							<div style={{ padding: '20px' }}>
								<h3 style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '20px', lineHeight: '28px', fontWeight: 600, color: '#e5e2e3', marginBottom: '4px' }}>
									{trainer.memberFullName || trainer.memberNick}
								</h3>
								<p style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', lineHeight: '20px', color: '#b9caca', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
									{trainer.memberDesc || 'Professional fitness trainer'}
								</p>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(58,73,74,0.5)' }}>
									<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
										<span
											onClick={(e) => likeHandler(e, trainer._id)}
											style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: trainer.meLiked?.[0]?.myFavorite ? '#ff8a00' : '#849495', cursor: 'pointer' }}
										>
											{trainer.meLiked?.[0]?.myFavorite ? '♥' : '♡'} {trainer.memberLikes}
										</span>
										<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#849495' }}>
											{trainer.memberWorkouts} workouts
										</span>
									</div>
									<span style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '13px', fontWeight: 600, color: '#e9feff' }}>
										View Profile →
									</span>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* No results */}
				{!loading && trainers.length === 0 && (
					<div style={{ textAlign: 'center', padding: '80px 0', color: '#b9caca', fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '18px' }}>
						No trainers found.
					</div>
				)}

				{/* Stats bar */}
				{total > 0 && (
					<div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #3a494a', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
						{[
							{ label: 'TOTAL TRAINERS', value: `${total}` },
							{ label: 'TOTAL WORKOUTS', value: `${trainers.reduce((a, t) => a + (t.memberWorkouts || 0), 0)}` },
							{ label: 'TOTAL FOLLOWERS', value: `${trainers.reduce((a, t) => a + (t.memberFollowers || 0), 0)}` },
							{ label: 'COMMUNITY', value: 'Active' },
						].map((stat) => (
							<div key={stat.label}>
								<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{stat.label}</span>
								<span style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '32px', fontWeight: 800, color: '#e5e2e3' }}>{stat.value}</span>
							</div>
						))}
					</div>
				)}

				{/* Pagination */}
				{total > searchFilter.limit && (
					<Stack alignItems="center" style={{ marginTop: '40px' }}>
						<Pagination
							count={Math.ceil(total / searchFilter.limit)}
							page={searchFilter.page}
							onChange={paginationHandler}
							shape="rounded"
							sx={{
								'& .MuiPaginationItem-root': { color: '#b9caca', borderColor: '#3a494a' },
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
