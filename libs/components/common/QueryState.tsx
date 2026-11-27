import React from 'react';
import { useTranslation } from 'next-i18next';

interface QueryStateProps {
	loading?: boolean;
	error?: unknown;
	hasData?: boolean;
	onRetry?: () => void;
}

const QueryState = ({ loading = false, error, hasData = false, onRetry }: QueryStateProps) => {
	const { t } = useTranslation('common');

	if (error) {
		return (
			<div className="lp-query-state lp-query-state--error" role="alert">
				<div className="lp-query-state-mark">!</div>
				<div className="lp-query-state-copy">
					<strong>{t('query.errorTitle')}</strong>
					<p>{t('query.errorHint')}</p>
				</div>
				{onRetry && (
					<button type="button" className="lp-btn-ghost lp-query-state-retry" onClick={onRetry}>
						{t('query.retry')}
					</button>
				)}
			</div>
		);
	}

	if (loading) {
		return (
			<div className={`lp-query-state ${hasData ? 'lp-query-state--refresh' : 'lp-query-state--initial'}`} role="status" aria-live="polite">
				<span className="lp-query-state-spinner" aria-hidden="true" />
				<span>{t(hasData ? 'query.refreshing' : 'query.loading')}</span>
			</div>
		);
	}

	return null;
};

export default QueryState;
