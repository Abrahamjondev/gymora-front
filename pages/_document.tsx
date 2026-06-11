import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang="en">
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
						'최고의 피트니스 플랫폼. Gymora에서 운동, 코스, 트레이너를 찾아 피트니스 목표를 달성하세요.'
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
