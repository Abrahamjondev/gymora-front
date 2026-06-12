module.exports = {
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'ru', 'uz'],
		// No automatic redirects — the user picks the language explicitly; the
		// choice is persisted in the NEXT_LOCALE cookie and restored in _app.
		localeDetection: false,
	},
	fallbackLng: 'en',
	trailingSlash: true,
};
