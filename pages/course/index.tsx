import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Pagination, Stack } from '@mui/material';
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

	const clearAllHandler = () => {
		setActiveCategory('ALL');
		setActiveDifficulty('ALL');
		setSearchText('');
		setActiveSort('courseRank');
		setSearchFilter({ ...searchFilter, page: 1, sort: 'courseRank', search: {} });
	};

	const categories = ['ALL', 'STRENGTH', 'CARDIO', 'YOGA', 'MOBILITY', 'NUTRITION'];
	const difficulties = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
	const sortOptions = [
		{ value: 'courseRank', label: 'Top Ranked' },
		{ value: 'courseRating', label: 'Highest Rated' },
		{ value: 'coursePrice', label: 'Price' },
		{ value: 'createdAt', label: 'Newest' },
	];

	const hasActiveFilters = activeCategory !== 'ALL' || activeDifficulty !== 'ALL' || searchText;

	return (
		<div className="wl-page">
			<div className="lp-container">
				{/* Hero */}
				<div className="wl-hero">
					<div className="wl-hero-glow" />
					<span className="lp-eyebrow lp-eyebrow--orange">Structured training</span>
					<h1 className="wl-title">
						Training <span className="lp-grad">Programs</span>
					</h1>
					<p className="lp-sub" style={{ margin: 0 }}>
						Multi-week programs designed by elite trainers. From strength to mobility — find your path.
					</p>
					<div className="wl-badge">
						<span className="wl-badge-dot" />
						<span>{total > 0 ? `${total} programs available` : 'Loading programs'}</span>
					</div>
				</div>

				{/* Filter console */}
				<div className="wl-console">
					<div className="wl-console-row">
						<div className="wl-search">
							<input
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && courseSearchHandler()}
								placeholder="Search programs..."
							/>
							{searchText && (
								<span
									className="wl-search-clear"
									onClick={() => {
										setSearchText('');
										buildCourseSearch({ text: '' });
									}}
								>
									✕
								</span>
							)}
						</div>
						<select className="wl-sort" value={activeSort} onChange={(e) => courseSortHandler(e.target.value)}>
							{sortOptions.map((s) => (
								<option key={s.value} value={s.value}>
									{s.label}
								</option>
							))}
						</select>
					</div>

					<div className="wl-console-row">
						<div className="wl-seg">
							{difficulties.map((d) => (
								<button key={d} className={activeDifficulty === d ? 'is-active' : ''} onClick={() => difficultyFilterHandler(d)}>
									{d === 'ALL' ? 'All Levels' : d.charAt(0) + d.slice(1).toLowerCase()}
								</button>
							))}
						</div>
						<div className="wl-muscles" style={{ gap: '6px' }}>
							{categories.map((cat) => {
								const accent = categoryColors[cat];
								const isActive = activeCategory === cat;
								return (
									<button
										key={cat}
										className="cl-cat-btn"
										style={
											isActive
												? { borderColor: accent ? `${accent}80` : 'rgba(0,220,229,0.5)', background: accent ? `${accent}1c` : 'rgba(0,220,229,0.14)', color: accent || '#00eaf4' }
												: undefined
										}
										onClick={() => categoryFilterHandler(cat)}
									>
										{accent && <span className="cl-cat-dot" style={{ background: accent }} />}
										{cat === 'ALL' ? 'All Goals' : cat.charAt(0) + cat.slice(1).toLowerCase()}
									</button>
								);
							})}
						</div>
					</div>
				</div>

				{/* Active filters summary */}
				{hasActiveFilters && (
					<div className="wl-active-row">
						<span className="wl-active-label">ACTIVE:</span>
						{activeCategory !== 'ALL' && <span className="wl-active-chip">{activeCategory}</span>}
						{activeDifficulty !== 'ALL' && <span className="wl-active-chip">{activeDifficulty}</span>}
						{searchText && <span className="wl-active-chip">"{searchText}"</span>}
						<button className="wl-active-clear" onClick={clearAllHandler}>
							✕ Clear all
						</button>
					</div>
				)}

				{/* Program Grid */}
				<div className="cl-grid">
					{loading && !courses.length
						? [1, 2, 3, 4, 5, 6].map((i) => (
								<div key={i} className="wl-skel">
									<div className="wl-skel-img" />
									<div className="wl-skel-body">
										<div className="wl-skel-line" />
										<div className="wl-skel-line" />
									</div>
								</div>
						  ))
						: courses.map((course) => {
								const accent = categoryColors[course.courseCategory] || '#00dce5';
								return (
									<div
										key={course._id}
										className="cl-card"
										style={
											{
												'--accent': accent,
												'--accent-soft': `${accent}59`,
												'--accent-glow': `${accent}14`,
											} as React.CSSProperties
										}
										onClick={() => pushDetailHandler(course._id)}
									>
										<div className="cl-card-img">
											<img
												src={course.courseThumbnail ? `${REACT_APP_API_URL}/${course.courseThumbnail}` : '/img/banner/header1.svg'}
												alt={course.courseTitle}
												loading="lazy"
											/>
											<div className="cl-card-shade" />
											<span
												className="lp-chip"
												style={{ position: 'absolute', top: '12px', left: '12px', background: `${accent}20`, borderColor: `${accent}35`, color: accent }}
											>
												{course.courseCategory}
											</span>
											{course.courseRating && course.courseRating > 0 ? (
												<span className="cl-card-rating">★ {course.courseRating.toFixed(1)}</span>
											) : null}
											<span className="cl-card-price">{course.coursePrice > 0 ? `$${course.coursePrice}` : 'Free'}</span>
										</div>

										<div className="cl-card-body">
											<h3>{course.courseTitle}</h3>
											<p className="cl-card-desc">{course.courseDesc || 'Professional training program'}</p>
											<div className="cl-card-foot">
												<div className="cl-card-meta">
													<span>{course.courseDuration}W</span>
													<span>{course.courseDifficulty}</span>
												</div>
												<button className="cl-card-cta">View Program →</button>
											</div>
										</div>
									</div>
								);
						  })}
				</div>

				{/* No results */}
				{!loading && courses.length === 0 && (
					<div className="wl-empty">
						<span className="wl-empty-label">No results</span>
						<h3>No programs match these filters.</h3>
						<p>Try a different goal, level or search term.</p>
					</div>
				)}

				{/* Pagination */}
				{total > searchFilter.limit && (
					<Stack alignItems="center" style={{ marginTop: '48px' }}>
						<Pagination
							count={Math.ceil(total / searchFilter.limit)}
							page={searchFilter.page}
							onChange={paginationHandler}
							shape="rounded"
							sx={{
								'& .MuiPaginationItem-root': { color: '#b9caca', borderColor: '#3a494a', fontFamily: 'JetBrains Mono, monospace' },
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
