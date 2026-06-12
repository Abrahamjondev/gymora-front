import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

export default class GymoraDocument extends Document {
	static async getInitialProps(ctx: DocumentContext) {
		const initialProps = await Document.getInitialProps(ctx);
		return { ...initialProps, locale: ctx.locale || 'en' };
	}

	render() {
		const locale = (this.props as any).locale || 'en';
		return (
			<Html lang={locale}>
				<Head>
					<meta name="robots" content="index,follow" />
					<link rel="icon" type="image/svg+xml" href="/img/logo/favicon.svg" />
					<link rel="apple-touch-icon" href="/img/logo/favicon.svg" />

					{/* SEO */}
					<meta name="keyword" content={'gymora, gymora fitness, workout, courses, trainers, nutrition'} />
					<meta
						name={'description'}
						content={
							'Your ultimate fitness platform. Find workouts, courses, and trainers to achieve your fitness goals with Gymora. | ' +
							'Ваша фитнес-платформа. Найдите тренировки, курсы и тренеров для достижения фитнес-целей с Gymora. | ' +
							"Eng zo'r fitnes platforma. Gymora bilan mashqlar, dasturlar va murabbiylarni toping."
						}
					/>
				</Head>
				<body>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}
