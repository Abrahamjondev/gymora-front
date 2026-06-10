import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import moment from 'moment';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import useReveal from '../../hooks/useReveal';

interface ArticleItem {
	_id: string;
	articleCategory: string;
	articleTitle: string;
	articleViews: number;
	articleLikes: number;
	createdAt: string;
	memberData?: { memberNick: string };
}

const CommunityPulse = () => {
	const router = useRouter();
	const [articles, setArticles] = useState<ArticleItem[]>([]);
	const sectionRef = useReveal<HTMLElement>(articles.length > 0);

	useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 3, sort: 'createdAt', direction: 'DESC', search: {} } },
		onCompleted: (d: T) => setArticles(d?.getBoardArticles?.list ?? []),
	});

	if (!articles.length) return null;

	return (
		<section ref={sectionRef} className="lp-section lp-reveal">
			<div className="lp-container">
				<div className="lp-section-head">
					<div>
						<span className="lp-eyebrow lp-eyebrow--violet">Community pulse</span>
						<h2 className="lp-h2">Knowledge from the floor</h2>
					</div>
					<button className="lp-view-btn" onClick={() => router.push('/community')}>
						Join the conversation →
					</button>
				</div>

				<div className="lp-community-grid">
					{articles.map((article) => (
						<div
							key={article._id}
							className="lp-article-card"
							onClick={() => router.push({ pathname: '/community/detail', query: { id: article._id } })}
						>
							<span className="lp-article-cat">{article.articleCategory?.replace(/_/g, ' ')}</span>
							<h3>{article.articleTitle}</h3>
							<div className="lp-article-meta">
								<span>{article.memberData?.memberNick ?? 'Member'}</span>
								<span>
									{article.articleViews} views · ♥ {article.articleLikes} · {moment(article.createdAt).format('MMM D')}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default CommunityPulse;
