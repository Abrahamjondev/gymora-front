import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { TablePagination } from '@mui/material';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_TRAINERS_BY_ADMIN } from '../../../apollo/admin/query';
import { GET_TRAINER_MEMBERS } from '../../../apollo/user/query';
import { DELETE_TRAINER_BY_ADMIN, UPDATE_TRAINER_BY_ADMIN } from '../../../apollo/admin/mutation';
import { REACT_APP_API_URL } from '../../../libs/config';
import { Trainer } from '../../../libs/types/trainer/trainer';
import { TrainersListInquiry } from '../../../libs/types/trainer/trainer.input';
import { TrainerVerificationStatus } from '../../../libs/enums/trainer.enum';
import { T } from '../../../libs/types/common';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';

const statusMeta: Record<string, { color: string }> = {
	VERIFIED: { color: '#66daba' },
	PENDING: { color: '#ffb77f' },
	REJECTED: { color: '#ff8a8a' },
};

const AdminTrainers: NextPage = ({ initialInquiry, ...props }: any) => {
	const [trainers, setTrainers] = useState<Trainer[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [inquiry, setInquiry] = useState<TrainersListInquiry>(initialInquiry);
	const [memberMap, setMemberMap] = useState<Record<string, { nick: string; image?: string }>>({});

	// Trainer entity carries only memberId — resolve names/avatars via the
	// public trainer-members list (backend Trainer DTO has no memberData)
	useQuery(GET_TRAINER_MEMBERS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 200, search: {} } },
		onCompleted: (d: T) => {
			const map: Record<string, { nick: string; image?: string }> = {};
			(d?.getTrainerMembers?.list ?? []).forEach((m: any) => {
				map[m._id] = { nick: m.memberFullName || m.memberNick, image: m.memberImage };
			});
			setMemberMap(map);
		},
	});

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
	const [updateTrainer] = useMutation(UPDATE_TRAINER_BY_ADMIN);

	useEffect(() => {
		refetch({ input: inquiry });
	}, [inquiry]);

	const handlePageChange = (e: unknown, newPage: number) => {
		setInquiry({ ...inquiry, page: newPage + 1 });
	};

	const handleRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInquiry({ ...inquiry, limit: parseInt(e.target.value, 10), page: 1 });
	};

	// Mirrors backend updateTrainerByAdmin — verification moderation
	const setVerification = async (id: string, status: TrainerVerificationStatus) => {
		try {
			await updateTrainer({ variables: { input: { _id: id, trainerVerificationStatus: status } } });
			await refetch({ input: inquiry });
			await sweetTopSmallSuccessAlert(`Trainer ${status.toLowerCase()}`, 800);
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
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
		<div className="ad-page">
			<div className="ad-head">
				<h2>Trainers</h2>
				<span className="wd-section-count">{total} total</span>
			</div>

			<div className="ad-table-wrap">
				<table className="ad-table">
					<thead>
						<tr>
							{['Trainer', 'Bio', 'Specializations', 'Exp', 'Rating', 'Status', 'Actions'].map((h) => (
								<th key={h}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{trainers.map((t) => {
							const meta = statusMeta[t.trainerVerificationStatus] || statusMeta.PENDING;
							const member = memberMap[String(t.memberId)];
							return (
								<tr key={t._id}>
									<td>
										<div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
											<img
												src={member?.image ? `${REACT_APP_API_URL}/${member.image}` : '/img/profile/defaultUser.svg'}
												alt=""
												style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
											/>
											<div>
												<span className="ad-strong" style={{ display: 'block', whiteSpace: 'nowrap' }}>{member?.nick ?? '—'}</span>
												<span className="ad-mono">{t._id.slice(-6)}</span>
											</div>
										</div>
									</td>
									<td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.trainerBio}</td>
									<td className="ad-mono" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
										{t.trainerSpecializations?.join(', ')}
									</td>
									<td className="ad-mono">{t.trainerExperience}y</td>
									<td className="ad-mono" style={{ color: '#ffb77f' }}>
										{t.trainerRating ? `★ ${t.trainerRating.toFixed(1)}` : '—'}
									</td>
									<td>
										<span
											className="ad-chip"
											style={{ ['--adc' as any]: meta.color, ['--adc-bg' as any]: `${meta.color}14`, ['--adc-bd' as any]: `${meta.color}35` }}
										>
											{t.trainerVerificationStatus}
										</span>
									</td>
									<td>
										<div className="ad-actions">
											{t.trainerVerificationStatus !== TrainerVerificationStatus.VERIFIED && (
												<button className="ad-btn is-success" onClick={() => setVerification(t._id, TrainerVerificationStatus.VERIFIED)}>
													Verify
												</button>
											)}
											{t.trainerVerificationStatus !== TrainerVerificationStatus.REJECTED && (
												<button className="ad-btn" onClick={() => setVerification(t._id, TrainerVerificationStatus.REJECTED)}>
													Reject
												</button>
											)}
											<button className="ad-btn is-danger" onClick={() => deleteHandler(t._id)}>
												Delete
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
				{!loading && trainers.length === 0 && <div className="ad-empty">No trainers found.</div>}
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

AdminTrainers.defaultProps = {
	initialInquiry: { page: 1, limit: 10, sort: 'createdAt', direction: 'DESC', search: {} },
};

export default withAdminLayout(AdminTrainers);
