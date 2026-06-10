import React, { useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_MEMBER_SUBSCRIPTIONS, GET_PAYMENT_HISTORY } from '../../../apollo/user/query';
import { INITIATE_PAYMENT, CREATE_SUBSCRIPTION } from '../../../apollo/user/mutation';
import { T } from '../../types/common';
import { Messages } from '../../config';
import { sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Honest membership framing — programs are one-time purchases; the
// subscription supports the platform (nothing on the backend gates on it)
const plans = [
	{
		key: 'MONTHLY',
		name: 'Monthly',
		price: 14.99,
		period: '/month',
		features: ['Support free training for everyone', 'Back verified trainers directly', 'Billed monthly, cancel anytime', 'Secured by Stripe'],
	},
	{
		key: 'YEARLY',
		name: 'Yearly',
		price: 119.88,
		period: '/year',
		sub: '$9.99/mo — Save 33%',
		featured: true,
		features: ['Everything in Monthly', 'Best value — $9.99 a month', 'One payment for the whole year', 'Founding supporter of the platform'],
	},
];

/* ─── Card payment form (inside Stripe Elements provider) ─── */
const CardPaymentForm = ({ clientSecret, onSuccess, onCancel, planName, price }: {
	clientSecret: string;
	onSuccess: () => void;
	onCancel: () => void;
	planName: string;
	price: number;
}) => {
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
			setError(stripeError.message ?? 'Payment failed');
			setProcessing(false);
		} else if (paymentIntent?.status === 'succeeded') {
			onSuccess();
		} else {
			setError('Payment was not completed. Please try again.');
			setProcessing(false);
		}
	};

	return (
		<div style={{
			position: 'fixed', inset: 0, zIndex: 1000,
			background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			animation: 'fadeIn 0.25s ease both',
		}}
			onClick={(e) => { if (e.target === e.currentTarget && !processing) onCancel(); }}
		>
			<div style={{
				background: '#1a1a1c', borderRadius: '20px', padding: '36px',
				width: '100%', maxWidth: '440px',
				border: '1px solid rgba(0,220,229,0.15)',
				boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
				animation: 'fadeInUp 0.3s ease both',
			}}>
				{/* Header */}
				<div style={{ textAlign: 'center', marginBottom: '28px' }}>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(0,220,229,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure Payment</span>
					<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '22px', fontWeight: 700, color: '#e9feff', marginTop: '8px' }}>
						{planName} Plan — ${price}
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
						Test: 4242 4242 4242 4242 | Any future date | Any CVC
					</p>

					{/* Buttons */}
					<div style={{ display: 'flex', gap: '10px' }}>
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
							Cancel
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
							{processing ? 'Processing...' : `Pay $${price}`}
						</button>
					</div>
				</form>

				{/* Security note */}
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
					<svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M10 5H9V3.5C9 1.57 7.43 0 5.5 0S2 1.57 2 3.5V5H1C0.45 5 0 5.45 0 6V13C0 13.55 0.45 14 1 14H10C10.55 14 11 13.55 11 13V6C11 5.45 10.55 5 10 5ZM5.5 10.5C4.95 10.5 4.5 10.05 4.5 9.5S4.95 8.5 5.5 8.5 6.5 8.95 6.5 9.5 6.05 10.5 5.5 10.5ZM7.5 5H3.5V3.5C3.5 2.4 4.4 1.5 5.5 1.5S7.5 2.4 7.5 3.5V5Z" fill="rgba(185,202,202,0.3)" /></svg>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.3)' }}>Secured by Stripe</span>
				</div>
			</div>
		</div>
	);
};

/* ─── Main Content ─── */
const SubscriptionContent = () => {
	const user = useReactiveVar(userVar);
	const router = useRouter();
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
			if (activeSub) { await sweetMixinErrorAlert('You already have an active subscription'); return; }

			setLoading(planKey);

			const useRealStripe = !!stripePublishableKey;

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
			if (!paymentResult?.paymentId) throw new Error('Payment initiation failed');

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
			await sweetMixinSuccessAlert('Subscription activated!');
		} catch (err: any) {
			sweetMixinErrorAlert(err.message.replace('Definer: ', '')).then();
		} finally {
			setLoading(null);
		}
	};

	return (
		<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
			{/* Header */}
			<div style={{ textAlign: 'center', marginBottom: '44px' }}>
				<span className="lp-eyebrow lp-eyebrow--orange" style={{ marginBottom: '8px' }}>Membership</span>
				<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
					Invest in <span className="lp-grad">Performance</span>
				</h2>
			</div>

			{/* Active subscription */}
			{activeSub && (() => {
				const daysLeft = activeSub.expiresAt ? Math.max(0, Math.ceil((new Date(activeSub.expiresAt).getTime() - Date.now()) / 86400000)) : null;
				return (
					<div style={{ background: 'linear-gradient(135deg, rgba(102,218,186,0.07), rgba(102,218,186,0.02))', border: '1px solid rgba(102,218,186,0.22)', borderRadius: '16px', padding: '20px 24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
						<div>
							<span className="ct-live" style={{ marginBottom: '8px' }}>
								<span className="ct-live-dot" />
								Active Plan
							</span>
							<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '21px', fontWeight: 800, color: '#ffffff', margin: '8px 0 0' }}>
								{activeSub.subscriptionPlan === 'MONTHLY' ? 'Monthly' : 'Yearly'} — ${activeSub.price}
							</h3>
						</div>
						<div style={{ textAlign: 'right' }}>
							{daysLeft !== null && (
								<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '22px', fontWeight: 800, color: '#66daba', display: 'block', lineHeight: 1 }}>
									{daysLeft} <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(185,202,202,0.55)' }}>days left</span>
								</span>
							)}
							<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.45)', display: 'block', marginTop: '6px' }}>
								Expires {activeSub.expiresAt ? new Date(activeSub.expiresAt).toLocaleDateString() : 'N/A'}
							</span>
						</div>
					</div>
				);
			})()}

			{/* Plan cards */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
				{plans.map((plan) => {
					const isSelected = selectedPlan === plan.key;
					return (
						<div
							key={plan.key}
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
							{plan.featured && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #00dce5, #e9feff)', color: '#003739', padding: '4px 14px', fontFamily: 'JetBrains Mono', fontSize: '9px', fontWeight: 700, borderRadius: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Best Value</div>}

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
				<div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
						{loading ? 'Processing...' : `Subscribe to ${selectedPlan === 'MONTHLY' ? 'Monthly' : 'Yearly'} Plan`}
					</button>
				</div>
			)}

			{/* Payment history */}
			{payments.length > 0 && (
				<div>
					<div className="wd-section-head" style={{ marginBottom: '14px' }}>
						<h3 style={{ fontSize: '20px' }}>Payment History</h3>
						<span className="wd-section-count">{payments.length} payment{payments.length === 1 ? '' : 's'}</span>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
						{payments.map((p: any) => {
							const statusColor = p.paymentStatus === 'PAID' ? '#66daba' : p.paymentStatus === 'PENDING' ? '#ffb77f' : '#9aabab';
							return (
								<div key={p._id} className="nm-row">
									<div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
										<span
											style={{
												fontFamily: 'JetBrains Mono',
												fontSize: '9px',
												fontWeight: 700,
												letterSpacing: '0.08em',
												textTransform: 'uppercase',
												padding: '4px 11px',
												borderRadius: '7px',
												background: `${statusColor}14`,
												border: `1px solid ${statusColor}35`,
												color: statusColor,
												flexShrink: 0,
											}}
										>
											{p.paymentStatus}
										</span>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>${p.paymentAmount}</span>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.5)' }}>{p.paymentProvider}</span>
									</div>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.4)', flexShrink: 0 }}>
										{new Date(p.createdAt).toLocaleDateString()}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Stripe Payment Modal */}
			{paymentModal && stripePromise && (
				<Elements stripe={stripePromise} options={{ clientSecret: paymentModal.clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#00dce5' } } }}>
					<CardPaymentForm
						clientSecret={paymentModal.clientSecret}
						planName={paymentModal.planKey === 'MONTHLY' ? 'Monthly' : 'Yearly'}
						price={paymentModal.price}
						onSuccess={() => finalizeSubscription(paymentModal.paymentId, paymentModal.planKey, paymentModal.price)}
						onCancel={() => setPaymentModal(null)}
					/>
				</Elements>
			)}
		</div>
	);
};

export default SubscriptionContent;
