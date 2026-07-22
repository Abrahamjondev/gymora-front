import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { light } from '../scss/MaterialTheme';
import { ApolloProvider } from '@apollo/client';
import { useApollo } from '../apollo/client';
import { appWithTranslation } from 'next-i18next';
import useSocket from '../libs/hooks/useSocket';
import moment from 'moment';
import 'moment/locale/ru';
import 'moment/locale/uz-latn';
import '../scss/app.scss';

// Keeps the presence socket connected on EVERY page while logged in — without
// this, members only counted as "online" (and got a lastSeen stamp) while the
// chat page itself was open.
const PresenceSocket = () => {
	useSocket();
	return null;
};

// localeDetection is off, so the language picked in the switcher (NEXT_LOCALE
// cookie) is restored manually on first load.
const LocaleRestore = () => {
	const router = useRouter();
	useEffect(() => {
		const saved = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=(\w+)/)?.[1];
		if (saved && router.locales?.includes(saved) && saved !== router.locale) {
			router.replace(router.asPath, router.asPath, { locale: saved });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	return null;
};

const App = ({ Component, pageProps }: AppProps) => {
	const router = useRouter();
	// @ts-ignore
	const [theme, setTheme] = useState(createTheme(light));
	const client = useApollo(pageProps.initialApolloState);

	// Set during render (not in an effect) so SERVER-rendered moment dates use
	// the page's locale too — an effect would leave SSR output in English.
	moment.locale(router.locale === 'uz' ? 'uz-latn' : router.locale || 'en');

	return (
		<ApolloProvider client={client}>
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
			</Head>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<PresenceSocket />
				<LocaleRestore />
				<Component {...pageProps} />
			</ThemeProvider>
		</ApolloProvider>
	);
};

export default appWithTranslation(App);
