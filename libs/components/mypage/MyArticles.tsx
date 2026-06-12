import React, { useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Pagination, Stack } from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { T } from '../../types/common';
import { BoardArticle } from '../../types/board-article/board-article';
import { LIKE_TARGET_BOARD_ARTICLE, UPDATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { Messages, REACT_APP_API_URL } from '../../config';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

const categoryAccent: Record<string, string> = {
	FITNESS_TIPS: '#00dce5',
	NUTRITION: '#ffb77f',
	WORKOUT_GUIDE: '#ddb7ff',
	CHALLENGE: '#ff8a8a',
	SUCCESS_STORY: '#66daba',
};
const accentFor = (category: string) => categoryAccent[category] || '#00dce5';

const MyArticles: NextPage = ({ initialInput, ...props }: T) => {
	const device = useDeviceDetect();
	const { t } = useTranslation('mypage');
	const user = useReactiveVar(userVar);
	const router = useRouter();
	const [searchCommunity, setSearchCommunity] = useState({ ...initialInput, search: { memberId: user._id } });
	const [boardArticles, setBoardArticles] = useState<BoardArticle[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);

	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);
	const [updateBoardArticle] = useMutation(UPDATE_BOARD_ARTICLE);

	const { loading, refetch } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: searchCommunity },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setBoardArticles(data?.getBoardArticles?.list ?? []);
			setTotalCount(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
		},
	});

	const paginationHandler = (e: T, value: number) => {
		setSearchCommunity({ ...searchCommunity, page: value });
	};

	const editHandler = (e: any, id: string) => {
		e.stopPropagation();
		router.push({ pathname: '/mypage', query: { category: 'writeArticle', articleId: id } }, undefined, { shallow: true });
	};

	const deleteHandler = async (e: any, id: string) => {
		e.stopPropagation();
		try {
			if (!id || !user?._id) throw new Error(Messages.error2);
			if (!(await sweetConfirmAlert(t('alerts.deleteArticleConfirm')))) return;
			await updateBoardArticle({ variables: { input: { _id: id, articleStatus: 'DELETE' } } });
			const { data } = await refetch({ input: searchCommunity });
			setBoardArticles(data?.getBoardArticles?.list ?? []);
			setTotalCount(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
			await sweetTopSmallSuccessAlert(t('alerts.deleted'), 750);
		} catch (err: any) {
			sweetMixinErrorAlert(err?.graphQLErrors?.[0]?.message || err.message).then();
		}
	};

	const likeHandler = async (e: any, id: string) => {
		try {
			e.stopPropagation();
			if (!id || !user?._id) throw new Error(Messages.error2);
			await likeTargetBoardArticle({ variables: { input: id } });
			const { data } = await refetch({ input: searchCommunity });
			if (data?.getBoardArticles?.list) setBoardArticles(data.getBoardArticles.list);
			await sweetTopSmallSuccessAlert(t('alerts.success'), 750);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	return (
		<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
			<div className="nt-head">
				<div>
					<span className="lp-eyebrow lp-eyebrow--violet" style={{ marginBottom: '6px' }}>
						{t('articles.eyebrow')}
					</span>
					<h2>{t('articles.title')}</h2>
				</div>
				<div className="nt-tools">
					<span className="wd-section-count">{t('articles.publishedCount', { count: totalCount })}</span>
					<button className="wd-btn" style={{ padding: '11px 20px', fontSize: '13.5px' }} onClick={() => router.push({ pathname: '/mypage', query: { category: 'writeArticle' } }, undefined, { shallow: true })}>
						{t('articles.writeShortcut')}
					</button>
				</div>
			</div>

			{boardArticles?.length > 0 ? (
				<div className="cm-list">
					{boardArticles.map((article) => {
						const accent = accentFor(article.articleCategory);
						return (
							<div
								key={article._id}
								className="cm-row"
								style={{ ['--accent' as any]: accent }}
								onClick={() => router.push({ pathname: '/community/detail', query: { id: article._id } })}
							>
								{article.articleImage && (
									<div className="cm-thumb" style={{ width: '150px' }}>
										<img src={`${REACT_APP_API_URL}/${article.articleImage}`} alt="" loading="lazy" />
									</div>
								)}
								<div className="cm-body">
									<div className="cm-meta-top">
										<span className="lp-chip" style={{ background: `${accent}18`, borderColor: `${accent}30`, color: accent }}>
											{t(`enums:articleCategory.${article.articleCategory}`, { defaultValue: article.articleCategory?.replace(/_/g, ' ') })}
										</span>
										<span className="cm-date">{new Date(article.createdAt).toLocaleDateString()}</span>
									</div>
									<h3 style={{ fontSize: '17px' }}>{article.articleTitle}</h3>
									<div className="cm-foot">
										<span
											className="cm-stat"
											onClick={(e) => likeHandler(e, article._id)}
											style={{ cursor: 'pointer', color: article.meLiked?.[0]?.myFavorite ? '#ff8a8a' : undefined }}
										>
											{article.meLiked?.[0]?.myFavorite ? '♥' : '♡'} {article.articleLikes ?? 0}
										</span>
										<span className="cm-stat">{article.articleViews ?? 0} {t('common:stats.views')}</span>
										<span className="cm-stat">{article.articleComments ?? 0} {t('common:stats.comments')}</span>
										<button className="wl-active-chip" style={{ cursor: 'pointer', border: '1px solid rgba(0,220,229,0.35)', background: 'rgba(0,220,229,0.08)', color: '#00dce5' }} onClick={(e) => editHandler(e, article._id)}>
											{t('common:actions.edit')}
										</button>
										<button className="wl-active-chip" style={{ cursor: 'pointer', border: '1px solid rgba(255,138,138,0.35)', background: 'rgba(255,138,138,0.07)', color: '#ff8a8a' }} onClick={(e) => deleteHandler(e, article._id)}>
											{t('common:actions.delete')}
										</button>
										<span className="cm-arrow">→</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				!loading && (
					<div className="nt-empty">
						<div className="nt-empty-ic">▤</div>
						<h4>{t('articles.emptyTitle')}</h4>
						<p>{t('articles.emptyDesc')}</p>
					</div>
				)
			)}

			{totalCount > searchCommunity.limit && (
				<Stack alignItems="center" sx={{ mt: 3 }}>
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
	);
};

MyArticles.defaultProps = {
	initialInput: { page: 1, limit: 6, sort: 'createdAt', direction: 'DESC', search: {} },
};

export default MyArticles;
