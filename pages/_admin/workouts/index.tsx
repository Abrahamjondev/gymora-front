import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { TablePagination } from '@mui/material';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_WORKOUTS_BY_ADMIN } from '../../../apollo/admin/query';
import { DELETE_WORKOUT_BY_ADMIN, UPDATE_WORKOUT_BY_ADMIN } from '../../../apollo/admin/mutation';
import { Workout } from '../../../libs/types/workout/workout';
import { T } from '../../../libs/types/common';
import { REACT_APP_API_URL } from '../../../libs/config';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';

const difficultyColor: Record<string, string> = {
	BEGINNER: '#66daba',
	INTERMEDIATE: '#ffb77f',
	ADVANCED: '#ff8a8a',
};

const AdminWorkouts: NextPage = ({ initialInquiry, ...props }: any) => {
	const [workouts, setWorkouts] = useState<Workout[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [inquiry, setInquiry] = useState<any>(initialInquiry);
	const [kcalEdits, setKcalEdits] = useState<Record<string, string>>({});

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
	const [updateWorkout] = useMutation(UPDATE_WORKOUT_BY_ADMIN);

	useEffect(() => {
		refetch({ input: inquiry });
	}, [inquiry]);

	const handlePageChange = (e: unknown, newPage: number) => {
		setInquiry({ ...inquiry, page: newPage + 1 });
	};

	const handleRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInquiry({ ...inquiry, limit: parseInt(e.target.value, 10), page: 1 });
	};

	const saveKcalHandler = async (id: string) => {
		try {
			const value = Number(kcalEdits[id]);
			if (!value || value <= 0) return;
			await updateWorkout({ variables: { input: { _id: id, estimatedCaloriesBurned: value } } });
			setKcalEdits((prev) => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
			await refetch({ input: inquiry });
			await sweetTopSmallSuccessAlert('Updated', 700);
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
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
		<div className="ad-page">
			<div className="ad-head">
				<h2>Workouts</h2>
				<span className="wd-section-count">{total} total</span>
			</div>

			<div className="ad-table-wrap">
				<table className="ad-table">
					<thead>
						<tr>
							{['Preview', 'Title', 'Difficulty', 'Target', 'Kcal', 'Views', 'Likes', 'Actions'].map((h) => (
								<th key={h}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{workouts.map((w) => {
							const dColor = difficultyColor[w.workoutDifficulty] || '#00dce5';
							const editing = kcalEdits[w._id] !== undefined;
							return (
								<tr key={w._id}>
									<td>
										<img className="ad-thumb" src={w.workoutThumbnail ? `${REACT_APP_API_URL}/${w.workoutThumbnail}` : '/img/banner/header1.svg'} alt="" />
									</td>
									<td className="ad-strong" style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
										{w.workoutTitle}
									</td>
									<td>
										<span
											className="ad-chip"
											style={{ ['--adc' as any]: dColor, ['--adc-bg' as any]: `${dColor}14`, ['--adc-bd' as any]: `${dColor}35` }}
										>
											{w.workoutDifficulty}
										</span>
									</td>
									<td className="ad-mono">{w.targetMuscle}</td>
									<td>
										{editing ? (
											<div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
												<input
													className="ad-price-input"
													type="number"
													value={kcalEdits[w._id]}
													onChange={(e) => setKcalEdits({ ...kcalEdits, [w._id]: e.target.value })}
												/>
												<button className="ad-btn is-success" onClick={() => saveKcalHandler(w._id)}>
													Save
												</button>
											</div>
										) : (
											<span
												className="ad-mono"
												style={{ cursor: 'pointer', color: '#ffc08f' }}
												title="Click to edit"
												onClick={() => setKcalEdits({ ...kcalEdits, [w._id]: String(w.estimatedCaloriesBurned ?? 0) })}
											>
												{w.estimatedCaloriesBurned} ✎
											</span>
										)}
									</td>
									<td className="ad-mono">{w.workoutViews ?? 0}</td>
									<td className="ad-mono">{w.workoutLikes ?? 0}</td>
									<td>
										<div className="ad-actions">
											<button className="ad-btn is-danger" onClick={() => deleteHandler(w._id)}>
												Delete
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
				{!loading && workouts.length === 0 && <div className="ad-empty">No workouts found.</div>}
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

AdminWorkouts.defaultProps = {
	initialInquiry: { page: 1, limit: 10, sort: 'createdAt', direction: 'DESC', search: {} },
};

export default withAdminLayout(AdminWorkouts);
