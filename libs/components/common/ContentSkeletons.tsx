import React from 'react';
import { Skeleton } from '@mui/material';

export type ContentSkeletonVariant = 'workout' | 'program' | 'trainer' | 'article';

interface ContentSkeletonsProps {
	variant: ContentSkeletonVariant;
	count?: number;
}

const skeletonSx = {
	backgroundColor: 'rgba(255, 255, 255, 0.075)',
	'&::after': {
		background: 'linear-gradient(90deg, transparent, rgba(0, 220, 229, 0.16), transparent)',
	},
};

const SkeletonLine = ({ width = '100%', height = 16 }: { width?: string; height?: number }) => (
	<Skeleton className="gymora-skeleton-line" variant="text" animation="wave" width={width} height={height} sx={{ ...skeletonSx, transform: 'none' }} />
);

const GridSkeleton = ({ variant, count }: { variant: 'workout' | 'program'; count: number }) => (
	<div className={variant === 'program' ? 'cl-grid' : 'wl-grid'}>
		{Array.from({ length: count }, (_, index) => (
			<div key={index} className="gymora-card-skeleton">
				<Skeleton className="gymora-card-skeleton-image" variant="rectangular" animation="wave" sx={{ ...skeletonSx, transform: 'none' }} />
				<div className="gymora-card-skeleton-body">
					<SkeletonLine width="72%" height={21} />
					<SkeletonLine width="48%" height={17} />
				</div>
			</div>
		))}
	</div>
);

const TrainerSkeleton = ({ count }: { count: number }) => (
	<div className="tr-grid">
		{Array.from({ length: count }, (_, index) => (
			<div key={index} className="gymora-trainer-skeleton">
				<Skeleton className="gymora-trainer-skeleton-image" variant="rectangular" animation="wave" sx={{ ...skeletonSx, transform: 'none' }} />
				<div className="gymora-trainer-skeleton-foot">
					<SkeletonLine width="58%" height={17} />
				</div>
			</div>
		))}
	</div>
);

const ArticleSkeleton = ({ count }: { count: number }) => (
	<div className="cm-list">
		{Array.from({ length: count }, (_, index) => (
			<div key={index} className="cm-row gymora-article-skeleton">
				<Skeleton className="gymora-article-skeleton-thumb" variant="rectangular" animation="wave" sx={{ ...skeletonSx, transform: 'none' }} />
				<div className="gymora-article-skeleton-body">
					<SkeletonLine width="32%" height={15} />
					<SkeletonLine width="72%" height={24} />
					<SkeletonLine width="92%" height={17} />
					<SkeletonLine width="46%" height={17} />
				</div>
			</div>
		))}
	</div>
);

const ContentSkeletons = ({ variant, count = variant === 'article' ? 3 : 6 }: ContentSkeletonsProps) => {
	if (variant === 'article') return <ArticleSkeleton count={count} />;
	if (variant === 'trainer') return <TrainerSkeleton count={count} />;
	return <GridSkeleton variant={variant} count={count} />;
};

export default ContentSkeletons;
