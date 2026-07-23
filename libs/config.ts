import { i18n } from 'next-i18next';

export const REACT_APP_API_URL = `${process.env.REACT_APP_API_URL}`;

export const AUTH_LIMITS = {
	nickMin: 3,
	nickMax: 20,
	passwordMinLogin: 5,
	passwordMinSignup: 8,
	passwordMax: 20,
} as const;

/** Active UI locale for Intl date/time formatting — keeps dates in the app's
 *  language instead of the browser's ('uz' renders Latin by default). */
export const appLocale = (): string => i18n?.language || 'en';

// Localized at ACCESS time via getters so every existing `Messages.errorN`
// call site stays unchanged; falls back to English before i18n is ready.
const message = (key: string, fallback: string) => i18n?.t(`common:alerts.${key}`, { defaultValue: fallback }) ?? fallback;

export const Messages = {
	get error1() {
		return message('somethingWrong', 'Something went wrong!');
	},
	get error2() {
		return message('loginFirst', 'Please login first!');
	},
	get error3() {
		return message('fillAllInputs', 'Please fulfill all inputs!');
	},
	get error4() {
		return message('messageEmpty', 'Message is empty!');
	},
	get error5() {
		return message('imageFormatOnly', 'Only images with jpeg, jpg, png format allowed!');
	},
};

export const topWorkoutRank = 2;
