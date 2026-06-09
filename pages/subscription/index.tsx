import React, { useState } from 'react';
import { NextPage } from 'next';
import { Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { GET_MEMBER_SUBSCRIPTIONS, GET_PAYMENT_HISTORY } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';

export const getStaticProps = async ({ locale }: any) => ({ props: { ...(await serverSideTranslations(locale, ['common'])) } });

const SubscriptionPage: NextPage = () => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const router = useRouter();
	const [subscriptions, setSubscriptions] = useState<any[]>([]);
	const [payments, setPayments] = useState<any[]>([]);

	useQuery(GET_MEMBER_SUBSCRIPTIONS, { fetchPolicy: 'network-only', skip: !user?._id, onCompleted: (d: T) => setSubscriptions(d?.getMemberSubscriptions ?? []) });
	useQuery(GET_PAYMENT_HISTORY, { fetchPolicy: 'network-only', skip: !user?._id, onCompleted: (d: T) => setPayments(d?.getPaymentHistory ?? []) });

	if (!user?._id) return <div style={{ background: '#131314', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#b9caca' }}>Please login.</p></div>;
	if (device === 'mobile') return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>SUBSCRIPTION MOBILE</div>;

	const plans = [
		{ name: 'MONTHLY', price: '$14.99', period: '/month', features: ['Unlimited Workouts', 'Health Metrics', 'Community Access'] },
		{ name: 'YEARLY', price: '$119.88', period: '/year', sub: '$9.99/mo · Save 33%', featured: true, features: ['Everything in Monthly', 'Biometric Integration', '1-on-1 Review', 'Early Access'] },
	];

	return (
		<div style={{ background: '#131314', minHeight: '100vh', padding: '40px 0' }}>
			<div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
				<div style={{ textAlign: 'center', marginBottom: '48px' }}>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#ff8a00', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Membership</span>
					<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '40px', fontWeight: 800, color: '#e5e2e3' }}>Invest in Performance</h2>
				</div>

				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '48px' }}>
					{plans.map((plan) => (
						<div key={plan.name} style={{ padding: '32px', border: plan.featured ? '2px solid #00dce5' : '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', background: plan.featured ? 'rgba(0,220,229,0.05)' : 'rgba(255,255,255,0.03)', position: 'relative' }}>
							{plan.featured && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#00dce5', color: '#003739', padding: '4px 12px', fontFamily: 'JetBrains Mono', fontSize: '10px', borderRadius: '4px', fontWeight: 700 }}>BEST VALUE</div>}
							<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495', textTransform: 'uppercase' }}>{plan.name}</span>
							<div style={{ margin: '12px 0 20px' }}><span style={{ fontFamily: 'Hanken Grotesk', fontSize: '36px', fontWeight: 800, color: '#e9feff' }}>{plan.price}</span><span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#849495' }}>{plan.period}</span></div>
							{plan.sub && <p style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#00dce5', marginBottom: '16px' }}>{plan.sub}</p>}
							{plan.features.map((f) => <div key={f} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}><span style={{ color: '#00dce5' }}>✓</span><span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#b9caca' }}>{f}</span></div>)}
							<button style={{ width: '100%', padding: '14px', marginTop: '16px', background: plan.featured ? '#e9feff' : 'transparent', color: plan.featured ? '#003739' : '#e9feff', border: plan.featured ? 'none' : '1px solid #3a494a', borderRadius: '8px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Get Started</button>
						</div>
					))}
				</div>

				{/* Active subscriptions */}
				{subscriptions.length > 0 && (
					<div style={{ marginBottom: '32px' }}>
						<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>Active Subscriptions</h3>
						{subscriptions.map((s: any) => (
							<div key={s._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<div><span style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3' }}>{s.subscriptionPlan}</span><span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: s.subscriptionStatus === 'ACTIVE' ? '#66daba' : '#849495', marginLeft: '12px' }}>{s.subscriptionStatus}</span></div>
							</div>
						))}
					</div>
				)}

				{/* Payment history */}
				{payments.length > 0 && (
					<div>
						<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>Payment History</h3>
						{payments.map((p: any) => (
							<div key={p._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
								<div><span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#e5e2e3' }}>${p.paymentAmount}</span><span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495', marginLeft: '12px' }}>{p.paymentProvider} • {p.paymentStatus}</span></div>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495' }}>{new Date(p.createdAt).toLocaleDateString()}</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default withLayoutBasic(SubscriptionPage);
