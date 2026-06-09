import React from 'react';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { REACT_APP_API_URL } from '../../config';
import Link from 'next/link';

const GymNavbar = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);

	const navLinks = [
		{ href: '/workout', label: 'Workouts' },
		{ href: '/course', label: 'Programs' },
		{ href: '/trainer', label: 'Trainers' },
		{ href: '/community', label: 'Community' },
	];

	const isActive = (href: string) => router.pathname.startsWith(href);

	return (
		<header
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100%',
				zIndex: 50,
				background: 'rgba(19,19,20,0.8)',
				backdropFilter: 'blur(12px)',
				borderBottom: '1px solid #3a494a',
				padding: '0 24px',
				height: '64px',
				display: 'flex',
				alignItems: 'center',
			}}
		>
			<div
				style={{
					maxWidth: '1200px',
					margin: '0 auto',
					width: '100%',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				{/* Logo */}
				<Link href="/" style={{ textDecoration: 'none' }}>
					<span
						style={{
							fontFamily: 'Hanken Grotesk, sans-serif',
							fontSize: '28px',
							fontWeight: 800,
							letterSpacing: '-0.02em',
							color: '#e9feff',
							cursor: 'pointer',
						}}
					>
						GYMORA
					</span>
				</Link>

				{/* Nav links */}
				<nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
					{navLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							style={{
								fontFamily: 'Hanken Grotesk, sans-serif',
								fontSize: '14px',
								fontWeight: isActive(link.href) ? 700 : 500,
								color: isActive(link.href) ? '#e9feff' : '#b9caca',
								textDecoration: 'none',
								borderBottom: isActive(link.href) ? '2px solid #e9feff' : '2px solid transparent',
								paddingBottom: '4px',
								transition: 'all 0.2s',
							}}
						>
							{link.label}
						</Link>
					))}
				</nav>

				{/* Right side */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
					{user?._id ? (
						<>
							<Link href="/mypage" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
								<div
									style={{
										width: '34px',
										height: '34px',
										borderRadius: '50%',
										overflow: 'hidden',
										border: '2px solid #3a494a',
										cursor: 'pointer',
									}}
								>
									<img
										src={
											user.memberImage
												? `${REACT_APP_API_URL}/${user.memberImage}`
												: '/img/profile/defaultUser.svg'
										}
										alt="profile"
										style={{ width: '100%', height: '100%', objectFit: 'cover' }}
									/>
								</div>
								<span
									style={{
										fontFamily: 'Hanken Grotesk, sans-serif',
										fontSize: '13px',
										fontWeight: 600,
										color: '#e5e2e3',
									}}
								>
									{user.memberNick}
								</span>
							</Link>
							<button
								onClick={() => logOut()}
								style={{
									fontFamily: 'Hanken Grotesk, sans-serif',
									fontSize: '12px',
									fontWeight: 600,
									color: '#849495',
									background: 'transparent',
									border: '1px solid #3a494a',
									padding: '6px 14px',
									borderRadius: '6px',
									cursor: 'pointer',
								}}
							>
								Logout
							</button>
						</>
					) : (
						<button
							onClick={() => router.push('/account/join')}
							style={{
								fontFamily: 'Hanken Grotesk, sans-serif',
								fontSize: '14px',
								fontWeight: 700,
								color: '#003739',
								background: '#e9feff',
								border: 'none',
								padding: '8px 24px',
								borderRadius: '6px',
								cursor: 'pointer',
							}}
						>
							Sign In
						</button>
					)}
				</div>
			</div>
		</header>
	);
};

export default GymNavbar;
