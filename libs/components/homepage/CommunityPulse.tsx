import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import moment from 'moment';
import { useTranslation } from 'next-i18next';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import useReveal from '../../hooks/useReveal';
import QueryState from '../common/QueryState';

const ARTICLE_DATE_FORMAT = 'MMM D';

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
	const { t } = useTranslation('landing');
	const [articles, setArticles] = useState<ArticleItem[]>([]);
	const sectionRef = useReveal<HTMLElement>(articles.length > 0);

	const { loading, error, refetch } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 3, sort: 'createdAt', direction: 'DESC', search: {} } },
		onCompleted: (d: T) => setArticles(d?.getBoardArticles?.list ?? []),
	});

	if (!articles.length && !loading && !error) return null;
	if (!articles.length) {
		return (
			<section className="lp-section lp-query-section">
				<div className="lp-container">
					<QueryState loading={loading} error={error} onRetry={() => void refetch()} />
				</div>
			</section>
		);
	}

	return (
		<section ref={sectionRef} className="lp-section lp-reveal">
			<div className="lp-container">
				<div className="lp-section-head">
					<div>
						<span className="lp-eyebrow lp-eyebrow--violet">{t('community.eyebrow')}</span>
						<h2 className="lp-h2">{t('community.title')}</h2>
					</div>
					<button className="lp-view-btn" onClick={() => router.push('/community')}>
						{t('community.join')} →
					</button>
				</div>
				<QueryState loading={loading} error={error} hasData={articles.length > 0} onRetry={() => void refetch()} />

				<div className="lp-community-grid">
					{articles.map((article) => (
						<div
							key={article._id}
							className="lp-article-card"
							onClick={() => router.push({ pathname: '/community/detail', query: { id: article._id } })}
						>
							<span className="lp-article-cat">
								{t(`enums:articleCategory.${article.articleCategory}`, {
									defaultValue: article.articleCategory?.replace(/_/g, ' '),
								})}
							</span>
							<h3>{article.articleTitle}</h3>
							<div className="lp-article-meta">
								<span>{article.memberData?.memberNick ?? t('community.memberFallback')}</span>
								<span>
									{article.articleViews} {t('common:stats.views')} · ♥ {article.articleLikes} ·{' '}
									{moment(article.createdAt).format(ARTICLE_DATE_FORMAT)}
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
