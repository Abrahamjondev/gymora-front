import React, { useMemo, useRef, useState } from 'react';
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
import { CREATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';

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

const TuiEditor = () => {
	const editorRef = useRef<Editor>(null),
		token = getJwtToken(),
		router = useRouter();
	const [articleCategory, setArticleCategory] = useState<BoardArticleCategory>(BoardArticleCategory.FITNESS_TIPS);
	const [articleTitle, setArticleTitle] = useState('');
	const [publishing, setPublishing] = useState(false);

	/** APOLLO REQUESTS **/
	const [createBoardArticle] = useMutation(CREATE_BOARD_ARTICLE);
	const memoizedValues = useMemo(() => {
		const articleContent = '',
			articleImage = '';
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
			sweetMixinErrorAlert('Image upload failed').then();
		}
	};

	const handleRegisterButton = async () => {
		try {
			const editor = editorRef.current;
			const articleContent = editor?.getInstance().getHTML() as string;
			const isEmptyContent = !articleContent || articleContent.replace(/<[^>]*>/g, '').trim() === '';

			if (isEmptyContent || !articleTitle.trim()) {
				throw new Error(Message.INSERT_ALL_INPUTS);
			}

			setPublishing(true);
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

			await sweetTopSuccessAlert('Article published!', 700);
			await router.push({ pathname: '/mypage', query: { category: 'myArticles' } });
		} catch (err: any) {
			setPublishing(false);
			const msg = err?.graphQLErrors?.[0]?.message || err?.message || Message.INSERT_ALL_INPUTS;
			sweetErrorHandling(new Error(msg.replace('Definer: ', ''))).then();
		}
	};

	return (
		<div>
			{/* Category + Title */}
			<div className="wd-form-card" style={{ marginBottom: '16px' }}>
				<div style={{ marginBottom: '18px' }}>
					<span style={labelStyle}>Category</span>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
						{categories.map((cat) => {
							const isActive = articleCategory === cat.value;
							return (
								<button
									key={cat.value}
									className="cl-cat-btn"
									style={isActive ? { borderColor: `${cat.accent}80`, background: `${cat.accent}1c`, color: cat.accent } : undefined}
									onClick={() => setArticleCategory(cat.value)}
								>
									<span className="cl-cat-dot" style={{ background: cat.accent }} />
									{cat.label}
								</button>
							);
						})}
					</div>
				</div>
				<div>
					<span style={labelStyle}>Title *</span>
					<input
						className="wd-input"
						type="text"
						placeholder="Give your article a strong title..."
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
					placeholder={'Share your fitness knowledge...'}
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
				{publishing ? 'Publishing...' : 'Publish Article →'}
			</button>
		</div>
	);
};

export default TuiEditor;
