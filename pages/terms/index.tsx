import { NextPage } from 'next';
import { useRouter } from 'next/router';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common', 'static'])) },
});

const TermsPage: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('static');
	const sections = ['account', 'freePaid', 'trainers', 'reviews', 'health', 'payments'].map((k) => ({
		h: t(`terms.sections.${k}H`),
		p: t(`terms.sections.${k}P`),
	}));
	return (
		<div className="wl-page">
			<div className="lp-container" style={{ maxWidth: '760px' }}>
				<div className="wl-hero" style={{ paddingBottom: '28px' }}>
					<span className="lp-eyebrow" style={{ marginBottom: '8px' }}>{t('terms.eyebrow')}</span>
					<h1 className="wl-title">{t('terms.titlePre')} <span className="lp-grad">{t('terms.titleAccent')}</span></h1>
					<p className="lp-sub" style={{ margin: 0 }}>{t('terms.subtitle')}</p>
				</div>
				{sections.map((s) => (
					<div key={s.h} className="wd-section" style={{ marginBottom: '28px' }}>
						<div className="wd-section-head" style={{ marginBottom: '10px' }}>
							<h3 style={{ fontSize: '19px' }}>{s.h}</h3>
						</div>
						<p>{s.p}</p>
					</div>
				))}
				<button className="lp-btn-ghost" onClick={() => router.push('/cs')}>{t('terms.ctaSupport')}</button>
			</div>
		</div>
	);
};

export default withLayoutBasic(TermsPage);
