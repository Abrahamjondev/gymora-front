import React, { useCallback, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { useRouter } from 'next/router';
import { logIn, signUp } from '../../libs/auth';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const labelStyle: React.CSSProperties = {
	fontFamily: 'JetBrains Mono, monospace',
	fontSize: '10px',
	letterSpacing: '0.08em',
	color: '#9aabab',
	textTransform: 'uppercase',
	display: 'block',
	marginBottom: '7px',
};

const Join: NextPage = () => {
	const router = useRouter();
	const device = useDeviceDetect();
	const [input, setInput] = useState({ nick: '', password: '', phone: '', type: 'USER' });
	const [loginView, setLoginView] = useState<boolean>(true);
	const [busy, setBusy] = useState<boolean>(false);

	/** HANDLERS **/
	const viewChangeHandler = (state: boolean) => {
		setLoginView(state);
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
			setBusy(true);
			await logIn(input.nick, input.password);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			setBusy(false);
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
			setBusy(true);
			await signUp(input.nick, input.password, input.phone, input.type);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			setBusy(false);
			const msg = (err.message || 'Signup failed').replace('Definer: ', '');
			await sweetMixinErrorAlert(msg);
		}
	}, [input]);

	const submitDisabled = busy || (loginView ? !input.nick || !input.password : !input.nick || !input.password || !input.phone);

	const onEnter = (e: React.KeyboardEvent) => {
		if (e.key !== 'Enter') return;
		if (loginView) doLogin();
		else doSignUp();
	};

	return (
		<div className="au-shell">
			{/* Visual panel */}
			<div className="au-visual">
				<div className="au-visual-bg" />
				<div className="au-visual-tint" />
				<div className="lp-hero-grain" />

				<div className="au-brand">
					<div className="au-brand-mark">
						<span>G</span>
					</div>
					<span className="au-brand-word">gymora</span>
				</div>

				<h2 className="au-quote">
					Every session counts.
					<br />
					<span className="lp-grad">Make yours today.</span>
				</h2>

				<span className="au-foot">Elite training platform</span>
			</div>

			{/* Form panel */}
			<div className="au-panel">
				<div className="au-card">
					<h1 className="au-title">{loginView ? 'Welcome back' : 'Join Gymora'}</h1>
					<p className="au-sub">
						{loginView ? 'Log in to continue your training.' : 'Create a free account — every workout is free from day one.'}
					</p>

					{/* Tabs */}
					<div className="wl-seg au-seg">
						<button className={loginView ? 'is-active' : ''} onClick={() => viewChangeHandler(true)}>
							Login
						</button>
						<button className={!loginView ? 'is-active' : ''} onClick={() => viewChangeHandler(false)}>
							Sign Up
						</button>
					</div>

					{/* Form */}
					<div className="au-fields">
						<div>
							<span style={labelStyle}>Nickname</span>
							<input
								className="wd-input"
								type="text"
								placeholder="Enter nickname"
								value={input.nick}
								onChange={(e) => handleInput('nick', e.target.value)}
								onKeyDown={onEnter}
							/>
						</div>
						<div>
							<span style={labelStyle}>Password</span>
							<input
								className="wd-input"
								type="password"
								placeholder="Enter password"
								value={input.password}
								onChange={(e) => handleInput('password', e.target.value)}
								onKeyDown={onEnter}
							/>
						</div>
						{!loginView && (
							<div>
								<span style={labelStyle}>Phone</span>
								<input
									className="wd-input"
									type="text"
									placeholder="Enter phone"
									value={input.phone}
									onChange={(e) => handleInput('phone', e.target.value)}
									onKeyDown={onEnter}
								/>
							</div>
						)}
					</div>

					{/* Submit */}
					<button className="lp-btn-primary au-submit" onClick={loginView ? doLogin : doSignUp} disabled={submitDisabled} style={{ opacity: submitDisabled ? 0.55 : 1, cursor: submitDisabled ? 'not-allowed' : 'pointer' }}>
						{busy ? 'Please wait...' : loginView ? 'Log In' : 'Create Free Account'} <span style={{ fontSize: '16px' }}>→</span>
					</button>

					{/* Switch */}
					<p className="au-switch">
						{loginView ? "Don't have an account? " : 'Already have an account? '}
						<span onClick={() => viewChangeHandler(!loginView)}>{loginView ? 'Sign Up' : 'Log In'}</span>
					</p>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(Join);
