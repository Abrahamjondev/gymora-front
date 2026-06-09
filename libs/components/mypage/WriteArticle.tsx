import React from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import dynamic from 'next/dynamic';
const TuiEditor = dynamic(() => import('../community/Teditor'), { ssr: false });

const WriteArticle: NextPage = () => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return <div style={{ color: '#e5e2e3' }}>WRITE ARTICLE MOBILE</div>;
	}

	return (
		<div>
			<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '8px' }}>
				Write an Article
			</h2>
			<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#849495', marginBottom: '24px' }}>
				Share your fitness knowledge with the community
			</p>
			<TuiEditor />
		</div>
	);
};

export default WriteArticle;
