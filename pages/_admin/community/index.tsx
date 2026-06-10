import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { TablePagination } from '@mui/material';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { GET_BOARD_ARTICLES_BY_ADMIN } from '../../../apollo/admin/query';
import { DELETE_BOARD_ARTICLE_BY_ADMIN } from '../../../apollo/admin/mutation';
import { BoardArticle } from '../../../libs/types/board-article/board-article';
import { BoardArticleCategory } from '../../../libs/enums/board-article.enum';
import { T } from '../../../libs/types/common';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';

const categoryAccent: Record<string, string> = {
	FITNESS_TIPS: '#00dce5',
	NUTRITION: '#ffb77f',
	WORKOUT_GUIDE: '#ddb7ff',
	CHALLENGE: '#ff8a8a',
	SUCCESS_STORY: '#66daba',
};

const categories = ['ALL', 'FITNESS_TIPS', 'NUTRITION', 'WORKOUT_GUIDE', 'CHALLENGE', 'SUCCESS_STORY'];

const AdminCommunity: NextPage = ({ initialInquiry, ...props }: any) => {
	const router = useRouter();
	const [inquiry, setInquiry] = useState<any>(initialInquiry);
	const [articles, setArticles] = useState<BoardArticle[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [activeCategory, setActiveCategory] = useState<string>('ALL');

	// NOTE: backend exposes no getAllBoardArticlesByAdmin — list uses the public
	// getBoardArticles query; moderation happens via deleteBoardArticleByAdmin.
	const { loading, refetch } = useQuery(GET_BOARD_ARTICLES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setArticles(data?.getBoardArticles?.list ?? []);
			setTotal(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
		},
	});

	const [deleteArticle] = useMutation(DELETE_BOARD_ARTICLE_BY_ADMIN);

	useEffect(() => {
		refetch({ input: inquiry });
	}, [inquiry]);

	const categoryHandler = (cat: string) => {
		setActiveCategory(cat);
		setInquiry({
			...inquiry,
			page: 1,
			search: cat === 'ALL' ? {} : { articleCategory: cat as BoardArticleCategory },
		});
	};

	const handlePageChange = (e: unknown, newPage: number) => {
		setInquiry({ ...inquiry, page: newPage + 1 });
	};

	const handleRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInquiry({ ...inquiry, limit: parseInt(e.target.value, 10), page: 1 });
	};

	const deleteHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Delete this article?')) {
				await deleteArticle({ variables: { input: id } });
				await refetch({ input: inquiry });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	return (
		<div className="ad-page">
			<div className="ad-head">
				<h2>Community</h2>
				<span className="wd-section-count">{total} articles</span>
			</div>

			{/* Category filter */}
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '18px' }}>
				{categories.map((cat) => {
					const accent = categoryAccent[cat] || '#00dce5';
					const isActive = activeCategory === cat;
					return (
						<button
							key={cat}
							className="cl-cat-btn"
							style={isActive ? { borderColor: `${accent}80`, background: `${accent}1c`, color: accent } : undefined}
							onClick={() => categoryHandler(cat)}
						>
							{cat !== 'ALL' && <span className="cl-cat-dot" style={{ background: accent }} />}
							{cat === 'ALL' ? 'All' : cat.replace(/_/g, ' ')}
						</button>
					);
				})}
			</div>

			<div className="ad-table-wrap">
				<table className="ad-table">
					<thead>
						<tr>
							{['Category', 'Title', 'Author', 'Views', 'Likes', 'Comments', 'Date', 'Actions'].map((h) => (
								<th key={h}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{articles.map((a) => {
							const accent = categoryAccent[a.articleCategory] || '#00dce5';
							return (
								<tr key={a._id}>
									<td>
										<span
											className="ad-chip"
											style={{ ['--adc' as any]: accent, ['--adc-bg' as any]: `${accent}14`, ['--adc-bd' as any]: `${accent}35` }}
										>
											{a.articleCategory?.replace(/_/g, ' ')}
										</span>
									</td>
									<td className="ad-strong" style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
										{a.articleTitle}
									</td>
									<td className="ad-mono">{a.memberData?.memberNick ?? '—'}</td>
									<td className="ad-mono">{a.articleViews ?? 0}</td>
									<td className="ad-mono">{a.articleLikes ?? 0}</td>
									<td className="ad-mono">{a.articleComments ?? 0}</td>
									<td className="ad-mono">{new Date(a.createdAt).toLocaleDateString()}</td>
									<td>
										<div className="ad-actions">
											<button className="ad-btn" onClick={() => router.push({ pathname: '/community/detail', query: { id: a._id } })}>
												Open
											</button>
											<button className="ad-btn is-danger" onClick={() => deleteHandler(a._id)}>
												Delete
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
				{!loading && articles.length === 0 && <div className="ad-empty">No articles found.</div>}
			</div>

			<TablePagination
				component="div"
				count={total}
				page={inquiry.page - 1}
				onPageChange={handlePageChange}
				rowsPerPage={inquiry.limit}
				onRowsPerPageChange={handleRowsPerPage}
				sx={{ color: '#b9caca', '& .MuiSvgIcon-root': { color: '#b9caca' } }}
			/>
		</div>
	);
};

AdminCommunity.defaultProps = {
	initialInquiry: { page: 1, limit: 10, sort: 'createdAt', direction: 'DESC', search: {} },
};

export default withAdminLayout(AdminCommunity);
