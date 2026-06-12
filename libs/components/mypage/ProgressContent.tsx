import React, { useState } from 'react';
import { CircularProgress, Stack } from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../../apollo/store';
import { GET_PROGRESS_TIMELINE } from '../../../apollo/user/query';
import { ADD_PROGRESS } from '../../../apollo/user/mutation';
import { T } from '../../types/common';
import { Messages } from '../../config';
import { sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';

const labelStyle: React.CSSProperties = {
	fontFamily: 'JetBrains Mono',
	fontSize: '10px',
	color: '#9aabab',
	textTransform: 'uppercase',
	display: 'block',
	marginBottom: '6px',
	letterSpacing: '0.06em',
};

/** Weight trend as a pure-SVG sparkline (oldest → newest, real entries only). */
const WeightSparkline = ({ weights }: { weights: number[] }) => {
	if (weights.length < 2) return null;
	const w = 600;
	const h = 64;
	const pad = 6;
	const min = Math.min(...weights);
	const max = Math.max(...weights);
	const range = max - min || 1;
	const pts = weights.map((v, i) => {
		const x = pad + (i / (weights.length - 1)) * (w - pad * 2);
		const y = pad + (1 - (v - min) / range) * (h - pad * 2);
		return `${x.toFixed(1)},${y.toFixed(1)}`;
	});
	const last = pts[pts.length - 1].split(',');
	return (
		<svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
			<defs>
				<linearGradient id="pgFill" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="rgba(0,220,229,0.25)" />
					<stop offset="100%" stopColor="rgba(0,220,229,0)" />
				</linearGradient>
			</defs>
			<polygon points={`${pad},${h - pad} ${pts.join(' ')} ${w - pad},${h - pad}`} fill="url(#pgFill)" />
			<polyline points={pts.join(' ')} fill="none" stroke="#00dce5" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
			<circle cx={last[0]} cy={last[1]} r="3.5" fill="#00dce5" />
		</svg>
	);
};

const ProgressContent = () => {
	const { t } = useTranslation('mypage');
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
			if (!newEntry.weight) throw new Error(t('progress.alerts.weightRequired'));
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
			await sweetMixinSuccessAlert(t('progress.alerts.logged'));
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	// Timeline arrives newest-first (backend sorts progressDate: -1)
	const latest = timeline[0];
	const oldest = timeline[timeline.length - 1];
	const totalChange = latest && oldest && timeline.length > 1 ? latest.weight - oldest.weight : null;
	const latestFat = timeline.find((e: any) => e.bodyFat != null)?.bodyFat;
	const chartWeights = [...timeline].reverse().map((e: any) => e.weight);

	const formatEntryDate = (iso: string) => new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });

	const deltaChip = (delta: number | null, unit: string = t('progress.units.kg')) => {
		if (delta === null || delta === 0) return null;
		const down = delta < 0;
		return (
			<span className={`pg-delta ${down ? 'is-down' : 'is-up'}`}>
				{down ? '▼' : '▲'} {Math.abs(delta).toFixed(1)} {unit}
			</span>
		);
	};

	return (
		<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
			{/* Header */}
			<div className="nt-head">
				<div>
					<span className="lp-eyebrow" style={{ marginBottom: '6px' }}>
						{t('progress.eyebrow')}
					</span>
					<h2>{t('progress.title')}</h2>
				</div>
				<button className="wd-btn" onClick={() => setShowAdd(!showAdd)}>
					{showAdd ? t('common:actions.close') : t('progress.logBtn')}
				</button>
			</div>

			{/* Add form */}
			{showAdd && (
				<div className="wd-form-card" style={{ borderColor: 'rgba(0,220,229,0.25)' }}>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
						<div>
							<span style={labelStyle}>{t('progress.form.weight')}</span>
							<input className="wd-input" type="number" value={newEntry.weight} onChange={(e) => setNewEntry({ ...newEntry, weight: e.target.value })} />
						</div>
						<div>
							<span style={labelStyle}>{t('progress.form.chest')}</span>
							<input className="wd-input" type="number" value={newEntry.chest} onChange={(e) => setNewEntry({ ...newEntry, chest: e.target.value })} />
						</div>
						<div>
							<span style={labelStyle}>{t('progress.form.waist')}</span>
							<input className="wd-input" type="number" value={newEntry.waist} onChange={(e) => setNewEntry({ ...newEntry, waist: e.target.value })} />
						</div>
						<div>
							<span style={labelStyle}>{t('progress.form.hips')}</span>
							<input className="wd-input" type="number" value={newEntry.hips} onChange={(e) => setNewEntry({ ...newEntry, hips: e.target.value })} />
						</div>
						<div>
							<span style={labelStyle}>{t('progress.form.bodyFat')}</span>
							<input className="wd-input" type="number" value={newEntry.bodyFat} onChange={(e) => setNewEntry({ ...newEntry, bodyFat: e.target.value })} />
						</div>
						<div>
							<span style={labelStyle}>{t('progress.form.note')}</span>
							<input
								className="wd-input"
								type="text"
								value={newEntry.progressNote}
								onChange={(e) => setNewEntry({ ...newEntry, progressNote: e.target.value })}
								placeholder={t('progress.form.notePlaceholder')}
							/>
						</div>
					</div>
					<button className="wd-btn" onClick={addHandler}>
						{t('progress.form.save')}
					</button>
				</div>
			)}

			{loading ? (
				<Stack sx={{ py: 4, alignItems: 'center' }}>
					<CircularProgress sx={{ color: '#00dce5' }} />
				</Stack>
			) : timeline.length === 0 ? (
				<div className="nt-empty">
					<div className="nt-empty-ic">△</div>
					<h4>{t('progress.emptyTitle')}</h4>
					<p>{t('progress.emptyDesc')}</p>
				</div>
			) : (
				<>
					{/* Summary — computed from real entries */}
					<div className="pg-summary">
						<div className="pg-stat">
							<span className="pg-stat-label">{t('progress.summary.currentWeight')}</span>
							<span className="pg-stat-value">
								{latest.weight} <small>{t('progress.units.kg')}</small>
							</span>
						</div>
						<div className="pg-stat">
							<span className="pg-stat-label">{t('progress.summary.totalChange')}</span>
							<span className="pg-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
								{totalChange !== null ? deltaChip(totalChange) || <small>{t('progress.summary.noChange')}</small> : <small>—</small>}
							</span>
						</div>
						<div className="pg-stat">
							<span className="pg-stat-label">{t('progress.summary.bodyFat')}</span>
							<span className="pg-stat-value">{latestFat != null ? <>{latestFat} <small>%</small></> : <small>—</small>}</span>
						</div>
						<div className="pg-stat">
							<span className="pg-stat-label">{t('progress.summary.entries')}</span>
							<span className="pg-stat-value">{timeline.length}</span>
						</div>
					</div>

					{/* Weight trend */}
					{chartWeights.length > 1 && (
						<div className="pg-chart">
							<div className="pg-chart-head">
								<span>{t('progress.weightTrend')}</span>
								<span>
									{new Date(oldest.progressDate).toLocaleDateString()} — {new Date(latest.progressDate).toLocaleDateString()}
								</span>
							</div>
							<WeightSparkline weights={chartWeights} />
						</div>
					)}

					{/* Timeline */}
					<div className="pg-timeline">
						{timeline.map((entry: any, idx: number) => {
							const prev = timeline[idx + 1];
							const delta = prev ? entry.weight - prev.weight : null;
							return (
								<div key={entry._id} className="pg-entry">
									<div className="pg-entry-top">
										<span className="pg-entry-date">{formatEntryDate(entry.progressDate)}</span>
										{idx === 0 && (
											<span className="lp-chip lp-chip--cyan" style={{ fontSize: '8.5px' }}>
												{t('progress.latest')}
											</span>
										)}
									</div>
									<div className="pg-entry-weight">
										<span className="pg-weight-value">
											{entry.weight} <small>{t('progress.units.kg')}</small>
										</span>
										{deltaChip(delta)}
									</div>
									{(entry.chest || entry.waist || entry.hips || entry.bodyFat) && (
										<div className="pg-metrics">
											{entry.chest && (
												<span className="pg-metric">
													{t('progress.metrics.chest')} <b>{entry.chest}{t('progress.units.cm')}</b>
												</span>
											)}
											{entry.waist && (
												<span className="pg-metric">
													{t('progress.metrics.waist')} <b>{entry.waist}{t('progress.units.cm')}</b>
												</span>
											)}
											{entry.hips && (
												<span className="pg-metric">
													{t('progress.metrics.hips')} <b>{entry.hips}{t('progress.units.cm')}</b>
												</span>
											)}
											{entry.bodyFat && (
												<span className="pg-metric">
													{t('progress.metrics.fat')} <b>{entry.bodyFat}%</b>
												</span>
											)}
										</div>
									)}
									{entry.progressNote && <p className="pg-entry-note">{entry.progressNote}</p>}
								</div>
							);
						})}
					</div>
				</>
			)}
		</div>
	);
};

export default ProgressContent;
