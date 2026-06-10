import React, { useState } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { GET_LESSONS_BY_COURSE } from '../../../apollo/user/query';
import { CREATE_LESSON, UPDATE_LESSON, DELETE_LESSON } from '../../../apollo/user/mutation';
import { T } from '../../types/common';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import { uploadVideoFile } from '../../upload';

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
				await sweetMixinSuccessAlert('Video uploaded!');
			} catch (err: any) {
				sweetMixinErrorAlert(err.message || 'Video upload failed').then();
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
			if (!form.title.trim()) throw new Error('Lesson title is required');
			if (!form.weekNumber || form.weekNumber < 1) throw new Error('Week number must be at least 1');
			if (!form.order || form.order < 1) throw new Error('Order must be at least 1');
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
			await sweetMixinSuccessAlert(editingId ? 'Lesson updated!' : 'Lesson added!');
		} catch (err: any) {
			sweetMixinErrorAlert(err?.graphQLErrors?.[0]?.message || err.message).then();
		} finally {
			setBusy(false);
		}
	};

	const deleteHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Delete this lesson?')) {
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
				<h3 style={{ fontSize: '17px' }}>Lessons — {courseTitle}</h3>
				<span className="wd-section-count">{lessons.length} lesson{lessons.length === 1 ? '' : 's'}</span>
			</div>

			{/* Lesson list */}
			{sorted.length > 0 && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
					{sorted.map((l) => (
						<div key={l._id} className="pd-lesson" style={{ marginBottom: 0 }}>
							<span className="pd-lesson-check">{`W${l.weekNumber}`}</span>
							<div className="pd-lesson-info">
								<h4>{l.title}</h4>
								{l.description && <p>{l.description}</p>}
							</div>
							<div className="pd-lesson-right">
								{l.duration ? <span className="pd-lesson-dur">{Math.round(l.duration)} min</span> : null}
								<button className="ad-btn" onClick={() => startEdit(l)}>
									Edit
								</button>
								<button className="ad-btn is-danger" onClick={() => deleteHandler(l._id)}>
									Delete
								</button>
							</div>
						</div>
					))}
				</div>
			)}
			{sorted.length === 0 && <p className="wd-empty-line" style={{ padding: '12px 0 18px' }}>No lessons yet — add the first one below.</p>}

			{/* Add / edit form */}
			<div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '18px' }}>
				<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '14.5px', fontWeight: 800, color: '#ffffff', margin: '0 0 14px' }}>
					{editingId ? 'Edit lesson' : 'Add lesson'}
				</h4>
				<div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
					<div>
						<span style={labelStyle}>Title *</span>
						<input className="wd-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lesson title" />
					</div>
					<div>
						<span style={labelStyle}>Week *</span>
						<input className="wd-input" type="number" min={1} value={form.weekNumber} onChange={(e) => setForm({ ...form, weekNumber: Number(e.target.value) })} />
					</div>
					<div>
						<span style={labelStyle}>Order *</span>
						<input className="wd-input" type="number" min={1} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
					</div>
					<div>
						<span style={labelStyle}>Duration (min)</span>
						<input className="wd-input" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
					</div>
				</div>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
					<div>
						<span style={labelStyle}>Description</span>
						<input className="wd-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description..." />
					</div>
					<div>
						<span style={labelStyle}>Video</span>
						<div style={{ display: 'flex', gap: '8px' }}>
							<input className="wd-input" style={{ flex: 1 }} value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="Upload or paste URL..." />
							<button className="nt-markall" disabled={uploadingVideo} onClick={uploadLessonVideo} style={{ whiteSpace: 'nowrap' }}>
								{uploadingVideo ? 'Uploading...' : 'Upload'}
							</button>
						</div>
					</div>
				</div>
				<div style={{ display: 'flex', gap: '10px' }}>
					<button className="wd-btn" onClick={saveHandler} disabled={busy}>
						{busy ? 'Saving...' : editingId ? 'Save Changes' : '+ Add Lesson'}
					</button>
					{editingId && (
						<button className="nt-markall" onClick={resetForm}>
							Cancel
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default LessonManager;
