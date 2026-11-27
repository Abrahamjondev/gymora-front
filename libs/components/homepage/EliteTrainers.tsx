import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { GET_TRAINER_MEMBERS } from '../../../apollo/user/query';
import { Member } from '../../types/member/member';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import useReveal from '../../hooks/useReveal';
import QueryState from '../common/QueryState';

const EliteTrainers = () => {
	const router = useRouter();
	const { t } = useTranslation('landing');
	const [trainers, setTrainers] = useState<Member[]>([]);
	const [activeIdx, setActiveIdx] = useState<number>(0);
	const sectionRef = useReveal<HTMLElement>(trainers.length > 0);

	const { loading, error, refetch } = useQuery(GET_TRAINER_MEMBERS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 4, sort: 'memberRank', direction: 'DESC', search: {} } },
		onCompleted: (d: T) => setTrainers(d?.getTrainerMembers?.list ?? []),
	});

	if (!trainers.length && !loading && !error) return null;
	if (!trainers.length) {
		return (
			<section className="lp-section lp-query-section">
				<div className="lp-container">
					<QueryState loading={loading} error={error} onRetry={() => void refetch()} />
				</div>
			</section>
		);
	}

	const active = trainers[activeIdx] ?? trainers[0];
	const portraitSrc = active?.memberImage ? `${REACT_APP_API_URL}/${active.memberImage}` : '/img/profile/defaultUser.svg';

	return (
		<section ref={sectionRef} className="lp-section lp-reveal">
			<div className="lp-container">
				<div className="lp-section-head">
					<div>
						<span className="lp-eyebrow lp-eyebrow--green">{t('eliteTrainers.eyebrow')}</span>
						<h2 className="lp-h2">{t('eliteTrainers.title')}</h2>
					</div>
					<button className="lp-view-btn" onClick={() => router.push('/trainer')}>
						{t('common:actions.viewAll')} →
					</button>
				</div>
				<QueryState loading={loading} error={error} hasData={trainers.length > 0} onRetry={() => void refetch()} />

				<div className="lp-trainers lp-trainers--roster">
					{/* Editorial name list */}
					<div className="lp-trainer-roster-list">
						{trainers.map((trainer, i) => (
							<button
								key={trainer._id}
								type="button"
								className={`lp-trainer-row${i === activeIdx ? ' is-active' : ''}`}
								onMouseEnter={() => setActiveIdx(i)}
								onFocus={() => setActiveIdx(i)}
								onClick={() => router.push({ pathname: '/trainer/detail', query: { id: trainer._id } })}
							>
								<span className="lp-trainer-name">
									<span className="lp-trainer-idx">0{i + 1}</span>
									{trainer.memberFullName || trainer.memberNick}
								</span>
								<span className="lp-trainer-meta">
									<span>{t('eliteTrainers.workoutsCount', { count: trainer.memberWorkouts })}</span>
									<span>{t('eliteTrainers.followersCount', { count: trainer.memberFollowers })}</span>
								</span>
							</button>
						))}
						<p className="lp-trainer-note">{t('eliteTrainers.note')}</p>
					</div>

					{/* Portrait panel follows the hovered name */}
					<div
						className="lp-trainer-portrait"
						onClick={() => router.push({ pathname: '/trainer/detail', query: { id: active._id } })}
						style={{ cursor: 'pointer' }}
					>
						<img key={active._id} className="lp-trainer-portrait-image" src={portraitSrc} alt={active.memberNick} loading="lazy" />
						<div className="lp-portrait-index">0{activeIdx + 1}</div>
						<div className="lp-portrait-overlay">
							<h3>{active.memberFullName || active.memberNick}</h3>
							{active.memberDesc && <p>{active.memberDesc}</p>}
							<div className="lp-portrait-stats">
								<span>{t('eliteTrainers.workoutsCount', { count: active.memberWorkouts })}</span>
								<span>{t('eliteTrainers.followersCount', { count: active.memberFollowers })}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default EliteTrainers;
