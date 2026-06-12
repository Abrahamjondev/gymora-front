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
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { GET_COURSES } from '../../apollo/user/query';
import { REACT_APP_API_URL } from '../../libs/config';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'program', 'enums'])),
	},
});

const categoryColors: Record<string, string> = {
	STRENGTH: '#ff8a00',
	CARDIO: '#00dce5',
	YOGA: '#ddb7ff',
	MOBILITY: '#66daba',
	NUTRITION: '#ffb77f',
};

const fallbackAccent = '#00dce5';

const CourseList: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('program');
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
		{ value: 'courseRank', label: t('list.sortTopRanked') },
		{ value: 'courseRating', label: t('list.sortHighestRated') },
		{ value: 'coursePrice', label: t('list.sortPrice') },
		{ value: 'createdAt', label: t('list.sortNewest') },
	];

	const hasActiveFilters = activeCategory !== 'ALL' || activeDifficulty !== 'ALL' || searchText;

	return (
		<div className="wl-page">
			<div className="lp-container">
				{/* Hero */}
				<div className="wl-hero">
					<div className="wl-hero-glow" />
					<span className="lp-eyebrow lp-eyebrow--orange">{t('list.eyebrow')}</span>
					<h1 className="wl-title">
						{t('list.titleLead')} <span className="lp-grad">{t('list.titleAccent')}</span>
					</h1>
					<p className="lp-sub" style={{ margin: 0 }}>
						{t('list.sub')}
					</p>
					<div className="wl-badge">
						<span className="wl-badge-dot" />
						<span>{total > 0 ? t('list.programsAvailable', { count: total }) : t('list.loadingPrograms')}</span>
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
								placeholder={t('list.searchPlaceholder')}
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
									{d === 'ALL' ? t('list.allLevels') : t(`enums:difficulty.${d}`)}
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
										{cat === 'ALL' ? t('list.allGoals') : t(`enums:category.${cat}`)}
									</button>
								);
							})}
						</div>
					</div>
				</div>

				{/* Active filters summary */}
				{hasActiveFilters && (
					<div className="wl-active-row">
						<span className="wl-active-label">{t('list.activeLabel')}</span>
						{activeCategory !== 'ALL' && <span className="wl-active-chip">{t(`enums:category.${activeCategory}`)}</span>}
						{activeDifficulty !== 'ALL' && <span className="wl-active-chip">{t(`enums:difficulty.${activeDifficulty}`)}</span>}
						{searchText && <span className="wl-active-chip">"{searchText}"</span>}
						<button className="wl-active-clear" onClick={clearAllHandler}>
							✕ {t('common:actions.clearAll')}
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
								const accent = categoryColors[course.courseCategory] || fallbackAccent;
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
												{t(`enums:category.${course.courseCategory}`)}
											</span>
											{course.courseRating && course.courseRating > 0 ? (
												<span className="cl-card-rating">★ {course.courseRating.toFixed(1)}</span>
											) : null}
											<span className="cl-card-price">{course.coursePrice > 0 ? `$${course.coursePrice}` : t('list.free')}</span>
										</div>

										<div className="cl-card-body">
											<h3>{course.courseTitle}</h3>
											<p className="cl-card-desc">{course.courseDesc || t('list.descFallback')}</p>
											<div className="cl-card-foot">
												<div className="cl-card-meta">
													<span>{t('list.weeksShort', { count: course.courseDuration })}</span>
													<span>{t(`enums:difficulty.${course.courseDifficulty}`)}</span>
													{(course.purchasedMembers?.length ?? 0) > 0 && (
														<span style={{ color: '#66daba' }}>{t('list.enrolledCount', { count: course.purchasedMembers.length })}</span>
													)}
													{(course.courseLikes ?? 0) > 0 && <span style={{ color: '#ff8a8a' }}>♥ {course.courseLikes}</span>}
												</div>
												<button className="cl-card-cta">{t('list.viewProgram')}</button>
											</div>
										</div>
									</div>
								);
						  })}
				</div>

				{/* No results */}
				{!loading && courses.length === 0 && (
					<div className="wl-empty">
						<span className="wl-empty-label">{t('list.emptyLabel')}</span>
						<h3>{t('list.emptyTitle')}</h3>
						<p>{t('list.emptyText')}</p>
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
