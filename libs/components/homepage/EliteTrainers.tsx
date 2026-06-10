import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { GET_TRAINER_MEMBERS } from '../../../apollo/user/query';
import { Member } from '../../types/member/member';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import useReveal from '../../hooks/useReveal';

const EliteTrainers = () => {
	const router = useRouter();
	const [trainers, setTrainers] = useState<Member[]>([]);
	const [activeIdx, setActiveIdx] = useState<number>(0);
	const sectionRef = useReveal<HTMLElement>(trainers.length > 0);

	useQuery(GET_TRAINER_MEMBERS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 4, sort: 'memberRank', direction: 'DESC', search: {} } },
		onCompleted: (d: T) => setTrainers(d?.getTrainerMembers?.list ?? []),
	});

	if (!trainers.length) return null;

	const active = trainers[activeIdx] ?? trainers[0];
	const portraitSrc = active?.memberImage ? `${REACT_APP_API_URL}/${active.memberImage}` : '/img/profile/defaultUser.svg';

	return (
		<section ref={sectionRef} className="lp-section lp-reveal">
			<div className="lp-container">
				<div className="lp-section-head">
					<div>
						<span className="lp-eyebrow lp-eyebrow--green">Verified professionals</span>
						<h2 className="lp-h2">Elite Trainers</h2>
					</div>
					<button className="lp-view-btn" onClick={() => router.push('/trainer')}>
						View all →
					</button>
				</div>

				<div className="lp-trainers">
					{/* Editorial name list */}
					<div>
						{trainers.map((trainer, i) => (
							<div
								key={trainer._id}
								className={`lp-trainer-row${i === activeIdx ? ' is-active' : ''}`}
								onMouseEnter={() => setActiveIdx(i)}
								onClick={() => router.push({ pathname: '/trainer/detail', query: { id: trainer._id } })}
							>
								<span className="lp-trainer-name">
									<span className="lp-trainer-idx">0{i + 1}</span>
									{trainer.memberFullName || trainer.memberNick}
								</span>
								<span className="lp-trainer-meta">
									<span>{trainer.memberWorkouts} workouts</span>
									<span>{trainer.memberFollowers} followers</span>
								</span>
							</div>
						))}
						<p
							style={{
								fontFamily: 'Hanken Grotesk',
								fontSize: '13px',
								color: 'rgba(205,218,218,0.65)',
								marginTop: '20px',
								lineHeight: 1.6,
							}}
						>
							Ranked by performance. Every trainer is verified before publishing programs.
						</p>
					</div>

					{/* Portrait panel follows the hovered name */}
					<div
						className="lp-trainer-portrait"
						onClick={() => router.push({ pathname: '/trainer/detail', query: { id: active._id } })}
						style={{ cursor: 'pointer' }}
					>
						<img key={active._id} src={portraitSrc} alt={active.memberNick} loading="lazy" style={{ animation: 'fadeIn 0.45s ease both' }} />
						<div className="lp-portrait-overlay">
							<h3>{active.memberFullName || active.memberNick}</h3>
							{active.memberDesc && <p>{active.memberDesc}</p>}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default EliteTrainers;
