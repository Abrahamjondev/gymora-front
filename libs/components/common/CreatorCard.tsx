import React from 'react';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { GET_MEMBER } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

interface CreatorCardProps {
	memberId?: string;
	title?: string;
	/** Optional trainer entity info (rating / experience) shown as extra chips */
	trainerRating?: number;
	trainerRatingCount?: number;
	trainerExperience?: number;
}

const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };
const grotesk: React.CSSProperties = { fontFamily: 'Hanken Grotesk, sans-serif' };

/** Compact creator/trainer profile card for workout & program detail sidebars. */
const CreatorCard = ({ memberId, title, trainerRating, trainerRatingCount, trainerExperience }: CreatorCardProps) => {
	const router = useRouter();
	const { t } = useTranslation(['common', 'enums']);
	const user = useReactiveVar(userVar);
	const cardTitle = title ?? t('creator.coach');

	const { data } = useQuery(GET_MEMBER, {
		fetchPolicy: 'cache-and-network',
		variables: { input: memberId },
		skip: !memberId,
		// A missing/deleted member legitimately throws NO_DATA_FOUND — the card just
		// hides itself, no global error popup needed.
		context: { skipGlobalError: true },
		onError: () => {},
	});
	const member: T | undefined = data?.getMember;

	if (!memberId || !member) return null;

	const isSelf = user?._id === member._id;
	const isTrainer = member.memberType === 'TRAINER';
	const name = member.memberFullName || member.memberNick;

	const goProfile = () => {
		if (isSelf) router.push('/mypage');
		else if (isTrainer) router.push({ pathname: '/trainer/detail', query: { id: member._id } });
		else router.push({ pathname: '/member', query: { memberId: member._id } });
	};

	const goMessage = () => {
		if (!user?._id) {
			router.push('/account/join');
			return;
		}
		router.push({ pathname: '/mypage', query: { category: 'chat', partner: member._id } });
	};

	return (
		<div
			style={{
				background: 'rgba(255,255,255,0.025)',
				border: '1px solid rgba(255,255,255,0.08)',
				borderRadius: '16px',
				padding: '20px',
			}}
		>
			<span
				style={{
					...mono,
					fontSize: '10px',
					letterSpacing: '0.12em',
					textTransform: 'uppercase',
					color: 'rgba(0,220,229,0.75)',
					display: 'block',
					marginBottom: '14px',
				}}
			>
				{cardTitle}
			</span>

			<div style={{ display: 'flex', alignItems: 'center', gap: '13px', cursor: 'pointer' }} onClick={goProfile}>
				<img
					src={member.memberImage ? `${REACT_APP_API_URL}/${member.memberImage}` : '/img/profile/defaultUser.svg'}
					alt={name}
					style={{
						width: '52px',
						height: '52px',
						borderRadius: '50%',
						objectFit: 'cover',
						border: '2px solid rgba(0,220,229,0.45)',
						boxShadow: '0 0 14px rgba(0,220,229,0.18)',
						flex: 'none',
					}}
				/>
				<div style={{ minWidth: 0 }}>
					<span style={{ ...grotesk, fontSize: '16px', fontWeight: 800, color: '#ffffff', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
						{name}
					</span>
					<span
						style={{
							...mono,
							fontSize: '10px',
							letterSpacing: '0.08em',
							color: isTrainer ? '#66daba' : '#b9caca',
							border: `1px solid ${isTrainer ? 'rgba(102,218,186,0.35)' : 'rgba(255,255,255,0.14)'}`,
							background: isTrainer ? 'rgba(102,218,186,0.08)' : 'rgba(255,255,255,0.04)',
							borderRadius: '20px',
							padding: '2.5px 9px',
							display: 'inline-block',
							marginTop: '5px',
						}}
					>
						{t(`enums:memberType.${member.memberType}`)}
					</span>
				</div>
			</div>

			{(trainerRating !== undefined || trainerExperience !== undefined) && (
				<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '13px' }}>
					{trainerRating !== undefined && (
						<span style={{ ...mono, fontSize: '11.5px', fontWeight: 600, color: '#ffb77f', background: 'rgba(255,183,127,0.08)', border: '1px solid rgba(255,183,127,0.25)', borderRadius: '8px', padding: '5px 10px' }}>
							★ {trainerRating > 0 ? trainerRating.toFixed(1) : t('creator.newTrainer')}
							{trainerRatingCount ? ` (${trainerRatingCount})` : ''}
						</span>
					)}
					{trainerExperience !== undefined && trainerExperience > 0 && (
						<span style={{ ...mono, fontSize: '11.5px', fontWeight: 600, color: '#ddb7ff', background: 'rgba(221,183,255,0.07)', border: '1px solid rgba(221,183,255,0.25)', borderRadius: '8px', padding: '5px 10px' }}>
							{t('creator.experienceYears', { count: trainerExperience })}
						</span>
					)}
				</div>
			)}

			<div style={{ display: 'flex', gap: '8px', marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '15px' }}>
				<div style={{ flex: 1 }}>
					<span style={{ ...grotesk, fontSize: '17px', fontWeight: 800, color: '#e9feff', display: 'block' }}>{member.memberWorkouts ?? 0}</span>
					<span style={{ ...mono, fontSize: '9.5px', letterSpacing: '0.08em', color: '#849495', textTransform: 'uppercase' }}>{t('stats.workouts')}</span>
				</div>
				<div style={{ flex: 1 }}>
					<span style={{ ...grotesk, fontSize: '17px', fontWeight: 800, color: '#e9feff', display: 'block' }}>{member.memberFollowers ?? 0}</span>
					<span style={{ ...mono, fontSize: '9.5px', letterSpacing: '0.08em', color: '#849495', textTransform: 'uppercase' }}>{t('stats.followers')}</span>
				</div>
				<div style={{ flex: 1 }}>
					<span style={{ ...grotesk, fontSize: '17px', fontWeight: 800, color: '#e9feff', display: 'block' }}>{member.memberLikes ?? 0}</span>
					<span style={{ ...mono, fontSize: '9.5px', letterSpacing: '0.08em', color: '#849495', textTransform: 'uppercase' }}>{t('stats.likes')}</span>
				</div>
			</div>

			<div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
				<button
					onClick={goProfile}
					style={{
						...grotesk,
						flex: 1,
						padding: '10px 12px',
						borderRadius: '10px',
						border: '1px solid rgba(255,255,255,0.14)',
						background: 'rgba(255,255,255,0.04)',
						color: '#e9feff',
						fontSize: '13px',
						fontWeight: 700,
						cursor: 'pointer',
						transition: 'border-color 0.2s ease, background 0.2s ease',
					}}
				>
					{t('actions.viewProfile')}
				</button>
				{!isSelf && (
					<button
						onClick={goMessage}
						style={{
							...grotesk,
							flex: 1,
							padding: '10px 12px',
							borderRadius: '10px',
							border: '1px solid rgba(0,220,229,0.4)',
							background: 'rgba(0,220,229,0.1)',
							color: '#00dce5',
							fontSize: '13px',
							fontWeight: 700,
							cursor: 'pointer',
							transition: 'background 0.2s ease',
						}}
					>
						{t('actions.message')}
					</button>
				)}
			</div>
		</div>
	);
};

export default CreatorCard;
