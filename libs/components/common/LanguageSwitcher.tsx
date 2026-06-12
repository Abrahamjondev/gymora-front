import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

const LOCALES = ['en', 'ru', 'uz'] as const;

/** Persist the explicit choice — localeDetection is off, _app restores this. */
export const setLocaleCookie = (locale: string) => {
	document.cookie = `NEXT_LOCALE=${locale}; max-age=31536000; path=/; samesite=lax`;
};

const LanguageSwitcher = ({ variant = 'dropdown' }: { variant?: 'dropdown' | 'row' }) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [open, setOpen] = useState(false);
	const boxRef = useRef<HTMLDivElement>(null);

	const current = (router.locale ?? 'en') as (typeof LOCALES)[number];

	useEffect(() => {
		if (!open) return;
		const onClick = (e: MouseEvent) => {
			if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('mousedown', onClick);
		return () => document.removeEventListener('mousedown', onClick);
	}, [open]);

	const switchTo = (locale: string) => {
		setOpen(false);
		if (locale === current) return;
		setLocaleCookie(locale);
		router.push(router.asPath, router.asPath, { locale });
	};

	// Mobile menu: inline row of pills instead of a dropdown
	if (variant === 'row') {
		return (
			<div className="gnav-lang-row">
				{LOCALES.map((loc) => (
					<button
						key={loc}
						className={`gnav-lang-pill${loc === current ? ' is-active' : ''}`}
						onClick={() => switchTo(loc)}
					>
						{loc.toUpperCase()}
					</button>
				))}
			</div>
		);
	}

	return (
		<div className="gnav-lang" ref={boxRef}>
			<button className="gnav-lang-btn" aria-label={t('language.label')} onClick={() => setOpen((v) => !v)}>
				{current.toUpperCase()}
				<svg width="8" height="5" viewBox="0 0 8 5" fill="none" aria-hidden="true">
					<path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
				</svg>
			</button>
			{open && (
				<div className="gnav-lang-menu">
					{LOCALES.map((loc) => (
						<button
							key={loc}
							className={`gnav-lang-item${loc === current ? ' is-active' : ''}`}
							onClick={() => switchTo(loc)}
						>
							<span className="gnav-lang-code">{loc.toUpperCase()}</span>
							{t(`language.${loc}`)}
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default LanguageSwitcher;
