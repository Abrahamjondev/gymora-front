import React from 'react';

interface DataLoadingOverlayProps {
	label: string;
}

const DataLoadingOverlay = ({ label }: DataLoadingOverlayProps) => {
	return (
		<div className="wl-fetch-overlay" role="status" aria-label={label}>
			<span className="wl-fetch-spinner" aria-hidden="true">
				<span />
			</span>
		</div>
	);
};

export default DataLoadingOverlay;
