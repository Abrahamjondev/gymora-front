import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { GET_TRAINER_MEMBERS } from '../../../apollo/user/query';
import { Member } from '../../types/member/member';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

const EliteTrainers = () => {
	const router = useRouter();
	const [trainers, setTrainers] = useState<Member[]>([]);

	useQuery(GET_TRAINER_MEMBERS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 4, sort: 'memberRank', direction: 'DESC', search: {} } },
		onCompleted: (d: T) => setTrainers(d?.getTrainerMembers?.list ?? []),
	});

	if (!trainers.length) return null;

	return (
		<section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px 100px' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', animation: 'fadeInUp 0.6s ease both' }}>
				<div>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(102,218,186,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Verified professionals</span>
					<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>Elite Trainers</h2>
				</div>
				<button onClick={() => router.push('/trainer')} style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'rgba(185,202,202,0.7)', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.25s ease' }}
					onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(102,218,186,0.3)'; (e.currentTarget as HTMLElement).style.color = '#66daba'; }}
					onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(185,202,202,0.7)'; }}>
					View all →
				</button>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
				{trainers.map((trainer, i) => {
					const isTop = i === 0;
					return (
						<div key={trainer._id} onClick={() => router.push({ pathname: '/member', query: { memberId: trainer._id } })}
							style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', border: isTop ? '1px solid rgba(102,218,186,0.15)' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)', animation: `fadeInUp 0.5s ease ${0.1 + i * 0.08}s both` }}
							onMouseOver={(e) => {
								const el = e.currentTarget as HTMLElement;
								el.style.transform = 'translateY(-6px) scale(1.01)';
								el.style.borderColor = isTop ? 'rgba(102,218,186,0.5)' : 'rgba(0,220,229,0.2)';
								el.style.boxShadow = isTop
									? '0 20px 60px rgba(102,218,186,0.12), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
									: '0 16px 48px rgba(0,0,0,0.5), 0 4px 16px rgba(0,220,229,0.06), inset 0 1px 0 rgba(255,255,255,0.03)';
							}}
							onMouseOut={(e) => {
								const el = e.currentTarget as HTMLElement;
								el.style.transform = 'translateY(0) scale(1)';
								el.style.borderColor = isTop ? 'rgba(102,218,186,0.15)' : 'rgba(255,255,255,0.05)';
								el.style.boxShadow = 'none';
							}}>

							<div style={{ aspectRatio: '4/5', overflow: 'hidden', position: 'relative' }}>
								<img src={trainer.memberImage ? `${REACT_APP_API_URL}/${trainer.memberImage}` : '/img/profile/defaultUser.svg'} alt={trainer.memberNick}
									style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.6) contrast(1.1)', transition: 'filter 0.5s ease, transform 0.5s ease' }}
									onMouseOver={(e) => { (e.target as HTMLImageElement).style.filter = 'grayscale(0) contrast(1)'; (e.target as HTMLImageElement).style.transform = 'scale(1.03)'; }}
									onMouseOut={(e) => { (e.target as HTMLImageElement).style.filter = 'grayscale(0.6) contrast(1.1)'; (e.target as HTMLImageElement).style.transform = 'scale(1)'; }} />
								<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />

								{isTop && (
									<span style={{ position: 'absolute', top: '12px', left: '12px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(102,218,186,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(102,218,186,0.2)', fontFamily: 'JetBrains Mono', fontSize: '9px', fontWeight: 600, color: 'rgba(102,218,186,0.9)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Trainer</span>
								)}
								<span style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Hanken Grotesk', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>#{i + 1}</span>

								<div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px' }}>
									<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '18px', fontWeight: 700, color: '#ffffff', lineHeight: '1.2', marginBottom: '4px' }}>{trainer.memberFullName || trainer.memberNick}</h3>
									{trainer.memberDesc && <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trainer.memberDesc}</p>}
								</div>
							</div>

							<div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.015)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.45)' }}>{trainer.memberWorkouts} workouts</span>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.45)' }}>{trainer.memberFollowers} followers</span>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
};

export default EliteTrainers;
