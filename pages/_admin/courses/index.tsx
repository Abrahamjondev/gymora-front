import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Stack, Typography, TablePagination } from '@mui/material';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_COURSES_BY_ADMIN } from '../../../apollo/admin/query';
import { DELETE_COURSE_BY_ADMIN } from '../../../apollo/admin/mutation';
import { Course } from '../../../libs/types/course/course';
import { CoursesInquiry } from '../../../libs/types/course/course.input';
import { Direction } from '../../../libs/enums/common.enum';
import { T } from '../../../libs/types/common';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';
import { REACT_APP_API_URL } from '../../../libs/config';

const AdminCourses: NextPage = ({ initialInquiry, ...props }: any) => {
	const [courses, setCourses] = useState<Course[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [inquiry, setInquiry] = useState<CoursesInquiry>(initialInquiry);

	const { loading, refetch } = useQuery(GET_ALL_COURSES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setCourses(data?.getAllCoursesByAdmin?.list ?? []);
			setTotal(data?.getAllCoursesByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	const [deleteCourse] = useMutation(DELETE_COURSE_BY_ADMIN);

	useEffect(() => {
		refetch({ input: inquiry });
	}, [inquiry]);

	const handlePageChange = (e: unknown, newPage: number) => {
		setInquiry({ ...inquiry, page: newPage + 1 });
	};

	const handleRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInquiry({ ...inquiry, limit: parseInt(e.target.value, 10), page: 1 });
	};

	const deleteHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Delete this course?')) {
				await deleteCourse({ variables: { input: id } });
				await refetch({ input: inquiry });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	return (
		<Stack sx={{ p: 3 }}>
			<Typography variant="h4" sx={{ mb: 3, fontFamily: 'Hanken Grotesk', fontWeight: 700 }}>
				Courses Management
			</Typography>

			<div style={{ overflowX: 'auto' }}>
				<table style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
						<tr style={{ borderBottom: '1px solid #eee' }}>
							{['Image', 'Title', 'Category', 'Difficulty', 'Duration', 'Price', 'Rating', 'Actions'].map((h) => (
								<th key={h} style={{ padding: '12px 8px', textAlign: 'left', fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600 }}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{courses.map((c) => (
							<tr key={c._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
								<td style={{ padding: '8px' }}>
									<img
										src={c.courseThumbnail ? `${REACT_APP_API_URL}/${c.courseThumbnail}` : '/img/banner/header1.svg'}
										alt=""
										style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
									/>
								</td>
								<td style={{ padding: '8px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 500 }}>{c.courseTitle}</td>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{c.courseCategory}</td>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{c.courseDifficulty}</td>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{c.courseDuration}w</td>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>${c.coursePrice}</td>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{c.courseRating?.toFixed(1) ?? '-'}</td>
								<td style={{ padding: '8px' }}>
									<button
										onClick={() => deleteHandler(c._id)}
										style={{ padding: '4px 12px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
									>
										Delete
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<TablePagination
				component="div"
				count={total}
				page={inquiry.page - 1}
				onPageChange={handlePageChange}
				rowsPerPage={inquiry.limit}
				onRowsPerPageChange={handleRowsPerPage}
			/>
		</Stack>
	);
};

AdminCourses.defaultProps = {
	initialInquiry: { page: 1, limit: 10, sort: 'createdAt', direction: 'DESC', search: {} },
};

export default withAdminLayout(AdminCourses);
