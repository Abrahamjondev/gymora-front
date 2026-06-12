import React, { useState } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { GET_LESSONS_BY_COURSE } from '../../../apollo/user/query';
import { CREATE_LESSON, UPDATE_LESSON, DELETE_LESSON } from '../../../apollo/user/mutation';
import { T } from '../../types/common';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import { uploadVideoFile } from '../../upload';
import { useTranslation } from 'next-i18next';

const labelStyle: React.CSSProperties = {
	fontFamily: 'JetBrains Mono, monospace',
	fontSize: '10px',
	color: '#9aabab',
	textTransform: 'uppercase',
	display: 'block',
	marginBottom: '6px',
	letterSpacing: '0.06em',
};

const emptyForm = { title: '', description: '', videoUrl: '', weekNumber: 1, order: 1, duration: '' };

/** Lesson CRUD for a trainer's own program — mirrors createLesson/updateLesson/deleteLesson (TRAINER, ownership on backend). */
const LessonManager = ({ courseId, courseTitle }: { courseId: string; courseTitle: string }) => {
	const { t } = useTranslation('mypage');
	const [lessons, setLessons] = useState<any[]>([]);
	const [form, setForm] = useState<any>(emptyForm);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [uploadingVideo, setUploadingVideo] = useState(false);

	const uploadLessonVideo = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'video/mp4,video/webm,video/ogg';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			try {
				setUploadingVideo(true);
				const url = await uploadVideoFile(file);
				setForm((prev: any) => ({ ...prev, videoUrl: url }));
				await sweetMixinSuccessAlert(t('alerts.videoUploaded'));
			} catch (err: any) {
				sweetMixinErrorAlert(err.message || t('alerts.videoUploadFailed')).then();
			} finally {
				setUploadingVideo(false);
			}
		};
		input.click();
	};

	const { refetch } = useQuery(GET_LESSONS_BY_COURSE, {
		fetchPolicy: 'network-only',
		variables: { input: courseId },
		onCompleted: (d: T) => setLessons(d?.getLessonsByCourse ?? []),
	});

	const [createLesson] = useMutation(CREATE_LESSON);
	const [updateLesson] = useMutation(UPDATE_LESSON);
	const [deleteLesson] = useMutation(DELETE_LESSON);

	const reload = async () => {
		const { data } = await refetch({ input: courseId });
		if (data?.getLessonsByCourse) setLessons(data.getLessonsByCourse);
	};

	const resetForm = () => {
		setForm(emptyForm);
		setEditingId(null);
	};

	const startEdit = (l: any) => {
		setEditingId(l._id);
		setForm({
			title: l.title ?? '',
			description: l.description ?? '',
			videoUrl: l.videoUrl ?? '',
			weekNumber: l.weekNumber ?? 1,
			order: l.order ?? 1,
			duration: l.duration ?? '',
		});
	};

	const saveHandler = async () => {
		try {
			if (!form.title.trim()) throw new Error(t('alerts.lessonTitleRequired'));
			if (!form.weekNumber || form.weekNumber < 1) throw new Error(t('alerts.weekMin'));
			if (!form.order || form.order < 1) throw new Error(t('alerts.orderMin'));
			setBusy(true);

			const base: any = {
				title: form.title.trim(),
				description: form.description || undefined,
				videoUrl: form.videoUrl || undefined,
				weekNumber: Number(form.weekNumber),
				order: Number(form.order),
				duration: form.duration ? Number(form.duration) : undefined,
			};

			if (editingId) {
				await updateLesson({ variables: { input: { _id: editingId, ...base } } });
			} else {
				await createLesson({ variables: { input: { courseId, ...base } } });
			}
			await reload();
			resetForm();
			await sweetMixinSuccessAlert(editingId ? t('alerts.lessonUpdated') : t('alerts.lessonAdded'));
		} catch (err: any) {
			sweetMixinErrorAlert(err?.graphQLErrors?.[0]?.message || err.message).then();
		} finally {
			setBusy(false);
		}
	};

	const deleteHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert(t('alerts.deleteLessonConfirm'))) {
				await deleteLesson({ variables: { input: id } });
				if (editingId === id) resetForm();
				await reload();
			}
		} catch (err: any) {
			sweetMixinErrorAlert(err?.graphQLErrors?.[0]?.message || err.message).then();
		}
	};

	const sorted = [...lessons].sort((a, b) => a.weekNumber - b.weekNumber || (a.order ?? 0) - (b.order ?? 0));

	return (
		<div className="wd-form-card" style={{ borderColor: 'rgba(255,138,0,0.22)', marginTop: '14px' }}>
			<div className="wd-section-head" style={{ marginBottom: '16px' }}>
				<h3 style={{ fontSize: '17px' }}>{t('lessons.header', { title: courseTitle })}</h3>
				<span className="wd-section-count">{lessons.length === 1 ? t('lessons.countOne', { count: lessons.length }) : t('lessons.count', { count: lessons.length })}</span>
			</div>

			{/* Lesson list */}
			{sorted.length > 0 && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
					{sorted.map((l) => (
						<div key={l._id} className="pd-lesson" style={{ marginBottom: 0 }}>
							<span className="pd-lesson-check">{t('lessons.weekShort', { n: l.weekNumber })}</span>
							<div className="pd-lesson-info">
								<h4>{l.title}</h4>
								{l.description && <p>{l.description}</p>}
							</div>
							<div className="pd-lesson-right">
								{l.duration ? <span className="pd-lesson-dur">{t('lessons.minutes', { count: Math.round(l.duration) })}</span> : null}
								<button className="ad-btn" onClick={() => startEdit(l)}>
									{t('common:actions.edit')}
								</button>
								<button className="ad-btn is-danger" onClick={() => deleteHandler(l._id)}>
									{t('common:actions.delete')}
								</button>
							</div>
						</div>
					))}
				</div>
			)}
			{sorted.length === 0 && <p className="wd-empty-line" style={{ padding: '12px 0 18px' }}>{t('lessons.empty')}</p>}

			{/* Add / edit form */}
			<div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '18px' }}>
				<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '14.5px', fontWeight: 800, color: '#ffffff', margin: '0 0 14px' }}>
					{editingId ? t('lessons.editLesson') : t('lessons.addLesson')}
				</h4>
				<div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
					<div>
						<span style={labelStyle}>{t('lessons.form.title')}</span>
						<input className="wd-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('lessons.form.titlePlaceholder')} />
					</div>
					<div>
						<span style={labelStyle}>{t('lessons.form.week')}</span>
						<input className="wd-input" type="number" min={1} value={form.weekNumber} onChange={(e) => setForm({ ...form, weekNumber: Number(e.target.value) })} />
					</div>
					<div>
						<span style={labelStyle}>{t('lessons.form.order')}</span>
						<input className="wd-input" type="number" min={1} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
					</div>
					<div>
						<span style={labelStyle}>{t('lessons.form.duration')}</span>
						<input className="wd-input" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
					</div>
				</div>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
					<div>
						<span style={labelStyle}>{t('lessons.form.description')}</span>
						<input className="wd-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('lessons.form.descPlaceholder')} />
					</div>
					<div>
						<span style={labelStyle}>{t('lessons.form.video')}</span>
						<div style={{ display: 'flex', gap: '8px' }}>
							<input className="wd-input" style={{ flex: 1 }} value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder={t('lessons.form.videoPlaceholder')} />
							<button className="nt-markall" disabled={uploadingVideo} onClick={uploadLessonVideo} style={{ whiteSpace: 'nowrap' }}>
								{uploadingVideo ? t('lessons.form.uploading') : t('lessons.form.upload')}
							</button>
						</div>
					</div>
				</div>
				<div style={{ display: 'flex', gap: '10px' }}>
					<button className="wd-btn" onClick={saveHandler} disabled={busy}>
						{busy ? t('lessons.form.saving') : editingId ? t('lessons.form.saveChanges') : t('lessons.form.add')}
					</button>
					{editingId && (
						<button className="nt-markall" onClick={resetForm}>
							{t('common:actions.cancel')}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default LessonManager;
