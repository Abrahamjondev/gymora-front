import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { CircularProgress, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Course, Lesson } from '../../libs/types/course/course';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_COURSE, GET_COURSE_REVIEWS, GET_LESSON_PROGRESS } from '../../apollo/user/query';
import { PURCHASE_COURSE, CREATE_REVIEW, COMPLETE_LESSON, CREATE_COURSE_CHECKOUT_SESSION } from '../../apollo/user/mutation';
import { REACT_APP_API_URL, Messages } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const CourseDetail: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [courseId, setCourseId] = useState<string | null>(null);
	const [course, setCourse] = useState<Course | null>(null);
	const [reviews, setReviews] = useState<any[]>([]);
	const [reviewText, setReviewText] = useState('');
	const [reviewRating, setReviewRating] = useState(5);
	const [lessonProgress, setLessonProgress] = useState<any[]>([]);

	const { loading, refetch } = useQuery(GET_COURSE, { fetchPolicy: 'network-only', variables: { input: courseId }, skip: !courseId, notifyOnNetworkStatusChange: true, onCompleted: (d: T) => { if (d?.getCourse) setCourse(d.getCourse); } });
	const { refetch: reviewsRefetch } = useQuery(GET_COURSE_REVIEWS, { fetchPolicy: 'network-only', variables: { input: courseId }, skip: !courseId, onCompleted: (d: T) => setReviews(d?.getCourseReviews ?? []) });
	const { refetch: progressRefetch } = useQuery(GET_LESSON_PROGRESS, { fetchPolicy: 'network-only', variables: { input: courseId }, skip: !courseId || !user?._id, onCompleted: (d: T) => setLessonProgress(d?.getLessonProgress ?? []) });

	const [purchaseCourse] = useMutation(PURCHASE_COURSE);
	const [createReview] = useMutation(CREATE_REVIEW);
	const [completeLesson] = useMutation(COMPLETE_LESSON);
	const [createCheckoutSession] = useMutation(CREATE_COURSE_CHECKOUT_SESSION);

	useEffect(() => { if (router.query.id) setCourseId(router.query.id as string); }, [router]);

	const isLessonCompleted = (lessonId: string) => lessonProgress.some((p: any) => p.lessonId === lessonId && p.isCompleted);

	const completeLessonHandler = async (lessonId: string) => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			await completeLesson({ variables: { input: lessonId } });
			const { data } = await progressRefetch({ input: courseId });
			if (data?.getLessonProgress) setLessonProgress(data.getLessonProgress);
			await sweetMixinSuccessAlert('Lesson completed!');
		} catch (err: any) { sweetMixinErrorAlert(err.message.replace('Definer: ', '')).then(); }
	};

	const enrollHandler = async () => {
		try {
			if (!user?._id) { await sweetMixinErrorAlert(Messages.error2); router.push('/account/join'); return; }
			if (course && course.coursePrice > 0) {
				const { data } = await createCheckoutSession({ variables: { courseId, baseUrl: window.location.origin } });
				const url = data?.createCourseCheckoutSession;
				if (url) { window.location.href = url; return; }
			}
			await purchaseCourse({ variables: { input: courseId } });
			const { data } = await refetch({ input: courseId });
			if (data?.getCourse) setCourse(data.getCourse);
			await sweetMixinSuccessAlert('Enrolled successfully!');
		} catch (err: any) { sweetMixinErrorAlert(err.message.replace('Definer: ', '')).then(); }
	};

	const reviewHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!reviewText) throw new Error('Review text required');
			await createReview({ variables: { input: { courseId, reviewRating, reviewText } } });
			setReviewText('');
			const { data } = await reviewsRefetch({ input: courseId });
			if (data?.getCourseReviews) setReviews(data.getCourseReviews);
			await sweetMixinSuccessAlert('Review posted!');
		} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
	};

	const lessonsByWeek: Record<number, Lesson[]> = {};
	if (course?.lessons) { course.lessons.forEach((l) => { if (!lessonsByWeek[l.weekNumber]) lessonsByWeek[l.weekNumber] = []; lessonsByWeek[l.weekNumber].push(l); }); }
	const weekNumbers = Object.keys(lessonsByWeek).map(Number).sort((a, b) => a - b);

	if (loading) return <Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#131314' }}><CircularProgress size={'4rem'} sx={{ color: '#00dce5' }} /></Stack>;
	if (device === 'mobile') return <div style={{ padding: '24px', color: '#e5e2e3', background: '#131314' }}>COURSE DETAIL MOBILE</div>;
	if (!course) return <Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh', background: '#131314' }}><p style={{ color: '#b9caca' }}>Course not found.</p></Stack>;

	const isEnrolled = user?._id ? course.purchasedMembers?.includes(user._id) : false;

	return (
		<div style={{ background: '#131314', minHeight: '100vh' }}>
			{/* Hero */}
			<div style={{ position: 'relative', width: '100%', height: '420px', backgroundImage: course.courseThumbnail ? `url(${REACT_APP_API_URL}/${course.courseThumbnail})` : 'url(/img/banner/header1.svg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
				<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #131314 0%, rgba(19,19,20,0.5) 40%, rgba(19,19,20,0.3) 100%)' }} />
				<div style={{ position: 'absolute', bottom: '40px', width: '100%', maxWidth: '1200px', padding: '0 24px', left: '50%', transform: 'translateX(-50%)' }}>
					<div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
						<span style={{ padding: '2px 8px', background: 'rgba(0,220,229,0.2)', border: '1px solid rgba(0,220,229,0.3)', borderRadius: '4px', fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00f5ff', textTransform: 'uppercase' }}>{course.courseCategory}</span>
						{course.courseRating && course.courseRating > 0 && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#ff8a00' }}>★ {course.courseRating.toFixed(1)} ({course.courseRatingCount} Reviews)</span>}
					</div>
					<h1 style={{ fontFamily: 'Hanken Grotesk', fontSize: '48px', lineHeight: '52px', letterSpacing: '-0.02em', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', maxWidth: '600px' }}>{course.courseTitle}</h1>
					{course.courseDesc && <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', lineHeight: '24px', color: 'rgba(255,255,255,0.7)', maxWidth: '560px', marginTop: '12px' }}>{course.courseDesc}</p>}
				</div>
			</div>

			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px' }}>
				{/* Left — Curriculum */}
				<div>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
						<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', textTransform: 'uppercase' }}>Curriculum</h2>
						<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495' }}>{course.courseDuration} WEEKS • {course.lessons?.length ?? 0} SESSIONS</span>
					</div>

					{weekNumbers.length > 0 ? weekNumbers.map((wn) => (
						<div key={wn} style={{ marginBottom: '24px' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
								<span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: '#00f5ff', fontWeight: 700 }}>{String(wn).padStart(2, '0')}</span>
								<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '18px', fontWeight: 600, color: '#e5e2e3' }}>Week {wn}</h3>
							</div>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
								{lessonsByWeek[wn].map((l) => (
									<div key={l._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px' }}>
										<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, color: '#e5e2e3', marginBottom: '4px' }}>{l.title}</h4>
										{l.description && <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: '#849495', marginBottom: '8px' }}>{l.description}</p>}
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
											{l.duration && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495' }}>{Math.round(l.duration)} min</span>}
											{isEnrolled && (
												isLessonCompleted(l._id)
													? <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#66daba' }}>Completed</span>
													: <button onClick={(e) => { e.stopPropagation(); completeLessonHandler(l._id); }} style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00dce5', background: 'rgba(0,220,229,0.1)', border: '1px solid rgba(0,220,229,0.2)', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer' }}>Mark done</button>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)) : <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}><p style={{ color: '#849495' }}>Curriculum coming soon.</p></div>}

					{/* Reviews */}
					<div style={{ marginTop: '40px' }}>
						<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '24px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px' }}>Reviews ({reviews.length})</h3>
						{user?._id && isEnrolled && (
							<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
								<div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
									{[1,2,3,4,5].map((n) => <span key={n} onClick={() => setReviewRating(n)} style={{ fontSize: '24px', cursor: 'pointer', color: n <= reviewRating ? '#ff8a00' : '#3a494a' }}>★</span>)}
								</div>
								<div style={{ display: 'flex', gap: '12px' }}>
									<input value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Write a review..." style={{ flex: 1, padding: '12px', background: '#201f20', border: '1px solid #3a494a', borderRadius: '8px', color: '#e5e2e3', fontFamily: 'Hanken Grotesk', fontSize: '14px', outline: 'none' }} />
									<button onClick={reviewHandler} style={{ background: '#e9feff', color: '#003739', border: 'none', borderRadius: '8px', padding: '12px 24px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Post</button>
								</div>
							</div>
						)}
						{reviews.map((r: any) => (
							<div key={r._id} style={{ padding: '16px 0', borderBottom: '1px solid rgba(58,73,74,0.3)' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
									<div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#2a2a2b' }}><img src={r.memberData?.memberImage ? `${REACT_APP_API_URL}/${r.memberData.memberImage}` : '/img/profile/defaultUser.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, color: '#e5e2e3' }}>{r.memberData?.memberNick ?? 'User'}</span>
									<span style={{ color: '#ff8a00', fontSize: '13px' }}>{'★'.repeat(r.reviewRating)}{'☆'.repeat(5 - r.reviewRating)}</span>
								</div>
								<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#b9caca', marginLeft: '44px' }}>{r.reviewText}</p>
							</div>
						))}
					</div>
				</div>

				{/* Right sidebar */}
				<div>
					<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
						<span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Lifetime Access</span>
						<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '40px', fontWeight: 800, color: '#e9feff', display: 'block', marginBottom: '20px' }}>{course.coursePrice > 0 ? `$${course.coursePrice}` : 'Free'}</span>
						<button onClick={enrollHandler} style={{ width: '100%', padding: '16px', background: isEnrolled ? '#353436' : '#00dce5', color: isEnrolled ? '#849495' : '#003739', border: 'none', borderRadius: '8px', fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 700, cursor: isEnrolled ? 'default' : 'pointer', textTransform: 'uppercase' }}>
							{isEnrolled ? '✓ Enrolled' : 'Enroll Now'}
						</button>
					</div>
					<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
						<div><span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Duration</span><span style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 800, color: '#e5e2e3' }}>{course.courseDuration}w</span></div>
						<div><span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Sessions</span><span style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 800, color: '#e5e2e3' }}>{course.lessons?.length ?? 0}</span></div>
					</div>
					<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
						<h4 style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, color: '#e5e2e3', marginBottom: '16px', textTransform: 'uppercase' }}>Included</h4>
						{['PDF training logs', 'Meal planning guide', 'Community Discord', 'Certificate'].map((item) => (
							<div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><span style={{ color: '#00dce5', fontSize: '14px' }}>✓</span><span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#b9caca' }}>{item}</span></div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(CourseDetail);
