import React, { useCallback, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Stack } from '@mui/material';
import { useRouter } from 'next/router';
import { logIn, signUp } from '../../libs/auth';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Join: NextPage = () => {
	const router = useRouter();
	const device = useDeviceDetect();
	const [input, setInput] = useState({ nick: '', password: '', phone: '', type: 'USER' });
	const [loginView, setLoginView] = useState<boolean>(true);

	/** HANDLERS **/
	const viewChangeHandler = (state: boolean) => {
		setLoginView(state);
	};

	const checkUserTypeHandler = (type: string) => {
		handleInput('type', type);
	};

	const handleInput = useCallback((name: any, value: any) => {
		setInput((prev) => {
			return { ...prev, [name]: value };
		});
	}, []);

	const doLogin = useCallback(async () => {
		try {
			if (!input.nick || !input.password) {
				await sweetMixinErrorAlert('Please fill in all fields');
				return;
			}
			await logIn(input.nick, input.password);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			const msg = (err.message || 'Login failed').replace('Definer: ', '');
			await sweetMixinErrorAlert(msg);
		}
	}, [input]);

	const doSignUp = useCallback(async () => {
		try {
			if (!input.nick || !input.password || !input.phone) {
				await sweetMixinErrorAlert('Please fill in all fields');
				return;
			}
			await signUp(input.nick, input.password, input.phone, input.type);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			const msg = (err.message || 'Signup failed').replace('Definer: ', '');
			await sweetMixinErrorAlert(msg);
		}
	}, [input]);

	const inputStyle = {
		width: '100%',
		padding: '14px 16px',
		background: 'rgba(255,255,255,0.03)',
		border: '1px solid #3a494a',
		borderRadius: '8px',
		fontFamily: 'Hanken Grotesk, sans-serif',
		fontSize: '14px',
		color: '#e5e2e3',
		outline: 'none',
	};

	const labelStyle = {
		fontFamily: 'JetBrains Mono, monospace',
		fontSize: '11px',
		letterSpacing: '0.05em',
		color: '#849495',
		textTransform: 'uppercase' as const,
		display: 'block',
		marginBottom: '8px',
	};

	if (device === 'mobile') {
		return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>GYMORA LOGIN MOBILE</div>;
	}

	return (
		<div style={{ background: '#131314', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
			<div style={{ maxWidth: '440px', width: '100%' }}>
				{/* Logo */}
				<div style={{ textAlign: 'center', marginBottom: '40px' }}>
					<h1 style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', color: '#e9feff' }}>
						GYMORA
					</h1>
					<p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#849495', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '4px' }}>
						Elite Performance
					</p>
				</div>

				{/* Card */}
				<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px' }}>
					{/* Tabs */}
					<div style={{ display: 'flex', marginBottom: '32px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #3a494a' }}>
						<button
							onClick={() => viewChangeHandler(true)}
							style={{
								flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
								fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', fontWeight: 700,
								background: loginView ? '#e9feff' : 'transparent',
								color: loginView ? '#003739' : '#849495',
								transition: 'all 0.2s',
							}}
						>
							Login
						</button>
						<button
							onClick={() => viewChangeHandler(false)}
							style={{
								flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
								fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', fontWeight: 700,
								background: !loginView ? '#e9feff' : 'transparent',
								color: !loginView ? '#003739' : '#849495',
								transition: 'all 0.2s',
							}}
						>
							Sign Up
						</button>
					</div>

					{/* Form */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
						<div>
							<span style={labelStyle}>Nickname</span>
							<input
								type="text"
								placeholder="Enter Nickname"
								style={inputStyle}
								onChange={(e) => handleInput('nick', e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && loginView) doLogin();
									if (e.key === 'Enter' && !loginView) doSignUp();
								}}
							/>
						</div>
						<div>
							<span style={labelStyle}>Password</span>
							<input
								type="password"
								placeholder="Enter Password"
								style={inputStyle}
								onChange={(e) => handleInput('password', e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && loginView) doLogin();
									if (e.key === 'Enter' && !loginView) doSignUp();
								}}
							/>
						</div>
						{!loginView && (
							<>
								<div>
									<span style={labelStyle}>Phone</span>
									<input
										type="text"
										placeholder="Enter Phone"
										style={inputStyle}
										onChange={(e) => handleInput('phone', e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') doSignUp();
										}}
									/>
								</div>
							</>
						)}
					</div>

					{/* Submit */}
					<button
						onClick={loginView ? doLogin : doSignUp}
						disabled={
							loginView
								? input.nick === '' || input.password === ''
								: input.nick === '' || input.password === '' || input.phone === ''
						}
						style={{
							width: '100%',
							padding: '16px',
							marginTop: '24px',
							borderRadius: '8px',
							border: 'none',
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontSize: '16px',
							fontWeight: 700,
							cursor: 'pointer',
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
							background:
								(loginView && input.nick && input.password) || (!loginView && input.nick && input.password && input.phone)
									? '#e9feff'
									: '#353436',
							color:
								(loginView && input.nick && input.password) || (!loginView && input.nick && input.password && input.phone)
									? '#003739'
									: '#849495',
						}}
					>
						{loginView ? 'Login' : 'Create Account'}
					</button>

					{/* Switch */}
					<p style={{ textAlign: 'center', marginTop: '20px', fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', color: '#849495' }}>
						{loginView ? "Don't have an account? " : 'Already have an account? '}
						<span
							onClick={() => viewChangeHandler(!loginView)}
							style={{ color: '#e9feff', fontWeight: 700, cursor: 'pointer' }}
						>
							{loginView ? 'Sign Up' : 'Login'}
						</span>
					</p>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(Join);
