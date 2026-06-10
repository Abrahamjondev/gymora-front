import React, { useEffect, useState } from 'react'; //@ts-ignore
import '@toast-ui/editor/dist/toastui-editor.css'; //@ts-ignore
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';
import { Viewer } from '@toast-ui/react-editor';
import { Box, Stack, CircularProgress } from '@mui/material';

const TViewer = (props: any) => {
	const [editorLoaded, setEditorLoaded] = useState(false);

	/** LIFECYCLES **/
	useEffect(() => {
		if (props.markdown) {
			setEditorLoaded(true);
		} else {
			setEditorLoaded(false);
		}
	}, [props.markdown]);

	// Seeded content arrives with escaped markdown (\# \- \*) — unescape for display
	const cleanMarkdown = (props.markdown ?? '').replace(/\\([#*\-_`>~[\]])/g, '$1');

	return (
		<Stack
			className="toastui-editor-dark"
			sx={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', mt: '8px', borderRadius: '16px' }}
		>
			<Box component={'div'} sx={{ m: '28px' }}>
				{editorLoaded ? (
					<Viewer
						initialValue={cleanMarkdown}
						theme="dark"
						customHTMLRenderer={{
							htmlBlock: {
								iframe(node: any) {
									return [
										{
											type: 'openTag',
											tagName: 'iframe',
											outerNewLine: true,
											attributes: node.attrs,
										},
										{ type: 'html', content: node.childrenHTML ?? '' },
										{ type: 'closeTag', tagName: 'iframe', outerNewLine: true },
									];
								},
								div(node: any) {
									return [
										{ type: 'openTag', tagName: 'div', outerNewLine: true, attributes: node.attrs },
										{ type: 'html', content: node.childrenHTML ?? '' },
										{ type: 'closeTag', tagName: 'div', outerNewLine: true },
									];
								},
							},
							htmlInline: {
								big(node: any, { entering }: any) {
									return entering
										? { type: 'openTag', tagName: 'big', attributes: node.attrs }
										: { type: 'closeTag', tagName: 'big' };
								},
							},
						}}
					/>
				) : (
					<CircularProgress />
				)}
			</Box>
		</Stack>
	);
};

export default TViewer;
