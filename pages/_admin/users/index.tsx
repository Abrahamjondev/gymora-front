import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { TablePagination } from '@mui/material';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_MEMBERS_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_MEMBER_BY_ADMIN } from '../../../apollo/admin/mutation';
import { MembersInquiry } from '../../../libs/types/member/member.input';
import { Member } from '../../../libs/types/member/member';
import { MemberStatus, MemberType } from '../../../libs/enums/member.enum';
import { MemberUpdateByAdmin } from '../../../libs/types/member/member.update';
import { T } from '../../../libs/types/common';
import { REACT_APP_API_URL } from '../../../libs/config';
import { sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';

const statusColor: Record<string, string> = {
	ACTIVE: '#66daba',
	BLOCK: '#ffb77f',
	DELETE: '#ff8a8a',
};

const typeColor: Record<string, string> = {
	USER: '#00dce5',
	TRAINER: '#66daba',
	ADMIN: '#ddb7ff',
};

const AdminUsers: NextPage = ({ initialInquiry, ...props }: any) => {
	const [inquiry, setInquiry] = useState<MembersInquiry>(initialInquiry);
	const [members, setMembers] = useState<Member[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [statusTab, setStatusTab] = useState<string>('ALL');
	const [typeFilter, setTypeFilter] = useState<string>('ALL');
	const [searchText, setSearchText] = useState('');

	const [updateMemberByAdmin] = useMutation(UPDATE_MEMBER_BY_ADMIN);

	const { loading, refetch } = useQuery(GET_ALL_MEMBERS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMembers(data?.getAllMembersByAdmin?.list ?? []);
			setTotal(data?.getAllMembersByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	useEffect(() => {
		refetch({ input: inquiry });
	}, [inquiry]);

	// Filters compose instead of overwriting each other (old page wiped
	// type/text whenever the status tab changed)
	const buildSearch = (overrides: { status?: string; type?: string; text?: string }) => {
		const status = overrides.status ?? statusTab;
		const type = overrides.type ?? typeFilter;
		const text = overrides.text ?? searchText;

		const search: any = {};
		if (status !== 'ALL') search.memberStatus = status as MemberStatus;
		if (type !== 'ALL') search.memberType = type as MemberType;
		if (text) search.text = text;

		setInquiry({ ...inquiry, page: 1, search });
	};

	const statusTabHandler = (tab: string) => {
		setStatusTab(tab);
		buildSearch({ status: tab });
	};

	const typeFilterHandler = (type: string) => {
		setTypeFilter(type);
		buildSearch({ type });
	};

	const updateMemberHandler = async (updateData: MemberUpdateByAdmin) => {
		try {
			await updateMemberByAdmin({ variables: { input: updateData } });
			await refetch({ input: inquiry });
			await sweetTopSmallSuccessAlert('Updated', 700);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const handlePageChange = (e: unknown, newPage: number) => {
		setInquiry({ ...inquiry, page: newPage + 1 });
	};

	const handleRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInquiry({ ...inquiry, limit: parseInt(e.target.value, 10), page: 1 });
	};

	return (
		<div className="ad-page">
			<div className="ad-head">
				<h2>Members</h2>
				<span className="wd-section-count">{total} total</span>
			</div>

			{/* Filter console */}
			<div className="wl-console" style={{ position: 'static', marginBottom: '18px' }}>
				<div className="wl-console-row">
					<div className="wl-search">
						<input
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && buildSearch({ text: searchText })}
							placeholder="Search by nickname..."
						/>
						{searchText && (
							<span
								className="wl-search-clear"
								onClick={() => {
									setSearchText('');
									buildSearch({ text: '' });
								}}
							>
								✕
							</span>
						)}
					</div>
				</div>
				<div className="wl-console-row">
					<div className="wl-seg">
						{['ALL', 'ACTIVE', 'BLOCK', 'DELETE'].map((s) => (
							<button key={s} className={statusTab === s ? 'is-active' : ''} onClick={() => statusTabHandler(s)}>
								{s === 'ALL' ? 'All Status' : s.charAt(0) + s.slice(1).toLowerCase()}
							</button>
						))}
					</div>
					<div className="wl-muscles">
						{['ALL', 'USER', 'TRAINER', 'ADMIN'].map((t) => {
							const accent = typeColor[t] || '#00dce5';
							const isActive = typeFilter === t;
							return (
								<button
									key={t}
									className="cl-cat-btn"
									style={isActive ? { borderColor: `${accent}80`, background: `${accent}1c`, color: accent } : undefined}
									onClick={() => typeFilterHandler(t)}
								>
									{t !== 'ALL' && <span className="cl-cat-dot" style={{ background: accent }} />}
									{t === 'ALL' ? 'All Types' : t.charAt(0) + t.slice(1).toLowerCase()}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			<div className="ad-table-wrap">
				<table className="ad-table">
					<thead>
						<tr>
							{['Member', 'Phone', 'Type', 'Status', 'Warnings', 'Joined', 'Actions'].map((h) => (
								<th key={h}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{members.map((m) => {
							const sColor = statusColor[m.memberStatus] || '#9aabab';
							const tColor = typeColor[m.memberType] || '#00dce5';
							return (
								<tr key={m._id}>
									<td>
										<div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
											<img
												src={m.memberImage ? `${REACT_APP_API_URL}/${m.memberImage}` : '/img/profile/defaultUser.svg'}
												alt=""
												style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
											/>
											<div>
												<span className="ad-strong" style={{ display: 'block' }}>{m.memberNick}</span>
												{m.memberFullName && <span className="ad-mono">{m.memberFullName}</span>}
											</div>
										</div>
									</td>
									<td className="ad-mono">{m.memberPhone}</td>
									<td>
										<select
											value={m.memberType}
											onChange={(e) => updateMemberHandler({ _id: m._id, memberType: e.target.value as MemberType })}
											className="ad-price-input"
											style={{ width: 'auto', color: tColor, borderColor: `${tColor}40`, cursor: 'pointer' }}
										>
											<option value="USER">USER</option>
											<option value="TRAINER">TRAINER</option>
											<option value="ADMIN">ADMIN</option>
										</select>
									</td>
									<td>
										<span
											className="ad-chip"
											style={{ ['--adc' as any]: sColor, ['--adc-bg' as any]: `${sColor}14`, ['--adc-bd' as any]: `${sColor}35` }}
										>
											{m.memberStatus}
										</span>
									</td>
									<td className="ad-mono">
										{m.memberWarnings ?? 0}w · {m.memberBlocks ?? 0}b
									</td>
									<td className="ad-mono">{new Date(m.createdAt).toLocaleDateString()}</td>
									<td>
										<div className="ad-actions">
											{m.memberStatus !== MemberStatus.ACTIVE && (
												<button className="ad-btn is-success" onClick={() => updateMemberHandler({ _id: m._id, memberStatus: MemberStatus.ACTIVE })}>
													Activate
												</button>
											)}
											{m.memberStatus !== MemberStatus.BLOCK && (
												<button className="ad-btn" onClick={() => updateMemberHandler({ _id: m._id, memberStatus: MemberStatus.BLOCK })}>
													Block
												</button>
											)}
											{m.memberStatus !== MemberStatus.DELETE && (
												<button className="ad-btn is-danger" onClick={() => updateMemberHandler({ _id: m._id, memberStatus: MemberStatus.DELETE })}>
													Delete
												</button>
											)}
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
				{!loading && members.length === 0 && <div className="ad-empty">No members found.</div>}
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

AdminUsers.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withAdminLayout(AdminUsers);
