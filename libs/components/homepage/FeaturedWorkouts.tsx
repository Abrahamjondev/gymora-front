import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { GET_WORKOUTS } from '../../../apollo/user/query';
import { Workout } from '../../types/workout/workout';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

const difficultyLabels: Record<string, string> = {
	BEGINNER: 'Beginner',
	INTERMEDIATE: 'Intermediate',
	ADVANCED: 'Advanced',
};

const FeaturedWorkouts = () => {
	const router = useRouter();
	const [workouts, setWorkouts] = useState<Workout[]>([]);

	const { loading } = useQuery(GET_WORKOUTS, {
		fetchPolicy: 'cache-and-network',
		variables: {
			input: {
				page: 1,
				limit: 4,
				sort: 'workoutRank',
				direction: 'DESC',
				search: {},
			},
		},
		onCompleted: (data: T) => {
			setWorkouts(data?.getWorkouts?.list ?? []);
		},
	});

	const handleClick = (id: string) => {
		router.push({ pathname: '/workout/detail', query: { id } });
	};

	return (
		<section style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
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
						curated tracks
					</span>
					<h2
						style={{
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontSize: '32px',
							lineHeight: '40px',
							letterSpacing: '-0.01em',
							fontWeight: 700,
							color: '#e5e2e3',
						}}
					>
						Elite Programs
					</h2>
				</div>
				<a
					onClick={() => router.push('/workout')}
					style={{
						color: '#e9feff',
						fontFamily: 'Hanken Grotesk, sans-serif',
						fontWeight: 700,
						fontSize: '14px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					View Library →
				</a>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
				{loading && !workouts.length
					? [1, 2, 3, 4].map((i) => (
							<div key={i}>
								<div
									style={{
										aspectRatio: '16/9',
										borderRadius: '12px',
										background: '#2a2a2b',
										marginBottom: '16px',
									}}
								/>
								<div style={{ height: '20px', background: '#2a2a2b', borderRadius: '4px', marginBottom: '8px' }} />
								<div style={{ height: '14px', background: '#1c1b1c', borderRadius: '4px', width: '60%' }} />
							</div>
					  ))
					: workouts.map((workout) => (
							<div
								key={workout._id}
								onClick={() => handleClick(workout._id)}
								style={{ cursor: 'pointer' }}
							>
								<div
									style={{
										aspectRatio: '16/9',
										borderRadius: '12px',
										overflow: 'hidden',
										marginBottom: '16px',
										position: 'relative',
									}}
								>
									<img
										src={
											workout.workoutThumbnail
												? `${REACT_APP_API_URL}/${workout.workoutThumbnail}`
												: '/img/banner/header1.svg'
										}
										alt={workout.workoutTitle}
										style={{
											width: '100%',
											height: '100%',
											objectFit: 'cover',
											transition: 'transform 0.5s',
										}}
										onMouseOver={(e) => ((e.target as HTMLImageElement).style.transform = 'scale(1.1)')}
										onMouseOut={(e) => ((e.target as HTMLImageElement).style.transform = 'scale(1)')}
									/>
									<div
										style={{
											position: 'absolute',
											inset: 0,
											background: 'linear-gradient(to top, rgba(19,19,20,0.8), transparent)',
										}}
									/>
									<div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '8px' }}>
										<span
											style={{
												background: 'rgba(0,245,255,0.2)',
												backdropFilter: 'blur(8px)',
												color: '#00f5ff',
												fontFamily: 'JetBrains Mono, monospace',
												fontSize: '10px',
												padding: '2px 8px',
												borderRadius: '4px',
												border: '1px solid rgba(0,245,255,0.3)',
												textTransform: 'uppercase',
											}}
										>
											{workout.targetMuscle || workout.workoutDifficulty}
										</span>
									</div>
								</div>
								<h4
									style={{
										fontFamily: 'Hanken Grotesk, sans-serif',
										fontSize: '20px',
										lineHeight: '28px',
										fontWeight: 600,
										color: '#e5e2e3',
										transition: 'color 0.2s',
									}}
									onMouseOver={(e) => ((e.target as HTMLElement).style.color = '#00f5ff')}
									onMouseOut={(e) => ((e.target as HTMLElement).style.color = '#e5e2e3')}
								>
									{workout.workoutTitle}
								</h4>
								<p
									style={{
										fontFamily: 'Hanken Grotesk, sans-serif',
										fontSize: '14px',
										lineHeight: '20px',
										color: '#b9caca',
									}}
								>
									{workout.estimatedCaloriesBurned} cal • {difficultyLabels[workout.workoutDifficulty] || workout.workoutDifficulty}
								</p>
							</div>
					  ))}
			</div>
		</section>
	);
};

export default FeaturedWorkouts;
