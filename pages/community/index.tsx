import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Pagination, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import useUrlFilter from '../../libs/hooks/useUrlFilter';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { T } from '../../libs/types/common';
import LikeButton from '../../libs/components/common/LikeButton';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BoardArticlesInquiry } from '../../libs/types/board-article/board-article.input';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { Direction } from '../../libs/enums/common.enum';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../apollo/user/mutation';
import { Messages, REACT_APP_API_URL, appLocale } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { userVar } from '../../apollo/store';
import { notifyMember } from '../../libs/notify';
import QueryState from '../../libs/components/common/QueryState';
import FilterSelect from '../../libs/components/common/FilterSelect';
import DataLoadingOverlay from '../../libs/components/common/DataLoadingOverlay';
import ContentSkeletons from '../../libs/components/common/ContentSkeletons';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'community', 'enums'])),
	},
});

const categories = [
	{ value: 'ALL', accent: '#00dce5' },
	{ value: 'FITNESS_TIPS', accent: '#00dce5' },
	{ value: 'NUTRITION', accent: '#ffb77f' },
	{ value: 'WORKOUT_GUIDE', accent: '#ddb7ff' },
	{ value: 'CHALLENGE', accent: '#ff8a8a' },
	{ value: 'SUCCESS_STORY', accent: '#66daba' },
];

const DEFAULT_ACCENT = '#00dce5';

const COMMUNITY_DEFAULT_INPUT: BoardArticlesInquiry = {
	page: 1,
	limit: 6,
	sort: 'createdAt',
	direction: Direction.DESC,
	search: {},
};

const COMMUNITY_SORTS = ['createdAt', 'articleViews', 'articleLikes'] as const;

const categoryAccent: Record<string, string> = {
	FITNESS_TIPS: '#00dce5',
	NUTRITION: '#ffb77f',
	WORKOUT_GUIDE: '#ddb7ff',
	CHALLENGE: '#ff8a8a',
	SUCCESS_STORY: '#66daba',
};

const ArticleThumbnail = ({ src, alt }: { src?: string; alt: string }) => {
	const [failed, setFailed] = useState(false);

	if (!src || failed) return null;

	return (
		<div className="cm-thumb">
			<img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
		</div>
	);
};

const Community: NextPage = () => {
	const { t } = useTranslation('community');
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [searchCommunity, setSearchCommunity] = useUrlFilter<BoardArticlesInquiry>(COMMUNITY_DEFAULT_INPUT, '/community', {
		allowedSorts: COMMUNITY_SORTS,
		scrollTarget: 'list-results-start',
	});
	const [boardArticles, setBoardArticles] = useState<BoardArticle[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);

	const {
		loading,
		data,
		error,
		refetch: boardArticlesRefetch,
	} = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: searchCommunity },
		notifyOnNetworkStatusChange: true,
	});

	useEffect(() => {
		const result = data?.getBoardArticles;
		if (!result) return;
		setBoardArticles(result.list ?? []);
		setTotalCount(result.metaCounter?.[0]?.total ?? 0);
	}, [data]);

	// View-state derived from the URL-synced filter so a shared link / refresh reflects it.
	const activeCategory = searchCommunity.search.articleCategory ?? 'ALL';
	const activeSort = searchCommunity.sort ?? 'createdAt';

	/** HANDLERS **/
	const tabChangeHandler = (value: string) => {
		setSearchCommunity({
			...searchCommunity,
			page: 1,
			search: value === 'ALL' ? {} : { articleCategory: value as BoardArticleCategory },
		});
	};

	const sortHandler = (sort: string) => {
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
			const target: any = boardArticles.find((a) => a._id === id);
			if (target && !target.meLiked?.[0]?.myFavorite) {
				notifyMember(target.memberId, user._id, 'SYSTEM', 'New like on your article', `${user.memberNick} liked "${target.articleTitle}"`);
			}
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const pushDetailHandler = (articleId: string) => {
		router.push({ pathname: '/community/detail', query: { id: articleId } });
	};

	const sortOptions = [
		{ value: 'createdAt', label: t('list.sort.newest') },
		{ value: 'articleViews', label: t('list.sort.mostViewed') },
		{ value: 'articleLikes', label: t('list.sort.mostLiked') },
	];

	return (
		<div className="wl-page">
			<div className="lp-container">
				{/* Hero */}
				<div className="wl-hero">
					<div className="wl-hero-glow" />
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px', flexWrap: 'wrap' }}>
						<div>
							<span className="lp-eyebrow lp-eyebrow--violet">{t('list.eyebrow')}</span>
							<h1 className="wl-title">
								{t('list.titleLead')} <span className="lp-grad">{t('list.titleAccent')}</span>
							</h1>
							<p className="lp-sub" style={{ margin: 0 }}>
								{t('list.subtitle')}
							</p>
							<div className="wl-badge">
								<span className="wl-badge-dot" />
								<span>{totalCount > 0 ? t('list.postsPublished', { count: totalCount }) : t('list.loadingPosts')}</span>
							</div>
						</div>
						{user?._id && (user?.memberType === 'TRAINER' || user?.memberType === 'ADMIN') && (
							<button
								className="lp-btn-primary"
								style={{ padding: '13px 26px', fontSize: '14px' }}
								onClick={() => router.push({ pathname: '/mypage', query: { category: 'writeArticle' } })}
							>
								{t('list.writeArticle')}
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
										{cat.value === 'ALL' ? t('list.allPosts') : t(`enums:articleCategory.${cat.value}`)}
									</button>
								);
							})}
						</div>
						<FilterSelect value={activeSort} options={sortOptions} ariaLabel={t('list.sort.newest')} onChange={sortHandler} />
					</div>
				</div>

				<QueryState loading={loading} error={error} hasData={boardArticles.length > 0} onRetry={() => void boardArticlesRefetch({ input: searchCommunity })} />

				{/* Articles */}
				<div className={`wl-data-shell${loading && boardArticles.length ? ' is-fetching' : ''}`} aria-busy={loading}>
					{loading && !boardArticles.length ? (
						<ContentSkeletons variant="article" />
					) : boardArticles.length === 0 ? (
					<div className="wl-empty">
						<span className="wl-empty-label">{t('list.empty.label')}</span>
						<h3>{t('list.empty.title')}</h3>
						<p>{t('list.empty.subtitle')}</p>
					</div>
					) : (
					<div className={`cm-list${loading ? ' is-fetching' : ''}`}>
						{boardArticles.map((article) => {
							const accent = categoryAccent[article.articleCategory] || DEFAULT_ACCENT;
							return (
								<div
									key={article._id}
									className="cm-row"
									style={{ ['--accent' as any]: accent }}
									onClick={() => pushDetailHandler(article._id)}
								>
									<ArticleThumbnail
										src={article.articleImage ? `${REACT_APP_API_URL}/${article.articleImage}` : undefined}
										alt={article.articleTitle}
									/>

									<div className="cm-body">
										<div className="cm-meta-top">
											<span className="lp-chip" style={{ background: `${accent}18`, borderColor: `${accent}30`, color: accent }}>
												{article.articleCategory ? t(`enums:articleCategory.${article.articleCategory}`) : ''}
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
															onError={(event) => {
																event.currentTarget.onerror = null;
																event.currentTarget.src = '/img/profile/defaultUser.svg';
															}}
														/>
													<span>{article.memberData.memberNick}</span>
												</span>
											)}
											<span className="cm-date">{new Date(article.createdAt).toLocaleDateString(appLocale())}</span>
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
											<span className="cm-stat">{article.articleViews ?? 0} {t('common:stats.views')}</span>
											<span className="cm-stat">{article.articleComments ?? 0} {t('common:stats.comments')}</span>
											<span className="cm-arrow">→</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
					)}
					{loading && <DataLoadingOverlay label={t('common:actions.loading')} />}
				</div>

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

export default withLayoutBasic(Community);
