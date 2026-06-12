import React from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { CircularProgress, Stack } from '@mui/material';
import { GET_BOARD_ARTICLE } from '../../../apollo/user/query';
import { T } from '../../types/common';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
const TuiEditor = dynamic(() => import('../community/Teditor'), { ssr: false });

const WriteArticle: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('mypage');
	const articleId = router.query?.articleId as string | undefined;

	const { data, loading } = useQuery(GET_BOARD_ARTICLE, {
		fetchPolicy: 'network-only',
		variables: { input: articleId },
		skip: !articleId,
	});
	const editArticle: T | undefined = articleId ? data?.getBoardArticle : undefined;
	const isEdit = !!articleId;

	return (
		<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
			<div className="nt-head">
				<div>
					<span className="lp-eyebrow lp-eyebrow--violet" style={{ marginBottom: '6px' }}>
						{t('articles.eyebrow')}
					</span>
					<h2>{isEdit ? t('articles.editTitle') : t('articles.writeTitle')}</h2>
				</div>
			</div>
			<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'rgba(185,202,202,0.6)', margin: '-8px 0 22px' }}>
				{isEdit ? t('articles.editSubtitle') : t('articles.writeSubtitle')}
			</p>
			{isEdit && (loading || !editArticle) ? (
				<Stack alignItems="center" sx={{ py: 8 }}>
					<CircularProgress size="2.4rem" sx={{ color: '#00dce5' }} />
				</Stack>
			) : (
				<TuiEditor key={articleId ?? 'new'} editArticle={editArticle} />
			)}
		</div>
	);
};

export default WriteArticle;
