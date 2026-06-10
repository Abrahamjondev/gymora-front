import React from 'react';

interface LikeButtonProps {
	liked: boolean;
	count: number;
	onClick: (e: React.MouseEvent) => void;
	variant?: 'chip' | 'full';
	label?: string;
}

const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

const LikeButton = ({ liked, count, onClick, variant = 'chip', label }: LikeButtonProps) => {
	if (variant === 'full') {
		return (
			<button onClick={onClick} style={{
				width: '100%', padding: '13px 16px', borderRadius: '10px',
				fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600,
				cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
				display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
				background: liked
					? 'linear-gradient(135deg, rgba(255,55,95,0.14), rgba(255,55,95,0.06))'
					: 'rgba(255,255,255,0.04)',
				color: liked ? '#ff375f' : '#c8d6d6',
				border: liked
					? '1.5px solid rgba(255,55,95,0.35)'
					: '1px solid rgba(255,255,255,0.1)',
			}}>
				<svg
					width="20" height="20" viewBox="0 0 24 24"
					style={{
						transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
						transform: liked ? 'scale(1.15)' : 'scale(1)',
						filter: liked ? 'drop-shadow(0 0 8px rgba(255,55,95,0.5))' : 'none',
					}}
				>
					<path
						d={HEART_PATH}
						fill={liked ? '#ff375f' : 'none'}
						stroke={liked ? 'none' : '#c8d6d6'}
						strokeWidth={liked ? '0' : '1.5'}
						style={{ transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)' }}
					/>
				</svg>
				<span>{liked ? 'Liked' : (label || 'Like')}</span>
				{count > 0 && (
					<span style={{
						fontFamily: 'JetBrains Mono', fontSize: '11px',
						color: liked ? 'rgba(255,55,95,0.6)' : 'rgba(200,214,214,0.4)',
						marginLeft: '2px',
					}}>
						({count})
					</span>
				)}
			</button>
		);
	}

	// Chip variant
	return (
		<span onClick={onClick} style={{
			display: 'inline-flex', alignItems: 'center', gap: '6px',
			padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
			fontFamily: 'JetBrains Mono', fontSize: '12px', fontWeight: 500,
			transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
			background: liked ? 'rgba(255,55,95,0.12)' : 'rgba(255,255,255,0.06)',
			border: liked ? '1px solid rgba(255,55,95,0.3)' : '1px solid rgba(255,255,255,0.1)',
			color: liked ? '#ff375f' : '#c8d6d6',
		}}>
			<svg
				width="15" height="15" viewBox="0 0 24 24"
				style={{
					transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
					transform: liked ? 'scale(1.2)' : 'scale(1)',
					filter: liked ? 'drop-shadow(0 0 5px rgba(255,55,95,0.6))' : 'none',
				}}
			>
				<path
					d={HEART_PATH}
					fill={liked ? '#ff375f' : 'none'}
					stroke={liked ? 'none' : '#c8d6d6'}
					strokeWidth={liked ? '0' : '1.5'}
					style={{ transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)' }}
				/>
			</svg>
			<span style={{ transition: 'color 0.2s ease' }}>{count}</span>
		</span>
	);
};

export default LikeButton;
