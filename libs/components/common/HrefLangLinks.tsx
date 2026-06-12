import React from 'react';
import { NextRouter } from 'next/router';

// hreflang requires ABSOLUTE urls — render only when the public site url is
// configured (production). NEXT_PUBLIC_* vars are inlined by Next.js.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

/**
 * SEO alternate-language links. Plain function (NOT a component) — next/head
 * renders its children outside the router context, so useRouter() would crash
 * during prerender. Call it from the layout (where the router hook lives) and
 * spread the result inside <Head>: {hrefLangLinks(router)}
 */
export const hrefLangLinks = (router: NextRouter): React.ReactNode => {
	if (!SITE_URL) return null;

	const path = router.asPath.split('?')[0].split('#')[0];
	return (
		<>
			{(router.locales ?? []).map((loc) => (
				<link
					key={loc}
					rel="alternate"
					hrefLang={loc}
					href={`${SITE_URL}${loc === router.defaultLocale ? '' : `/${loc}`}${path}`}
				/>
			))}
			<link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${path}`} />
		</>
	);
};

export default hrefLangLinks;
