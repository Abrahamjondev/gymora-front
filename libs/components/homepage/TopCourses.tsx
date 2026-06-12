import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { GET_COURSES } from '../../../apollo/user/query';
import { Course } from '../../types/course/course';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import useReveal from '../../hooks/useReveal';

const DEFAULT_ACCENT = '#00dce5';

const categoryAccent: Record<string, string> = {
	STRENGTH: '#ff8a00',
	CARDIO: '#00dce5',
	YOGA: '#ddb7ff',
	MOBILITY: '#66daba',
	NUTRITION: '#ffb77f',
};

const TopCourses = () => {
	const router = useRouter();
	const { t } = useTranslation('landing');
	const [courses, setCourses] = useState<Course[]>([]);
	const sectionRef = useReveal<HTMLElement>(courses.length > 0);

	useQuery(GET_COURSES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 4, sort: 'courseRank', direction: 'DESC', search: {} } },
		onCompleted: (d: T) => setCourses(d?.getCourses?.list ?? []),
	});

	if (!courses.length) return null;

	const [featured, ...rest] = courses;
	const featuredAccent = categoryAccent[featured.courseCategory] || DEFAULT_ACCENT;
	const openCourse = (id: string) => router.push({ pathname: '/course/detail', query: { id } });

	return (
		<section ref={sectionRef} className="lp-section lp-section--tinted lp-reveal">
			<div className="lp-container">
				<div className="lp-section-head">
					<div>
						<span className="lp-eyebrow lp-eyebrow--orange">{t('topCourses.eyebrow')}</span>
						<h2 className="lp-h2">{t('topCourses.title')}</h2>
					</div>
					<button className="lp-view-btn" onClick={() => router.push('/course')}>
						{t('topCourses.browseAll')} →
					</button>
				</div>

				<div className="lp-course-show">
					{/* Spotlight: #1 ranked program */}
					<div
						className="lp-course-feature"
						style={{ boxShadow: `0 0 70px ${featuredAccent}0e` }}
						onClick={() => openCourse(featured._id)}
						onMouseOver={(e) => {
							(e.currentTarget as HTMLElement).style.borderColor = `${featuredAccent}45`;
						}}
						onMouseOut={(e) => {
							(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
						}}
					>
						<img
							className="lp-course-feature-img"
							src={featured.courseThumbnail ? `${REACT_APP_API_URL}/${featured.courseThumbnail}` : '/img/banner/header1.svg'}
							alt={featured.courseTitle}
							loading="lazy"
						/>
						<div className="lp-course-feature-shade" />
						<span className="lp-course-feature-price">{featured.coursePrice > 0 ? `$${featured.coursePrice}` : t('topCourses.free')}</span>

						<div className="lp-course-feature-body">
							<div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
								<span
									className="lp-chip"
									style={{ background: `${featuredAccent}20`, borderColor: `${featuredAccent}35`, color: featuredAccent }}
								>
									{t(`enums:category.${featured.courseCategory}`)}
								</span>
								<span className="lp-chip">{t('topCourses.rankBadge')}</span>
								{featured.courseRating && featured.courseRating > 0 && (
									<span className="lp-chip" style={{ color: '#ff8a00' }}>
										★ {featured.courseRating.toFixed(1)}
									</span>
								)}
							</div>
							<h3>{featured.courseTitle}</h3>
							{featured.courseDesc && <p className="lp-course-feature-desc">{featured.courseDesc}</p>}
							<div className="lp-course-feature-foot">
								<div className="lp-course-feature-meta">
									<span>{t('common:stats.weeks', { count: featured.courseDuration })}</span>
									<span>{t(`enums:difficulty.${featured.courseDifficulty}`)}</span>
								</div>
								<span className="lp-course-feature-go">
									{t('topCourses.viewProgram')} <span>→</span>
								</span>
							</div>
						</div>
					</div>

					{/* Ranked rows: #2 — #4 */}
					<div className="lp-course-rows">
						{rest.map((course, i) => {
							const accent = categoryAccent[course.courseCategory] || DEFAULT_ACCENT;
							return (
								<div
									key={course._id}
									className="lp-course-row"
									style={{ ['--accent' as any]: accent }}
									onClick={() => openCourse(course._id)}
								>
									<span className="lp-course-row-idx">0{i + 2}</span>
									<div className="lp-course-row-thumb">
										<img
											src={course.courseThumbnail ? `${REACT_APP_API_URL}/${course.courseThumbnail}` : '/img/banner/header1.svg'}
											alt={course.courseTitle}
											loading="lazy"
										/>
									</div>
									<div className="lp-course-row-info">
										<h3>{course.courseTitle}</h3>
										<div className="lp-course-row-meta">
											<span style={{ color: accent }}>{t(`enums:category.${course.courseCategory}`)}</span>
											<span>{t('topCourses.weeksShort', { count: course.courseDuration })}</span>
											<span>{t(`enums:difficulty.${course.courseDifficulty}`)}</span>
										</div>
									</div>
									<div className="lp-course-row-right">
										{course.courseRating && course.courseRating > 0 ? (
											<span className="lp-course-row-rating">★ {course.courseRating.toFixed(1)}</span>
										) : null}
										<span className="lp-course-row-price">{course.coursePrice > 0 ? `$${course.coursePrice}` : t('topCourses.free')}</span>
									</div>
									<span className="lp-course-row-arrow">→</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
};

export default TopCourses;
