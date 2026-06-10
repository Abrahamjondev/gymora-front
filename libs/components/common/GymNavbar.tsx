import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { REACT_APP_API_URL } from '../../config';
import Link from 'next/link';

interface GymNavbarProps {
	/** Render the navbar transparently over the page hero (no spacer). */
	overlay?: boolean;
}

const GymNavbar = ({ overlay = false }: GymNavbarProps) => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [scrolled, setScrolled] = useState(false);

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
	const navClass = `gnav${scrolled ? ' is-scrolled' : overlay ? ' is-clear' : ''}`;

	return (
		<>
			<header className={navClass}>
				<div className="gnav-inner">
					{/* Logo */}
					<Link href="/" className="gnav-logo">
						<div className="gnav-logo-mark">
							<span>G</span>
						</div>
						<span className="gnav-logo-word">gymora</span>
					</Link>

					{/* Center Nav */}
					<nav className="gnav-links">
						{navLinks.map((link) => (
							<Link key={link.href} href={link.href} className={`gnav-link${isActive(link.href) ? ' is-active' : ''}`}>
								{link.label}
							</Link>
						))}
					</nav>

					{/* Right */}
					<div className="gnav-right">
						{user?._id ? (
							<div className="gnav-user">
								<Link href="/mypage" className="gnav-user-link">
									<img
										src={user.memberImage ? `${REACT_APP_API_URL}/${user.memberImage}` : '/img/profile/defaultUser.svg'}
										alt="profile"
									/>
									<span>{user.memberNick}</span>
								</Link>
								<span className="gnav-user-divider" />
								<button className="gnav-logout" onClick={() => logOut()}>
									Log out
								</button>
							</div>
						) : (
							<>
								<button className="gnav-login" onClick={() => router.push('/account/join')}>
									Log in
								</button>
								<button className="gnav-cta" onClick={() => router.push('/account/join')}>
									Get Started
								</button>
							</>
						)}
					</div>
				</div>
			</header>

			{/* Spacer keeps content below the fixed bar on non-hero pages */}
			{!overlay && <div style={{ height: '62px' }} />}
		</>
	);
};

export default GymNavbar;
