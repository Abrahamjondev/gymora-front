import React, { useState } from 'react';
import Link from 'next/link';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { BoardArticle } from '../../types/board-article/board-article';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { useQuery } from '@apollo/client';
import { T } from '../../types/common';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { useRouter } from 'next/router';

const CommunityBoards = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const [searchCommunity] = useState({
		page: 1,
		sort: 'articleViews',
		direction: 'DESC',
	});
	const [workoutGuideArticles, setWorkoutGuideArticles] = useState<BoardArticle[]>([]);
	const [fitnessTipsArticles, setFitnessTipsArticles] = useState<BoardArticle[]>([]);

	/** APOLLO REQUESTS **/
	useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: { ...searchCommunity, limit: 3, search: { articleCategory: BoardArticleCategory.WORKOUT_GUIDE } } },
		onCompleted: (data: T) => {
			setWorkoutGuideArticles(data?.getBoardArticles?.list ?? []);
		},
	});

	useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: { ...searchCommunity, limit: 3, search: { articleCategory: BoardArticleCategory.FITNESS_TIPS } } },
		onCompleted: (data: T) => {
			setFitnessTipsArticles(data?.getBoardArticles?.list ?? []);
		},
	});

	const allArticles = [...workoutGuideArticles, ...fitnessTipsArticles];

	if (!allArticles.length) return null;

	if (device === 'mobile') {
		return <div style={{ padding: '24px', color: '#b9caca' }}>GYMORA COMMUNITY MOBILE</div>;
	}

	return (
		<section style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
				<div>
					<span
						style={{
							fontFamily: 'JetBrains Mono, monospace',
							fontSize: '11px',
							letterSpacing: '0.2em',
							color: '#00f5ff',
							fontWeight: 500,
							textTransform: 'uppercase',
							display: 'block',
							marginBottom: '8px',
						}}
					>
						community
					</span>
					<h2
						style={{
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontSize: '32px',
							lineHeight: '40px',
							letterSpacing: '-0.01em',
							fontWeight: 700,
							color: '#e5e2e3',
						}}
					>
						Latest from the Community
					</h2>
				</div>
				<Link
					href="/community"
					style={{
						color: '#e9feff',
						fontFamily: 'Hanken Grotesk, sans-serif',
						fontWeight: 700,
						fontSize: '14px',
						textDecoration: 'none',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					View All →
				</Link>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
				{allArticles.slice(0, 6).map((article) => (
					<div
						key={article._id}
						onClick={() => router.push({ pathname: '/community/detail', query: { id: article._id } })}
						style={{
							background: 'rgba(255,255,255,0.03)',
							border: '1px solid rgba(255,255,255,0.08)',
							borderRadius: '12px',
							padding: '20px',
							cursor: 'pointer',
							transition: 'all 0.3s',
						}}
						onMouseOver={(e) => {
							(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
							(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,220,229,0.3)';
						}}
						onMouseOut={(e) => {
							(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
							(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
						}}
					>
						<span
							style={{
								fontFamily: 'JetBrains Mono, monospace',
								fontSize: '10px',
								color: '#00f5ff',
								textTransform: 'uppercase',
								letterSpacing: '0.1em',
								background: 'rgba(0,245,255,0.1)',
								padding: '2px 8px',
								borderRadius: '4px',
								border: '1px solid rgba(0,245,255,0.2)',
								display: 'inline-block',
								marginBottom: '12px',
							}}
						>
							{article.articleCategory?.replace('_', ' ')}
						</span>
						<h4
							style={{
								fontFamily: 'Hanken Grotesk, sans-serif',
								fontSize: '18px',
								fontWeight: 600,
								color: '#e5e2e3',
								lineHeight: '24px',
								marginBottom: '8px',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{article.articleTitle}
						</h4>
						<div style={{ display: 'flex', gap: '16px' }}>
							<span style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '13px', color: '#849495' }}>
								{article.articleViews ?? 0} views
							</span>
							<span style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '13px', color: '#849495' }}>
								{article.articleLikes ?? 0} likes
							</span>
						</div>
					</div>
				))}
			</div>
		</section>
	);
};

export default CommunityBoards;
