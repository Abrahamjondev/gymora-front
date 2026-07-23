import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { Editor } from '@toast-ui/react-editor';
import { getJwtToken } from '../../auth';
import { REACT_APP_API_URL } from '../../config';
import { useRouter } from 'next/router';
import axios from 'axios';
import { T } from '../../types/common'; //@ts-ignore
import '@toast-ui/editor/dist/toastui-editor.css'; //@ts-ignore
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { CREATE_BOARD_ARTICLE, UPDATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { getErrorMessage, sweetErrorHandling, sweetMixinErrorAlert, sweetTopSuccessAlert } from '../../sweetAlert';

const categories: { value: BoardArticleCategory; label: string; accent: string }[] = [
	{ value: BoardArticleCategory.FITNESS_TIPS, label: 'Fitness Tips', accent: '#00dce5' },
	{ value: BoardArticleCategory.NUTRITION, label: 'Nutrition', accent: '#ffb77f' },
	{ value: BoardArticleCategory.WORKOUT_GUIDE, label: 'Workout Guide', accent: '#ddb7ff' },
	{ value: BoardArticleCategory.CHALLENGE, label: 'Challenge', accent: '#ff8a8a' },
	{ value: BoardArticleCategory.SUCCESS_STORY, label: 'Success Story', accent: '#66daba' },
];

const labelStyle: React.CSSProperties = {
	fontFamily: 'JetBrains Mono, monospace',
	fontSize: '10px',
	letterSpacing: '0.08em',
	color: '#9aabab',
	textTransform: 'uppercase',
	display: 'block',
	marginBottom: '8px',
};

const TuiEditor = ({ editArticle }: { editArticle?: T }) => {
	const { t } = useTranslation('mypage');
	const editorRef = useRef<Editor>(null),
		token = getJwtToken(),
		router = useRouter();
	const isEdit = !!editArticle?._id;
	const [articleCategory, setArticleCategory] = useState<BoardArticleCategory>(
		editArticle?.articleCategory ?? BoardArticleCategory.FITNESS_TIPS,
	);
	const [articleTitle, setArticleTitle] = useState(editArticle?.articleTitle ?? '');
	const [publishing, setPublishing] = useState(false);

	/** APOLLO REQUESTS **/
	const [createBoardArticle] = useMutation(CREATE_BOARD_ARTICLE);
	const [updateBoardArticle] = useMutation(UPDATE_BOARD_ARTICLE);

	// Prefill content in edit mode once the editor instance is mounted
	useEffect(() => {
		if (!editArticle?.articleContent) return;
		const t = setInterval(() => {
			const inst = editorRef.current?.getInstance();
			if (inst) {
				inst.setHTML(editArticle.articleContent);
				clearInterval(t);
			}
		}, 120);
		return () => clearInterval(t);
	}, []);
	const memoizedValues = useMemo(() => {
		const articleContent = '',
			articleImage = editArticle?.articleImage ?? '';
		return { articleContent, articleImage };
	}, []);

	/** HANDLERS **/
	const uploadImage = async (image: any) => {
		try {
			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) {
						imageUploader(file: $file, target: $target)
				  }`,
					variables: { file: null, target: 'article' },
				}),
			);
			formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
			formData.append('0', image);

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImage = response.data.data.imageUploader;
			memoizedValues.articleImage = responseImage;

			return `${REACT_APP_API_URL}/${responseImage}`;
		} catch (err) {
			sweetMixinErrorAlert(t('alerts.imageUploadFailed')).then();
		}
	};

	const handleRegisterButton = async () => {
		try {
			const editor = editorRef.current;
			const articleContent = editor?.getInstance().getHTML() as string;
			const plainContent = articleContent?.replace(/<[^>]*>/g, '').trim() ?? '';
			const isEmptyContent = plainContent === '';

			if (isEmptyContent || !articleTitle.trim()) {
				throw new Error(t('common:alerts.fillAllInputs'));
			}
			if (!isEdit && (articleTitle.trim().length < 5 || articleTitle.trim().length > 100)) {
				throw new Error(t('alerts.articleTitleLength', { min: 5, max: 100 }));
			}
			if (!isEdit && (plainContent.length < 20 || plainContent.length > 5000)) {
				throw new Error(t('alerts.articleContentLength', { min: 20, max: 5000 }));
			}

			setPublishing(true);
			if (isEdit) {
				// BoardArticleUpdate has no articleCategory field — category is fixed after publish
				await updateBoardArticle({
					variables: {
						input: {
							_id: editArticle._id,
							articleTitle: articleTitle.trim(),
							articleContent,
							articleImage: memoizedValues.articleImage,
						},
					},
				});
			} else {
				await createBoardArticle({
					variables: {
						input: {
							articleTitle: articleTitle.trim(),
							articleContent,
							articleImage: memoizedValues.articleImage,
							articleCategory,
						},
					},
				});
			}

			await sweetTopSuccessAlert(isEdit ? t('alerts.articleUpdated') : t('alerts.articlePublished'), 700);
			await router.push({ pathname: '/mypage', query: { category: 'myArticles' } });
		} catch (err: any) {
			setPublishing(false);
			sweetErrorHandling(new Error(getErrorMessage(err, t('common:alerts.fillAllInputs')))).then();
		}
	};

	return (
		<div>
			{/* Category + Title */}
			<div className="wd-form-card" style={{ marginBottom: '16px' }}>
				<div style={{ marginBottom: '18px' }}>
					<span style={labelStyle}>{isEdit ? t('articles.form.categoryFixed') : t('articles.form.category')}</span>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
						{categories.map((cat) => {
							const isActive = articleCategory === cat.value;
							return (
								<button
									key={cat.value}
									className="cl-cat-btn"
									disabled={isEdit}
									style={{
										...(isActive ? { borderColor: `${cat.accent}80`, background: `${cat.accent}1c`, color: cat.accent } : {}),
										...(isEdit ? { opacity: isActive ? 0.85 : 0.3, cursor: 'default' } : {}),
									}}
									onClick={() => !isEdit && setArticleCategory(cat.value)}
								>
									<span className="cl-cat-dot" style={{ background: cat.accent }} />
									{t(`enums:articleCategory.${cat.value}`, { defaultValue: cat.label })}
								</button>
							);
						})}
					</div>
				</div>
				<div>
					<span style={labelStyle}>{t('articles.form.title')}</span>
					<input
						className="wd-input"
						type="text"
						placeholder={t('articles.form.titlePlaceholder')}
						value={articleTitle}
						onChange={(e) => setArticleTitle(e.target.value)}
					/>
				</div>
			</div>

			{/* Editor */}
			<div
				className="toastui-editor-dark"
				style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}
			>
				<Editor
					initialValue={' '}
					placeholder={t('articles.form.contentPlaceholder')}
					previewStyle={'vertical'}
					height={'560px'}
					theme={'dark'}
					// @ts-ignore
					initialEditType={'WYSIWYG'}
					toolbarItems={[
						['heading', 'bold', 'italic', 'strike'],
						['image', 'table', 'link'],
						['ul', 'ol', 'task'],
					]}
					ref={editorRef}
					hooks={{
						addImageBlobHook: async (image: any, callback: any) => {
							const uploadedImageURL = await uploadImage(image);
							callback(uploadedImageURL);
							return false;
						},
					}}
					events={{
						load: function (param: any) {},
					}}
				/>
			</div>

			{/* Publish */}
			<button className="wd-btn" onClick={handleRegisterButton} disabled={publishing} style={{ padding: '14px 36px' }}>
				{publishing ? (isEdit ? t('articles.form.saving') : t('articles.form.publishing')) : isEdit ? t('articles.form.saveChanges') : t('articles.form.publish')}
			</button>
		</div>
	);
};

export default TuiEditor;
