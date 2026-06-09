import React, { useState } from 'react';
import { NextPage } from 'next';
import { CircularProgress, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { GET_PROGRESS_TIMELINE } from '../../apollo/user/query';
import { ADD_PROGRESS } from '../../apollo/user/mutation';
import { T } from '../../libs/types/common';
import { Messages } from '../../libs/config';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const ProgressPage: NextPage = () => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const [timeline, setTimeline] = useState<any[]>([]);
	const [showAdd, setShowAdd] = useState(false);
	const [newEntry, setNewEntry] = useState({ progressDate: new Date().toISOString(), weight: '', chest: '', waist: '', hips: '', bodyFat: '', progressNote: '' });

	const { loading, refetch } = useQuery(GET_PROGRESS_TIMELINE, {
		fetchPolicy: 'network-only',
		skip: !user?._id,
		onCompleted: (data: T) => setTimeline(data?.getProgressTimeline ?? []),
	});

	const [addProgress] = useMutation(ADD_PROGRESS);

	const addHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!newEntry.weight) throw new Error('Weight is required');
			await addProgress({
				variables: {
					input: {
						progressDate: newEntry.progressDate,
						weight: Number(newEntry.weight),
						chest: newEntry.chest ? Number(newEntry.chest) : undefined,
						waist: newEntry.waist ? Number(newEntry.waist) : undefined,
						hips: newEntry.hips ? Number(newEntry.hips) : undefined,
						bodyFat: newEntry.bodyFat ? Number(newEntry.bodyFat) : undefined,
						progressNote: newEntry.progressNote || undefined,
					},
				},
			});
			const { data: rd } = await refetch();
			if (rd?.getProgressTimeline) setTimeline(rd.getProgressTimeline);
			setShowAdd(false);
			setNewEntry({ progressDate: new Date().toISOString(), weight: '', chest: '', waist: '', hips: '', bodyFat: '', progressNote: '' });
			await sweetMixinSuccessAlert('Progress logged!');
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const inputStyle = { padding: '12px', background: '#201f20', border: '1px solid #3a494a', borderRadius: '8px', color: '#e5e2e3', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', outline: 'none', width: '100%' };

	if (!user?._id) {
		return (
			<div style={{ background: '#131314', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<p style={{ color: '#b9caca', fontFamily: 'Hanken Grotesk', fontSize: '18px' }}>Please login to track progress.</p>
			</div>
		);
	}

	if (device === 'mobile') return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>GYMORA PROGRESS MOBILE</div>;

	return (
		<div style={{ background: '#131314', minHeight: '100vh', padding: '40px 0' }}>
			<div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
				{/* Header */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
					<div>
						<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '0.2em', color: '#00dce5', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Body Metrics</span>
						<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '40px', fontWeight: 800, color: '#e5e2e3' }}>Progress Tracker</h2>
					</div>
					<button onClick={() => setShowAdd(!showAdd)} style={{ background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
						+ Log Progress
					</button>
				</div>

				{/* Add form */}
				{showAdd && (
					<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,220,229,0.3)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
						<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '18px', fontWeight: 600, color: '#e5e2e3', marginBottom: '16px' }}>New Entry</h4>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
							<div>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Weight (kg)*</span>
								<input type="number" value={newEntry.weight} onChange={(e) => setNewEntry({ ...newEntry, weight: e.target.value })} style={inputStyle} />
							</div>
							<div>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Chest (cm)</span>
								<input type="number" value={newEntry.chest} onChange={(e) => setNewEntry({ ...newEntry, chest: e.target.value })} style={inputStyle} />
							</div>
							<div>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Waist (cm)</span>
								<input type="number" value={newEntry.waist} onChange={(e) => setNewEntry({ ...newEntry, waist: e.target.value })} style={inputStyle} />
							</div>
							<div>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Hips (cm)</span>
								<input type="number" value={newEntry.hips} onChange={(e) => setNewEntry({ ...newEntry, hips: e.target.value })} style={inputStyle} />
							</div>
							<div>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Body Fat %</span>
								<input type="number" value={newEntry.bodyFat} onChange={(e) => setNewEntry({ ...newEntry, bodyFat: e.target.value })} style={inputStyle} />
							</div>
							<div>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Note</span>
								<input type="text" value={newEntry.progressNote} onChange={(e) => setNewEntry({ ...newEntry, progressNote: e.target.value })} placeholder="Optional note..." style={inputStyle} />
							</div>
						</div>
						<button onClick={addHandler} style={{ background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px', padding: '12px 32px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Save Entry</button>
					</div>
				)}

				{/* Timeline */}
				{loading ? (
					<Stack sx={{ py: 4, alignItems: 'center' }}><CircularProgress sx={{ color: '#00dce5' }} /></Stack>
				) : timeline.length === 0 ? (
					<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
						<p style={{ color: '#849495', fontFamily: 'Hanken Grotesk', fontSize: '18px', marginBottom: '8px' }}>No progress entries yet</p>
						<p style={{ color: '#849495', fontFamily: 'Hanken Grotesk', fontSize: '14px' }}>Start logging to see your transformation</p>
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						{timeline.map((entry: any, idx: number) => (
							<div key={entry._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
									<div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,220,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 800, color: '#00dce5' }}>{idx + 1}</span>
									</div>
									<div>
										<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495', display: 'block', marginBottom: '4px' }}>
											{new Date(entry.progressDate).toLocaleDateString()}
										</span>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 800, color: '#e9feff' }}>{entry.weight} kg</span>
										{entry.progressNote && <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '13px', color: '#849495', marginTop: '4px' }}>{entry.progressNote}</p>}
									</div>
								</div>
								<div style={{ display: 'flex', gap: '24px' }}>
									{entry.chest && (
										<div style={{ textAlign: 'center' }}>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', display: 'block' }}>CHEST</span>
											<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e5e2e3' }}>{entry.chest}cm</span>
										</div>
									)}
									{entry.waist && (
										<div style={{ textAlign: 'center' }}>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', display: 'block' }}>WAIST</span>
											<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e5e2e3' }}>{entry.waist}cm</span>
										</div>
									)}
									{entry.bodyFat && (
										<div style={{ textAlign: 'center' }}>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', display: 'block' }}>FAT %</span>
											<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, color: '#e5e2e3' }}>{entry.bodyFat}%</span>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default withLayoutBasic(ProgressPage);
