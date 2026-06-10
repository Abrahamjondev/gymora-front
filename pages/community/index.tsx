import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Pagination, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { T } from '../../libs/types/common';
import LikeButton from '../../libs/components/common/LikeButton';
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
	{ value: 'ALL', label: 'All Posts', accent: '#00dce5' },
	{ value: 'FITNESS_TIPS', label: 'Fitness Tips', accent: '#00dce5' },
	{ value: 'NUTRITION', label: 'Nutrition', accent: '#ffb77f' },
	{ value: 'WORKOUT_GUIDE', label: 'Workout Guide', accent: '#ddb7ff' },
	{ value: 'CHALLENGE', label: 'Challenge', accent: '#ff8a8a' },
	{ value: 'SUCCESS_STORY', label: 'Success Story', accent: '#66daba' },
];

const categoryAccent: Record<string, string> = {
	FITNESS_TIPS: '#00dce5',
	NUTRITION: '#ffb77f',
	WORKOUT_GUIDE: '#ddb7ff',
	CHALLENGE: '#ff8a8a',
	SUCCESS_STORY: '#66daba',
};

const Community: NextPage = ({ initialInput, ...props }: T) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const { query } = router;
	const articleCategory = query?.articleCategory as string;
	const [searchCommunity, setSearchCommunity] = useState<BoardArticlesInquiry>(initialInput);
	const [boardArticles, setBoardArticles] = useState<BoardArticle[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);
	const [activeSort, setActiveSort] = useState<string>('createdAt');

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

	const activeCategory = searchCommunity.search.articleCategory ?? 'ALL';

	/** LIFECYCLES **/
	useEffect(() => {
		if (articleCategory && articleCategory !== activeCategory) {
			setSearchCommunity({
				...searchCommunity,
				page: 1,
				search: articleCategory === 'ALL' ? {} : { articleCategory: articleCategory as BoardArticleCategory },
			});
		}
	}, [articleCategory]);

	/** HANDLERS **/
	const tabChangeHandler = async (value: string) => {
		setSearchCommunity({
			...searchCommunity,
			page: 1,
			search: value === 'ALL' ? {} : { articleCategory: value as BoardArticleCategory },
		});
		await router.push({ pathname: '/community', query: { articleCategory: value } }, router.pathname, { shallow: true });
	};

	const sortHandler = (sort: string) => {
		setActiveSort(sort);
		setSearchCommunity({ ...searchCommunity, page: 1, sort });
	};

	const paginationHandler = (e: T, value: number) => {
		setSearchCommunity({ ...searchCommunity, page: value });
	};

	const likeArticleHandler = async (e: any, id: string) => {
		try {
			e.stopPropagation();
			if (!id) return;
			if (!user?._id) throw new Error(Messages.error2);
			setBoardArticles((prev: any[]) =>
				prev.map((a: any) => {
					if (a._id !== id) return a;
					const wasLiked = !!a.meLiked?.[0]?.myFavorite;
					return {
						...a,
						articleLikes: (a.articleLikes ?? 0) + (wasLiked ? -1 : 1),
						meLiked: wasLiked ? [] : [{ memberId: user._id, likeRefId: id, myFavorite: true }],
					};
				}),
			);
			await likeTargetBoardArticle({ variables: { input: id } });
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const pushDetailHandler = (articleId: string) => {
		router.push({ pathname: '/community/detail', query: { id: articleId } });
	};

	const sortOptions = [
		{ value: 'createdAt', label: 'Newest' },
		{ value: 'articleViews', label: 'Most Viewed' },
		{ value: 'articleLikes', label: 'Most Liked' },
	];

	return (
		<div className="wl-page">
			<div className="lp-container">
				{/* Hero */}
				<div className="wl-hero">
					<div className="wl-hero-glow" />
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px', flexWrap: 'wrap' }}>
						<div>
							<span className="lp-eyebrow lp-eyebrow--violet">Community</span>
							<h1 className="wl-title">
								Knowledge from <span className="lp-grad">the floor</span>
							</h1>
							<p className="lp-sub" style={{ margin: 0 }}>
								Share your achievements, ask trainers, and connect with athletes.
							</p>
							<div className="wl-badge">
								<span className="wl-badge-dot" />
								<span>{totalCount > 0 ? `${totalCount} posts published` : 'Loading posts'}</span>
							</div>
						</div>
						{user?._id && (user?.memberType === 'TRAINER' || user?.memberType === 'ADMIN') && (
							<button
								className="lp-btn-primary"
								style={{ padding: '13px 26px', fontSize: '14px' }}
								onClick={() => router.push({ pathname: '/mypage', query: { category: 'writeArticle' } })}
							>
								Write Article →
							</button>
						)}
					</div>
				</div>

				{/* Filter console */}
				<div className="wl-console">
					<div className="wl-console-row">
						<div className="wl-muscles" style={{ flex: 1 }}>
							{categories.map((cat) => {
								const isActive = activeCategory === cat.value;
								return (
									<button
										key={cat.value}
										className="cl-cat-btn"
										style={
											isActive
												? { borderColor: `${cat.accent}80`, background: `${cat.accent}1c`, color: cat.accent }
												: undefined
										}
										onClick={() => tabChangeHandler(cat.value)}
									>
										<span className="cl-cat-dot" style={{ background: cat.accent }} />
										{cat.label}
									</button>
								);
							})}
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

				{/* Articles */}
				{loading && !boardArticles.length ? (
					<div className="cm-list">
						{[1, 2, 3].map((i) => (
							<div key={i} className="wl-skel" style={{ display: 'flex', gap: '20px', padding: '18px' }}>
								<div className="wl-skel-img" style={{ width: '200px', aspectRatio: '16/10', borderRadius: '11px', flex: 'none' }} />
								<div style={{ flex: 1 }}>
									<div className="wl-skel-line" style={{ width: '40%' }} />
									<div className="wl-skel-line" />
									<div className="wl-skel-line" style={{ width: '70%' }} />
								</div>
							</div>
						))}
					</div>
				) : boardArticles.length === 0 ? (
					<div className="wl-empty">
						<span className="wl-empty-label">No posts</span>
						<h3>Nothing in this category yet.</h3>
						<p>Be the first to start the conversation.</p>
					</div>
				) : (
					<div className="cm-list">
						{boardArticles.map((article) => {
							const accent = categoryAccent[article.articleCategory] || '#00dce5';
							return (
								<div
									key={article._id}
									className="cm-row"
									style={{ ['--accent' as any]: accent }}
									onClick={() => pushDetailHandler(article._id)}
								>
									{article.articleImage && (
										<div className="cm-thumb">
											<img src={`${REACT_APP_API_URL}/${article.articleImage}`} alt={article.articleTitle} loading="lazy" />
										</div>
									)}

									<div className="cm-body">
										<div className="cm-meta-top">
											<span className="lp-chip" style={{ background: `${accent}18`, borderColor: `${accent}30`, color: accent }}>
												{article.articleCategory?.replace(/_/g, ' ')}
											</span>
											{article.memberData && (
												<span className="cm-author">
													<img
														src={
															article.memberData.memberImage
																? `${REACT_APP_API_URL}/${article.memberData.memberImage}`
																: '/img/profile/defaultUser.svg'
														}
														alt={article.memberData.memberNick}
													/>
													<span>{article.memberData.memberNick}</span>
												</span>
											)}
											<span className="cm-date">{new Date(article.createdAt).toLocaleDateString()}</span>
										</div>
										<h3>{article.articleTitle}</h3>
										<p className="cm-excerpt">
											{article.articleContent
												?.replace(/<[^>]*>/g, '')
												.replace(/[\\#*_`>~\[\]]/g, ' ')
												.replace(/\s+/g, ' ')
												.trim()
												.slice(0, 220)}
										</p>
										<div className="cm-foot">
											<LikeButton
												liked={!!article.meLiked?.[0]?.myFavorite}
												count={article.articleLikes ?? 0}
												onClick={(e) => likeArticleHandler(e, article._id)}
											/>
											<span className="cm-stat">{article.articleViews ?? 0} views</span>
											<span className="cm-stat">{article.articleComments ?? 0} comments</span>
											<span className="cm-arrow">→</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}

				{/* Pagination */}
				{totalCount > searchCommunity.limit && (
					<Stack alignItems="center" style={{ marginTop: '48px' }}>
						<Pagination
							count={Math.ceil(totalCount / searchCommunity.limit)}
							page={searchCommunity.page}
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

Community.defaultProps = {
	initialInput: {
		page: 1,
		limit: 6,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withLayoutBasic(Community);
