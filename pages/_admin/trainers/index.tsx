import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Stack, Typography, TablePagination } from '@mui/material';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_TRAINERS_BY_ADMIN } from '../../../apollo/admin/query';
import { DELETE_TRAINER_BY_ADMIN } from '../../../apollo/admin/mutation';
import { Trainer } from '../../../libs/types/trainer/trainer';
import { TrainersListInquiry } from '../../../libs/types/trainer/trainer.input';
import { Direction } from '../../../libs/enums/common.enum';
import { T } from '../../../libs/types/common';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';

const AdminTrainers: NextPage = ({ initialInquiry, ...props }: any) => {
	const [trainers, setTrainers] = useState<Trainer[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [inquiry, setInquiry] = useState<TrainersListInquiry>(initialInquiry);

	const { loading, refetch } = useQuery(GET_ALL_TRAINERS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setTrainers(data?.getAllTrainersByAdmin?.list ?? []);
			setTotal(data?.getAllTrainersByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	const [deleteTrainer] = useMutation(DELETE_TRAINER_BY_ADMIN);

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
			if (await sweetConfirmAlert('Delete this trainer?')) {
				await deleteTrainer({ variables: { input: id } });
				await refetch({ input: inquiry });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	return (
		<Stack sx={{ p: 3 }}>
			<Typography variant="h4" sx={{ mb: 3, fontFamily: 'Hanken Grotesk', fontWeight: 700 }}>
				Trainers Management
			</Typography>

			<div style={{ overflowX: 'auto' }}>
				<table style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
						<tr style={{ borderBottom: '1px solid #eee' }}>
							{['ID', 'Bio', 'Specializations', 'Experience', 'Rating', 'Status', 'Actions'].map((h) => (
								<th key={h} style={{ padding: '12px 8px', textAlign: 'left', fontFamily: 'Hanken Grotesk', fontSize: '13px', fontWeight: 600 }}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{trainers.map((t) => (
							<tr key={t._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '11px' }}>{t._id.slice(-6)}</td>
								<td style={{ padding: '8px', fontFamily: 'Hanken Grotesk', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.trainerBio}</td>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '11px' }}>{t.trainerSpecializations?.join(', ')}</td>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{t.trainerExperience} yrs</td>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{t.trainerRating?.toFixed(1) ?? '-'}</td>
								<td style={{ padding: '8px', fontFamily: 'JetBrains Mono', fontSize: '11px' }}>{t.trainerVerificationStatus}</td>
								<td style={{ padding: '8px' }}>
									<button
										onClick={() => deleteHandler(t._id)}
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

AdminTrainers.defaultProps = {
	initialInquiry: { page: 1, limit: 10, sort: 'createdAt', direction: 'DESC', search: {} },
};

export default withAdminLayout(AdminTrainers);
