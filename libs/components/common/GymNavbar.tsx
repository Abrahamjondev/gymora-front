import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { REACT_APP_API_URL } from '../../config';
import { sweetConfirmAlert } from '../../sweetAlert';
import LanguageSwitcher from './LanguageSwitcher';
import Link from 'next/link';

interface GymNavbarProps {
	/** Render the navbar transparently over the page hero (no spacer). */
	overlay?: boolean;
}

const GymNavbar = ({ overlay = false }: GymNavbarProps) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [scrolled, setScrolled] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// Close the mobile menu on navigation
	useEffect(() => {
		setMenuOpen(false);
	}, [router.asPath]);

	useEffect(() => {
		if (!menuOpen || !window.matchMedia('(max-width: 768px)').matches) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [menuOpen]);

	const logoutHandler = async () => {
		if (await sweetConfirmAlert(t('actions.confirmLogout'))) logOut();
	};

	const navLinks = [
		{ href: '/workout', label: t('nav.workouts') },
		{ href: '/course', label: t('nav.programs') },
		{ href: '/trainer', label: t('nav.trainers') },
		{ href: '/community', label: t('nav.community') },
	];

	const isActive = (href: string) => router.pathname.startsWith(href);
	const navClass = `gnav${scrolled || menuOpen ? ' is-scrolled' : overlay ? ' is-clear' : ''}`;

	return (
		<>
			<header className={navClass}>
				<div className="gnav-inner">
					{/* Logo */}
					<Link href="/" className="gnav-logo">
						<div className="gnav-logo-mark" aria-hidden="true">
							<span className="gnav-roll">
								<i>G</i>
								<i>Y</i>
								<i>M</i>
								<i>O</i>
								<i>R</i>
								<i>A</i>
								<i>G</i>
							</span>
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
						<LanguageSwitcher />
						{user?._id ? (
							<div className="gnav-user">
								<Link href="/mypage" className="gnav-user-link">
									<img
										src={user.memberImage ? `${REACT_APP_API_URL}/${user.memberImage}` : '/img/profile/defaultUser.svg'}
										alt={t('nav.profileAlt')}
									/>
									<span>{user.memberNick}</span>
								</Link>
								<span className="gnav-user-divider" />
								<button className="gnav-logout" onClick={logoutHandler}>
									{t('nav.logout')}
								</button>
							</div>
						) : (
							<>
								<button className="gnav-login" onClick={() => router.push('/account/join')}>
									{t('nav.login')}
								</button>
								<button className="gnav-cta" onClick={() => router.push('/account/join')}>
									{t('nav.getStarted')}
								</button>
							</>
						)}
						<button
							className={`gnav-burger${menuOpen ? ' is-open' : ''}`}
							aria-label={t('nav.menu')}
							aria-expanded={menuOpen}
							aria-controls="gymora-mobile-menu"
							onClick={() => setMenuOpen((v) => !v)}
						>
							<span />
							<span />
							<span />
						</button>
					</div>
				</div>

				{/* Mobile menu */}
				<div id="gymora-mobile-menu" className={`gnav-mobile${menuOpen ? ' is-open' : ''}`}>
					<nav className="gnav-mobile-links">
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className={`gnav-mobile-link${isActive(link.href) ? ' is-active' : ''}`}
							>
								{link.label}
								<span className="gnav-mobile-arrow">→</span>
							</Link>
						))}
					</nav>
					<div className="gnav-mobile-foot">
						<LanguageSwitcher variant="row" />
						{user?._id ? (
							<>
								<Link href="/mypage" className="gnav-mobile-account">
									<img
										src={user.memberImage ? `${REACT_APP_API_URL}/${user.memberImage}` : '/img/profile/defaultUser.svg'}
										alt={t('nav.profileAlt')}
									/>
									<span>{t('nav.myPage')}</span>
								</Link>
								<button className="gnav-mobile-logout" onClick={logoutHandler}>
									{t('nav.logout')}
								</button>
							</>
						) : (
							<>
								<button className="gnav-login" onClick={() => router.push('/account/join')}>
									{t('nav.login')}
								</button>
								<button className="gnav-cta" onClick={() => router.push('/account/join')}>
									{t('nav.getStarted')}
								</button>
							</>
						)}
					</div>
				</div>
			</header>

			{/* Spacer keeps content below the fixed bar on non-hero pages */}
			{!overlay && <div style={{ height: '100px' }} />}
		</>
	);
};

export default GymNavbar;
