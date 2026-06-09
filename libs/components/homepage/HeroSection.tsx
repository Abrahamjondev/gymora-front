import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { GET_WORKOUTS, GET_TRAINER_MEMBERS } from '../../../apollo/user/query';
import { T } from '../../types/common';

const HeroSection = () => {
	const router = useRouter();
	const [workoutTotal, setWorkoutTotal] = useState<number>(0);
	const [trainerTotal, setTrainerTotal] = useState<number>(0);

	useQuery(GET_WORKOUTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, search: {} } },
		onCompleted: (d: T) => setWorkoutTotal(d?.getWorkouts?.metaCounter?.[0]?.total ?? 0),
	});

	useQuery(GET_TRAINER_MEMBERS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, search: {} } },
		onCompleted: (d: T) => setTrainerTotal(d?.getTrainerMembers?.metaCounter?.[0]?.total ?? 0),
	});

	return (
		<section
			style={{
				position: 'relative',
				maxWidth: '1280px',
				margin: '0 auto',
				padding: '80px 32px 100px',
				textAlign: 'center',
				overflow: 'hidden',
			}}
		>
			{/* Background glow */}
			<div
				style={{
					position: 'absolute',
					top: '-120px',
					left: '50%',
					transform: 'translateX(-50%)',
					width: '800px',
					height: '600px',
					background: 'radial-gradient(circle, rgba(0,220,229,0.06) 0%, rgba(0,220,229,0.02) 40%, transparent 70%)',
					pointerEvents: 'none',
				}}
			/>

			{/* Badge */}
			<div
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: '10px',
					padding: '6px 16px 6px 8px',
					borderRadius: '9999px',
					background: 'rgba(0,220,229,0.06)',
					border: '1px solid rgba(0,220,229,0.15)',
					marginBottom: '36px',
					animation: 'fadeInUp 0.6s ease both',
				}}
			>
				<span
					style={{
						width: '6px',
						height: '6px',
						borderRadius: '50%',
						background: '#00dce5',
						boxShadow: '0 0 8px rgba(0,220,229,0.6)',
						animation: 'pulse 2s ease-in-out infinite',
					}}
				/>
				<span
					style={{
						fontFamily: 'JetBrains Mono, monospace',
						fontSize: '11px',
						letterSpacing: '0.06em',
						fontWeight: 500,
						color: 'rgba(0,220,229,0.9)',
						textTransform: 'uppercase',
					}}
				>
					{workoutTotal > 0 ? `${workoutTotal}+ workouts available` : 'Elite fitness platform'}
				</span>
			</div>

			{/* Heading */}
			<h1
				style={{
					fontFamily: 'Hanken Grotesk, sans-serif',
					fontSize: 'clamp(32px, 5vw, 56px)',
					lineHeight: '1.08',
					letterSpacing: '-0.035em',
					fontWeight: 800,
					color: '#ffffff',
					maxWidth: '720px',
					margin: '0 auto 28px',
					animation: 'fadeInUp 0.7s ease 0.1s both',
				}}
			>
				Expert training.
				<br />
				<span
					style={{
						background: 'linear-gradient(135deg, #00dce5 0%, #e9feff 50%, #00f5ff 100%)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						backgroundClip: 'text',
					}}
				>
					Real results.
				</span>
			</h1>

			{/* Subtitle */}
			<p
				style={{
					fontFamily: 'Hanken Grotesk, sans-serif',
					fontSize: 'clamp(15px, 1.8vw, 18px)',
					lineHeight: '1.65',
					color: 'rgba(185,202,202,0.85)',
					maxWidth: '520px',
					margin: '0 auto 44px',
					animation: 'fadeInUp 0.7s ease 0.2s both',
				}}
			>
				Precision-engineered programs for elite performance. Professional-grade coaching and data-driven insights.
			</p>

			{/* Buttons */}
			<div
				style={{
					display: 'flex',
					gap: '14px',
					justifyContent: 'center',
					flexWrap: 'wrap',
					animation: 'fadeInUp 0.7s ease 0.35s both',
				}}
			>
				<button
					onClick={() => router.push('/account/join')}
					style={{
						background: 'linear-gradient(135deg, #00dce5 0%, #e9feff 100%)',
						color: '#003739',
						fontFamily: 'Hanken Grotesk, sans-serif',
						fontWeight: 700,
						padding: '14px 32px',
						borderRadius: '12px',
						border: 'none',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						fontSize: '15px',
						transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
						boxShadow: '0 0 30px rgba(0,220,229,0.25), 0 4px 12px rgba(0,0,0,0.3)',
					}}
					onMouseOver={(e) => {
						(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
						(e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(0,220,229,0.4), 0 8px 24px rgba(0,0,0,0.3)';
					}}
					onMouseOut={(e) => {
						(e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
						(e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(0,220,229,0.25), 0 4px 12px rgba(0,0,0,0.3)';
					}}
				>
					Get Started Free
					<span style={{ fontSize: '16px' }}>→</span>
				</button>
				<button
					onClick={() => router.push('/workout')}
					style={{
						background: 'rgba(255,255,255,0.04)',
						color: 'rgba(233,254,255,0.9)',
						fontFamily: 'Hanken Grotesk, sans-serif',
						fontWeight: 600,
						padding: '14px 32px',
						borderRadius: '12px',
						border: '1px solid rgba(255,255,255,0.08)',
						cursor: 'pointer',
						fontSize: '15px',
						transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
					}}
					onMouseOver={(e) => {
						(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
						(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,220,229,0.3)';
						(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
					}}
					onMouseOut={(e) => {
						(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
						(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
						(e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
					}}
				>
					Browse Programs
				</button>
			</div>

			{/* Dynamic Stats */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					gap: '48px',
					marginTop: '64px',
					animation: 'fadeInUp 0.7s ease 0.5s both',
				}}
			>
				{[
					{ value: workoutTotal > 0 ? `${workoutTotal}+` : '—', label: 'Workouts' },
					{ value: trainerTotal > 0 ? `${trainerTotal}+` : '—', label: 'Trainers' },
					{ value: '100%', label: 'Free Workouts' },
					{ value: '24/7', label: 'Access' },
				].map((stat) => (
					<div key={stat.label} style={{ textAlign: 'center' }}>
						<span
							style={{
								fontFamily: 'Hanken Grotesk, sans-serif',
								fontSize: '28px',
								fontWeight: 800,
								color: '#ffffff',
								display: 'block',
								lineHeight: '1',
							}}
						>
							{stat.value}
						</span>
						<span
							style={{
								fontFamily: 'JetBrains Mono, monospace',
								fontSize: '10px',
								color: 'rgba(185,202,202,0.5)',
								textTransform: 'uppercase',
								letterSpacing: '0.08em',
								marginTop: '6px',
								display: 'block',
							}}
						>
							{stat.label}
						</span>
					</div>
				))}
			</div>
		</section>
	);
};

export default HeroSection;
