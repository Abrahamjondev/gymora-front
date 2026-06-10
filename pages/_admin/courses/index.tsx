import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { TablePagination } from '@mui/material';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { GET_ALL_COURSES_BY_ADMIN, GET_LESSONS_BY_ADMIN } from '../../../apollo/admin/query';
import { DELETE_COURSE_BY_ADMIN, DELETE_LESSON_BY_ADMIN, UPDATE_COURSE_BY_ADMIN } from '../../../apollo/admin/mutation';
import { Course } from '../../../libs/types/course/course';
import { T } from '../../../libs/types/common';
import { REACT_APP_API_URL } from '../../../libs/config';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';

const categoryColor: Record<string, string> = {
	STRENGTH: '#ff8a00',
	CARDIO: '#00dce5',
	YOGA: '#ddb7ff',
	MOBILITY: '#66daba',
	NUTRITION: '#ffb77f',
};

const AdminCourses: NextPage = ({ initialInquiry, ...props }: any) => {
	const [courses, setCourses] = useState<Course[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [inquiry, setInquiry] = useState<any>(initialInquiry);
	const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});
	const [openLessons, setOpenLessons] = useState<string | null>(null);
	const [lessons, setLessons] = useState<any[]>([]);

	const { loading, refetch } = useQuery(GET_ALL_COURSES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setCourses(data?.getAllCoursesByAdmin?.list ?? []);
			setTotal(data?.getAllCoursesByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	const [fetchLessons, { loading: lessonsLoading }] = useLazyQuery(GET_LESSONS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		onCompleted: (d: T) => setLessons(d?.getLessonsByAdmin ?? []),
	});

	const [deleteCourse] = useMutation(DELETE_COURSE_BY_ADMIN);
	const [updateCourse] = useMutation(UPDATE_COURSE_BY_ADMIN);
	const [deleteLesson] = useMutation(DELETE_LESSON_BY_ADMIN);

	useEffect(() => {
		refetch({ input: inquiry });
	}, [inquiry]);

	const handlePageChange = (e: unknown, newPage: number) => {
		setInquiry({ ...inquiry, page: newPage + 1 });
	};

	const handleRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInquiry({ ...inquiry, limit: parseInt(e.target.value, 10), page: 1 });
	};

	const toggleLessons = async (courseId: string) => {
		if (openLessons === courseId) {
			setOpenLessons(null);
			setLessons([]);
			return;
		}
		setOpenLessons(courseId);
		setLessons([]);
		await fetchLessons({ variables: { input: courseId } });
	};

	const savePriceHandler = async (id: string) => {
		try {
			const value = Number(priceEdits[id]);
			if (Number.isNaN(value) || value < 0) return;
			await updateCourse({ variables: { input: { _id: id, coursePrice: value } } });
			setPriceEdits((prev) => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
			await refetch({ input: inquiry });
			await sweetTopSmallSuccessAlert('Price updated', 700);
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const deleteHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Delete this program?')) {
				await deleteCourse({ variables: { input: id } });
				await refetch({ input: inquiry });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const deleteLessonHandler = async (lessonId: string, courseId: string) => {
		try {
			if (await sweetConfirmAlert('Delete this lesson?')) {
				await deleteLesson({ variables: { input: lessonId } });
				await fetchLessons({ variables: { input: courseId } });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	return (
		<div className="ad-page">
			<div className="ad-head">
				<h2>Programs</h2>
				<span className="wd-section-count">{total} total</span>
			</div>

			<div className="ad-table-wrap">
				<table className="ad-table">
					<thead>
						<tr>
							{['Preview', 'Title', 'Category', 'Level', 'Weeks', 'Price', 'Enrolled', 'Actions'].map((h) => (
								<th key={h}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{courses.map((c) => {
							const accent = categoryColor[c.courseCategory] || '#00dce5';
							const editing = priceEdits[c._id] !== undefined;
							const expanded = openLessons === c._id;
							return (
								<React.Fragment key={c._id}>
									<tr>
										<td>
											<img className="ad-thumb" src={c.courseThumbnail ? `${REACT_APP_API_URL}/${c.courseThumbnail}` : '/img/banner/header1.svg'} alt="" />
										</td>
										<td className="ad-strong" style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
											{c.courseTitle}
										</td>
										<td>
											<span
												className="ad-chip"
												style={{ ['--adc' as any]: accent, ['--adc-bg' as any]: `${accent}14`, ['--adc-bd' as any]: `${accent}35` }}
											>
												{c.courseCategory}
											</span>
										</td>
										<td className="ad-mono">{c.courseDifficulty}</td>
										<td className="ad-mono">{c.courseDuration}w</td>
										<td>
											{editing ? (
												<div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
													<input
														className="ad-price-input"
														type="number"
														value={priceEdits[c._id]}
														onChange={(e) => setPriceEdits({ ...priceEdits, [c._id]: e.target.value })}
													/>
													<button className="ad-btn is-success" onClick={() => savePriceHandler(c._id)}>
														Save
													</button>
												</div>
											) : (
												<span
													className="ad-strong"
													style={{ cursor: 'pointer' }}
													title="Click to edit price"
													onClick={() => setPriceEdits({ ...priceEdits, [c._id]: String(c.coursePrice ?? 0) })}
												>
													${c.coursePrice} ✎
												</span>
											)}
										</td>
										<td className="ad-mono">{c.purchasedMembers?.length ?? 0}</td>
										<td>
											<div className="ad-actions">
												<button className="ad-btn" onClick={() => toggleLessons(c._id)}>
													{expanded ? 'Hide lessons' : 'Lessons'}
												</button>
												<button className="ad-btn is-danger" onClick={() => deleteHandler(c._id)}>
													Delete
												</button>
											</div>
										</td>
									</tr>
									{expanded && (
										<tr>
											<td colSpan={8} className="ad-sub">
												{lessonsLoading ? (
													<span className="ad-mono">Loading lessons...</span>
												) : lessons.length === 0 ? (
													<span className="ad-mono">No lessons in this program yet.</span>
												) : (
													<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
														{lessons.map((l: any, i: number) => (
															<div key={l._id} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
																<span className="ad-mono" style={{ color: 'rgba(0,220,229,0.7)', width: '52px' }}>
																	W{String(l.weekNumber).padStart(2, '0')}·{String(l.order ?? i + 1).padStart(2, '0')}
																</span>
																<span className="ad-strong" style={{ flex: 1 }}>{l.title}</span>
																{l.duration ? <span className="ad-mono">{Math.round(l.duration)} min</span> : null}
																<button className="ad-btn is-danger" onClick={() => deleteLessonHandler(l._id, c._id)}>
																	Delete
																</button>
															</div>
														))}
													</div>
												)}
											</td>
										</tr>
									)}
								</React.Fragment>
							);
						})}
					</tbody>
				</table>
				{!loading && courses.length === 0 && <div className="ad-empty">No programs found.</div>}
			</div>

			<TablePagination
				component="div"
				count={total}
				page={inquiry.page - 1}
				onPageChange={handlePageChange}
				rowsPerPage={inquiry.limit}
				onRowsPerPageChange={handleRowsPerPage}
				sx={{ color: '#b9caca', '& .MuiSvgIcon-root': { color: '#b9caca' } }}
			/>
		</div>
	);
};

AdminCourses.defaultProps = {
	initialInquiry: { page: 1, limit: 10, sort: 'createdAt', direction: 'DESC', search: {} },
};

export default withAdminLayout(AdminCourses);
