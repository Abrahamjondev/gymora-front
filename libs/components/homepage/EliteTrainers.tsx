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

	const { loading } = useQuery(GET_TRAINER_MEMBERS, {
		fetchPolicy: 'cache-and-network',
		variables: {
			input: {
				page: 1,
				limit: 3,
				sort: 'memberRank',
				direction: 'DESC',
				search: {},
			},
		},
		onCompleted: (data: T) => {
			setTrainers(data?.getTrainerMembers?.list ?? []);
		},
	});

	const handleClick = (memberId: string) => {
		router.push({ pathname: '/member', query: { memberId } });
	};

	return (
		<section style={{ background: '#1c1b1c', padding: '40px 0' }}>
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
				<div style={{ display: 'grid', gridTemplateColumns: '4fr 8fr', gap: '48px', alignItems: 'center' }}>
					{/* Left side - text */}
					<div>
						<span
							style={{
								fontFamily: 'JetBrains Mono, monospace',
								fontSize: '11px',
								letterSpacing: '0.2em',
								color: '#00f5ff',
								fontWeight: 500,
								textTransform: 'uppercase',
								display: 'block',
								marginBottom: '8px',
							}}
						>
							Master coaches
						</span>
						<h2
							style={{
								fontFamily: 'Hanken Grotesk, sans-serif',
								fontSize: '32px',
								lineHeight: '40px',
								letterSpacing: '-0.01em',
								fontWeight: 700,
								color: '#e5e2e3',
								marginBottom: '24px',
							}}
						>
							Train with the elite.
						</h2>
						<p
							style={{
								fontFamily: 'Hanken Grotesk, sans-serif',
								fontSize: '16px',
								lineHeight: '24px',
								color: '#b9caca',
								marginBottom: '32px',
							}}
						>
							Our trainers aren't just influencers — they are world-class athletes, researchers, and professional
							coaches with decades of combined experience.
						</p>
						<button
							onClick={() => router.push('/trainer')}
							style={{
								background: 'transparent',
								border: '1px solid #3a494a',
								borderRadius: '8px',
								padding: '12px 24px',
								fontFamily: 'Hanken Grotesk, sans-serif',
								fontSize: '14px',
								fontWeight: 700,
								color: '#e9feff',
								cursor: 'pointer',
								marginBottom: '24px',
								width: 'fit-content',
							}}
						>
							View All Trainers →
						</button>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
							{[
								{ icon: '✓', title: 'NASM Master Trainers', sub: 'Certified Excellence' },
								{ icon: '★', title: 'Olympian-Led Programs', sub: 'Pro Performance' },
							].map((item) => (
								<div
									key={item.title}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '16px',
										padding: '16px',
										borderRadius: '8px',
										background: '#201f20',
										border: '1px solid #3a494a',
									}}
								>
									<div
										style={{
											width: '40px',
											height: '40px',
											borderRadius: '50%',
											background: 'rgba(0,245,255,0.2)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: '#00f5ff',
											fontSize: '18px',
										}}
									>
										{item.icon}
									</div>
									<div>
										<div style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontWeight: 700, color: '#e5e2e3' }}>
											{item.title}
										</div>
										<div style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', color: '#b9caca' }}>
											{item.sub}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Right side - trainer cards */}
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
						{loading && !trainers.length
							? [1, 2, 3].map((i) => (
									<div
										key={i}
										style={{ aspectRatio: '3/4', borderRadius: '12px', background: '#2a2a2b' }}
									/>
							  ))
							: trainers.map((trainer) => (
									<div
										key={trainer._id}
										onClick={() => handleClick(trainer._id)}
										style={{
											aspectRatio: '3/4',
											borderRadius: '12px',
											overflow: 'hidden',
											position: 'relative',
											cursor: 'pointer',
										}}
									>
										<img
											src={
												trainer.memberImage
													? `${REACT_APP_API_URL}/${trainer.memberImage}`
													: '/img/profile/defaultUser.svg'
											}
											alt={trainer.memberNick}
											style={{
												width: '100%',
												height: '100%',
												objectFit: 'cover',
												filter: 'grayscale(1)',
												transition: 'filter 0.5s',
											}}
											onMouseOver={(e) => ((e.target as HTMLImageElement).style.filter = 'grayscale(0)')}
											onMouseOut={(e) => ((e.target as HTMLImageElement).style.filter = 'grayscale(1)')}
										/>
										<div
											style={{
												position: 'absolute',
												inset: 0,
												background: 'linear-gradient(to top, #131314 0%, transparent 50%)',
											}}
										/>
										<div style={{ position: 'absolute', bottom: '16px', left: '16px' }}>
											<div
												style={{
													fontFamily: 'Hanken Grotesk, sans-serif',
													fontWeight: 700,
													color: '#ffffff',
													fontSize: '16px',
												}}
											>
												{trainer.memberFullName || trainer.memberNick}
											</div>
											<div
												style={{
													fontFamily: 'JetBrains Mono, monospace',
													fontSize: '10px',
													color: '#00f5ff',
													textTransform: 'uppercase',
												}}
											>
												{trainer.memberDesc?.slice(0, 25) || 'Elite Trainer'}
											</div>
										</div>
									</div>
							  ))}
					</div>
				</div>
			</div>
		</section>
	);
};

export default EliteTrainers;
