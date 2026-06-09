import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { GET_WORKOUTS } from '../../../apollo/user/query';
import { Workout } from '../../types/workout/workout';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

const HotWorkouts = () => {
	const router = useRouter();
	const [workouts, setWorkouts] = useState<Workout[]>([]);

	useQuery(GET_WORKOUTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 6, sort: 'workoutRank', direction: 'DESC', search: {} } },
		onCompleted: (d: T) => setWorkouts(d?.getWorkouts?.list ?? []),
	});

	if (!workouts.length) return null;

	return (
		<section style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px 80px' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', animation: 'fadeInUp 0.6s ease both' }}>
				<div>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(0,220,229,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Trending this week</span>
					<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>Hot Workouts</h2>
				</div>
				<button onClick={() => router.push('/workout')} style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'rgba(185,202,202,0.7)', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.25s ease' }}
					onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,220,229,0.3)'; (e.currentTarget as HTMLElement).style.color = '#e9feff'; }}
					onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(185,202,202,0.7)'; }}>
					View all →
				</button>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
				{workouts.slice(0, 6).map((w, i) => {
					const isFeatured = i < 2;
					return (
						<div key={w._id} onClick={() => router.push({ pathname: '/workout/detail', query: { id: w._id } })}
							style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', border: isFeatured ? '1px solid rgba(0,220,229,0.15)' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)', animation: `fadeInUp 0.5s ease ${0.05 + i * 0.07}s both` }}
							onMouseOver={(e) => {
								const el = e.currentTarget as HTMLElement;
								el.style.transform = 'translateY(-6px) scale(1.01)';
								el.style.borderColor = isFeatured ? 'rgba(0,220,229,0.5)' : 'rgba(0,220,229,0.2)';
								el.style.boxShadow = isFeatured
									? '0 20px 60px rgba(0,220,229,0.12), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
									: '0 16px 48px rgba(0,0,0,0.5), 0 4px 16px rgba(0,220,229,0.06), inset 0 1px 0 rgba(255,255,255,0.03)';
							}}
							onMouseOut={(e) => {
								const el = e.currentTarget as HTMLElement;
								el.style.transform = 'translateY(0) scale(1)';
								el.style.borderColor = isFeatured ? 'rgba(0,220,229,0.15)' : 'rgba(255,255,255,0.05)';
								el.style.boxShadow = 'none';
							}}>

							<div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
								<img src={w.workoutThumbnail ? `${REACT_APP_API_URL}/${w.workoutThumbnail}` : '/img/banner/header1.svg'} alt={w.workoutTitle} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
									onMouseOver={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1.05)'; }}
									onMouseOut={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }} />
								<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />
								<div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
									<span style={{ padding: '4px 8px', borderRadius: '6px', background: isFeatured ? 'rgba(0,220,229,0.15)' : 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: isFeatured ? '1px solid rgba(0,220,229,0.25)' : '1px solid rgba(255,255,255,0.1)', fontFamily: 'Hanken Grotesk', fontSize: '11px', fontWeight: 800, color: isFeatured ? '#00dce5' : 'rgba(255,255,255,0.6)' }}>#{i + 1}</span>
									{isFeatured && <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(0,220,229,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,220,229,0.2)', fontFamily: 'JetBrains Mono', fontSize: '9px', fontWeight: 600, color: 'rgba(0,220,229,0.9)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trending</span>}
								</div>
								<div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '6px' }}>
									<span style={{ padding: '3px 8px', borderRadius: '5px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(6px)', fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(233,254,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{w.targetMuscle}</span>
									<span style={{ padding: '3px 8px', borderRadius: '5px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(6px)', fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(233,254,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{w.workoutDifficulty}</span>
								</div>
							</div>

							<div style={{ padding: '16px', background: 'rgba(255,255,255,0.015)' }}>
								<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3', lineHeight: '1.3', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.workoutTitle}</h3>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.45)' }}>{w.estimatedCaloriesBurned} kcal</span>
									<div style={{ display: 'flex', gap: '12px' }}>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.35)' }}>{w.workoutViews ?? 0} views</span>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.35)' }}>♥ {w.workoutLikes ?? 0}</span>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
};

export default HotWorkouts;
