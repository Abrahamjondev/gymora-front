import React, { useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Pagination, Stack } from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { T } from '../../types/common';
import { BoardArticle } from '../../types/board-article/board-article';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { Messages, REACT_APP_API_URL } from '../../config';
import { useRouter } from 'next/router';

const MyArticles: NextPage = ({ initialInput, ...props }: T) => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const router = useRouter();
	const [searchCommunity, setSearchCommunity] = useState({ ...initialInput, search: { memberId: user._id } });
	const [boardArticles, setBoardArticles] = useState<BoardArticle[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);

	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);

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

	const likeHandler = async (e: any, id: string) => {
		try {
			e.stopPropagation();
			if (!id || !user?._id) throw new Error(Messages.error2);
			await likeTargetBoardArticle({ variables: { input: id } });
			const { data } = await refetch({ input: searchCommunity });
			if (data?.getBoardArticles?.list) setBoardArticles(data.getBoardArticles.list);
			await sweetTopSmallSuccessAlert('Success!', 750);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (device === 'mobile') return <div style={{ color: '#e5e2e3' }}>MY ARTICLES MOBILE</div>;

	return (
		<div>
			<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '8px' }}>My Articles</h2>
			<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#849495', marginBottom: '24px' }}>Articles you have written</p>

			{boardArticles?.length > 0 ? (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
					{boardArticles.map((article) => (
						<div
							key={article._id}
							onClick={() => router.push({ pathname: '/community/detail', query: { id: article._id } })}
							style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', cursor: 'pointer', display: 'flex', gap: '16px', transition: 'all 0.2s' }}
							onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,220,229,0.3)')}
							onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)')}
						>
							{article.articleImage && (
								<div style={{ width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
									<img src={`${REACT_APP_API_URL}/${article.articleImage}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
								</div>
							)}
							<div style={{ flex: 1 }}>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00f5ff', textTransform: 'uppercase' }}>{article.articleCategory?.replace('_', ' ')}</span>
								<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3', margin: '4px 0 8px' }}>{article.articleTitle}</h4>
								<div style={{ display: 'flex', gap: '16px' }}>
									<span onClick={(e) => likeHandler(e, article._id)} style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: article.meLiked?.[0]?.myFavorite ? '#ff8a00' : '#849495', cursor: 'pointer' }}>
										{article.meLiked?.[0]?.myFavorite ? '♥' : '♡'} {article.articleLikes ?? 0}
									</span>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#849495' }}>👁 {article.articleViews ?? 0}</span>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#849495' }}>{article.articleStatus}</span>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div style={{ textAlign: 'center', padding: '40px', color: '#849495' }}>
					<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px' }}>No articles found.</p>
				</div>
			)}

			{totalCount > searchCommunity.limit && (
				<Stack alignItems="center" sx={{ mt: 3 }}>
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
				</Stack>
			)}
		</div>
	);
};

MyArticles.defaultProps = {
	initialInput: { page: 1, limit: 6, sort: 'createdAt', direction: 'DESC', search: {} },
};

export default MyArticles;
