import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { CircularProgress, Pagination, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BoardArticlesInquiry } from '../../libs/types/board-article/board-article.input';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../apollo/user/mutation';
import { Messages, REACT_APP_API_URL } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { userVar } from '../../apollo/store';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const categories = [
	{ value: 'FITNESS_TIPS', label: 'All Posts' },
	{ value: 'NUTRITION', label: 'Nutrition' },
	{ value: 'WORKOUT_GUIDE', label: 'Workout Guide' },
	{ value: 'CHALLENGE', label: 'Challenge' },
	{ value: 'SUCCESS_STORY', label: 'Success Story' },
];

const Community: NextPage = ({ initialInput, ...props }: T) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const { query } = router;
	const articleCategory = query?.articleCategory as string;
	const [searchCommunity, setSearchCommunity] = useState<BoardArticlesInquiry>(initialInput);
	const [boardArticles, setBoardArticles] = useState<BoardArticle[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);

	const {
		loading,
		refetch: boardArticlesRefetch,
	} = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: searchCommunity },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setBoardArticles(data?.getBoardArticles?.list ?? []);
			setTotalCount(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (!query?.articleCategory) {
			router.push({ pathname: router.pathname, query: { articleCategory: 'FITNESS_TIPS' } }, router.pathname, { shallow: true });
		} else if (articleCategory && articleCategory !== searchCommunity.search.articleCategory) {
			setSearchCommunity({ ...searchCommunity, page: 1, search: { articleCategory: articleCategory as BoardArticleCategory } });
		}
	}, [articleCategory]);

	/** HANDLERS **/
	const tabChangeHandler = async (value: string) => {
		setSearchCommunity({ ...searchCommunity, page: 1, search: { articleCategory: value as BoardArticleCategory } });
		await router.push({ pathname: '/community', query: { articleCategory: value } }, router.pathname, { shallow: true });
	};

	const paginationHandler = (e: T, value: number) => {
		setSearchCommunity({ ...searchCommunity, page: value });
	};

	const likeArticleHandler = async (e: any, id: string) => {
		try {
			e.stopPropagation();
			if (!id) return;
			if (!user?._id) throw new Error(Messages.error2);
			await likeTargetBoardArticle({ variables: { input: id } });
			await boardArticlesRefetch({ input: searchCommunity });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const pushDetailHandler = (articleId: string) => {
		router.push({ pathname: '/community/detail', query: { id: articleId } });
	};

	if (device === 'mobile') {
		return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>GYMORA COMMUNITY MOBILE</div>;
	}

	return (
		<div style={{ background: '#131314', minHeight: '100vh', padding: '40px 0' }}>
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
				{/* Header */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
					<div>
						<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '40px', lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: 800, color: '#e5e2e3' }}>
							Gymora Community
						</h2>
						<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', lineHeight: '24px', color: '#b9caca', marginTop: '8px' }}>
							Share your achievements, ask trainers, and connect with athletes.
						</p>
					</div>
					{user?._id && (user?.memberType === 'TRAINER' || user?.memberType === 'ADMIN') && (
						<button
							onClick={() => router.push({ pathname: '/mypage', query: { category: 'writeArticle' } })}
							style={{
								background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px',
								padding: '12px 24px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
							}}
						>
							Write Article
						</button>
					)}
				</div>

				{/* Category tabs */}
				<div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
					{categories.map((cat) => (
						<button
							key={cat.value}
							onClick={() => tabChangeHandler(cat.value)}
							style={{
								padding: '8px 24px',
								borderRadius: '9999px',
								fontFamily: 'Hanken Grotesk',
								fontSize: '14px',
								fontWeight: searchCommunity.search.articleCategory === cat.value ? 700 : 400,
								cursor: 'pointer',
								transition: 'all 0.2s',
								border: searchCommunity.search.articleCategory === cat.value ? 'none' : '1px solid #3a494a',
								background: searchCommunity.search.articleCategory === cat.value ? '#e9feff' : '#353436',
								color: searchCommunity.search.articleCategory === cat.value ? '#003739' : '#b9caca',
							}}
						>
							{cat.label}
						</button>
					))}
				</div>

				{/* Articles */}
				{loading && !boardArticles.length ? (
					<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
						<CircularProgress size={'3rem'} sx={{ color: '#00dce5' }} />
					</Stack>
				) : boardArticles.length === 0 ? (
					<div style={{ textAlign: 'center', padding: '80px 0', color: '#849495', fontFamily: 'Hanken Grotesk', fontSize: '18px' }}>
						No articles found in this category.
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{boardArticles.map((article) => (
							<div
								key={article._id}
								onClick={() => pushDetailHandler(article._id)}
								style={{
									background: 'rgba(255,255,255,0.03)',
									border: '1px solid rgba(255,255,255,0.08)',
									borderRadius: '12px',
									padding: '24px',
									cursor: 'pointer',
									transition: 'all 0.3s',
									display: 'flex',
									gap: '20px',
								}}
								onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,220,229,0.3)')}
								onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)')}
							>
								{/* Image */}
								{article.articleImage && (
									<div style={{ width: '200px', minHeight: '140px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
										<img
											src={`${REACT_APP_API_URL}/${article.articleImage}`}
											alt={article.articleTitle}
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
										/>
									</div>
								)}

								{/* Content */}
								<div style={{ flex: 1 }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
										<span style={{
											padding: '2px 8px', borderRadius: '4px',
											background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)',
											fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00f5ff', textTransform: 'uppercase',
										}}>
											{article.articleCategory?.replace('_', ' ')}
										</span>
										{article.memberData && (
											<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: '#849495' }}>
												{article.memberData.memberNick}
											</span>
										)}
									</div>
									<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', lineHeight: '28px', fontWeight: 600, color: '#e5e2e3', marginBottom: '8px' }}>
										{article.articleTitle}
									</h3>
									<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', lineHeight: '20px', color: '#849495', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '12px' }}>
										{article.articleContent?.replace(/<[^>]*>/g, '').slice(0, 200)}
									</p>
									<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
										<span
											onClick={(e) => likeArticleHandler(e, article._id)}
											style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: article.meLiked?.[0]?.myFavorite ? '#ff8a00' : '#849495', cursor: 'pointer' }}
										>
											{article.meLiked?.[0]?.myFavorite ? '♥' : '♡'} {article.articleLikes ?? 0}
										</span>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#849495' }}>
											👁 {article.articleViews ?? 0}
										</span>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#849495' }}>
											💬 {article.articleComments ?? 0}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Pagination */}
				{totalCount > searchCommunity.limit && (
					<Stack alignItems="center" style={{ marginTop: '40px' }}>
						<Pagination
							count={Math.ceil(totalCount / searchCommunity.limit)}
							page={searchCommunity.page}
							onChange={paginationHandler}
							shape="rounded"
							sx={{
								'& .MuiPaginationItem-root': { color: '#b9caca', borderColor: '#3a494a' },
								'& .Mui-selected': { backgroundColor: '#e9feff !important', color: '#003739' },
							}}
						/>
						<p style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#849495', marginTop: '12px' }}>
							Total {totalCount} article{totalCount > 1 ? 's' : ''} available
						</p>
					</Stack>
				)}
			</div>
		</div>
	);
};

Community.defaultProps = {
	initialInput: {
		page: 1,
		limit: 6,
		sort: 'createdAt',
		direction: 'ASC',
		search: {
			articleCategory: 'FITNESS_TIPS',
		},
	},
};

export default withLayoutBasic(Community);
