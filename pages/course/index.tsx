import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { CircularProgress, Pagination, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Course } from '../../libs/types/course/course';
import { CoursesInquiry } from '../../libs/types/course/course.input';
import { CourseCategory, CourseDifficulty } from '../../libs/enums/course.enum';
import { Direction } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useQuery } from '@apollo/client';
import { GET_COURSES } from '../../apollo/user/query';
import { REACT_APP_API_URL } from '../../libs/config';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const categoryColors: Record<string, string> = {
	STRENGTH: '#ff8a00',
	CARDIO: '#00dce5',
	YOGA: '#ddb7ff',
	MOBILITY: '#66daba',
	NUTRITION: '#ffb77f',
};

const CourseList: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const [courses, setCourses] = useState<Course[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchFilter, setSearchFilter] = useState<CoursesInquiry>({
		page: 1,
		limit: 6,
		sort: 'courseRank',
		direction: Direction.DESC,
		search: {},
	});
	const [activeCategory, setActiveCategory] = useState<string>('ALL');
	const [activeDifficulty, setActiveDifficulty] = useState<string>('ALL');
	const [searchText, setSearchText] = useState<string>('');
	const [activeSort, setActiveSort] = useState<string>('courseRank');

	/** APOLLO REQUESTS **/
	const { loading, refetch } = useQuery(GET_COURSES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setCourses(data?.getCourses?.list ?? []);
			setTotal(data?.getCourses?.metaCounter?.[0]?.total ?? 0);
		},
	});

	useEffect(() => {
		refetch({ input: searchFilter });
	}, [searchFilter]);

	/** HANDLERS **/
	const buildCourseSearch = (overrides: any = {}) => {
		const cat = overrides.category ?? activeCategory;
		const diff = overrides.difficulty ?? activeDifficulty;
		const text = overrides.text ?? searchText;
		const sort = overrides.sort ?? activeSort;

		const search: any = {};
		if (cat !== 'ALL') search.courseCategory = cat;
		if (diff !== 'ALL') search.courseDifficulty = diff;
		if (text) search.text = text;

		setSearchFilter({ ...searchFilter, page: 1, sort, search });
	};

	const categoryFilterHandler = (cat: string) => {
		setActiveCategory(cat);
		buildCourseSearch({ category: cat });
	};

	const difficultyFilterHandler = (diff: string) => {
		setActiveDifficulty(diff);
		buildCourseSearch({ difficulty: diff });
	};

	const courseSortHandler = (sort: string) => {
		setActiveSort(sort);
		buildCourseSearch({ sort });
	};

	const courseSearchHandler = () => {
		buildCourseSearch({ text: searchText });
	};

	const paginationHandler = (e: any, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const pushDetailHandler = (courseId: string) => {
		router.push({ pathname: '/course/detail', query: { id: courseId } });
	};

	const categories = ['ALL', 'STRENGTH', 'CARDIO', 'YOGA', 'MOBILITY', 'NUTRITION'];

	if (loading && !courses.length) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#131314' }}>
				<CircularProgress size={'4rem'} sx={{ color: '#00dce5' }} />
			</Stack>
		);
	}

	if (device === 'mobile') {
		return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>GYMORA COURSES MOBILE</div>;
	}

	return (
		<div style={{ background: '#131314', minHeight: '100vh', padding: '40px 0' }}>
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
				{/* Header */}
				<div style={{ marginBottom: '32px' }}>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#ff8a00', fontWeight: 500, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
						Elite Performance
					</span>
					<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '40px', lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: 800, color: '#e9feff' }}>
						Programs Library
					</h2>
					<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', lineHeight: '24px', color: '#b9caca', maxWidth: '560px', marginTop: '12px' }}>
						Structured multi-week programs designed by elite trainers. From strength to mobility — find your path.
					</p>
				</div>

				{/* Search + Sort */}
				<div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
					<div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid #3a494a', borderRadius: '8px', padding: '0 16px' }}>
						<span style={{ color: '#849495', marginRight: '8px' }}>🔍</span>
						<input value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && courseSearchHandler()} placeholder="Search programs..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#e5e2e3', padding: '14px 0' }} />
						{searchText && <span onClick={() => { setSearchText(''); buildCourseSearch({ text: '' }); }} style={{ color: '#849495', cursor: 'pointer' }}>✕</span>}
					</div>
					<select value={activeSort} onChange={(e) => courseSortHandler(e.target.value)} style={{ padding: '12px 16px', background: '#201f20', border: '1px solid #3a494a', borderRadius: '8px', color: '#e5e2e3', fontFamily: 'Hanken Grotesk', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
						<option value="courseRank">Top Ranked</option>
						<option value="courseRating">Highest Rated</option>
						<option value="coursePrice">Price</option>
						<option value="createdAt">Newest</option>
					</select>
				</div>

				{/* Category filters */}
				<div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
					{categories.map((cat) => (
						<button key={cat} onClick={() => categoryFilterHandler(cat)} style={{ padding: '8px 20px', borderRadius: '9999px', fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: activeCategory === cat ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s', border: activeCategory === cat ? 'none' : '1px solid #3a494a', background: activeCategory === cat ? '#e9feff' : '#353436', color: activeCategory === cat ? '#003739' : '#b9caca' }}>
							{cat === 'ALL' ? 'All Goals' : cat.charAt(0) + cat.slice(1).toLowerCase()}
						</button>
					))}
				</div>

				{/* Difficulty filters */}
				<div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
					<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'flex', alignItems: 'center', marginRight: '4px' }}>LEVEL:</span>
					{['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((d) => (
						<button key={d} onClick={() => difficultyFilterHandler(d)} style={{ padding: '6px 14px', borderRadius: '6px', fontFamily: 'JetBrains Mono', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s', border: activeDifficulty === d ? '1px solid #ff8a00' : '1px solid #3a494a', background: activeDifficulty === d ? 'rgba(255,138,0,0.15)' : 'transparent', color: activeDifficulty === d ? '#ff8a00' : '#849495' }}>
							{d === 'ALL' ? 'Any' : d.charAt(0) + d.slice(1).toLowerCase()}
						</button>
					))}
				</div>

				{/* Course Grid */}
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
					{courses.map((course) => (
						<div
							key={course._id}
							onClick={() => pushDetailHandler(course._id)}
							style={{
								background: 'rgba(255,255,255,0.03)',
								border: '1px solid rgba(255,255,255,0.08)',
								borderRadius: '12px',
								overflow: 'hidden',
								cursor: 'pointer',
								transition: 'all 0.3s',
							}}
							onMouseOver={(e) => {
								(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,220,229,0.3)';
								(e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
							}}
							onMouseOut={(e) => {
								(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
								(e.currentTarget as HTMLElement).style.transform = 'scale(1)';
							}}
						>
							{/* Image */}
							<div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
								<img
									src={course.courseThumbnail ? `${REACT_APP_API_URL}/${course.courseThumbnail}` : '/img/banner/header1.svg'}
									alt={course.courseTitle}
									style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
									onMouseOver={(e) => ((e.target as HTMLImageElement).style.transform = 'scale(1.1)')}
									onMouseOut={(e) => ((e.target as HTMLImageElement).style.transform = 'scale(1)')}
								/>
								<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(19,19,20,0.6), transparent)' }} />
								<span style={{
									position: 'absolute', top: '12px', left: '12px',
									padding: '4px 10px', borderRadius: '4px',
									background: categoryColors[course.courseCategory] || '#ff8a00',
									fontFamily: 'JetBrains Mono', fontSize: '10px', fontWeight: 700,
									color: '#131314', textTransform: 'uppercase', letterSpacing: '0.05em',
								}}>
									{course.courseCategory}
								</span>
								{course.courseRating && course.courseRating > 0 && (
									<div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 8px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
										<span style={{ color: '#ff8a00', fontSize: '12px' }}>★</span>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#e5e2e3', fontWeight: 700 }}>{course.courseRating.toFixed(1)}</span>
									</div>
								)}
							</div>

							{/* Info */}
							<div style={{ padding: '20px' }}>
								<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', lineHeight: '28px', fontWeight: 600, color: '#e5e2e3', marginBottom: '8px' }}>
									{course.courseTitle}
								</h3>
								<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: '#b9caca' }}>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }}>⏱ {course.courseDuration} Weeks</span>
									<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }}>📊 {course.courseDifficulty}</span>
								</div>
								<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', lineHeight: '20px', color: '#849495', marginBottom: '16px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
									{course.courseDesc || 'Professional training program'}
								</p>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(58,73,74,0.5)' }}>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '18px', fontWeight: 700, color: '#e9feff' }}>
										{course.coursePrice > 0 ? `$${course.coursePrice}` : 'Free'}
									</span>
									<button style={{
										background: '#e9feff', color: '#003739', border: 'none', borderRadius: '6px',
										padding: '8px 20px', fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
									}}>
										View Program
									</button>
								</div>
							</div>
						</div>
					))}
				</div>

				{!loading && courses.length === 0 && (
					<div style={{ textAlign: 'center', padding: '80px 0', color: '#b9caca', fontFamily: 'Hanken Grotesk', fontSize: '18px' }}>
						No programs found. Try a different category.
					</div>
				)}

				{total > searchFilter.limit && (
					<Stack alignItems="center" style={{ marginTop: '40px' }}>
						<Pagination
							count={Math.ceil(total / searchFilter.limit)}
							page={searchFilter.page}
							onChange={paginationHandler}
							shape="rounded"
							sx={{
								'& .MuiPaginationItem-root': { color: '#b9caca', borderColor: '#3a494a' },
								'& .Mui-selected': { backgroundColor: '#e9feff !important', color: '#003739' },
							}}
						/>
					</Stack>
				)}
			</div>
		</div>
	);
};

export default withLayoutBasic(CourseList);
