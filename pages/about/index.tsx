import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useQuery } from '@apollo/client';
import { GET_WORKOUTS, GET_TRAINER_MEMBERS, GET_COURSES } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import useCountUp from '../../libs/hooks/useCountUp';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const values = [
	{
		num: '01',
		title: 'Free training, forever',
		desc: 'Every workout on Gymora is free. We believe quality coaching knowledge should be the starting point, not the paywall.',
	},
	{
		num: '02',
		title: 'Verified expertise',
		desc: 'Trainers are verified before they earn their badge, and every rating comes from a member who actually trained with them.',
	},
	{
		num: '03',
		title: 'Data over guesswork',
		desc: 'AI food scanning, calculated nutrition targets and a measurable progress timeline — decisions built on your numbers.',
	},
];

const AboutPage: NextPage = () => {
	const router = useRouter();
	const [workoutTotal, setWorkoutTotal] = useState(0);
	const [trainerTotal, setTrainerTotal] = useState(0);
	const [programTotal, setProgramTotal] = useState(0);
	const workouts = useCountUp(workoutTotal);
	const trainers = useCountUp(trainerTotal);
	const programs = useCountUp(programTotal);

	useQuery(GET_WORKOUTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, search: {} } },
		onCompleted: (d: T) => setWorkoutTotal(d?.getWorkouts?.metaCounter?.[0]?.total ?? 0),
	});
	useQuery(GET_TRAINER_MEMBERS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, search: {} } },
		onCompleted: (d: T) => setTrainerTotal(d?.getTrainerMembers?.metaCounter?.[0]?.total ?? 0),
	});
	useQuery(GET_COURSES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, search: {} } },
		onCompleted: (d: T) => setProgramTotal(d?.getCourses?.metaCounter?.[0]?.total ?? 0),
	});

	return (
		<div className="wl-page">
			<div className="lp-container">
				{/* Hero */}
				<div className="wl-hero" style={{ paddingBottom: '20px' }}>
					<div className="wl-hero-glow" />
					<span className="lp-eyebrow" style={{ marginBottom: '8px' }}>About Gymora</span>
					<h1 className="wl-title" style={{ maxWidth: '760px' }}>
						Training that treats you <span className="lp-grad">like an athlete.</span>
					</h1>
					<p className="lp-sub" style={{ margin: 0, maxWidth: '600px' }}>
						Gymora connects verified trainers with people who are serious about results — free workouts for everyone,
						structured programs for those ready to go deeper, and AI-powered tracking to prove the work is working.
					</p>
				</div>

				{/* Live platform stats — real backend counters */}
				<div className="lp-hero-stats" style={{ marginTop: '12px', marginBottom: '56px', animation: 'none' }}>
					{[
						{ value: workoutTotal > 0 ? `${workouts}+` : '—', label: 'Free Workouts' },
						{ value: trainerTotal > 0 ? `${trainers}+` : '—', label: 'Verified Trainers' },
						{ value: programTotal > 0 ? `${programs}+` : '—', label: 'Training Programs' },
						{ value: '24/7', label: 'Platform Access' },
					].map((s) => (
						<div key={s.label}>
							<span className="lp-stat-value">{s.value}</span>
							<span className="lp-stat-label">{s.label}</span>
						</div>
					))}
				</div>

				{/* Values */}
				<div className="wd-section">
					<div className="wd-section-head">
						<h3>What we stand for</h3>
					</div>
					<div className="ab-values">
						{values.map((v) => (
							<div key={v.num} className="ab-value">
								<span className="ab-value-num">{v.num}</span>
								<h3>{v.title}</h3>
								<p>{v.desc}</p>
							</div>
						))}
					</div>
				</div>

				{/* CTA */}
				<div className="lp-cta">
					<div className="lp-cta-orb" />
					<h2>Built for your strongest season.</h2>
					<p>Join free, train with verified professionals and let the data tell your story.</p>
					<div className="lp-cta-actions">
						<button className="lp-btn-primary" onClick={() => router.push('/account/join')}>
							Start Training Free →
						</button>
						<button className="lp-btn-ghost" onClick={() => router.push('/trainer')}>
							Meet the Trainers
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(AboutPage);
