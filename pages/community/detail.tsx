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
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_BOARD_ARTICLE, GET_COMMENTS } from '../../apollo/user/query';
import { CREATE_COMMENT, LIKE_TARGET_BOARD_ARTICLE, UPDATE_COMMENT } from '../../apollo/user/mutation';
import { Messages, REACT_APP_API_URL } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetMixinSuccessAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import dynamic from 'next/dynamic';

const ToastViewerComponent = dynamic(() => import('../../libs/components/community/TViewer'), { ssr: false });

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const CommunityDetail: NextPage = ({ initialInput, ...props }: T) => {
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

	const {
		loading: articleLoading,
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
			const { data: cd } = await commentsRefetch({ input: searchFilter });
			if (cd?.getComments) { setComments(cd.getComments.list ?? []); setTotal(cd.getComments.metaCounter?.[0]?.total ?? 0); }
			const { data: ad } = await articleRefetch({ input: articleId });
			if (ad?.getBoardArticle) setBoardArticle(ad.getBoardArticle);
			setComment('');
			await sweetMixinSuccessAlert('Comment posted!');
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	};

	const deleteCommentHandler = async (commentId: string) => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (await sweetConfirmAlert('Delete this comment?')) {
				const updateData: CommentUpdate = { _id: commentId, commentStatus: CommentStatus.DELETE };
				await updateComment({ variables: { input: updateData } });
				const { data: cd } = await commentsRefetch({ input: searchFilter });
				if (cd?.getComments) { setComments(cd.getComments.list ?? []); setTotal(cd.getComments.metaCounter?.[0]?.total ?? 0); }
				await sweetMixinSuccessAlert('Deleted!');
			}
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	};

	const paginationHandler = (e: T, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const goMemberPage = (id: any) => {
		if (id === user?._id) router.push('/mypage');
		else router.push(`/member?memberId=${id}`);
	};

	/** LOADING **/
	if (articleLoading) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#131314' }}>
				<CircularProgress size={'4rem'} sx={{ color: '#00dce5' }} />
			</Stack>
		);
	}

	if (device === 'mobile') {
		return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>GYMORA COMMUNITY DETAIL MOBILE</div>;
	}

	if (!boardArticle) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#131314' }}>
				<p style={{ color: '#b9caca', fontFamily: 'Hanken Grotesk', fontSize: '18px' }}>Article not found.</p>
			</Stack>
		);
	}

	return (
		<div style={{ background: '#131314', minHeight: '100vh', padding: '40px 0' }}>
			<div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
				{/* Category + Author */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
					<span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)', fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00f5ff', textTransform: 'uppercase' }}>
						{boardArticle.articleCategory?.replace('_', ' ')}
					</span>
					{boardArticle.memberData && (
						<span
							onClick={() => goMemberPage(boardArticle.memberData?._id)}
							style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#e9feff', cursor: 'pointer', fontWeight: 600 }}
						>
							{boardArticle.memberData.memberNick}
						</span>
					)}
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495' }}>
						{new Date(boardArticle.createdAt).toLocaleDateString()}
					</span>
				</div>

				{/* Title */}
				<h1 style={{ fontFamily: 'Hanken Grotesk', fontSize: '36px', lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: 800, color: '#e5e2e3', marginBottom: '24px' }}>
					{boardArticle.articleTitle}
				</h1>

				{/* Image */}
				{boardArticle.articleImage && (
					<div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
						<img src={`${REACT_APP_API_URL}/${boardArticle.articleImage}`} alt={boardArticle.articleTitle} style={{ width: '100%', height: 'auto' }} />
					</div>
				)}

				{/* Stats */}
				<div style={{ display: 'flex', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #3a494a' }}>
					<LikeButton
						liked={!!boardArticle.meLiked?.[0]?.myFavorite}
						count={boardArticle.articleLikes ?? 0}
						onClick={likeBoardArticleHandler}
					/>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: '#849495' }}>👁 {boardArticle.articleViews ?? 0}</span>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: '#849495' }}>💬 {total}</span>
				</div>

				{/* Content */}
				<div style={{ marginBottom: '40px', color: '#b9caca', fontFamily: 'Hanken Grotesk', fontSize: '16px', lineHeight: '28px' }}>
					<ToastViewerComponent markdown={boardArticle.articleContent} className={'ytb_play'} />
				</div>

				{/* Comments */}
				<div style={{ borderTop: '1px solid #3a494a', paddingTop: '32px' }}>
					<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 600, color: '#e5e2e3', marginBottom: '20px' }}>
						Comments ({total})
					</h3>

					{/* Input */}
					<div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
						<input
							value={comment}
							onChange={(e) => { if (e.target.value.length <= 100) setComment(e.target.value); }}
							onKeyDown={(e) => e.key === 'Enter' && createCommentHandler()}
							placeholder="Leave a comment..."
							style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid #3a494a', borderRadius: '8px', padding: '12px 16px', fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#e5e2e3', outline: 'none' }}
						/>
						<button onClick={createCommentHandler} style={{ background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
							Post
						</button>
					</div>

					{/* List */}
					{comments.map((c) => (
						<div key={c._id} style={{ padding: '16px 0', borderBottom: '1px solid rgba(58,73,74,0.3)' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
									<div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#2a2a2b' }}>
										<img
											src={c.memberData?.memberImage ? `${REACT_APP_API_URL}/${c.memberData.memberImage}` : '/img/profile/defaultUser.svg'}
											alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
										/>
									</div>
									<span onClick={() => goMemberPage(c.memberData?._id)} style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, color: '#e5e2e3', cursor: 'pointer' }}>
										{c.memberData?.memberNick ?? 'Anonymous'}
									</span>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495' }}>
										{new Date(c.createdAt).toLocaleDateString()}
									</span>
								</div>
								{c.memberId === user?._id && (
									<button onClick={() => deleteCommentHandler(c._id)} style={{ background: 'transparent', border: 'none', color: '#849495', cursor: 'pointer', fontSize: '16px' }}>
										×
									</button>
								)}
							</div>
							<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', lineHeight: '20px', color: '#b9caca', marginLeft: '44px' }}>
								{c.commentContent}
							</p>
						</div>
					))}

					{comments.length === 0 && !commentsLoading && (
						<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#849495', textAlign: 'center', padding: '24px 0' }}>No comments yet.</p>
					)}

					{total > searchFilter.limit && (
						<Stack alignItems="center" sx={{ mt: 3 }}>
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
