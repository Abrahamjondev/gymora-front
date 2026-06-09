import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { GET_COURSES } from '../../../apollo/user/query';
import { Course } from '../../types/course/course';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

const categoryAccent: Record<string, string> = {
	STRENGTH: '#ff8a00',
	CARDIO: '#00dce5',
	YOGA: '#ddb7ff',
	MOBILITY: '#66daba',
	NUTRITION: '#ffb77f',
};

const TopCourses = () => {
	const router = useRouter();
	const [courses, setCourses] = useState<Course[]>([]);

	useQuery(GET_COURSES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 4, sort: 'courseRank', direction: 'DESC', search: {} } },
		onCompleted: (d: T) => setCourses(d?.getCourses?.list ?? []),
	});

	if (!courses.length) return null;

	return (
		<section style={{ padding: '80px 0', background: 'rgba(255,255,255,0.01)' }}>
			<div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px' }}>
				{/* Header */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', animation: 'fadeInUp 0.6s ease both' }}>
					<div>
						<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(255,138,0,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
							Structured programs
						</span>
						<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
							Top Courses
						</h2>
					</div>
					<button
						onClick={() => router.push('/course')}
						style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600, color: 'rgba(185,202,202,0.7)', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.25s ease' }}
						onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,138,0,0.3)'; (e.currentTarget as HTMLElement).style.color = '#ffb77f'; }}
						onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(185,202,202,0.7)'; }}
					>
						Browse all →
					</button>
				</div>

				{/* Course grid */}
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
					{courses.map((course, i) => {
						const accent = categoryAccent[course.courseCategory] || '#00dce5';
						return (
							<div
								key={course._id}
								onClick={() => router.push({ pathname: '/course/detail', query: { id: course._id } })}
								style={{
									borderRadius: '14px', overflow: 'hidden', cursor: 'pointer',
									background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
									transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
									animation: `fadeInUp 0.5s ease ${0.1 + i * 0.1}s both`,
								}}
								onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${accent}33`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${accent}10`; }}
								onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
							>
								{/* Image */}
								<div style={{ aspectRatio: '16/10', overflow: 'hidden', position: 'relative' }}>
									<img src={course.courseThumbnail ? `${REACT_APP_API_URL}/${course.courseThumbnail}` : '/img/banner/header1.svg'} alt={course.courseTitle} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} />
									<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 60%)' }} />
									{/* Category pill */}
									<span style={{ position: 'absolute', top: '12px', left: '12px', padding: '4px 10px', borderRadius: '6px', background: `${accent}20`, backdropFilter: 'blur(8px)', border: `1px solid ${accent}30`, fontFamily: 'JetBrains Mono', fontSize: '9px', fontWeight: 600, color: accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
										{course.courseCategory}
									</span>
									{/* Price */}
									<div style={{ position: 'absolute', bottom: '12px', right: '12px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>{course.coursePrice > 0 ? `$${course.coursePrice}` : 'Free'}</span>
									</div>
								</div>

								{/* Content */}
								<div style={{ padding: '16px' }}>
									<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3', lineHeight: '1.3', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.courseTitle}</h3>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
										<div style={{ display: 'flex', gap: '10px' }}>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.5)', textTransform: 'uppercase' }}>{course.courseDuration}w</span>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.5)', textTransform: 'uppercase' }}>{course.courseDifficulty}</span>
										</div>
										{course.courseRating && course.courseRating > 0 && (
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#ff8a00' }}>★ {course.courseRating.toFixed(1)}</span>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default TopCourses;
