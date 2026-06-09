import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Stack, Typography, TablePagination, MenuItem, Select } from '@mui/material';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_WORKOUTS_BY_ADMIN } from '../../../apollo/admin/query';
import { DELETE_WORKOUT_BY_ADMIN, UPDATE_WORKOUT_BY_ADMIN } from '../../../apollo/admin/mutation';
import { Workout } from '../../../libs/types/workout/workout';
import { WorkoutsInquiry } from '../../../libs/types/workout/workout.input';
import { Direction } from '../../../libs/enums/common.enum';
import { T } from '../../../libs/types/common';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';
import { REACT_APP_API_URL } from '../../../libs/config';

const AdminWorkouts: NextPage = ({ initialInquiry, ...props }: any) => {
	const [workouts, setWorkouts] = useState<Workout[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [inquiry, setInquiry] = useState<WorkoutsInquiry>(initialInquiry);

	const { loading, refetch } = useQuery(GET_ALL_WORKOUTS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setWorkouts(data?.getAllWorkoutsByAdmin?.list ?? []);
			setTotal(data?.getAllWorkoutsByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	const [deleteWorkout] = useMutation(DELETE_WORKOUT_BY_ADMIN);

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
			if (await sweetConfirmAlert('Delete this workout?')) {
				await deleteWorkout({ variables: { input: id } });
				await refetch({ input: inquiry });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	return (
		<Stack sx={{ p: 3 }}>
			<Typography variant="h4" sx={{ mb: 3, fontFamily: 'Hanken Grotesk', fontWeight: 700 }}>
				Workouts Management
			</Typography>

			{/* Table */}
			<div style={{ overflowX: 'auto' }}>
				<table style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
						<tr style={{ borderBottom: '1px solid #eee' }}>
							{['Image', 'Title', 'Difficulty', 'Target', 'Calories', 'Free', 'Views', 'Likes', 'Actions'].map((h) => (
								<th key={h} style={{ padding: '12px 8px', textAlign: 'left', fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600 }}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{workouts.map((w) => (
							<tr key={w._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
								<td style={{ padding: '8px' }}>
									<img
										src={w.workoutThumbnail ? `${REACT_APP_API_URL}/${w.workoutThumbnail}` : '/img/banner/header1.svg'}
										alt=""
										style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
									/>
								</td>
								<td style={{ padding: '8px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 500 }}>{w.workoutTitle}</td>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{w.workoutDifficulty}</td>
								<td style={{ padding: '8px', fontFamily: 'Hanken Grotesk', fontSize: '13px' }}>{w.targetMuscle}</td>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{w.estimatedCaloriesBurned}</td>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>'✅ Free'</td>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{w.workoutViews ?? 0}</td>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{w.workoutLikes ?? 0}</td>
								<td style={{ padding: '8px' }}>
									<button
										onClick={() => deleteHandler(w._id)}
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

AdminWorkouts.defaultProps = {
	initialInquiry: { page: 1, limit: 10, sort: 'createdAt', direction: 'DESC', search: {} },
};

export default withAdminLayout(AdminWorkouts);
