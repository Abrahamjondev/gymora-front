import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { CircularProgress, Pagination, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { Comment } from '../../libs/types/comment/comment';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { CommentUpdate } from '../../libs/types/comment/comment.update';
import { T } from '../../libs/types/common';
import LikeButton from '../../libs/components/common/LikeButton';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_BOARD_ARTICLE, GET_COMMENTS } from '../../apollo/user/query';
import { CREATE_COMMENT, LIKE_TARGET_BOARD_ARTICLE, UPDATE_COMMENT } from '../../apollo/user/mutation';
import { REMOVE_COMMENT_BY_ADMIN } from '../../apollo/admin/mutation';
import { Messages, REACT_APP_API_URL, appLocale } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { notifyMember } from '../../libs/notify';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetMixinSuccessAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import dynamic from 'next/dynamic';
import QueryState from '../../libs/components/common/QueryState';

const ToastViewerComponent = dynamic(() => import('../../libs/components/community/TViewer'), { ssr: false });

const dateFormatOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'community', 'enums'])),
	},
});

const CommunityDetail: NextPage = ({ initialInput, ...props }: T) => {
	const { t } = useTranslation('community');
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const articleId = router.query?.id as string;

	const [boardArticle, setBoardArticle] = useState<BoardArticle | null>(null);
	const [comments, setComments] = useState<Comment[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [comment, setComment] = useState<string>('');
	const [searchFilter, setSearchFilter] = useState<CommentsInquiry>({ ...initialInput });
	const [likeLoading, setLikeLoading] = useState<boolean>(false);

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);
	const [createComment] = useMutation(CREATE_COMMENT);
	const [updateComment] = useMutation(UPDATE_COMMENT);
	const [removeCommentByAdmin] = useMutation(REMOVE_COMMENT_BY_ADMIN);

	const {
		loading: articleLoading,
		error: articleError,
		refetch: articleRefetch,
	} = useQuery(GET_BOARD_ARTICLE, {
		fetchPolicy: 'network-only',
		variables: { input: articleId },
		skip: !articleId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: any) => {
			setBoardArticle(data?.getBoardArticle);
		},
	});

	const {
		loading: commentsLoading,
		error: commentsError,
		refetch: commentsRefetch,
	} = useQuery(GET_COMMENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: searchFilter },
		skip: !searchFilter.search.commentRefId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: any) => {
			setComments(data?.getComments?.list ?? []);
			setTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (articleId) setSearchFilter({ ...searchFilter, search: { commentRefId: articleId } });
	}, [articleId]);

	/** HANDLERS **/
	const likeBoardArticleHandler = async () => {
		try {
			if (likeLoading) return;
			if (!articleId) return;
			if (!user?._id) throw new Error(Messages.error2);
			setLikeLoading(true);
			const wasLiked = !!boardArticle?.meLiked?.[0]?.myFavorite;
			setBoardArticle((prev: any) => ({
				...prev,
				articleLikes: (prev.articleLikes ?? 0) + (wasLiked ? -1 : 1),
				meLiked: wasLiked ? [] : [{ memberId: user._id, likeRefId: articleId, myFavorite: true }],
			}));
			await likeTargetBoardArticle({ variables: { input: articleId } });
			if (!wasLiked) notifyMember((boardArticle as any)?.memberId, user._id, 'SYSTEM', 'New like on your article', `${user.memberNick} liked "${boardArticle?.articleTitle}"`);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		} finally {
			setLikeLoading(false);
		}
	};

	const createCommentHandler = async () => {
		if (!comment) return;
		try {
			if (!user?._id) throw new Error(Messages.error2);
			const commentInput: CommentInput = { commentGroup: CommentGroup.ARTICLE, commentRefId: articleId, commentContent: comment };
			await createComment({ variables: { input: commentInput } });
			notifyMember((boardArticle as any)?.memberId, user._id, 'SYSTEM', 'New comment on your article', `${user.memberNick} commented on "${boardArticle?.articleTitle}"`);
			const { data: cd } = await commentsRefetch({ input: searchFilter });
			if (cd?.getComments) { setComments(cd.getComments.list ?? []); setTotal(cd.getComments.metaCounter?.[0]?.total ?? 0); }
			const { data: ad } = await articleRefetch({ input: articleId });
			if (ad?.getBoardArticle) setBoardArticle(ad.getBoardArticle);
			setComment('');
			await sweetMixinSuccessAlert(t('alerts.commentPosted'));
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	};

	const deleteCommentHandler = async (commentId: string, isOwn: boolean) => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (await sweetConfirmAlert(t('alerts.deleteCommentConfirm'))) {
				if (isOwn) {
					const updateData: CommentUpdate = { _id: commentId, commentStatus: CommentStatus.DELETE };
					await updateComment({ variables: { input: updateData } });
				} else {
					// Admin moderation — backend removeCommentByAdmin
					await removeCommentByAdmin({ variables: { input: commentId } });
				}
				const { data: cd } = await commentsRefetch({ input: searchFilter });
				if (cd?.getComments) { setComments(cd.getComments.list ?? []); setTotal(cd.getComments.metaCounter?.[0]?.total ?? 0); }
				await sweetMixinSuccessAlert(t('alerts.deleted'));
			}
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	};

	const paginationHandler = (e: T, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const goMemberPage = (id: any, memberType?: string) => {
		if (id === user?._id) router.push('/mypage');
		else if (memberType === 'TRAINER') router.push({ pathname: '/trainer/detail', query: { id } });
		else router.push(`/member?memberId=${id}`);
	};

	const categoryAccent: Record<string, string> = {
		FITNESS_TIPS: '#00dce5',
		NUTRITION: '#ffb77f',
		WORKOUT_GUIDE: '#ddb7ff',
		CHALLENGE: '#ff8a8a',
		SUCCESS_STORY: '#66daba',
	};

	/** LOADING **/
	if (articleLoading) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#131314' }}>
				<CircularProgress size={'4rem'} sx={{ color: '#00dce5' }} />
			</Stack>
		);
	}

	if (articleError) {
		return (
			<Stack sx={{ justifyContent: 'center', width: '100%', minHeight: '70vh', background: '#131314' }}>
				<div className="lp-container">
					<QueryState error={articleError} onRetry={() => void articleRefetch({ input: articleId })} />
				</div>
			</Stack>
		);
	}

	if (!boardArticle) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#0d0d0e' }}>
				<p style={{ color: '#b9caca', fontFamily: 'Hanken Grotesk', fontSize: '18px' }}>{t('detail.notFound')}</p>
			</Stack>
		);
	}

	const accent = categoryAccent[boardArticle.articleCategory] || '#00dce5';
	const wordCount = boardArticle.articleContent?.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length ?? 0;
	const readMinutes = Math.max(1, Math.round(wordCount / 200));

	return (
		<div className="wd-page">
			<div style={{ maxWidth: '800px', margin: '0 auto', padding: '36px 24px 96px' }}>
				<button className="wd-back" style={{ marginBottom: '28px' }} onClick={() => router.push('/community')}>
					{t('detail.back')}
				</button>

				{/* Meta row */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
					<span className="lp-chip" style={{ background: `${accent}18`, borderColor: `${accent}35`, color: accent }}>
						{boardArticle.articleCategory ? t(`enums:articleCategory.${boardArticle.articleCategory}`) : ''}
					</span>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10.5px', color: 'rgba(185,202,202,0.5)' }}>
						{new Date(boardArticle.createdAt).toLocaleDateString(appLocale(), dateFormatOptions)}
					</span>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10.5px', color: 'rgba(185,202,202,0.5)' }}>{t('common:stats.minRead', { count: readMinutes })}</span>
				</div>

				{/* Title */}
				<h1
					style={{
						fontFamily: 'Hanken Grotesk',
						fontSize: 'clamp(30px, 4.5vw, 44px)',
						lineHeight: 1.12,
						letterSpacing: '-0.025em',
						fontWeight: 800,
						color: '#ffffff',
						marginBottom: '22px',
					}}
				>
					{boardArticle.articleTitle}
				</h1>

				{/* Author card */}
				{boardArticle.memberData && (
					<div
						onClick={() => goMemberPage(boardArticle.memberData?._id, boardArticle.memberData?.memberType)}
						style={{ display: 'inline-flex', alignItems: 'center', gap: '11px', marginBottom: '26px', cursor: 'pointer' }}
					>
						<img
							src={boardArticle.memberData.memberImage ? `${REACT_APP_API_URL}/${boardArticle.memberData.memberImage}` : '/img/profile/defaultUser.svg'}
							alt=""
							style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(0,220,229,0.35)' }}
						/>
						<div>
							<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14.5px', fontWeight: 700, color: '#ffffff', display: 'block' }}>
								{boardArticle.memberData.memberNick}
							</span>
							<span className={`td-person-type${boardArticle.memberData.memberType === 'TRAINER' ? ' is-trainer' : ''}`} style={{ marginTop: '3px', display: 'inline-block' }}>
								{boardArticle.memberData.memberType ? t(`enums:memberType.${boardArticle.memberData.memberType}`) : ''}
							</span>
						</div>
					</div>
				)}

				{/* Image */}
				{boardArticle.articleImage && (
					<div style={{ borderRadius: '18px', overflow: 'hidden', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.07)' }}>
						<img src={`${REACT_APP_API_URL}/${boardArticle.articleImage}`} alt={boardArticle.articleTitle} style={{ width: '100%', height: 'auto', display: 'block' }} />
					</div>
				)}

				{/* Stats bar */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '20px',
						marginBottom: '30px',
						padding: '14px 18px',
						borderRadius: '14px',
						background: 'rgba(255,255,255,0.02)',
						border: '1px solid rgba(255,255,255,0.06)',
					}}
				>
					<LikeButton liked={!!boardArticle.meLiked?.[0]?.myFavorite} count={boardArticle.articleLikes ?? 0} onClick={likeBoardArticleHandler} />
					<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13.5px', fontWeight: 600, color: 'rgba(213,226,226,0.75)' }}>
						<b style={{ color: '#ffffff' }}>{boardArticle.articleViews ?? 0}</b> {t('common:stats.views')}
					</span>
					<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '13.5px', fontWeight: 600, color: 'rgba(213,226,226,0.75)' }}>
						<b style={{ color: '#ffffff' }}>{total}</b> {t('common:stats.comments')}
					</span>
				</div>

				{/* Content */}
				<div style={{ marginBottom: '48px', color: '#cddada', fontFamily: 'Hanken Grotesk', fontSize: '16px', lineHeight: '1.8' }}>
					<ToastViewerComponent markdown={boardArticle.articleContent} className={'ytb_play'} />
				</div>

				{/* Comments */}
				<div className="wd-section">
					<div className="wd-section-head">
						<h3>{t('detail.commentsTitle')}</h3>
						<span className="wd-section-count">{t('detail.commentsTotal', { count: total })}</span>
					</div>

					{/* Input */}
					<div className="wd-form-card">
						<div style={{ display: 'flex', gap: '12px' }}>
							<input
								className="wd-input"
								style={{ flex: 1 }}
								value={comment}
								onChange={(e) => {
									if (e.target.value.length <= 100) setComment(e.target.value);
								}}
								onKeyDown={(e) => e.key === 'Enter' && createCommentHandler()}
								placeholder={t('detail.commentPlaceholder')}
							/>
							<button className="wd-btn" onClick={createCommentHandler} disabled={!comment}>
								{t('common:actions.post')}
							</button>
						</div>
					</div>

					<QueryState
						loading={commentsLoading}
						error={commentsError}
						hasData={comments.length > 0}
						onRetry={() => void commentsRefetch({ input: searchFilter })}
					/>

					{/* List */}
					{comments.map((c) => (
						<div key={c._id} className="wd-comment">
							<img
								src={c.memberData?.memberImage ? `${REACT_APP_API_URL}/${c.memberData.memberImage}` : '/img/profile/defaultUser.svg'}
								alt=""
								onClick={() => goMemberPage(c.memberData?._id, (c.memberData as any)?.memberType)}
								style={{ cursor: 'pointer' }}
							/>
							<div className="wd-comment-body">
								<div className="wd-comment-head">
									<span
										className="wd-comment-nick"
										onClick={() => goMemberPage(c.memberData?._id, (c.memberData as any)?.memberType)}
										style={{ cursor: 'pointer' }}
									>
										{c.memberData?.memberNick ?? t('detail.anonymous')}
									</span>
									<span className="wd-comment-date">{new Date(c.createdAt).toLocaleDateString(appLocale())}</span>
									{(c.memberId === user?._id || user?.memberType === 'ADMIN') && (
										<button className="nm-del" style={{ marginLeft: 'auto' }} onClick={() => deleteCommentHandler(c._id, c.memberId === user?._id)}>
											✕
										</button>
									)}
								</div>
								<p>{c.commentContent}</p>
							</div>
						</div>
					))}

					{comments.length === 0 && !commentsLoading && !commentsError && <p className="wd-empty-line">{t('detail.emptyComments')}</p>}

					{total > searchFilter.limit && (
						<Stack alignItems="center" sx={{ mt: 3 }}>
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
		</div>
	);
};

CommunityDetail.defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: { commentRefId: '' },
	},
};

export default withLayoutBasic(CommunityDetail);
