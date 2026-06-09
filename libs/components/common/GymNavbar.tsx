import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { REACT_APP_API_URL } from '../../config';
import Link from 'next/link';

const GymNavbar = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [scrolled, setScrolled] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const navLinks = [
		{ href: '/workout', label: 'Workouts' },
		{ href: '/course', label: 'Programs' },
		{ href: '/trainer', label: 'Trainers' },
		{ href: '/community', label: 'Community' },
	];

	const isActive = (href: string) => router.pathname.startsWith(href);

	return (
		<>
			<header
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					width: '100%',
					zIndex: 100,
					background: scrolled ? 'rgba(13,13,14,0.92)' : 'rgba(19,19,20,0.4)',
					backdropFilter: 'blur(20px)',
					WebkitBackdropFilter: 'blur(20px)',
					borderBottom: scrolled ? '1px solid rgba(58,73,74,0.4)' : '1px solid transparent',
					transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
					padding: '0 32px',
					height: '72px',
					display: 'flex',
					alignItems: 'center',
				}}
			>
				<div
					style={{
						maxWidth: '1280px',
						margin: '0 auto',
						width: '100%',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					{/* Logo */}
					<Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
						<div
							style={{
								width: '36px',
								height: '36px',
								borderRadius: '10px',
								background: 'linear-gradient(135deg, #00dce5 0%, #00f5ff 100%)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								boxShadow: '0 0 20px rgba(0,220,229,0.3)',
							}}
						>
							<span style={{ fontSize: '18px', fontWeight: 900, color: '#003739', fontFamily: 'Hanken Grotesk, sans-serif' }}>G</span>
						</div>
						<span
							style={{
								fontFamily: 'Hanken Grotesk, sans-serif',
								fontSize: '22px',
								fontWeight: 800,
								letterSpacing: '-0.03em',
								color: '#ffffff',
								cursor: 'pointer',
							}}
						>
							gymora
						</span>
					</Link>

					{/* Center Nav */}
					<nav
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '4px',
							background: 'rgba(255,255,255,0.04)',
							borderRadius: '12px',
							padding: '4px',
							border: '1px solid rgba(255,255,255,0.06)',
						}}
					>
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								style={{
									fontFamily: 'Hanken Grotesk, sans-serif',
									fontSize: '13px',
									fontWeight: isActive(link.href) ? 600 : 500,
									color: isActive(link.href) ? '#ffffff' : 'rgba(185,202,202,0.8)',
									textDecoration: 'none',
									padding: '8px 18px',
									borderRadius: '8px',
									background: isActive(link.href) ? 'rgba(0,220,229,0.12)' : 'transparent', boxShadow: isActive(link.href) ? '0 0 12px rgba(0,220,229,0.08)' : 'none',
									transition: 'all 0.25s ease',
									position: 'relative',
								}}
							>
								{link.label}
								{isActive(link.href) && (
									<span
										style={{
											position: 'absolute',
											bottom: '2px',
											left: '50%',
											transform: 'translateX(-50%)',
											width: '16px',
											height: '2px',
											borderRadius: '1px',
											background: '#00dce5',
										}}
									/>
								)}
							</Link>
						))}
					</nav>

					{/* Right */}
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						{user?._id ? (
							<>
								<Link href="/mypage" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
									<div
										style={{
											width: '34px',
											height: '34px',
											borderRadius: '10px',
											overflow: 'hidden',
											border: '1.5px solid rgba(255,255,255,0.1)',
											cursor: 'pointer',
											transition: 'border-color 0.25s ease',
										}}
									>
										<img
											src={user.memberImage ? `${REACT_APP_API_URL}/${user.memberImage}` : '/img/profile/defaultUser.svg'}
											alt="profile"
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
										/>
									</div>
									<span style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '13px', fontWeight: 600, color: '#e5e2e3' }}>
										{user.memberNick}
									</span>
								</Link>
								<button
									onClick={() => logOut()}
									style={{
										fontFamily: 'Hanken Grotesk, sans-serif',
										fontSize: '12px',
										fontWeight: 500,
										color: 'rgba(185,202,202,0.5)',
										background: 'transparent',
										border: '1px solid rgba(255,255,255,0.06)',
										padding: '7px 14px',
										borderRadius: '8px',
										cursor: 'pointer',
										transition: 'all 0.25s ease',
									}}
								>
									Log out
								</button>
							</>
						) : (
							<>
								<button
									onClick={() => router.push('/account/join')}
									style={{
										fontFamily: 'Hanken Grotesk, sans-serif',
										fontSize: '13px',
										fontWeight: 600,
										color: 'rgba(185,202,202,0.8)',
										background: 'transparent',
										border: 'none',
										padding: '8px 16px',
										cursor: 'pointer',
										transition: 'color 0.25s ease',
									}}
								>
									Log in
								</button>
								<button
									onClick={() => router.push('/account/join')}
									style={{
										fontFamily: 'Hanken Grotesk, sans-serif',
										fontSize: '13px',
										fontWeight: 700,
										color: '#003739',
										background: 'linear-gradient(135deg, #00dce5 0%, #e9feff 100%)',
										border: 'none',
										padding: '9px 22px',
										borderRadius: '10px',
										cursor: 'pointer',
										transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
										boxShadow: '0 0 20px rgba(0,220,229,0.2)',
									}}
								>
									Get Started
								</button>
							</>
						)}
					</div>
				</div>
			</header>

			{/* Spacer */}
			<div style={{ height: '72px' }} />
		</>
	);
};

export default GymNavbar;
