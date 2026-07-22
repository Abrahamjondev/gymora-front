import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { GET_MEMBER_SUBSCRIPTIONS, GET_PAYMENT_HISTORY } from '../../apollo/user/query';
import { INITIATE_PAYMENT, CREATE_SUBSCRIPTION } from '../../apollo/user/mutation';
import { T } from '../../libs/types/common';
import { Messages, appLocale } from '../../libs/config';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../libs/sweetAlert';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export const getStaticProps = async ({ locale }: any) => ({ props: { ...(await serverSideTranslations(locale, ['common', 'mypage', 'enums'])) } });

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;


/* ─── Card payment form (inside Stripe Elements provider) ─── */
const CardPaymentForm = ({ clientSecret, onSuccess, onCancel, planName, price }: {
	clientSecret: string;
	onSuccess: () => void;
	onCancel: () => void;
	planName: string;
	price: number;
}) => {
	const { t } = useTranslation('mypage');
	const stripe = useStripe();
	const elements = useElements();
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!stripe || !elements) return;

		setProcessing(true);
		setError(null);

		const cardElement = elements.getElement(CardElement);
		if (!cardElement) { setProcessing(false); return; }

		const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
			payment_method: { card: cardElement },
		});

		if (stripeError) {
			setError(stripeError.message ?? t('subscription.modal.paymentFailed'));
			setProcessing(false);
		} else if (paymentIntent?.status === 'succeeded') {
			onSuccess();
		} else {
			setError(t('subscription.modal.notCompleted'));
			setProcessing(false);
		}
	};

	return (
		<div className="subscription-modal-overlay" style={{
			position: 'fixed', inset: 0, zIndex: 1000,
			background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			animation: 'fadeIn 0.25s ease both',
		}}
			onClick={(e) => { if (e.target === e.currentTarget && !processing) onCancel(); }}
		>
			<div className="subscription-modal-panel" style={{
				background: '#1a1a1c', borderRadius: '20px', padding: '36px',
				width: '100%', maxWidth: '440px',
				border: '1px solid rgba(0,220,229,0.15)',
				boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
				animation: 'fadeInUp 0.3s ease both',
			}}>
				{/* Header */}
				<div style={{ textAlign: 'center', marginBottom: '28px' }}>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(0,220,229,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('subscription.modal.securePayment')}</span>
					<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '22px', fontWeight: 700, color: '#e9feff', marginTop: '8px' }}>
						{t('subscription.modal.heading', { plan: planName, price })}
					</h3>
				</div>

				<form onSubmit={handleSubmit}>
					{/* Card input */}
					<div style={{
						background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
						borderRadius: '12px', padding: '16px 14px',
						marginBottom: '16px', transition: 'border-color 0.25s ease',
					}}>
						<CardElement options={{
							hidePostalCode: true,
							style: {
								base: {
									fontSize: '16px',
									color: '#e9feff',
									fontFamily: 'Hanken Grotesk, sans-serif',
									'::placeholder': { color: 'rgba(185,202,202,0.35)' },
								},
								invalid: { color: '#ff6b6b' },
							},
						}} />
					</div>

					{error && (
						<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: '#ff6b6b', marginBottom: '16px', textAlign: 'center' }}>
							{error}
						</p>
					)}

					{/* Test card hint */}
					<p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.3)', textAlign: 'center', marginBottom: '20px' }}>
						{t('subscription.modal.testHint')}
					</p>

					{/* Buttons */}
					<div className="subscription-modal-actions" style={{ display: 'flex', gap: '10px' }}>
						<button
							type="button"
							onClick={onCancel}
							disabled={processing}
							style={{
								flex: 1, padding: '14px', borderRadius: '10px',
								fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600,
								background: 'transparent', color: 'rgba(185,202,202,0.6)',
								border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
								transition: 'all 0.25s ease',
							}}
						>
							{t('common:actions.cancel')}
						</button>
						<button
							type="submit"
							disabled={!stripe || processing}
							style={{
								flex: 2, padding: '14px', borderRadius: '10px',
								fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700,
								background: processing ? 'rgba(0,220,229,0.3)' : 'linear-gradient(135deg, #00dce5, #e9feff)',
								color: '#003739', border: 'none', cursor: processing ? 'wait' : 'pointer',
								boxShadow: processing ? 'none' : '0 0 24px rgba(0,220,229,0.2)',
								transition: 'all 0.25s ease',
							}}
						>
							{processing ? t('subscription.processing') : t('subscription.modal.pay', { price })}
						</button>
					</div>
				</form>

				{/* Security note */}
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
					<svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M10 5H9V3.5C9 1.57 7.43 0 5.5 0S2 1.57 2 3.5V5H1C0.45 5 0 5.45 0 6V13C0 13.55 0.45 14 1 14H10C10.55 14 11 13.55 11 13V6C11 5.45 10.55 5 10 5ZM5.5 10.5C4.95 10.5 4.5 10.05 4.5 9.5S4.95 8.5 5.5 8.5 6.5 8.95 6.5 9.5 6.05 10.5 5.5 10.5ZM7.5 5H3.5V3.5C3.5 2.4 4.4 1.5 5.5 1.5S7.5 2.4 7.5 3.5V5Z" fill="rgba(185,202,202,0.3)" /></svg>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.3)' }}>{t('subscription.modal.securedByStripe')}</span>
				</div>
			</div>
		</div>
	);
};

/* ─── Main Page ─── */
const SubscriptionPage: NextPage = () => {
	const { t } = useTranslation('mypage');
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const router = useRouter();

	// Shares the membership copy with the mypage SubscriptionContent component
	const plans = [
		{
			key: 'MONTHLY',
			name: t('subscription.plans.monthly.name'),
			price: 14.99,
			period: t('subscription.perMonth'),
			features: [
				t('subscription.plans.monthly.features.0'),
				t('subscription.plans.monthly.features.1'),
				t('subscription.plans.monthly.features.2'),
				t('subscription.plans.monthly.features.3'),
			],
		},
		{
			key: 'YEARLY',
			name: t('subscription.plans.yearly.name'),
			price: 119.88,
			period: t('subscription.perYear'),
			sub: t('subscription.yearlySub'),
			featured: true,
			features: [
				t('subscription.plans.yearly.features.0'),
				t('subscription.plans.yearly.features.1'),
				t('subscription.plans.yearly.features.2'),
				t('subscription.plans.yearly.features.3'),
			],
		},
	];
	const statusLabels: Record<string, string> = { PAID: t('subscription.status.PAID'), PENDING: t('subscription.status.PENDING') };
	const [subscriptions, setSubscriptions] = useState<any[]>([]);
	const [payments, setPayments] = useState<any[]>([]);
	const [loading, setLoading] = useState<string | null>(null);
	const [selectedPlan, setSelectedPlan] = useState<string>('YEARLY');

	// Stripe payment modal state
	const [paymentModal, setPaymentModal] = useState<{ clientSecret: string; paymentId: string; planKey: string; price: number } | null>(null);

	const { refetch: subsRefetch } = useQuery(GET_MEMBER_SUBSCRIPTIONS, { fetchPolicy: 'network-only', skip: !user?._id, onCompleted: (d: T) => setSubscriptions(d?.getMemberSubscriptions ?? []) });
	const { refetch: payRefetch } = useQuery(GET_PAYMENT_HISTORY, { fetchPolicy: 'network-only', skip: !user?._id, onCompleted: (d: T) => setPayments(d?.getPaymentHistory ?? []) });

	const [initiatePayment] = useMutation(INITIATE_PAYMENT);
	const [createSubscription] = useMutation(CREATE_SUBSCRIPTION);

	const activeSub = subscriptions.find((s: any) => s.subscriptionStatus === 'ACTIVE');

	const startSubscription = async (planKey: string, price: number) => {
		try {
			if (!user?._id) { await sweetMixinErrorAlert(Messages.error2); router.push('/account/join'); return; }
			if (activeSub) { await sweetMixinErrorAlert(t('subscription.alerts.alreadyActive')); return; }

			setLoading(planKey);

			// Use real Stripe only if frontend has the publishable key configured
			const useRealStripe = !!stripePublishableKey;

			// Step 1: Initiate payment on backend
			const { data: paymentData } = await initiatePayment({
				variables: {
					input: {
						paymentAmount: price,
						paymentCurrency: 'USD',
						subscriptionPlan: planKey,
						paymentProvider: useRealStripe ? 'STRIPE' : 'PAYME',
						paymentNote: `Gymora ${planKey} subscription`,
					},
				},
			});

			const paymentResult = paymentData?.initiatePayment;
			if (!paymentResult?.paymentId) throw new Error(t('subscription.alerts.initiationFailed'));

			// Step 2: Real Stripe flow — show card payment modal
			if (paymentResult.clientSecret && paymentResult.clientSecret !== 'mock_paid' && stripePromise) {
				setPaymentModal({
					clientSecret: paymentResult.clientSecret,
					paymentId: paymentResult.paymentId,
					planKey,
					price,
				});
				setLoading(null);
				return;
			}

			// Step 3: Mock/dev mode — payment already PAID, create subscription directly
			await finalizeSubscription(paymentResult.paymentId, planKey, price);
		} catch (err: any) {
			setLoading(null);
			sweetMixinErrorAlert(err.message.replace('Definer: ', '')).then();
		}
	};

	const finalizeSubscription = async (paymentId: string, planKey: string, price: number) => {
		try {
			setLoading(planKey);
			await createSubscription({
				variables: {
					input: { paymentId, subscriptionPlan: planKey, price },
				},
			});

			const { data: rd } = await subsRefetch();
			if (rd?.getMemberSubscriptions) setSubscriptions(rd.getMemberSubscriptions);
			const { data: pd } = await payRefetch();
			if (pd?.getPaymentHistory) setPayments(pd.getPaymentHistory);

			setPaymentModal(null);
			await sweetMixinSuccessAlert(t('subscription.alerts.activated'));
		} catch (err: any) {
			sweetMixinErrorAlert(err.message.replace('Definer: ', '')).then();
		} finally {
			setLoading(null);
		}
	};

	if (!user?._id) return <div style={{ background: '#0d0d0e', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'rgba(185,202,202,0.5)', fontFamily: 'Hanken Grotesk' }}>{t('subscription.loginRequired')}</p></div>;

	return (
		<div className="subscription-page" style={{ background: '#0d0d0e', minHeight: '100vh', padding: '40px 0' }}>
			<div className="subscription-shell" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px' }}>
				{/* Header */}
				<div style={{ textAlign: 'center', marginBottom: '48px', animation: 'fadeInUp 0.6s ease both' }}>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(255,138,0,0.7)', textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px' }}>{t('subscription.eyebrow')}</span>
					<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '36px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>{t('subscription.titlePrefix')} {t('subscription.titleHighlight')}</h2>
				</div>

				{/* Active subscription */}
				{activeSub && (
					<div className="subscription-active" style={{ background: 'rgba(102,218,186,0.05)', border: '1px solid rgba(102,218,186,0.15)', borderRadius: '14px', padding: '20px 24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeInUp 0.5s ease 0.1s both' }}>
						<div>
							<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#66daba', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{t('subscription.activePlan')}</span>
							<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 700, color: '#e5e2e3', marginTop: '4px' }}>{activeSub.subscriptionPlan === 'MONTHLY' ? t('subscription.plans.monthly.name') : t('subscription.plans.yearly.name')} — ${activeSub.price}</h3>
						</div>
						<div style={{ textAlign: 'right' }}>
							<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.4)', display: 'block' }}>{t('subscription.expires')}</span>
							<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#e5e2e3' }}>{activeSub.expiresAt ? new Date(activeSub.expiresAt).toLocaleDateString(appLocale()) : t('subscription.notAvailable')}</span>
						</div>
					</div>
				)}

				{/* Plan cards */}
				<div className="subscription-plans" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px', animation: 'fadeInUp 0.5s ease 0.15s both' }}>
					{plans.map((plan) => {
						const isSelected = selectedPlan === plan.key;
						return (
							<div
								key={plan.key}
								className="subscription-plan-card"
								onClick={() => !activeSub && setSelectedPlan(plan.key)}
								style={{
									padding: '32px', borderRadius: '16px', position: 'relative', cursor: activeSub ? 'default' : 'pointer',
									border: isSelected ? '1.5px solid rgba(0,220,229,0.4)' : '1px solid rgba(255,255,255,0.05)',
									background: isSelected ? 'rgba(0,220,229,0.04)' : 'rgba(255,255,255,0.02)',
									boxShadow: isSelected ? '0 0 24px rgba(0,220,229,0.06)' : 'none',
									transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
								}}
								onMouseOver={(e) => { if (!activeSub) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = isSelected ? '0 16px 48px rgba(0,220,229,0.1)' : '0 12px 40px rgba(0,0,0,0.4)'; } }}
								onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = isSelected ? '0 0 24px rgba(0,220,229,0.06)' : 'none'; }}
							>
								{plan.featured && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #00dce5, #e9feff)', color: '#003739', padding: '4px 14px', fontFamily: 'JetBrains Mono', fontSize: '9px', fontWeight: 700, borderRadius: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{t('subscription.bestValue')}</div>}

								{/* Selection indicator */}
								<div style={{ position: 'absolute', top: '16px', right: '16px', width: '22px', height: '22px', borderRadius: '50%', border: isSelected ? '2px solid #00dce5' : '2px solid rgba(255,255,255,0.1)', background: isSelected ? '#00dce5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s ease' }}>
									{isSelected && <span style={{ color: '#003739', fontSize: '12px', fontWeight: 700 }}>✓</span>}
								</div>

								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: isSelected ? 'rgba(0,220,229,0.8)' : 'rgba(185,202,202,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', transition: 'color 0.25s ease' }}>{plan.name}</span>
								<div style={{ margin: '12px 0 20px' }}>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '36px', fontWeight: 800, color: '#e9feff' }}>${plan.price}</span>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'rgba(185,202,202,0.4)' }}>{plan.period}</span>
								</div>
								{plan.sub && <p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'rgba(0,220,229,0.7)', marginBottom: '16px' }}>{plan.sub}</p>}

								<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
									{plan.features.map((f) => (
										<div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
											<span style={{ color: '#00dce5', fontSize: '12px' }}>✓</span>
											<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: 'rgba(185,202,202,0.7)' }}>{f}</span>
										</div>
									))}
								</div>
							</div>
						);
					})}
				</div>

				{/* Subscribe button */}
				{!activeSub && (
					<div style={{ textAlign: 'center', marginBottom: '48px', animation: 'fadeInUp 0.5s ease 0.2s both' }}>
						<button
							onClick={() => {
								const plan = plans.find((p) => p.key === selectedPlan);
								if (plan) startSubscription(plan.key, plan.price);
							}}
							disabled={!!loading}
							style={{
								padding: '16px 48px', borderRadius: '12px', cursor: loading ? 'wait' : 'pointer',
								fontFamily: 'Hanken Grotesk', fontSize: '15px', fontWeight: 700,
								background: loading ? 'rgba(0,220,229,0.3)' : 'linear-gradient(135deg, #00dce5, #e9feff)',
								color: '#003739', border: 'none',
								boxShadow: '0 0 30px rgba(0,220,229,0.2)',
								transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
							}}
							onMouseOver={(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 50px rgba(0,220,229,0.35)'; } }}
							onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(0,220,229,0.2)'; }}
						>
							{loading
								? t('subscription.processing')
								: t('subscription.subscribe', {
										plan: selectedPlan === 'MONTHLY' ? t('subscription.plans.monthly.name') : t('subscription.plans.yearly.name'),
								  })}
						</button>
					</div>
				)}

				{/* Payment history */}
				{payments.length > 0 && (
					<div style={{ animation: 'fadeInUp 0.5s ease 0.25s both' }}>
						<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '22px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>{t('subscription.paymentHistory')}</h3>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
							{payments.map((p: any) => (
								<div key={p._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<div>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '15px', fontWeight: 600, color: '#e5e2e3' }}>${p.paymentAmount}</span>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.4)', marginLeft: '10px' }}>{p.paymentProvider}</span>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', marginLeft: '8px', color: p.paymentStatus === 'PAID' ? '#66daba' : p.paymentStatus === 'PENDING' ? '#ff8a00' : '#849495' }}>{statusLabels[p.paymentStatus] || p.paymentStatus}</span>
									</div>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.3)' }}>{new Date(p.createdAt).toLocaleDateString(appLocale())}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Stripe Payment Modal */}
			{paymentModal && stripePromise && (
				<Elements stripe={stripePromise} options={{ clientSecret: paymentModal.clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#00dce5' } } }}>
					<CardPaymentForm
						clientSecret={paymentModal.clientSecret}
						planName={paymentModal.planKey === 'MONTHLY' ? t('subscription.plans.monthly.name') : t('subscription.plans.yearly.name')}
						price={paymentModal.price}
						onSuccess={() => finalizeSubscription(paymentModal.paymentId, paymentModal.planKey, paymentModal.price)}
						onCancel={() => setPaymentModal(null)}
					/>
				</Elements>
			)}
		</div>
	);
};

export default withLayoutBasic(SubscriptionPage);
