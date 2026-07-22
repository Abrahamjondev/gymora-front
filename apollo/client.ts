import { useMemo } from 'react';
import { ApolloClient, ApolloLink, InMemoryCache, from, NormalizedCacheObject } from '@apollo/client';
import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
import { onError } from '@apollo/client/link/error';
import { clearAuthSession, getJwtToken } from '../libs/auth';
import { TokenRefreshLink } from 'apollo-link-token-refresh';
import { sweetErrorAlert } from '../libs/sweetAlert';

let apolloClient: ApolloClient<NormalizedCacheObject>;
let sessionRecoveryStarted = false;

const isAuthFailure = (message: string) => {
	const normalized = message.toLowerCase();
	return (
		normalized.includes('token_not_exist') ||
		normalized.includes('not_authenticated') ||
		normalized.includes('unauthorized') ||
		normalized.includes('jwt expired') ||
		normalized.includes('jwt malformed')
	);
};

const recoverExpiredSession = () => {
	if (typeof window === 'undefined' || sessionRecoveryStarted) return;
	sessionRecoveryStarted = true;
	clearAuthSession();

	const path = window.location.pathname;
	const isPrivatePath = /^\/(?:ru\/|uz\/)?(?:mypage|subscription|_admin)(?:\/|$)/.test(path);
	if (isPrivatePath) {
		const localePrefix = path.match(/^\/(ru|uz)(?:\/|$)/)?.[1];
		window.location.assign(`${localePrefix ? `/${localePrefix}` : ''}/account/join`);
	} else {
		window.location.reload();
	}
};

function getHeaders() {
	const headers = {} as HeadersInit;
	const token = getJwtToken();
	// @ts-ignore
	if (token) headers['Authorization'] = `Bearer ${token}`;
	return headers;
}

const tokenRefreshLink = new TokenRefreshLink({
	accessTokenField: 'accessToken',
	isTokenValidOrUndefined: () => {
		return true;
	}, // @ts-ignore
	fetchAccessToken: () => {
		return null;
	},
});

function createIsomorphicLink() {
	if (typeof window !== 'undefined') {
		const authLink = new ApolloLink((operation, forward) => {
			operation.setContext(({ headers = {} }) => ({
				headers: {
					...headers,
					...getHeaders(),
				},
			}));
			return forward(operation);
		});

		// @ts-ignore
		const link = new createUploadLink({
			uri: process.env.REACT_APP_GRAPHQL_URL ?? 'http://localhost:3003/graphql',
		});

		const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
			// Operations can opt out of the global error popup when they handle
			// errors themselves (e.g. best-effort deletes of stale rows).
			const skipGlobal = operation.getContext()?.skipGlobalError;
			const authFailure = graphQLErrors?.some(({ message }) => isAuthFailure(message));
			if (authFailure) recoverExpiredSession();
			if (graphQLErrors && !skipGlobal && !authFailure) {
				graphQLErrors.map(({ message }) => {
					if (!message.includes('input')) sweetErrorAlert(message);
				});
			}
			if (networkError) console.log(`[Network error]: ${networkError}`);
		});

		return from([errorLink, tokenRefreshLink, authLink.concat(link)]);
	}
}

function createApolloClient() {
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: createIsomorphicLink(),
		cache: new InMemoryCache(),
		resolvers: {},
	});
}

export function initializeApollo(initialState = null) {
	const _apolloClient = apolloClient ?? createApolloClient();
	if (initialState) _apolloClient.cache.restore(initialState);
	if (typeof window === 'undefined') return _apolloClient;
	if (!apolloClient) apolloClient = _apolloClient;
	return _apolloClient;
}

export function useApollo(initialState: any) {
	return useMemo(() => initializeApollo(initialState), [initialState]);
}
