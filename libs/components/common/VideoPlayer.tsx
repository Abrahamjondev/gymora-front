import React from 'react';
import { useTranslation } from 'next-i18next';
import { REACT_APP_API_URL } from '../../config';

/**
 * Universal lesson/workout player. Accepts:
 *  - YouTube links (watch?v=, youtu.be, shorts, embed) → iframe embed
 *  - Vimeo links → iframe embed
 *  - Direct files: absolute http(s) URLs as-is, or backend-relative
 *    paths (uploads/video/...) prefixed with the API host → <video>
 */
const getYouTubeId = (url: string): string | null => {
	const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
	return m ? m[1] : null;
};

const getVimeoId = (url: string): string | null => {
	const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
	return m ? m[1] : null;
};

const frameStyle: React.CSSProperties = {
	position: 'relative',
	aspectRatio: '16/9',
	borderRadius: '16px',
	overflow: 'hidden',
	border: '1px solid rgba(255,255,255,0.07)',
	background: '#0a0a0b',
};

const VideoPlayer = ({ src, title }: { src: string; title?: string }) => {
	const { t } = useTranslation('common');
	if (!src) return null;

	const yt = getYouTubeId(src);
	if (yt) {
		return (
			<div style={frameStyle}>
				<iframe
					src={`https://www.youtube.com/embed/${yt}`}
					title={title ?? t('videoPlayer.title')}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
				/>
			</div>
		);
	}

	const vimeo = getVimeoId(src);
	if (vimeo) {
		return (
			<div style={frameStyle}>
				<iframe
					src={`https://player.vimeo.com/video/${vimeo}`}
					title={title ?? t('videoPlayer.title')}
					allow="autoplay; fullscreen; picture-in-picture"
					allowFullScreen
					style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
				/>
			</div>
		);
	}

	const resolved = src.startsWith('http') ? src : `${REACT_APP_API_URL}/${src}`;
	return <video className="wd-video" src={resolved} controls preload="metadata" />;
};

export default VideoPlayer;
