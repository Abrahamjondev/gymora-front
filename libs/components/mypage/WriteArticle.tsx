import React from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import dynamic from 'next/dynamic';
const TuiEditor = dynamic(() => import('../community/Teditor'), { ssr: false });

const WriteArticle: NextPage = () => {
	const device = useDeviceDetect();

	return (
		<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
			<div className="nt-head">
				<div>
					<span className="lp-eyebrow lp-eyebrow--violet" style={{ marginBottom: '6px' }}>
						Community
					</span>
					<h2>Write an Article</h2>
				</div>
			</div>
			<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'rgba(185,202,202,0.6)', margin: '-8px 0 22px' }}>
				Share your fitness knowledge with the community.
			</p>
			<TuiEditor />
		</div>
	);
};

export default WriteArticle;
