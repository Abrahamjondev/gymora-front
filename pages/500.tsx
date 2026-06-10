import React from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const ServerError: NextPage = () => {
	const router = useRouter();

	return (
		<div
			style={{
				minHeight: '100vh',
				background: '#0d0d0e',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '24px',
				textAlign: 'center',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					position: 'absolute',
					width: '520px',
					height: '520px',
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(255,138,138,0.06) 0%, transparent 65%)',
					pointerEvents: 'none',
				}}
			/>
			<div
				style={{
					width: '52px',
					height: '52px',
					borderRadius: '14px',
					background: 'linear-gradient(135deg, #00dce5 0%, #00f5ff 100%)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					boxShadow: '0 0 28px rgba(0,220,229,0.35)',
					marginBottom: '28px',
				}}
			>
				<span style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '26px', fontWeight: 900, color: '#003739' }}>G</span>
			</div>
			<span
				style={{
					fontFamily: 'JetBrains Mono, monospace',
					fontSize: '12px',
					letterSpacing: '0.18em',
					color: '#ff8a8a',
					textTransform: 'uppercase',
					marginBottom: '10px',
				}}
			>
				Error 500
			</span>
			<h1
				style={{
					fontFamily: 'Hanken Grotesk, sans-serif',
					fontSize: 'clamp(34px, 6vw, 56px)',
					fontWeight: 900,
					color: '#ffffff',
					letterSpacing: '-0.03em',
					margin: '0 0 14px',
				}}
			>
				We dropped the <span style={{ color: '#ff8a8a' }}>barbell</span>.
			</h1>
			<p style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '16px', color: '#b9caca', maxWidth: '440px', margin: '0 0 34px', lineHeight: '24px' }}>
				Something went wrong on our side. Please try again in a moment.
			</p>
			<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
				<button className="lp-btn-primary" style={{ padding: '14px 30px', fontSize: '14px' }} onClick={() => router.reload()}>
					Try Again
				</button>
				<button className="lp-btn-ghost" style={{ padding: '14px 30px', fontSize: '14px' }} onClick={() => router.push('/')}>
					Back to Home
				</button>
			</div>
		</div>
	);
};

export default ServerError;
