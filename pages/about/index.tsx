import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { GET_WORKOUTS, GET_TRAINER_MEMBERS, GET_COURSES } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import useCountUp from '../../libs/hooks/useCountUp';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common', 'static'])) },
});

const AboutPage: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('static');
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

	const values = [
		{ num: '01', title: t('about.values.v1Title'), desc: t('about.values.v1Desc') },
		{ num: '02', title: t('about.values.v2Title'), desc: t('about.values.v2Desc') },
		{ num: '03', title: t('about.values.v3Title'), desc: t('about.values.v3Desc') },
	];

	return (
		<div className="wl-page">
			<div className="lp-container">
				{/* Hero */}
				<div className="wl-hero" style={{ paddingBottom: '20px' }}>
					<div className="wl-hero-glow" />
					<span className="lp-eyebrow" style={{ marginBottom: '8px' }}>{t('about.eyebrow')}</span>
					<h1 className="wl-title" style={{ maxWidth: '760px' }}>
						{t('about.titlePre')} <span className="lp-grad">{t('about.titleAccent')}</span>
					</h1>
					<p className="lp-sub" style={{ margin: 0, maxWidth: '600px' }}>
						{t('about.subtitle')}
					</p>
				</div>

				{/* Live platform stats — real backend counters */}
				<div className="lp-hero-stats" style={{ marginTop: '12px', marginBottom: '56px', animation: 'none' }}>
					{[
						{ value: workoutTotal > 0 ? `${workouts}+` : '—', label: t('about.stats.freeWorkouts') },
						{ value: trainerTotal > 0 ? `${trainers}+` : '—', label: t('about.stats.verifiedTrainers') },
						{ value: programTotal > 0 ? `${programs}+` : '—', label: t('about.stats.trainingPrograms') },
						{ value: '24/7', label: t('about.stats.platformAccess') },
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
						<h3>{t('about.valuesTitle')}</h3>
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
					<h2>{t('about.cta.title')}</h2>
					<p>{t('about.cta.subtitle')}</p>
					<div className="lp-cta-actions">
						<button className="lp-btn-primary" onClick={() => router.push('/account/join')}>
							{t('about.cta.primary')}
						</button>
						<button className="lp-btn-ghost" onClick={() => router.push('/trainer')}>
							{t('about.cta.secondary')}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(AboutPage);
