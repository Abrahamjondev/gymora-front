import React, { useCallback, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { useRouter } from 'next/router';
import { logIn, signUp, telegramLogin } from '../../libs/auth';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import TelegramLoginButton from '../../libs/components/common/TelegramLoginButton';
import { TelegramAuthInput } from '../../libs/types/telegramAuth';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'auth'])),
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
	const { t } = useTranslation('auth');
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
				await sweetMixinErrorAlert(t('alerts.fillAllFields'));
				return;
			}
			setBusy(true);
			await logIn(input.nick, input.password);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			setBusy(false);
			const msg = (err.message || t('alerts.loginFailed')).replace('Definer: ', '');
			await sweetMixinErrorAlert(msg);
		}
	}, [input, t]);

	const doSignUp = useCallback(async () => {
		try {
			if (!input.nick || !input.password || !input.phone) {
				await sweetMixinErrorAlert(t('alerts.fillAllFields'));
				return;
			}
			setBusy(true);
			await signUp(input.nick, input.password, input.phone, input.type);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			setBusy(false);
			const msg = (err.message || t('alerts.signupFailed')).replace('Definer: ', '');
			await sweetMixinErrorAlert(msg);
		}
	}, [input, t]);

	const doTelegramLogin = useCallback(
		async (payload: TelegramAuthInput) => {
			try {
				setBusy(true);
				await telegramLogin(payload);
				await router.push(`${router.query.referrer ?? '/'}`);
			} catch (err: any) {
				setBusy(false);
				const msg = (err.message || t('alerts.telegramFailed')).replace('Definer: ', '');
				await sweetMixinErrorAlert(msg);
			}
		},
		[router, t],
	);

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
					{t('panel.quoteLine1')}
					<br />
					<span className="lp-grad">{t('panel.quoteLine2')}</span>
				</h2>

				<span className="au-foot">{t('panel.foot')}</span>
			</div>

			{/* Form panel */}
			<div className="au-panel">
				<div className="au-card">
					<h1 className="au-title">{loginView ? t('form.titleLogin') : t('form.titleSignup')}</h1>
					<p className="au-sub">{loginView ? t('form.subLogin') : t('form.subSignup')}</p>

					{/* Tabs */}
					<div className="wl-seg au-seg">
						<button className={loginView ? 'is-active' : ''} onClick={() => viewChangeHandler(true)}>
							{t('form.tabLogin')}
						</button>
						<button className={!loginView ? 'is-active' : ''} onClick={() => viewChangeHandler(false)}>
							{t('form.tabSignup')}
						</button>
					</div>

					{/* Form */}
					<div className="au-fields">
						<div>
							<span style={labelStyle}>{t('form.nicknameLabel')}</span>
							<input
								className="wd-input"
								type="text"
								placeholder={t('form.nicknamePlaceholder')}
								value={input.nick}
								onChange={(e) => handleInput('nick', e.target.value)}
								onKeyDown={onEnter}
							/>
						</div>
						<div>
							<span style={labelStyle}>{t('form.passwordLabel')}</span>
							<input
								className="wd-input"
								type="password"
								placeholder={t('form.passwordPlaceholder')}
								value={input.password}
								onChange={(e) => handleInput('password', e.target.value)}
								onKeyDown={onEnter}
							/>
						</div>
						{!loginView && (
							<div>
								<span style={labelStyle}>{t('form.phoneLabel')}</span>
								<input
									className="wd-input"
									type="text"
									placeholder={t('form.phonePlaceholder')}
									value={input.phone}
									onChange={(e) => handleInput('phone', e.target.value)}
									onKeyDown={onEnter}
								/>
							</div>
						)}
					</div>

					{/* Submit */}
					<button className="lp-btn-primary au-submit" onClick={loginView ? doLogin : doSignUp} disabled={submitDisabled} style={{ opacity: submitDisabled ? 0.55 : 1, cursor: submitDisabled ? 'not-allowed' : 'pointer' }}>
						{busy ? t('form.submitBusy') : loginView ? t('form.submitLogin') : t('form.submitSignup')}{' '}
						<span style={{ fontSize: '16px' }}>→</span>
					</button>

						{/* Telegram login */}
						<div className="au-divider">
							<span>{t('form.orContinueWith')}</span>
						</div>
						<TelegramLoginButton onAuth={doTelegramLogin} />

						{/* Switch */}
					<p className="au-switch">
						{loginView ? t('form.switchToSignupPrompt') : t('form.switchToLoginPrompt')}{' '}
						<span onClick={() => viewChangeHandler(!loginView)}>
							{loginView ? t('form.switchToSignupAction') : t('form.switchToLoginAction')}
						</span>
					</p>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(Join);
